-- =============================================================================
--  AuraHUB CMS — poprawki bezpieczeństwa (RLS / storage)
--  Powiązane z SECURITY-AUDIT.md
--
--  STATUS: część WDROŻONA 2026-07-05 na projekcie Supabase `aurabroker`
--  (migracje: cms_security_storage_and_review_moderation,
--             close_anon_pii_apk_forms_tokens_ud_offers).
--  Ten plik pełni rolę dokumentacji i punktu odniesienia.
-- =============================================================================

-- ✅ WDROŻONE ----------------------------------------------------------------

-- S-04 (Wysokie) — usunięto anonimowy upload do bucketu zdjęć.
-- Zostaje reguła "Authenticated upload article-images" (upload tylko po logowaniu).
DROP POLICY IF EXISTS "Allow Uploads qt2lnz_0" ON storage.objects;

-- S-05 (Wysokie) — zablokowano publikację opinii z pominięciem moderacji.
ALTER POLICY "public insert" ON public.div_review   WITH CHECK (approved IS NOT TRUE);
ALTER POLICY "public insert" ON public.ud_review    WITH CHECK (approved IS NOT TRUE);
ALTER POLICY "anon_insert"   ON public.aura_reviews WITH CHECK (approved IS NOT TRUE);

-- S-01 / S-02 (Krytyczne) — usunięto publiczny (anon) odczyt formularzy i tokenów APK.
-- 0 rekordów ma NULL tenant, więc reguły tenantowe nie dają anonowi nic —
-- po usunięciu poniższych anon nie ma już bezpośredniego odczytu SELECT.
DROP POLICY IF EXISTS "apk_forms_select_anon_by_ref" ON public.apk_forms;
DROP POLICY IF EXISTS "apk_tokens_select_anon"        ON public.apk_tokens;

-- Bezpieczny odczyt formularza „po tokenie" (zamiast blankietowego SELECT).
CREATE OR REPLACE FUNCTION public.apk_form_by_token(p_token text)
RETURNS SETOF public.apk_forms
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT f.* FROM public.apk_forms f
  JOIN public.apk_tokens t ON t.form_id = f.id
  WHERE t.token = p_token
    AND (t.expires_at IS NULL OR t.expires_at > now());
$$;
REVOKE ALL ON FUNCTION public.apk_form_by_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.apk_form_by_token(text) TO anon, authenticated;

-- S-03 (Krytyczne) — ud_offers: bezpieczny odczyt oferty po DOKŁADNYM tokenie (RPC),
-- oraz usunięcie reguły anon pozwalającej czytać wszystkie „udostępnione" oferty.
CREATE OR REPLACE FUNCTION public.ud_offer_by_token(p_token text)
RETURNS SETOF public.ud_offers
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT o.* FROM public.ud_offers o
  WHERE o.share_token IS NOT NULL AND o.share_token = p_token;
$$;
REVOKE ALL ON FUNCTION public.ud_offer_by_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.ud_offer_by_token(text) TO anon, authenticated;

DROP POLICY IF EXISTS "ud_offers_public_share" ON public.ud_offers;

-- Wymagana drobna zmiana po stronie publicznych stron (inne repozytoria):
--   * strona „podgląd formularza APK z linku" -> supabase.rpc('apk_form_by_token', { p_token })
--   * strona „oferta z linku" (UtrataDochodu)  -> supabase.rpc('ud_offer_by_token', { p_token })
-- zamiast bezpośredniego .from(...).select().eq(...).


-- ⚠️  DO KOORDYNACJI z właścicielem aplikacji APK (NIE zmieniano, by nie
--     zepsuć aktywnego publicznego formularza APK). Pozostałe ekspozycje:
--
--   * apk_forms_select_auth  (authenticated, USING true)
--       -> każdy ZALOGOWANY użytkownik projektu czyta WSZYSTKIE formularze APK.
--          Zalecenie: zawęzić do tenantu (usunąć regułę; zostaje apk_tenant_select).
--   * apk_forms_update_anon  (anon, USING status='draft', WITH CHECK true)
--   * apk_tokens_update_anon (anon, USING status<>'used', WITH CHECK true)
--       -> anon może modyfikować (i przez UPDATE ... RETURNING odczytać) szkice
--          formularzy / nieużyte tokeny. Zalecenie: zawęzić WITH CHECK i zakres.
--   * apk_forms_insert_anon / apk_tokens_insert_auth (WITH CHECK true)
--       -> anon / dowolny zalogowany może wstawiać rekordy (spam).
--
-- Przykład zawężenia (do uzgodnienia z aplikacją APK — NIE uruchamiać na ślepo):
--   DROP POLICY "apk_forms_select_auth" ON public.apk_forms;   -- zostaje tenantowa
