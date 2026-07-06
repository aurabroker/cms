/**
 * Konfiguracja Supabase.
 *
 * Klucz `anon` jest publiczny z założenia — bezpieczeństwo danych zapewniają
 * polityki Row Level Security (RLS) po stronie bazy, nie ukrywanie klucza.
 * Te same wartości były wcześniej wbudowane w app.js. W razie potrzeby można
 * je nadpisać zmiennymi środowiskowymi PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY.
 */
import { env } from '$env/dynamic/public';

export const SUPABASE_URL =
	env.PUBLIC_SUPABASE_URL || 'https://kukvgsjrmrqtzhkszzum.supabase.co';

export const SUPABASE_ANON_KEY =
	env.PUBLIC_SUPABASE_ANON_KEY ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3Znc2pybXJxdHpoa3N6enVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTI0NzYsImV4cCI6MjA4ODQ4ODQ3Nn0.wOB-4CJTcRksSUY7WD7CXEccTKNxPIVF8AT8hczS5zY';

/** Nazwa publicznego bucketu na zdjęcia w Supabase Storage. */
export const STORAGE_BUCKET = 'article-images';
