(function () {
  "use strict";

  // Frontend-safe Supabase publishable key only.
  // Never put the service_role key in this file.
  window.KAAM_KARO_SUPABASE = {
    url: "https://nayfeeqpssjmfkvmsorf.supabase.co",
    anonKey: "sb_publishable_75N8Af19fYfdXGMmbb_q3g_fktSyWNf",
    backendUrl: "",
    phoneCountryCode: "+91",
    devBypassOtp: window.location.protocol === "file:" ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  };
})();
