(function () {
  "use strict";

  // Frontend-safe Supabase publishable key only.
  // Never put the service_role key in this file.
  window.KAAM_KARO_SUPABASE = {
    url: "https://nayfeeqpssjmfkvmsorf.supabase.co",
    anonKey: "sb_publishable_75N8Af19fYfdXGMmbb_q3g_fktSyWNf",
    backendUrl: "",
    phoneCountryCode: "+91",
    // Testing only: lets the prototype continue without SMS OTP while Supabase phone auth is not ready.
    // Set this to false before public launch.
    testLoginEnabled: true,
    devBypassOtp: window.location.protocol === "file:" ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  };
})();
