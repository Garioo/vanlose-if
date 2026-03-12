import { expect, test, type APIRequestContext } from "@playwright/test";

async function getAdminCookie(request: APIRequestContext): Promise<string> {
  const password = process.env.ADMIN_PASSWORD;
  test.skip(!password, "ADMIN_PASSWORD must be set to verify authorized writes.");

  const login = await request.post("/api/auth/login", {
    data: { password },
  });

  expect(login.status()).toBe(200);

  const setCookie = login.headers()["set-cookie"];
  expect(setCookie).toBeTruthy();
  return setCookie!.split(";")[0];
}

test.describe("API smoke", () => {
  test("contact endpoint validates payload", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "",
        email: "not-an-email",
        subject: "",
        message: "kort",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("contact endpoint rejects honeypot spam", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "Spam Bot",
        email: "spam@example.com",
        subject: "Medlemskab",
        message: "Denne besked burde blive afvist som spam.",
        website: "https://spam.example.com",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("admin write endpoints reject unauthenticated requests", async ({ request }) => {
    const createArticle = await request.post("/api/articles", {
      data: {
        title: "Unauthorized",
      },
    });

    const inboxBulk = await request.patch("/api/admin/inbox/bulk", {
      data: {
        type: "contact",
        ids: ["00000000-0000-0000-0000-000000000000"],
        status: "handled",
      },
    });

    const liveWrite = await request.put("/api/admin/matches/00000000-0000-0000-0000-000000000000/live", {
      data: {
        status: "live",
      },
    });

    expect(createArticle.status()).toBe(401);
    expect(inboxBulk.status()).toBe(401);
    expect(liveWrite.status()).toBe(401);
  });

  test("admin write endpoints accept valid admin session", async ({ request }) => {
    const cookie = await getAdminCookie(request);

    const inboxBulk = await request.patch("/api/admin/inbox/bulk", {
      headers: {
        Cookie: cookie,
      },
      data: {
        type: "contact",
        ids: [],
        status: "handled",
      },
    });

    // 400 confirms auth passed and payload validation was reached.
    expect(inboxBulk.status()).toBe(400);
  });

  test("upload endpoint rejects invalid MIME/type", async ({ request }) => {
    const cookie = await getAdminCookie(request);

    const upload = await request.post("/api/upload", {
      headers: {
        Cookie: cookie,
      },
      multipart: {
        file: {
          name: "bad.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("not-an-image"),
        },
      },
    });

    expect(upload.status()).toBe(415);
  });
});
