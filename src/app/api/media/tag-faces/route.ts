import { execFile } from "node:child_process";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";

/**
 * Runs scripts/face_tagger over one folder and reports how many suggestions it
 * produced.
 *
 * Local-only: recognition needs Python, a ~280 MB model and minutes of CPU per
 * batch, which do not fit in a serverless function. Run from your own machine
 * against the shared database, and the suggestions are visible to everyone.
 */

// Assembled from array segments, not literals: a literal path makes the bundler
// treat it as a static asset reference and follow .venv-face/bin/python, a
// symlink outside the project root, which fails the build.
const segments = (...parts: string[]) => path.join(process.cwd(), ...parts);
const PYTHON = process.env.FACE_TAGGER_PYTHON || segments(...[".venv-face", "bin", "python"]);
const SCRIPT_DIR = segments(...["scripts", "face_tagger"]);

// A batch of a few dozen photos runs for minutes on CPU.
const TIMEOUT_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          "Ansigtsgenkendelse kan kun køres lokalt. Start admin på din egen maskine (npm run dev) og prøv igen — forslagene gemmes i den fælles database.",
      },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const folder = typeof body?.folder === "string" && body.folder ? body.folder : null;
  const onlyUntagged = body?.onlyUntagged !== false;

  // Separate argv entries with no shell, so a folder name cannot become code.
  const args = [path.join(SCRIPT_DIR, ...["tag_media.py"]), "--json"];
  if (folder) args.push("--folder", folder);
  if (onlyUntagged) args.push("--only-untagged");

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      execFile(
        PYTHON,
        args,
        { cwd: SCRIPT_DIR, timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
        (error, out, stderr) => {
          if (error) {
            reject(new Error(stderr?.trim().split("\n").slice(-3).join(" ") || error.message));
            return;
          }
          resolve(out);
        }
      );
    });

    const line = stdout
      .split("\n")
      .reverse()
      .find((l) => l.startsWith("RESULT "));
    const result = line ? JSON.parse(line.slice("RESULT ".length)) : { suggestions: 0, scanned: 0 };

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    // The venv is created by hand, so this is the likely first-run failure.
    if (message.includes("ENOENT")) {
      return NextResponse.json(
        { error: "Fandt ikke .venv-face. Følg opsætningen i scripts/face_tagger/README.md." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
