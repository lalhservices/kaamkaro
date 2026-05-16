// Copy these values from Supabase Project Settings > API.
// This file is an example only. Do not put the service_role key in frontend code.
window.KAAM_KARO_SUPABASE = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  phoneCountryCode: "+91",

  // TEST ONLY. Set true only while privately testing before SMS OTP is ready.
  // Must be false before public launch.
  allowPhoneOnlyTestLogin: false,

  devBypassOtp: false
};
