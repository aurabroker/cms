import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * Klient Supabase dla przeglądarki. Współdzieli sesję (cookie) z klientem
 * serwerowym z hooks.server.ts, więc operacje klienckie (upload zdjęć,
 * zapis artykułu, autozapis) działają jako zalogowany użytkownik.
 */
export const supabaseBrowser = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
