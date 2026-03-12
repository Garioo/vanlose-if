export type ContactSubmissionPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
};

export type VolunteerSubmissionPayload = {
  name: string;
  email: string;
  role: string;
  website?: string;
};

export type NewsletterSubscriptionPayload = {
  email: string;
  website?: string;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSpamTrapFilled(website?: string): boolean {
  return normalizeText(website).length > 0;
}

export function parseContactSubmission(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const payload: ContactSubmissionPayload = {
    name: normalizeText(input.name),
    email: normalizeText(input.email).toLowerCase(),
    subject: normalizeText(input.subject),
    message: normalizeText(input.message),
    website: normalizeText(input.website),
  };

  if (isSpamTrapFilled(payload.website)) {
    return { ok: false as const, error: "Spam detected" };
  }

  if (!payload.name || payload.name.length < 2) {
    return { ok: false as const, error: "Navn er ugyldigt." };
  }

  if (!isValidEmail(payload.email)) {
    return { ok: false as const, error: "E-mail er ugyldig." };
  }

  if (!payload.subject) {
    return { ok: false as const, error: "Vælg et emne." };
  }

  if (!payload.message || payload.message.length < 10) {
    return { ok: false as const, error: "Beskeden er for kort." };
  }

  return { ok: true as const, payload };
}

export function parseVolunteerSubmission(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const payload: VolunteerSubmissionPayload = {
    name: normalizeText(input.name),
    email: normalizeText(input.email).toLowerCase(),
    role: normalizeText(input.role),
    website: normalizeText(input.website),
  };

  if (isSpamTrapFilled(payload.website)) {
    return { ok: false as const, error: "Spam detected" };
  }

  if (!payload.name || payload.name.length < 2) {
    return { ok: false as const, error: "Navn er ugyldigt." };
  }

  if (!isValidEmail(payload.email)) {
    return { ok: false as const, error: "E-mail er ugyldig." };
  }

  if (!payload.role) {
    return { ok: false as const, error: "Vælg en rolle." };
  }

  return { ok: true as const, payload };
}

export function parseNewsletterSubscription(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const payload: NewsletterSubscriptionPayload = {
    email: normalizeText(input.email).toLowerCase(),
    website: normalizeText(input.website),
  };

  if (isSpamTrapFilled(payload.website)) {
    return { ok: false as const, error: "Spam detected" };
  }

  if (!isValidEmail(payload.email)) {
    return { ok: false as const, error: "E-mail er ugyldig." };
  }

  return { ok: true as const, payload };
}
