-- =============================================================================
--  AuraHUB CMS — propozycje poprawek bezpieczeństwa (RLS / storage)
--  Powiązane z SECURITY-AUDIT.md
--
--  UWAGA: to jest PROPOZYCJA. Nie uruchamiać hurtem na produkcji.
--  Zmiany dotyczą współdzielonej bazy `aurabroker` — sekcja KRYTYCZNA
--  (S-01..S-03) może wpłynąć na inne aplikacje grupy i wymaga analizy.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- S-04 (Wysokie) — usuń anonimowy upload do bucketu zdjęć.
-- Zostaje reguła "Authenticated upload article-images" (upload tylko po logowaniu).
-- CMS wgrywa zdjęcia dopiero po zalogowaniu admina — nic się nie zepsuje.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow Uploads qt2lnz_0" ON storage.objects;

-- -----------------------------------------------------------------------------
-- S-05 (Wysokie) — zablokuj publikację opinii z pominięciem moderacji.
-- Publiczny formularz nadal działa, ale nie może wstawić approved = true.
-- -----------------------------------------------------------------------------
ALTER POLICY "public insert" ON public.div_review   WITH CHECK (approved IS NOT TRUE);
ALTER POLICY "public insert" ON public.ud_review    WITH CHECK (approved IS NOT TRUE);
ALTER POLICY "anon_insert"   ON public.aura_reviews WITH CHECK (approved IS NOT TRUE);

-- -----------------------------------------------------------------------------
-- S-08 (Średnie) — ogranicz LISTOWANIE plików w publicznych bucketach.
-- (Pobranie znanej ścieżki dalej działa; zmiana blokuje listowanie całości.)
-- Dla apk-pdfs zaleca się dodatkowo ustawić bucket jako prywatny i używać
-- podpisanych URL-i (signed URLs) — do wykonania w panelu Supabase / API.
-- -----------------------------------------------------------------------------
-- (do doprecyzowania po przeglądzie ścieżek plików)

-- =============================================================================
--  SEKCJA KRYTYCZNA — S-01 / S-02 / S-03
--  NIE uruchamiać bez analizy aplikacji APK / UtrataDochodu.
--  Kierunek naprawy (nie gotowe do wklejenia):
--    * apk_forms  — zamiast USING (true) weryfikować konkretny token/ref
--                   (np. przez funkcję RPC SECURITY DEFINER sprawdzającą apk_tokens),
--                   albo ograniczyć SELECT do roli authenticated.
--    * apk_tokens — usunąć publiczny SELECT; weryfikacja tokenu po stronie serwera.
--    * ud_offers  — warunek dopasowania do KONKRETNEGO tokenu przekazanego w zapytaniu,
--                   zamiast (share_token IS NOT NULL).
--  Przykład kierunku (do dostosowania):
--
--    DROP POLICY "apk_forms_select_anon_by_ref" ON public.apk_forms;
--    DROP POLICY "apk_tokens_select_anon"        ON public.apk_tokens;
--    -- + funkcja RPC: get_apk_form_by_token(p_token text) SECURITY DEFINER
--    --   która zwraca formularz tylko dla ważnego, niewygasłego tokenu.
-- =============================================================================
