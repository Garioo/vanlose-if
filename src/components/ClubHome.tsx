import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowRight, MapPin } from "lucide-react";
import SiteImage from "@/components/SiteImage";
import type { Article, Match, Player, Sponsor } from "@/lib/supabase";
import { formatMatchDate } from "@/lib/matchDate";
import "./club-home.css";

type NewsItem = Pick<Article, "id" | "slug" | "title" | "excerpt" | "image_url" | "category" | "date">;
type Props = {
  nextMatch: Match | null;
  latestMatch: Match | null;
  heroImage: string | null;
  youthImage: string | null;
  logoMap: Record<string, string | null>;
  players: Player[];
  articles: NewsItem[];
  sponsors: Sponsor[];
};

function TeamCrest({ name, id, logos }: { name: string; id: string | null; logos: Props["logoMap"] }) {
  const src = (id && logos[id]) || (name.toLowerCase().includes("vanløse") ? "/uploads/b479f1c8-7804-4e16-81a1-039a647b1628.png" : null);
  return src ? <Image src={src} alt="" width={56} height={60} className="match-crest" /> : <span className="match-crest-fallback" aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span>;
}

function MatchPanel({ match, label, logos }: { match: Match | null; label: string; logos: Props["logoMap"] }) {
  const scored = match?.status === "live" || match?.status === "finished";
  return <div className="home-match">
    <div className="match-meta"><span>{match?.status === "live" ? "Live nu" : label}</span><span>{match?.status === "finished" ? formatMatchDate(match.date) : match ? (match.match_type === "cup" ? "Pokal" : "Turnering") : "Førsteholdet"}</span></div>
    {match ? <>
      <div className="match-teams">
        <div><TeamCrest name={match.home} id={match.home_team_id} logos={logos} /><strong>{match.home}</strong></div>
        <div className="match-score">{scored ? `${match.home_score ?? "–"} : ${match.away_score ?? "–"}` : <><strong>{match.time || "Tid følger"}</strong><span>{formatMatchDate(match.date)}</span></>}</div>
        <div><TeamCrest name={match.away} id={match.away_team_id} logos={logos} /><strong>{match.away}</strong></div>
      </div>
      <div className="match-bottom"><span>{match.venue && <><MapPin size={13} aria-hidden="true" />{match.venue}</>}</span><Link href={`/kampe/${match.id}`}>{scored ? "Se kampen" : "Kampinfo"}<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </> : <div className="match-empty"><strong>{label === "Seneste resultat" ? "Følg holdets resultater" : "Vi ses til næste kamp"}</strong><p>{label === "Seneste resultat" ? "Resultater vises her, når kampene er afsluttet." : "Næste kamp offentliggøres her, når programmet er klar."}</p><Link href="/kampe">Se kampprogram <ArrowRight size={16} aria-hidden="true" /></Link></div>}
  </div>;
}

export default function ClubHome({ nextMatch, latestMatch, heroImage, youthImage, logoMap, players, articles, sponsors }: Props) {
  return <div className="club-home">
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-heading"><p>Fodbold i Vanløse. Siden 1921.</p><h1 id="home-title">Vores klub.<br className="mobile-break" /> Vores Vanløse.</h1></div>
      <div className="home-hero-photo">
        {heroImage && <SiteImage src={heroImage} alt="Vanløse IFs spillere på vej på banen" width={1600} sizes="100vw" priority className="home-photo" />}
        <div className="hero-photo-content"><span> </span><Link href="/forsteholdet">Mød førsteholdet <ArrowUpRight size={19} aria-hidden="true" /></Link></div>
      </div>
    </section>

    <section className="home-match-strip" aria-label="Kampe og resultater">
      <MatchPanel match={nextMatch} label="Næste kamp" logos={logoMap} />
      <MatchPanel match={latestMatch} label="Seneste resultat" logos={logoMap} />
      <Link className="match-program" href="/kampe"><span>Hele sæsonen.<br />Alle kampene.</span><span>Se kampprogram <ArrowUpRight size={20} aria-hidden="true" /></span></Link>
    </section>

    <section className="home-section home-news" aria-labelledby="news-title">
      <div className="home-section-heading"><h2 id="news-title">Nyt fra klubben</h2><Link href="/nyheder">Alle nyheder <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
      {articles.length ? <div className="home-news-grid">{articles.map((article, i) => <article key={article.id} className={i === 0 ? "news-lead" : "news-support"}>
        <Link href={`/nyheder/${article.slug}`} className="news-link">
          {article.image_url && <div className="news-image"><SiteImage src={article.image_url} alt={article.title} width={i === 0 ? 900 : 500} sizes={i === 0 ? "(max-width: 767px) 100vw, 60vw" : "(max-width: 767px) 40vw, 20vw"} className="home-photo" /></div>}
          <div className="news-copy"><p className="news-meta">{article.category.toLocaleLowerCase("da-DK")}<span>{article.date}</span></p><h3>{article.title}</h3>{i === 0 && <p className="news-excerpt">{article.excerpt}</p>}<span className="news-read">Læs historien <ArrowUpRight size={17} aria-hidden="true" /></span></div>
        </Link>
      </article>)}</div> : <p className="home-empty">Der er endnu ingen nyheder. Følg med her for nyt fra klubben.</p>}
    </section>

    <section className="home-squad home-section" aria-labelledby="squad-title">
      <div className="squad-intro"><p className="section-label">Førsteholdet</p><h2 id="squad-title">Holdet bag<br />klubmærket.</h2><p>Mød spillerne, der repræsenterer Vanløse på banen.</p><Link className="home-button" href="/forsteholdet">Se hele truppen <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
      <div className="squad-players">{players.map((player) => <Link href={`/spillere/${player.id}`} key={player.id} className="squad-player"><div className="squad-photo"><span aria-hidden="true">{player.number}</span><SiteImage src={player.image_url || "/images/player-placeholder.png"} alt={player.name} width={500} sizes="(max-width: 767px) 65vw, 23vw" className="home-photo" /></div><div className="squad-player-name"><h3>{player.name}</h3><ArrowUpRight size={17} aria-hidden="true" /></div><p>{player.position.toLocaleLowerCase("da-DK")}</p></Link>)}{players.length === 0 && <p className="home-empty">Truppen offentliggøres her, når spillerlisten er klar.</p>}</div>
    </section>

    <section className="home-community home-section" aria-labelledby="community-title">
      {youthImage && <div className="community-photo"><SiteImage src={youthImage} alt="Ungdomsfodbold hos Vanløse IF" width={900} sizes="(max-width: 767px) 100vw, 55vw" className="home-photo" /></div>}
      <div className="community-copy"><p className="section-label">Plads til næste generation</p><h2 id="community-title">Din fodbold<br />starter her.</h2><p>De første afleveringer. Nye holdkammerater. Find et hold i Vanløse og bliv en del af klubben.</p><Link className="home-button" href="/ungdom">Find dit ungdomshold <ArrowUpRight size={18} aria-hidden="true" /></Link><div className="community-links"><Link href="/bliv-medlem">Bliv medlem <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/frivillig">Giv en hånd som frivillig <ArrowRight size={17} aria-hidden="true" /></Link></div></div>
    </section>

    {sponsors.length > 0 && <section className="home-partners home-section" aria-label="Klubbens partnere"><div className="home-section-heading"><h2>Med os hele vejen</h2><Link href="/sponsorer">Vores partnere <ArrowUpRight size={18} aria-hidden="true" /></Link></div><div className="partner-logos">{sponsors.map(sponsor => {
      const content = sponsor.logo_url ? <Image src={sponsor.logo_url} alt={sponsor.name} width={160} height={70} /> : <span>{sponsor.name}</span>;
      return sponsor.website_url ? <a key={sponsor.id} href={sponsor.website_url} target="_blank" rel="noopener noreferrer">{content}</a> : <div key={sponsor.id}>{content}</div>;
    })}</div></section>}
  </div>;
}
