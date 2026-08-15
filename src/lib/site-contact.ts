import { supabase } from "@/lib/supabase";

export const FALLBACK_CONTACT_ADDRESS = "Klitmøllervej 20, 2720 Vanløse";
export const FALLBACK_CONTACT_EMAIL = "vanloeseif@gmail.com";
export const FALLBACK_CONTACT_PHONE = "+45 38 74 12 12";

export interface SiteContact {
  address: string;
  email: string;
  phone: string;
}

/**
 * Club contact details from site_settings, with hardcoded fallbacks.
 *
 * These are the only way visitors can reach the club now that the public
 * intake forms are gone, so every caller falls back rather than rendering
 * an empty contact block.
 */
export async function getSiteContact(): Promise<SiteContact> {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["contact_address", "contact_email", "contact_phone"]);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value;

  return {
    address: settings["contact_address"] || FALLBACK_CONTACT_ADDRESS,
    email: settings["contact_email"] || FALLBACK_CONTACT_EMAIL,
    phone: settings["contact_phone"] || FALLBACK_CONTACT_PHONE,
  };
}

/** mailto: link with a pre-filled subject line. */
export function mailtoUrl(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

/** Strips spaces so tel: links dial correctly. */
export function telUrl(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}
