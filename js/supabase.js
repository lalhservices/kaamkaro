(function () {
  "use strict";

  function readConfig() {
    var fromWindow = window.KAAM_KARO_SUPABASE || window.KAAM_KARO_SUPABASE_CONFIG || {};
    var urlMeta = document.querySelector('meta[name="supabase-url"]');
    var keyMeta = document.querySelector('meta[name="supabase-anon-key"]');
    return {
      url: fromWindow.url || (urlMeta ? urlMeta.content : "") || localStorage.getItem("kkSupabaseUrl") || "",
      anonKey: fromWindow.anonKey || (keyMeta ? keyMeta.content : "") || localStorage.getItem("kkSupabaseAnonKey") || "",
      phoneCountryCode: fromWindow.phoneCountryCode || localStorage.getItem("kkPhoneCountryCode") || "+91",
      devBypassOtp: fromWindow.devBypassOtp === true || localStorage.getItem("kkDevBypassOtp") === "true",
      allowPhoneOnlyTestLogin: fromWindow.allowPhoneOnlyTestLogin === true
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
