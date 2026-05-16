(function () {
  "use strict";

  // Frontend-safe Supabase publishable key only.
  // Never put the service_role key in this file.
  window.KAAM_KARO_SUPABASE = {
    url: "https://nayfeeqpssjmfkvmsorf.supabase.co",
    anonKey: "sb_publishable_75N8Af19fYfdXGMmbb_q3g_fktSyWNf",
    phoneCountryCode: "+91",

    // TEST ONLY:
    // Allows phone-number-only login without SMS OTP while Supabase OTP is not set up.
    // Keep true only while testing the MVP privately.
    // Set to false before public launch.
    allowPhoneOnlyTestLogin: true,

    devBypassOtp: window.location.protocol === "file:" ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  };
})();
