# Audyt bezpieczeństwa i funkcjonalny — AuraHUB CMS

**Data:** 2026-07-05 · **Zakres:** repozytorium `aurabroker/cms` + projekt Supabase `aurabroker`
**Ocena ogólna:** 🔴 WYSOKIE RYZYKO — wymaga pilnego działania

> Raport w czytelnej formie wizualnej: opublikowany jako Artifact (link w rozmowie).
> Poniżej wersja tekstowa do śledzenia w repo.

## Kontekst

CMS jest zbudowany rozsądnie, ale **współdzieli bazę Supabase z innymi aplikacjami** grupy
(APK — analiza potrzeb klienta, oferty UtrataDochodu, CRM, izba, itp.). Publiczny klucz `anon`
wpisany w `app.js` jest publiczny **z założenia** (to normalne dla Supabase) — ale sięga do
**wszystkich** tabel. Bezpieczeństwo zależy więc w 100% od reguł RLS. W kilku tabelach reguły są
zbyt luźne, przez co dane osobowe klientów są dziś dostępne publicznie.

**Rotacja klucza anon NIE naprawi tych luk — trzeba poprawić reguły RLS.**

## Ustalenia — bezpieczeństwo

| ID | Waga | Ustalenie | Gdzie |
|----|------|-----------|-------|
| S-01 | 🔴 Krytyczne | Formularze APK z danymi klientów czytelne bez logowania (`USING (true)`) | `apk_forms` / `apk_forms_select_anon_by_ref` |
| S-02 | 🔴 Krytyczne | Tokeny dostępu APK czytelne dla każdego (`USING (true)`) | `apk_tokens` / `apk_tokens_select_anon` |
| S-03 | 🔴 Krytyczne | Wszystkie „udostępnione” oferty klientów czytelne dla każdego | `ud_offers` / `ud_offers_public_share` (`share_token IS NOT NULL`) |
| S-04 | 🟠 Wysokie | Anonimowy upload plików do bucketu zdjęć | storage `article-images` / `Allow Uploads qt2lnz_0` |
| S-05 | 🟠 Wysokie | Opinie można opublikować z pominięciem moderacji (`WITH CHECK (true)`) | `div_review`, `ud_review`, `aura_reviews` |
| S-06 | 🟡 Średnie | Brak separacji treści między markami w bazie (filtr tylko client-side) + duplikaty reguł | `aura_articles` |
| S-07 | 🟡 Średnie | 7 widoków SECURITY DEFINER omijających RLS | `blog_posts`, `analytics_30d/daily`, `pakiety_pelne`, `v_pakiet_szczegoly`, `v_porownanie_pakietow`, `bond_limits_view` |
| S-08 | 🟡 Średnie | Publiczne buckety pozwalają listować pliki | `article-images`, `apk-pdfs`, `logos` |
| S-09 | 🟡 Średnie | 51 funkcji SECURITY DEFINER dostępnych publicznie; 16 z mutable `search_path` | funkcje `public.*` |
| S-10 | 🔵 Niskie | Ochrona przed wyciekłymi hasłami wyłączona | Supabase Auth |
| S-11 | 🔵 Niskie | Rozszerzenie w schemacie `public` | Supabase |
| S-12 | 🔵 Niskie | Biblioteki z CDN + `unsafe-inline` w CSP — rozważyć self-host + SRI | `index.html`, `article.html` |
| S-13 | 🔵 Niskie | Klucz anon w publicznym repo — OK z założenia; rotacja pomoże dopiero po naprawie RLS | `app.js` |

> S-01…S-03 dotyczą tabel **innych aplikacji** grupy. Naprawa jest pilna, ale może wpłynąć na te
> aplikacje (podgląd formularza/oferty z linku) — **wymaga potwierdzenia i analizy przed wdrożeniem**.

## Ustalenia — funkcjonalne

| ID | Ustalenie |
|----|-----------|
| F-01 | Panel „Social Media" to atrapa — dane w HTML na sztywno, przyciski nic nie zapisują. |
| F-02 | Panel „Użytkownicy" to atrapa — lista i role wpisane na sztywno; realny model to `profiles.rola` = `admin`/`viewer`. |
| F-03 | Analityka „Ruch wg Domen" — liczby, unikalni, czas, trendy wpisane na sztywno; realne są tylko „Top artykuły wg wyświetleń". |
| F-04 | Dashboard „Aktywne platformy: 6" na sztywno — realnie 17 platform. |
| F-05 | Tytuł bloga „Baza Wiedzy HR" stały niezależnie od domeny (mylące na stronach rozwodowych/ubezpieczeniowych). |
| F-06 | Licznik `views` bez deduplikacji — każde odświeżenie zawyża odsłony. |
| F-07 | Nowa domena wymaga wpisu w `HOSTNAME_TO_PLATFORM` — inaczej blog pokaże **wszystkie** artykuły (brak filtra). Istotne przy podłączaniu platformy ZARZAD. |

## Co działa dobrze

- RLS włączone na wszystkich 100+ tabelach.
- Zapis/edycja/usuwanie artykułów tylko dla roli `admin`.
- `profiles` bez reguł zapisu → brak eskalacji uprawnień (viewer nie awansuje się na admina).
- Ochrona XSS: DOMPurify na treści, escapowanie tytułów/tagów, iframe tylko YouTube/Vimeo.
- CSP obecne na obu stronach; realna autoryzacja wymuszana przez RLS (nie tylko UI).

## Plan działania (priorytety)

1. 🔴 **Natychmiast:** zamknąć publiczny odczyt `apk_forms`, `apk_tokens`, `ud_offers` (S-01/02/03).
2. 🔴 **Natychmiast:** usunąć anonimowy upload do `article-images` (S-04).
3. 🟠 **Wkrótce:** zablokować self-approve opinii (S-05).
4. 🟠 **Wkrótce:** `apk-pdfs` → bucket prywatny, ograniczyć listowanie (S-08).
5. 🟡 **Zaplanuj:** przegląd widoków/funkcji SECURITY DEFINER + `search_path` (S-07, S-09).
6. 🟡 **Zaplanuj:** uporządkować reguły odczytu artykułów (S-06).
7. 🟡 **Zaplanuj:** włączyć ochronę haseł, hardening CSP (S-10, S-12).
8. 🟡 **Zaplanuj:** oznaczyć/dokończyć panele-atrapy (F-01…F-04).

Propozycje zapytań SQL: patrz `db/security-hardening.sql` (do zatwierdzenia przed wdrożeniem).
