(function () {
  "use strict";

  function readConfig() {
    var fromWindow = window.KAAM_KARO_SUPABASE || window.KAAM_KARO_SUPABASE_CONFIG || {};
    var urlMeta = document.querySelector('meta[name="supabase-url"]');
    var keyMeta = document.querySelector('meta[name="supabase-anon-key"]');
    var backendMeta = document.querySelector('meta[name="kaam-karo-backend-url"]');
    var isLocal = window.location.protocol === "file:" ||
      (window.location.protocol === "http:" && ["localhost", "127.0.0.1", ""].indexOf(window.location.hostname) >= 0);
    return {
      url: fromWindow.url || (urlMeta ? urlMeta.content : "") || localStorage.getItem("kkSupabaseUrl") || "",
      anonKey: fromWindow.anonKey || (keyMeta ? keyMeta.content : "") || localStorage.getItem("kkSupabaseAnonKey") || "",
      backendUrl: fromWindow.backendUrl || window.KAAM_KARO_BACKEND_URL || (backendMeta ? backendMeta.content : "") || localStorage.getItem("kkBackendUrl") || "",
      phoneCountryCode: fromWindow.phoneCountryCode || localStorage.getItem("kkPhoneCountryCode") || "+91",
      devBypassOtp: isLocal && (fromWindow.devBypassOtp === true || localStorage.getItem("kkDevBypassOtp") === "true"),
      testLoginEnabled: fromWindow.testLoginEnabled === true || localStorage.getItem("kkTestLoginEnabled") === "true"
    };
  }

  function getClient() {
    var cfg = readConfig();
    if (!cfg.url || !cfg.anonKey || !window.supabase || !window.supabase.createClient) return null;
    if (!window.kaamKaroSupabaseClient) {
      window.kaamKaroSupabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
    }
    return window.kaamKaroSupabaseClient;
  }

  function setLocalConfig(url, anonKey) {
    if (url) localStorage.setItem("kkSupabaseUrl", url);
    if (anonKey) localStorage.setItem("kkSupabaseAnonKey", anonKey);
    window.kaamKaroSupabaseClient = null;
    return !!getClient();
  }

  window.KaamKaroSupabase = {
    config: readConfig,
    client: getClient,
    isConfigured: function () { return !!getClient(); },
    setLocalConfig: setLocalConfig
  };
})();
