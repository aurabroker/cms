# AuraHUB CMS (SvelteKit)

System zarządzania treścią dla platform Aura Group. Jeden panel logowania,
z którego publikuje się artykuły na wiele domen naraz — a publiczny blog każdej
domeny jest renderowany po stronie serwera (SSR), więc treść jest widoczna dla
Google i podglądów w social media.

---

## Technologie

| Warstwa | Co używamy |
|---|---|
| Framework | [SvelteKit](https://kit.svelte.dev) (Svelte 5) + TypeScript |
| Renderowanie | SSR + meta/Open Graph per artykuł (SEO) |
| Edytor treści | [TipTap v2](https://tiptap.dev) — tabele, wyrównanie, obrazy z alt, licznik znaków |
| Baza / Auth / Storage | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage) |
| Hosting | Cloudflare Workers (`@sveltejs/adapter-cloudflare`) |
| Ikony | `@lucide/svelte` |

Poprzednia wersja (vanilla JS SPA) została w całości przepisana na SvelteKit.

---

## Struktura projektu

```
src/
├── app.html               # Szkielet HTML + inline-init motywu (bez FOUC)
├── app.css                # Design system (przeniesiony) + style edytora
├── hooks.server.ts        # Supabase SSR (sesja w cookie) + guard /admin
├── lib/
│   ├── config.ts          # URL + anon key Supabase (publiczny)
│   ├── platforms.ts        # Typy + resolver + fallback (źródło prawdy: tabela cms_platforms)
│   ├── server/platforms.ts # Ładowanie platform z bazy (cache 60 s)
│   ├── types.ts           # Typy tabel + konfiguracja tabel opinii
│   ├── supabaseClient.ts  # Klient przeglądarkowy (upload, zapis)
│   ├── sanitize.client.ts # DOMPurify przy zapisie treści
│   ├── youtube.ts, util.ts, theme.svelte.ts
│   └── components/        # Editor, BlogCard, PlatformBadge, ThemeToggle
└── routes/
    ├── +page.svelte             # Publiczny blog (SSR, filtr po domenie)
    ├── artykul/[slug]/          # Czytnik artykułu (SSR + meta/OG, licznik odsłon)
    ├── login/, logout/          # Logowanie (server actions + cookie)
    ├── sitemap.xml/, robots.txt/# SEO per-domena
    └── admin/                   # Panel (guard: rola = admin)
        ├── +page.svelte          # Pulpit (KPI)
        ├── artykuly/            # Tabela + edytor (/edytor/[[id]])
        ├── opinie/[table]/      # Moderacja: div_review / ud_review / aura_reviews
        ├── analityka/           # Top artykuły wg wyświetleń
        └── platformy/           # Zarządzanie domenami (CRUD, bez zmian w kodzie)
```

---

## Jak działa multi-tenant

Wszystkie domeny wskazują na tego samego Workera. `src/lib/platforms.ts` mapuje
nagłówek `Host` żądania na wartość platformy (np. `utratadochodu.pl` →
`UtrataDochodu.pl`). Publiczny blog i czytnik pobierają artykuły po stronie
serwera i filtrują po `platforms @> [platforma]`. Nieznany host (np. domena
panelu, localhost) pokazuje wszystkie opublikowane artykuły.

Platformy dodaje się z panelu **/admin/platformy** (tabela `cms_platforms`) —
bez zmian w kodzie. Nowa platforma od razu pojawia się w edytorze, filtrach
i badge'ach (kolor znacznika ustawiasz w panelu). Ostatni krok to podłączenie
domeny do Workera w panelu Cloudflare. `src/lib/platforms.ts` zawiera już tylko
typy, resolver i awaryjny fallback.

---

## Supabase

**Projekt:** `kukvgsjrmrqtzhkszzum.supabase.co`

- `aura_articles` — artykuły (m.in. `slug` używany do SEO-friendly URLi).
- `profiles` — role; dostęp do panelu ma `rola = 'admin'`.
- `div_review`, `ud_review`, `aura_reviews` — opinie (moderacja).
- `cms_platforms` — platformy/domeny zarządzane z panelu (patrz `supabase/migrations`).
- Storage bucket `article-images` — zdjęcia z edytora.
- RPC `increment_article_views` — licznik odsłon (wywoływany z czytnika).

Klucz `anon` jest publiczny; bezpieczeństwo zapewnia RLS. W `src/lib/config.ts`
są domyślne wartości; można je nadpisać `PUBLIC_SUPABASE_URL` /
`PUBLIC_SUPABASE_ANON_KEY` (patrz `.env.example`).

---

## Uruchomienie

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build produkcyjny (Cloudflare Worker)
npm run preview    # podgląd
npm run check      # typecheck (svelte-check)
```

> Uwaga: lokalnie zapytania do Supabase wymagają dostępu sieciowego do domeny
> projektu; w produkcji na Cloudflare działa bez ograniczeń.

---

## Deploy (Cloudflare Workers)

`wrangler.jsonc` jest skonfigurowany pod `adapter-cloudflare`:

```bash
npm run deploy      # = npm run build && wrangler deploy
```

Push do `main` może triggerować auto-deploy (konfiguracja w panelu Cloudflare).
