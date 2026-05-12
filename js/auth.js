(function () {
  "use strict";

  var DEMO_USERS_KEY = "kkAuthUsers";
  var PENDING_PHONE_KEY = "kkPendingOtpPhone";
  var DEV_OTP_KEY = "kkDevOtpFallback";

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "").slice(-10);
  }

  function fullPhone(phone) {
    var cfg = window.KaamKaroSupabase && window.KaamKaroSupabase.config ? window.KaamKaroSupabase.config() : {};
    var countryCode = String(cfg.phoneCountryCode || "+91").replace(/[^\d+]/g, "");
    if (countryCode.charAt(0) !== "+") countryCode = "+" + countryCode;
    return countryCode + normalizePhone(phone);
  }

  function getClient() {
    return window.KaamKaroSupabase && window.KaamKaroSupabase.client ? window.KaamKaroSupabase.client() : null;
  }

  function isLocalPrototype() {
    return window.location.protocol === "file:" ||
      (window.location.protocol === "http:" && ["localhost", "127.0.0.1", ""].indexOf(window.location.hostname) >= 0);
  }

  function forceRealOtp() {
    var params = new URLSearchParams(window.location.search || "");
    return localStorage.getItem("kkForceRealOtp") === "true" || params.get("realOtp") === "1";
  }

  function canBypassOtpForTesting() {
    var cfg = window.KaamKaroSupabase && window.KaamKaroSupabase.config ? window.KaamKaroSupabase.config() : {};
    if (forceRealOtp()) return false;
    return cfg.devBypassOtp === true || isLocalPrototype();
  }

  function demoUsers() {
    try { return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "{}") || {}; }
    catch (error) { return {}; }
  }

  function saveDemoUsers(users) {
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
  }

  function ensureDemoUser(phone) {
    var users = demoUsers();
    if (!users[phone]) {
      users[phone] = {
        id: "demo-user-" + phone,
        phone_number: phone,
        active_role: "worker",
        has_worker_profile: false,
        has_employer_profile: false,
        language: localStorage.getItem("kaamkaroLang") || "en",
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      saveDemoUsers(users);
    }
    return users[phone];
  }

  async function ensureUserRecord(client, authUser, phone) {
    var now = new Date().toISOString();
    var columns = "id, phone_number, has_worker_profile, has_employer_profile, active_role, language, is_suspended, created_at, updated_at";
    var existing = await client
      .from("users")
      .select(columns)
      .eq("phone_number", phone)
      .maybeSingle();

    if (existing.error && existing.error.code !== "PGRST116") throw existing.error;
    if (existing.data && existing.data.is_suspended) throw new Error("This account is temporarily restricted.");
    if (existing.data) {
      await client.from("users").update({ updated_at: now }).eq("id", existing.data.id);
      return existing.data;
    }

    var row = {
      id: authUser.id,
      phone_number: phone,
      has_worker_profile: false,
      has_employer_profile: false,
      active_role: "worker",
      language: localStorage.getItem("kaamkaroLang") || "en",
      is_suspended: false,
      created_at: now,
      updated_at: now
    };
    var inserted = await client.from("users").insert(row).select(columns).single();
    if (inserted.error) throw inserted.error;
    return inserted.data;
  }

  async function sendOtp(rawPhone) {
    var phone = normalizePhone(rawPhone);
    if (phone.length !== 10) throw new Error("Enter a valid 10 digit phone number.");
    localStorage.setItem(PENDING_PHONE_KEY, phone);

    var client = getClient();
    if (!client) return { mode: "demo", phone: phone, bypassOtp: true, user: ensureDemoUser(phone) };
    if (canBypassOtpForTesting()) {
      return { mode: "test-bypass", phone: phone, bypassOtp: true, user: ensureDemoUser(phone) };
    }

    var result = await client.auth.signInWithOtp({
      phone: fullPhone(phone),
      options: { shouldCreateUser: true }
    });
    if (result.error) {
      if (isPhoneProviderSetupError(result.error) && canBypassOtpForTesting()) {
        sessionStorage.setItem(DEV_OTP_KEY, "1");
        return { mode: "test-bypass", phone: phone, bypassOtp: true, user: ensureDemoUser(phone) };
      }
      throw friendlyAuthError(result.error);
    }
    sessionStorage.removeItem(DEV_OTP_KEY);
    return { mode: "supabase", phone: phone };
  }

  async function verifyOtp(rawPhone, token) {
    var phone = normalizePhone(rawPhone || localStorage.getItem(PENDING_PHONE_KEY));
    var otp = String(token || "").replace(/\D/g, "");
    if (phone.length !== 10) throw new Error("Enter a valid 10 digit phone number.");
    if (!getClient() && otp.length !== 4 && otp.length !== 6) throw new Error("Enter the OTP code.");
    if (getClient() && sessionStorage.getItem(DEV_OTP_KEY) !== "1" && otp.length !== 6) throw new Error("Enter the 6 digit OTP code from SMS.");

    var client = getClient();
    if (sessionStorage.getItem(DEV_OTP_KEY) === "1" && isLocalPrototype()) {
      if (otp !== "123456") throw new Error("For local testing, use OTP 123456.");
      return { mode: "local-dev", phone: phone, user: ensureDemoUser(phone), session: null };
    }
    if (!client) {
      return { mode: "demo", phone: phone, user: ensureDemoUser(phone), session: null };
    }

    var verified = await client.auth.verifyOtp({
      phone: fullPhone(phone),
      token: otp,
      type: "sms"
    });
    if (verified.error) throw friendlyAuthError(verified.error);
    var authUser = verified.data && verified.data.user;
    if (!authUser) throw new Error("Could not verify OTP. Please try again.");
    var dbUser = await ensureUserRecord(client, authUser, phone);
    return { mode: "supabase", phone: phone, user: dbUser, session: verified.data.session || null };
  }

  function isPhoneProviderSetupError(error) {
    var message = String((error && error.message) || error || "");
    var code = String((error && error.code) || "");
    return /unsupported phone number|sms_send_failed|phone_provider_disabled|provider_disabled/i.test(message + " " + code);
  }

  function friendlyAuthError(error) {
    var message = String((error && error.message) || error || "");
    var code = String((error && error.code) || "");
    if (isPhoneProviderSetupError(error)) {
      return new Error("Phone OTP is not ready yet. Enable Phone Auth and configure an SMS provider in Supabase.");
    }
    if (/rate/i.test(message + " " + code)) {
      return new Error("Too many OTP attempts. Please wait a minute and try again.");
    }
    return error instanceof Error ? error : new Error(message || "Something went wrong. Please try again.");
  }

  async function logout() {
    var client = getClient();
    if (client) await client.auth.signOut();
    localStorage.removeItem(PENDING_PHONE_KEY);
    sessionStorage.removeItem(DEV_OTP_KEY);
  }

  window.KaamKaroAuth = {
    sendOtp: sendOtp,
    verifyOtp: verifyOtp,
    logout: logout,
    normalizePhone: normalizePhone,
    getClient: getClient,
    isSupabaseConfigured: function () { return !!getClient(); },
    forceRealOtp: forceRealOtp
  };
})();
