export type ArticleCategory = "KAMP" | "KLUB" | "UNGDOM";

export interface Article {
  id: number;
  slug: string;
  category: ArticleCategory;
  date: string;
  title: string;
  excerpt: string;
  content: string;
  latest: boolean;
}

export const articles: Article[] = [
  {
    id: 1,
    slug: "storsejr-vif-bk-frem",
    category: "KAMP",
    date: "8. marts 2026",
    title: "Storsejr hjemme: VIF vinder 3-1 over BK Frem",
    excerpt:
      "En dominerende præstation på Vanløse Idrætspark sender holdet til tops i 3. Division. Mads Hansen scorede to gange.",
    content: `Vanløse IF leverede en storstilet præstation hjemme på Vanløse Idrætspark og sendte BK Frem hjem med tre mål i bagagen.

Kampen startede tæt, men VIF fik hurtigt overtaget da Mads Hansen åbnede scoring efter et flot kombinationsspil fra venstre fløj. Inden pausen scorede Hansen igen på et præcist frispark fra kanten af feltet.

Efter pausen var der aldrig tvivl om resultatet. Jonas Berg skaffede en straffespark i det 67. minut og satte sikkert selv bolden i nettet. BK Frem reducerede kort efter til 3-1, men VIF holdt resultatet.

"Det er den slags præstationer vi har trænet på. Alle mand løb og kæmpede, og det viste sig i dag," sagde kaptajn Christian Krogh efter kampen.

Med sejren er VIF nu placeret på en suveræn førsteplads med 24 point — tre foran nærmeste forfølger BK Frem.`,
    latest: true,
  },
  {
    id: 2,
    slug: "ny-hovedsponsor-2026",
    category: "KLUB",
    date: "5. marts 2026",
    title: "Ny hovedsponsor klar til resten af sæsonen",
    excerpt:
      "Vanløse IF er stolt af at præsentere det nye samarbejde, der styrker ambitionerne om oprykning til 2. Division.",
    content: `Vanløse IF kan i dag offentliggøre et nyt og spændende sponsorsamarbejde, der sikrer klubben øget finansiering til resten af sæsonen og den kommende sæson.

Den nye sponsor ønsker at bidrage aktivt til klubbens vision om at rykke op i 2. Division inden for de næste to sæsoner. Det betyder ny træningsudstyr, forbedring af faciliteter og mulighed for at fastholde trænerstabens nuværende niveau.

"Vi er utroligt glade for dette samarbejde. Det er en kæmpe tillid til det arbejde vi laver herude i Vanløse," siger formand Erik Hansen.

Samarbejdet inkluderer synlighed på spillernes trøjer, LED-skærme ved banen og co-branding på alle klubbens kommunikationskanaler.`,
    latest: false,
  },
  {
    id: 3,
    slug: "u17-dm-slutrunde",
    category: "UNGDOM",
    date: "2. marts 2026",
    title: "U17 til DM-slutrunde for første gang i 10 år",
    excerpt:
      "En historisk præstation fra de unge drenge, der nu rejser til Odense og repræsenterer København.",
    content: `Vanløse IFs U17-hold har kvalificeret sig til DM-slutrunden — den første gang i over 10 år at klubben er repræsenteret på dette niveau i ungdomsfodbold.

Med en imponerende sæson med 14 sejre i 16 kampe er holdet under ledelse af cheftræner Søren Bach kørt til tops i den sjællandske pulje og har dermed sikret sig billetten til den nationale slutrunde i Odense.

"Drengene har arbejdet utrolig hårdt hele sæsonen. Denne kvalifikation er fortjent og er kulminationen på mange måneders dedikation," siger træner Søren Bach.

Slutrunden spilles 25.-27. april i Odense. VIF møder i første runde Silkeborg IF U17.`,
    latest: false,
  },
  {
    id: 4,
    slug: "0-0-bronshoj-udebane",
    category: "KAMP",
    date: "28. feb. 2026",
    title: "0-0 på udebane mod Brønshøj — et point i hård kamp",
    excerpt:
      "Defensivt stærkt VIF holdt nullet på udebane og befæster pladsen i toppen af 3. Division.",
    content: `En taktisk moden VIF-præstation på Brønshøj Stadion sikrede et vigtigt point i topkampen, da de to hold delte nullet i et jævnt opgør.

Cheftræner Thomas Rasmussen valgte en forsigtig tilgang til den svære udekamp, og defensiven, anført af kaptajn Christian Krogh, stod solidt hele kampen igennem.

Bedste chance havde VIF i det 74. minut, da Mads Jørgensen headede på stolpen fra et indlæg. Brønshøj var farlige på omstillinger, men målmand Lasse Krogh var på pletten hver gang.

"Et point her er godt. Vi vidste, at det ville blive en kamp, vi ikke skulle løbe med 3-0, men vi holdt nullet og det er vigtigt," sagde Thomas Rasmussen.`,
    latest: false,
  },
  {
    id: 5,
    slug: "generalforsamling-2026",
    category: "KLUB",
    date: "25. feb. 2026",
    title: "Generalforsamling 2026 — her er de vigtigste beslutninger",
    excerpt:
      "Bestyrelsen genvalgt, nyt budget godkendt og en spændende plan for renovering af omklædningsrum.",
    content: `Vanløse IF afholdt sin årlige generalforsamling tirsdag aften med ca. 80 fremmødte medlemmer.

Den nuværende bestyrelse med formand Erik Hansen i spidsen blev genvalgt med stort flertal. Årsregnskabet for 2025 viste et lille overskud på 45.000 kr., hvilket bestyrelsen betegnede som tilfredsstillende set i lyset af det øgede aktivitetsniveau.

Det kommende budget på 2,8 mio. kr. blev godkendt. Heraf er 400.000 kr. øremærket til renovering af omklædningsrummene, der er 30 år gamle og trænger til en grundig opdatering.

Et forslag om at øge kontingentsatserne med 8% fra 2027 blev vedtaget. Bestyrelsen understregede, at stigningen er nødvendig for at fastholde klubbens ambitionsniveau.`,
    latest: false,
  },
  {
    id: 6,
    slug: "ny-u13-traener",
    category: "UNGDOM",
    date: "20. feb. 2026",
    title: "Ny U13-træner ansat: 'Glæder mig til at møde spillerne'",
    excerpt:
      "Anders Holm med baggrund fra Akademisk BK træder til som ny træner for U13-holdet fra næste sæson.",
    content: `Vanløse IF er klar med en ny U13-træner. Anders Holm, der kommer med en solid baggrund som assistenttræner i Akademisk BKs ungdomsafdeling, tager over fra næste sæson.

"Jeg har fulgt Vanløse IF med interesse i lang tid og er imponeret over det arbejde, der gøres i ungdomsafdelingen. Glæder mig til at møde spillerne og bidrage til den positive udvikling," siger Anders Holm.

Holm har UEFA B-licens og har specialiseret sig i teknisk grundtræning for de yngre årgange. Han erstatter Martin Petersen, der stopper efter fire år i klubben.

"Vi er meget glade for at have fået Anders til klubben. Hans erfaring og passion for spillerudvikling passer perfekt til vores filosofi," siger ungdomskoordinator Lars Eriksen.`,
    latest: false,
  },
];
