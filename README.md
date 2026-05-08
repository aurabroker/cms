# AuraHUB CMS

System zarządzania treściami dla platform Aura Group. Pozwala tworzyć, edytować i publikować artykuły na wielu domenach jednocześnie.

---

## Technologie

| Warstwa | Co używamy |
|---|---|
| Frontend | Vanilla JS + HTML/CSS (bez frameworka) |
| Edytor treści | [TipTap v2](https://tiptap.dev) (headless, oparty na ProseMirror) |
| Baza danych | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage) |
| Hosting | Cloudflare Workers (Static Assets) |
| Ikony | Lucide |

---

## Struktura plików

```
cms/
├── index.html      # Cały interfejs (SPA — jedna strona)
├── app.js          # Cała logika: auth, routing, edytor, Supabase
├── style.css       # Style — design system + komponenty
├── wrangler.jsonc  # Konfiguracja Cloudflare Workers
└── README.md
```

---

## Supabase — baza danych

**Projekt:** `kukvgsjrmrqtzhkszzum.supabase.co`

### Tabele

#### `aura_articles`
Główna tabela artykułów.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | Tytuł artykułu |
| `excerpt` | text | Krótki wstęp / zajawka |
| `content` | text | Treść HTML z edytora TipTap |
| `tags` | text[] | Tablica tagów |
| `platforms` | text[] | Domeny do publikacji (patrz niżej) |
| `thumbnail_url` | text | Link do YouTube (miniaturka wyciągana automatycznie) |
| `status` | text | `draft` lub `published` |
| `published_at` | timestamptz | Data publikacji |
| `ai_generated` | bool | Flaga treści AI |
| `views` | int | Licznik wyświetleń |
| `created_at` | timestamptz | Auto |

#### `profiles`
Profile użytkowników z rolami.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | uuid | FK → `auth.users.id` |
| `rola` | text | `admin` lub `viewer` |

### Storage

**Bucket:** `article-images` — publiczny bucket na zdjęcia wgrywane do edytora.
Pliki wgrywane jako: `{timestamp}-{random}.{ext}`

---

## Platformy publikacji

Artykuł można przypisać do jednej lub wielu domen:

| Wartość w bazie | Domena |
|---|---|
| `AuraBenefits` | aurabenefits.pl |
| `AuraConsulting.pl` | auraconsulting.pl |
| `Grupowe.pro` | grupowe.pro |
| `UtrataDochodu.pl` | utratadochodu.pl |
| `Gwarancje.pro` | gwarancje.pro |
| `Idzik.org.pl` | idzik.org.pl |

---

## Role użytkowników

- **admin** — pełny dostęp: tworzenie/edycja/usuwanie artykułów, dashboard, analityka, zarządzanie użytkownikami
- **viewer** — tylko publiczny podgląd bloga (brak panelu admin)

Rola ustawiana w tabeli `profiles.rola`. Logowanie przez Supabase Auth (email + hasło).

---

## Edytor TipTap

Edytor jest headless — własny toolbar z przyciskami:

**Formatowanie:** H2, H3, Bold, Italic, Underline, Strike, Blockquote, Lista punktowana, Lista numerowana

**Wstawianie:** Link, Zdjęcie (upload do Supabase Storage), YouTube (embed)

**Zdjęcia:** można wstawiać przez przycisk toolbar lub wklejając ze schowka (`Ctrl+V`).

**Auto-save:** co 30 sekund, jeśli artykuł ma już `id` (po pierwszym zapisie) i wykryto zmiany.

---

## Deploy

Hosting na Cloudflare Workers (Static Assets). Konfiguracja w `wrangler.jsonc`.

```jsonc
{
  "name": "cms",
  "compatibility_date": "2026-05-07",
  "assets": { "directory": "." }
}
```

Każdy push do brancha `main` triggeruje automatyczny deploy na Cloudflare (skonfigurowane w panelu Cloudflare → Workers & Pages → projekt `cms` → Settings → Builds).

### Deploy ręczny (lokalnie)

```bash
npx wrangler deploy
```

---

## Uruchomienie lokalne

Nie wymaga build stepu — to czysty HTML/JS/CSS.

```bash
# Podgląd przez Wrangler (zalecane, symuluje Cloudflare)
npx wrangler dev

# Lub dowolny serwer statyczny
npx serve .
```

> Uwaga: plik `index.html` zawiera CSP (`Content-Security-Policy`) — otwieranie przez `file://` nie zadziała poprawnie. Używaj lokalnego serwera HTTP.

---

## Zmienne / konfiguracja

Klucz Supabase (`anon key`) jest wbudowany w `app.js` — jest to klucz publiczny przeznaczony do działania po stronie klienta. Bezpieczeństwo danych zapewniają polityki **Row Level Security (RLS)** w Supabase, nie ukrywanie klucza.

Jeśli chcesz zmienić projekt Supabase, zaktualizuj dwie stałe na początku `app.js`:

```js
const SB_URL = 'https://<twoj-projekt>.supabase.co';
const SB_KEY = '<twoj-anon-key>';
```
