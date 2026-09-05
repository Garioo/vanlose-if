-- Seeds volunteer_roles from the hardcoded fallback in
-- src/app/(site)/frivillig/page.tsx.
--
-- The table is empty, so /frivillig renders that fallback array and the admin
-- screen for volunteer roles has no effect on what visitors see. Moving the
-- same text into the database makes the admin screen real. The copy below is
-- taken verbatim from the fallback, not written fresh.

INSERT INTO public.volunteer_roles (title, description, tasks, display_order)
VALUES
  (
    'Træner & Holdleder',
    'Som træner eller holdleder står du for den daglige kontakt med spillere og forældre. Vi tilbyder DBU-uddannelse og hjælp fra klubbens øvrige trænere.',
    ARRAY['Ledelse af træninger', 'Kampledelse og tilmelding', 'Kontakt til forældre'],
    0
  ),
  (
    'Event & Kiosk',
    'Bag enhver god kampdag står frivillige kræfter. Vi har brug for hjælp i kiosken, ved opstilling og nedtagning af udstyr, og til at skabe den stemning, der gør Vanløse Idrætspark til noget særligt.',
    ARRAY['Kioskdrift på kampdage', 'Arrangementssupport', 'Dekorering og opsætning'],
    1
  ),
  (
    'Bestyrelse & Administration',
    'Har du kompetencer inden for økonomi, kommunikation, jura eller ledelse? Klubbens daglige drift kræver engagerede mennesker, der vil gøre en forskel bag kulisserne.',
    ARRAY['Strategisk klubudvikling', 'Kommunikation og sociale medier', 'Økonomi og sponsorater'],
    2
  );
