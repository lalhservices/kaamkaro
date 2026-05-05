(function () {
  "use strict";

  var DEMO_USERS_KEY = "kkAuthUsers";
  var PENDING_PHONE_KEY = "kkPendingOtpPhone";

  function config() {
    var fromWindow = window.KAAM_KARO_SUPABASE || {};
    var urlMeta = document.querySelector('meta[name="supabase-url"]');
    var keyMeta = document.querySelector('meta[name="supabase-anon-key"]');
    return {
      url: fromWindow.url || (urlMeta ? urlMeta.content : "") || localStorage.getItem("kkSupabaseUrl") || "",
      anonKey: fromWindow.anonKey || (keyMeta ? keyMeta.content : "") || localStorage.getItem("kkSupabaseAnonKey") || ""
    };
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "").slice(-10);
  }

  function fullPhone(phone) {
    return "+91" + normalizePhone(phone);
  }

  function getClient() {
    var cfg = config();
    if (!cfg.url || !cfg.anonKey || !window.supabase || !window.supabase.createClient) return null;
    if (!window.kaamKaroSupabaseClient) {
      window.kaamKaroSupabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
    }
    return window.kaamKaroSupabaseClient;
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
        role: "worker",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      saveDemoUsers(users);
    }
    return users[phone];
  }

  async function ensureUserRecord(client, authUser, phone) {
    var now = new Date().toISOString();
    var existing = await client
      .from("users")
      .select("id, phone_number, role, created_at, updated_at")
      .eq("phone_number", phone)
      .maybeSingle();

    if (existing.error && existing.error.code !== "PGRST116") throw existing.error;
    if (existing.data) {
      await client.from("users").update({ updated_at: now }).eq("id", existing.data.id);
      return existing.data;
    }

    var row = {
      id: authUser.id,
      phone_number: phone,
      role: "worker",
      created_at: now,
      updated_at: now
    };
    var inserted = await client.from("users").insert(row).select("id, phone_number, role, created_at, updated_at").single();
    if (inserted.error) throw inserted.error;
    return inserted.data;
  }

  async function sendOtp(rawPhone) {
    var phone = normalizePhone(rawPhone);
    if (phone.length !== 10) throw new Error("Enter a valid 10 digit phone number.");
    localStorage.setItem(PENDING_PHONE_KEY, phone);

    var client = getClient();
    if (!client) return { mode: "demo", phone: phone };

    var result = await client.auth.signInWithOtp({
      phone: fullPhone(phone),
      options: { shouldCreateUser: true }
    });
    if (result.error) throw result.error;
    return { mode: "supabase", phone: phone };
  }

  async function verifyOtp(rawPhone, token) {
    var phone = normalizePhone(rawPhone || localStorage.getItem(PENDING_PHONE_KEY));
    var otp = String(token || "").replace(/\D/g, "");
    if (phone.length !== 10) throw new Error("Enter a valid 10 digit phone number.");
    if (otp.length !== 4 && !getClient()) throw new Error("Enter the 4 digit OTP code.");

    var client = getClient();
    if (!client) {
      return { mode: "demo", phone: phone, user: ensureDemoUser(phone), session: null };
    }

    var verified = await client.auth.verifyOtp({
      phone: fullPhone(phone),
      token: otp,
      type: "sms"
    });
    if (verified.error) throw verified.error;
    var authUser = verified.data && verified.data.user;
    if (!authUser) throw new Error("Could not verify OTP. Please try again.");
    var dbUser = await ensureUserRecord(client, authUser, phone);
    return { mode: "supabase", phone: phone, user: dbUser, session: verified.data.session || null };
  }

  async function logout() {
    var client = getClient();
    if (client) await client.auth.signOut();
    localStorage.removeItem(PENDING_PHONE_KEY);
  }

  window.KaamKaroAuth = {
    sendOtp: sendOtp,
    verifyOtp: verifyOtp,
    logout: logout,
    normalizePhone: normalizePhone,
    isSupabaseConfigured: function () { return !!getClient(); }
  };
})();
