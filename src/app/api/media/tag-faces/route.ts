import { execFile } from "node:child_process";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";

/**
 * Runs the face tagger over one folder and returns how many suggestions it
 * produced (see scripts/face_tagger).
 *
 * Local-only by design. Recognition needs a Python runtime, a ~280 MB model and
 * minutes of CPU per batch, none of which fit in a serverless function — so the
 * admin runs this against the shared database from their own machine, and the
 * suggestions it writes are then visible to everyone in the deployed admin.
 */

// Assembled from array segments rather than string literals: a literal path
// here makes the bundler treat it as a static asset reference and try to follow
// .venv-face/bin/python, a symlink pointing outside the project root, which
// fails the build. FACE_TAGGER_PYTHON overrides the location of the venv.
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

  // Passed as separate argv entries with no shell, so a folder name containing
  // spaces or quotes cannot turn into anything executable.
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
    // The venv is created by hand (see scripts/face_tagger/README.md), so a
    // missing interpreter is the most likely first-run failure.
    if (message.includes("ENOENT")) {
      return NextResponse.json(
        { error: "Fandt ikke .venv-face. Følg opsætningen i scripts/face_tagger/README.md." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
