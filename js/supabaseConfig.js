/**
 * Supabase Configuration
 * Spamton Save Editor — подключение к Supabase
 *
 * ВАЖНО: Замените значения на ваши из Project Settings → API
 * SUPABASE_URL    → Project URL
 * SUPABASE_ANON_KEY → anon / public key
 */

var SupabaseConfig = (function () {

    // ===== ЗАМЕНИТЕ ЭТИ ЗНАЧЕНИЯ =====
    var SUPABASE_URL = 'https://sbujykoaalwmstlrvlut.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNidWp5a29hYWx3bXN0bHJ2bHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzg5NDcsImV4cCI6MjA4ODU1NDk0N30.J0yhmfvURuRdsSFEnDexl2yyTnZz3k5nIVhTnWbjgjI';
    // ==================================

    var _client = null;

    function getClient() {
        if (_client) return _client;
        if (typeof supabase === 'undefined' || !supabase.createClient) {
            console.error('Supabase JS SDK не загружен. Подключите CDN скрипт.');
            return null;
        }
        _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return _client;
    }

    function isConfigured() {
        return SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
               SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE';
    }

    return {
        getClient: getClient,
        isConfigured: isConfigured
    };
})();
