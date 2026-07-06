-- Tabela platform (domen) zarządzana z panelu /admin/platformy.
-- Zastępuje zaszytą na sztywno listę platform w kodzie.
-- Zastosowana na projekcie Supabase kukvgsjrmrqtzhkszzum.

CREATE TABLE IF NOT EXISTS public.cms_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,          -- tag zapisywany w aura_articles.platforms
  label text NOT NULL,                 -- widoczna nazwa
  domain text NOT NULL,                -- domena (bez www) do mapowania Host -> platforma
  color text NOT NULL DEFAULT '#475569',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_platforms ENABLE ROW LEVEL SECURITY;

-- Publiczny odczyt (potrzebny dla SSR bloga na kluczu anon).
CREATE POLICY "Publiczny odczyt platform" ON public.cms_platforms
  FOR SELECT USING (true);

-- Pełne zarządzanie tylko dla roli admin (wzorzec jak w aura_articles).
CREATE POLICY "Admin zarzadza platformami" ON public.cms_platforms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rola = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rola = 'admin')
  );

-- Seed: dotychczasowe 18 platform.
INSERT INTO public.cms_platforms (value, label, domain, color, sort_order) VALUES
  ('AuraBenefits',       'AuraBenefits',     'aurabenefits.pl',      '#6366f1', 10),
  ('AuraConsulting.pl',  'AuraConsulting',   'auraconsulting.pl',    '#0f172a', 20),
  ('Grupowe.pro',        'Grupowe.pro',      'grupowe.pro',          '#3b82f6', 30),
  ('UtrataDochodu.pl',   'UtrataDochodu',    'utratadochodu.pl',     '#d97706', 40),
  ('Gwarancje.pro',      'Gwarancje.pro',    'gwarancje.pro',        '#01696f', 50),
  ('Idzik.org.pl',       'Idzik.org.pl',     'idzik.org.pl',         '#8b5cf6', 60),
  ('Zarzad',             'Zarząd',           'zarzad.pl',            '#475569', 70),
  ('RozwodWaw.pl',       'Rozwód Warszawa',  'rozwod.waw.pl',        '#1d4ed8', 80),
  ('RozwodTarchomin.pl', 'Rozwód Tarchomin', 'rozwodtarchomin.pl',   '#dc2626', 90),
  ('RozwodOchota.pl',    'Rozwód Ochota',    'rozwodochota.pl',      '#ea580c', 100),
  ('RozwodZoliborz.pl',  'Rozwód Żoliborz',  'rozwodzoliborz.pl',    '#ca8a04', 110),
  ('RozwodBielany.pl',   'Rozwód Bielany',   'rozwodbielany.pl',     '#16a34a', 120),
  ('RozwodLegionowo.pl', 'Rozwód Legionowo', 'rozwodlegionowo.pl',   '#0891b2', 130),
  ('RozwodMokotow.pl',   'Rozwód Mokotów',   'rozwodmokotow.pl',     '#7c3aed', 140),
  ('RozwodLomianki.pl',  'Rozwód Łomianki',  'rozwodlomianki.pl',    '#be185d', 150),
  ('RozwodWola.pl',      'Rozwód Wola',      'rozwodwola.pl',        '#9333ea', 160),
  ('RozwodBemowo.pl',    'Rozwód Bemowo',    'rozwodbemowo.pl',      '#0f766e', 170),
  ('RozwodJablonna.pl',  'Rozwód Jabłonna',  'rozwodjablonna.pl',    '#be123c', 180)
ON CONFLICT (value) DO NOTHING;
