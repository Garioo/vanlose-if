import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getSiteContact } from "@/lib/site-contact";

export default async function Footer() {
  const [settings, contact] = await Promise.all([
    supabase.from("site_settings").select("key, value").in("key", ["social_instagram", "social_facebook", "social_youtube"]),
    getSiteContact(),
  ]);
  const social = Object.fromEntries((settings.data ?? []).map((s) => [s.key, s.value]));
  return <footer className="club-footer">
    <div className="footer-main">
      <div><Link href="/" className="footer-brand"><Image src="/uploads/b479f1c8-7804-4e16-81a1-039a647b1628.png" alt="" width={35} height={39} />Vanløse IF</Link><p className="footer-address">Fodbold i Vanløse siden 1921.<br />{contact.address}</p></div>
      <nav className="footer-links" aria-label="Klubben"><Link href="/forsteholdet">Førsteholdet</Link><Link href="/ungdom">Ungdom</Link><Link href="/klubben">Om klubben</Link><Link href="/klubben#vedtaegter">Vedtægter</Link><Link href="/klubben#arkiv">Historie</Link><Link href="/kontakt">Kontakt</Link></nav>
      <nav className="footer-links" aria-label="Bliv en del af klubben"><Link href="/bliv-medlem">Bliv medlem</Link><Link href="/frivillig">Bliv frivillig</Link><Link href="/sponsorer">Bliv sponsor</Link>{[["social_instagram", "Instagram"], ["social_facebook", "Facebook"], ["social_youtube", "YouTube"]].map(([key, label]) => social[key] ? <a key={key} href={social[key]} target="_blank" rel="noopener noreferrer">{label}</a> : null)}</nav>
    </div>
    <div className="footer-bottom"><p>© {new Date().getFullYear()} Vanløse Idrætsforening</p><div><Link href="/privatlivspolitik">Privatlivspolitik</Link><Link href="/cookiepolitik">Cookiepolitik</Link></div></div>
  </footer>;
}
