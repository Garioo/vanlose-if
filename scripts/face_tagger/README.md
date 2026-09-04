# Ansigtsgenkendelse til spillertags

Foreslår spillertags til mediebiblioteket ved at genkende ansigter i klubbens
fotos. Forslagene bliver **aldrig** anvendt automatisk — de lander i
mediebiblioteket, hvor en admin godkender eller afviser hvert enkelt.

## Hvorfor det virker uden manuel oplæring

Biblioteket er allerede tagget i hånden med spillernavne. De tags er
træningsdataene: for hver spiller indlejres alle fotos tagget med deres navn,
og den dominerende ansigtsklynge på tværs af de fotos *er* spilleren — alle
andre varierer fra foto til foto. Derfor kræver opsætningen ingen manuel
markering af enkeltansigter.

## Omfang: kun førsteholdet

Referencerne bygges udelukkende fra `players`-tabellen (førsteholdstruppen), og
medier under en `ungdom/`- eller `U<nr>/`-sti springes helt over
(`YOUTH_PATTERN` i `common.py`).

Det er en bevidst afgrænsning, ikke et teknisk tilfælde. Ansigtsindlejringer er
biometriske data og dermed særlig kategori efter GDPR art. 9. For voksne
førsteholdsspillere hviler behandlingen på klubbens eget grundlag; for
ungdomsspillere kræver det samtykke fra forældre/værge, og den beslutning skal
træffes før koden udvides — ikke bagefter.

Derfor gælder også:

- **Indlejringerne forlader ikke maskinen.** `player_faces.json` er gitignoreret
  og bliver aldrig lagt i databasen.
- **Databasen indeholder ingen biometri.** `media_tag_suggestions` gemmer kun et
  tagnavn og en score.
- **Ingen tredjeparts-ansigts-API.** Al genkendelse kører lokalt via ONNX.

## Opsætning

```bash
python3 -m venv .venv-face
./.venv-face/bin/pip install -r scripts/face_tagger/requirements.txt
```

Testet på Python 3.9 (arm64). Modellen (`buffalo_l`, ca. 280 MB) hentes
automatisk første gang til `~/.insightface/`.

Kræver `.env.local` med `CLOUDINARY_*`, `NEXT_PUBLIC_SUPABASE_URL` og
`SUPABASE_SERVICE_ROLE_KEY`.

Migrationerne `20260904000000_add_media_assets.sql` og
`20260904010000_add_media_tag_suggestions.sql` skal være kørt.

## To signaler: ansigt og rygnummer

Ansigtsgenkendelse virker kun når ansigtet vender mod kameraet. På vidvinkel-
billeder gør det sjældent det — målt på allerede taggede fotos blev der fundet
101 ansigter hvor tags nævner ~49 spillerforekomster, altså mange spillere helt
uden synligt ansigt. Rygnummeret er læsbart præcis når spilleren vender ryggen
til, så de to signaler dækker hinandens huller.

Numrene kommer fra `players.number`, hvilket dækker **alle** spillere i truppen
— også de 12 der ikke har et brugbart referenceansigt.

### Modstanderproblemet

Begge hold er på hvert kampfoto, og OCR læser modstanderens 9-tal lige så
sikkert som vores. Derfor godtages et nummer kun hvis trøjen omkring det har en
af klubbens kitfarver.

Farverne bliver ikke skrevet i hånden, men udledt: et ansigt der matcher
galleriet *er* en af vores spillere, så trøjen lige under er vores kit. Prøverne
klynges, og resultatet er de farver der faktisk optræder i fotoerne.

Uden `kit_colours.json` slår nummeraflæsningen sig selv fra med en advarsel
frem for at tagge modstandere.

**Kendte begrænsninger:** målmandstrøjen har en anden farve end marktrøjen og
falder som regel for farvefiltret, og en modstander i tilfældigt lignende farver
slipper igennem. Alt bliver gennemset af et menneske, så det koster tid, ikke
korrekthed.

## Brug

Byg referenceansigterne (kør igen når truppen ændrer sig):

```bash
cd scripts/face_tagger && ../../.venv-face/bin/python build_gallery.py
```

Udled kitfarverne (kør igen hvis klubben skifter spilletøj):

```bash
cd scripts/face_tagger && ../../.venv-face/bin/python calibrate_kit.py
```

Foreslå tags — start altid med `--dry-run`:

```bash
cd scripts/face_tagger && ../../.venv-face/bin/python tag_media.py --dry-run
```

Gem forslagene, evt. afgrænset til én kamp:

```bash
cd scripts/face_tagger && ../../.venv-face/bin/python tag_media.py --folder "2026-08-08 Næsby vs Vanløse"
```

### Eller: knappen i mediebiblioteket

**☺ Find spillere** i upload-panelet kører det samme over den mappe du står i
(alle mapper hvis ingen er valgt), og kun over utaggede medier.

Knappen virker **kun lokalt** — `npm run dev` på din egen maskine. Genkendelse
kræver Python, en ~280 MB model og flere minutters CPU pr. kørsel, hvilket ikke
kan køre i en serverless function. Kørt lokalt skriver den til den fælles
database, så forslagene er synlige for alle bagefter. På et deployet site
svarer knappen med en besked om netop det.

Forslagene vises derefter i mediebibliotekets tagpanel under
**Foreslået ansigtsgenkendelse**, med en procentsats. `+` lægger tagget i
kladden (det skrives først til Cloudinary når du gemmer som normalt), `×`
afviser det permanent, så en senere kørsel ikke foreslår det igen.

## Indstillinger

| Flag | Standard | Betydning |
| --- | --- | --- |
| `--cluster-threshold` | 0.45 | Hvornår to ansigter regnes som samme person ved opbygning |
| `--min-samples` | 3 | Mindste klyngestørrelse før en spiller optages |
| `--limit-per-player` | 40 | Maks. fotos pr. spiller |
| `--threshold` | 0.5 | Mindste lighed før et match foreslås |
| `--only-untagged` | fra | Spring medier over der allerede har tags |
| `--no-numbers` | fra | Slå aflæsning af rygnumre fra |
| `--number-score` | 0.6 | Mindste OCR-sikkerhed for et rygnummer |
| `--kit-tolerance` | fra filen | Hvor langt en trøjefarve må ligge fra kitfarven |

Når begge signaler peger på samme spiller, får forslaget kilden `face+number`
og et løft i sikkerhed, så de sikreste ligger øverst i køen. Et forslag der
allerede ligger til gennemsyn bliver opdateret hvis det andet signal senere
bekræfter det — men et forslag du har godkendt eller afvist bliver aldrig
foreslået igen.

Tærsklen er sat efter præcision frem for dækning: et forkert spillertag er
værre end et manglende. Forvent gode resultater på nærbilleder og fejringer og
svage resultater på vidvinkelbilleder, hvor ansigterne fylder få pixels. Skru
`--threshold` op hvis der kommer for mange forkerte forslag, ned hvis der
kommer for få.
