import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "Vanløse IF <noreply@vanlose-if.dk>";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

export async function sendNewContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!resend || !ADMIN_EMAIL) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[Kontakt] ${data.subject}`,
    text: `Ny kontaktbesked fra ${data.name} (${data.email}):\n\n${data.message}`,
  });
}

export async function sendNewVolunteerNotification(data: {
  name: string;
  email: string;
  role: string;
}) {
  if (!resend || !ADMIN_EMAIL) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[Frivillig] ${data.name} ønsker at bidrage`,
    text: `Ny frivilligtilmelding:\n\nNavn: ${data.name}\nE-mail: ${data.email}\nRolle: ${data.role}`,
  });
}

export async function sendNewMembershipNotification(data: {
  name: string;
  email: string;
  phone?: string | null;
  membershipTier: string;
}) {
  if (!resend || !ADMIN_EMAIL) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[Medlemskab] ${data.name} — ${data.membershipTier}`,
    text: `Ny medlemsanmodning:\n\nNavn: ${data.name}\nE-mail: ${data.email}${data.phone ? `\nTelefon: ${data.phone}` : ""}\nMedlemskab: ${data.membershipTier}`,
  });
}
