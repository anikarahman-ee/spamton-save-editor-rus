/**
 * MongoConfig — устаревший модуль (Realm Web SDK удалён).
 * Теперь все запросы к базе данных идут через ApiClient (REST API → Vercel Functions → MongoDB Atlas).
 *
 * Этот файл оставлен как пустая заглушка для обратной совместимости.
 * Ни одна из функций ниже не используется — используйте ApiClient напрямую.
 */

var MongoConfig = (function () {

    function warn() {
        console.warn('MongoConfig устарел — используйте ApiClient');
        return null;
    }

    function isConfigured() {
        return true; // бэкенд всегда готов
    }

    return {
        getApp:                  warn,
        getDB:                   warn,
        getCollection:           warn,
        getPublicCollection:     warn,
        getProfilesCollection:   warn,
        getCommentsCollection:   warn,
        getCollectionsCollection:warn,
        getReportsCollection:    warn,
        getSuggestionsCollection:warn,
        isConfigured:            isConfigured
    };
})();
