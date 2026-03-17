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
  test("membership endpoint validates payload", async ({ request }) => {
    const response = await request.post("/api/membership", {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
      data: {
        name: "",
        email: "not-an-email",
        membershipTier: "",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("membership endpoint rejects honeypot spam", async ({ request }) => {
    const response = await request.post("/api/membership", {
      headers: {
        "x-forwarded-for": "203.0.113.11",
      },
      data: {
        name: "Spam Bot",
        email: "spam@example.com",
        phone: "+45 00 00 00 00",
        membershipTier: "Aktiv",
        website: "https://spam.example.com",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("membership endpoint rate limits repeated requests", async ({ request }) => {
    const ip = "203.0.113.12";

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await request.post("/api/membership", {
        headers: {
          "x-forwarded-for": ip,
        },
        data: {
          name: "",
          email: "not-an-email",
          membershipTier: "",
        },
      });

      expect(response.status()).toBe(400);
    }

    const limited = await request.post("/api/membership", {
      headers: {
        "x-forwarded-for": ip,
      },
      data: {
        name: "",
        email: "not-an-email",
        membershipTier: "",
      },
    });

    expect(limited.status()).toBe(429);
  });

  test("membership submission can be listed and updated in admin inbox", async ({ request }) => {
    const cookie = await getAdminCookie(request);
    const unique = Date.now();
    const email = `medlem-${unique}@example.com`;
    const bulkEmail = `medlem-bulk-${unique}@example.com`;

    const create = await request.post("/api/membership", {
      headers: {
        "x-forwarded-for": "203.0.113.13",
      },
      data: {
        name: "Medlem Test",
        email,
        phone: "+45 11 11 11 11",
        membershipTier: "Aktiv",
      },
    });
    expect(create.status()).toBe(200);

    const createBulk = await request.post("/api/membership", {
      headers: {
        "x-forwarded-for": "203.0.113.14",
      },
      data: {
        name: "Medlem Bulk",
        email: bulkEmail,
        phone: "+45 22 22 22 22",
        membershipTier: "Familie",
      },
    });
    expect(createBulk.status()).toBe(200);

    const list = await request.get(`/api/admin/inbox?type=membership&q=${encodeURIComponent(email)}`, {
      headers: {
        Cookie: cookie,
      },
    });
    expect(list.status()).toBe(200);
    const payload = await list.json();
    expect(Array.isArray(payload.items)).toBeTruthy();
    const created = payload.items.find((item: { email?: string }) => item.email === email);
    expect(created).toBeTruthy();

    const singleUpdate = await request.patch(`/api/admin/inbox/${created.id}`, {
      headers: {
        Cookie: cookie,
      },
      data: {
        type: "membership",
        status: "handled",
      },
    });
    expect(singleUpdate.status()).toBe(200);
    const updated = await singleUpdate.json();
    expect(updated.status).toBe("handled");

    const bulkList = await request.get(`/api/admin/inbox?type=membership&q=${encodeURIComponent(bulkEmail)}`, {
      headers: {
        Cookie: cookie,
      },
    });
    expect(bulkList.status()).toBe(200);
    const bulkPayload = await bulkList.json();
    const bulkCreated = bulkPayload.items.find((item: { email?: string }) => item.email === bulkEmail);
    expect(bulkCreated).toBeTruthy();

    const bulkUpdate = await request.patch("/api/admin/inbox/bulk", {
      headers: {
        Cookie: cookie,
      },
      data: {
        type: "membership",
        ids: [bulkCreated.id],
        status: "handled",
      },
    });
    expect(bulkUpdate.status()).toBe(200);
    const bulkUpdated = await bulkUpdate.json();
    expect(bulkUpdated.updated).toBe(1);
  });

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
