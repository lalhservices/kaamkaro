(function () {
  "use strict";

  function client() {
    return window.KaamKaroSupabase && window.KaamKaroSupabase.client ? window.KaamKaroSupabase.client() : null;
  }

  async function session() {
    var supabase = client();
    if (!supabase) return null;
    var result = await supabase.auth.getSession();
    if (result.error) throw result.error;
    return result.data && result.data.session ? result.data.session : null;
  }

  function profileStrengthFromState(appState) {
    var phoneVerified = !!(appState.user && appState.user.phoneVerified);
    var photoVerified = !!(appState.worker && appState.worker.photoVerified);
    if (phoneVerified && photoVerified) return 100;
    if (phoneVerified) return 70;
    return 0;
  }

  function workerPayload(appState, userId) {
    var worker = appState.worker || {};
    return {
      user_id: userId,
      full_name: worker.name || (appState.user && appState.user.displayName) || "",
      city: worker.city || "",
      district: worker.district || "",
      state: worker.state || "",
      formatted_location: worker.formatted_location || worker.location || worker.city || "",
      lat: worker.lat || null,
      lng: worker.lng || null,
      preferred_jobs: worker.jobTypes || [],
      skills: worker.skills || [],
      availability: {
        summary: worker.availability || "",
        start: worker.startAvailability || "",
        days: worker.availableDays || [],
        shift: worker.shiftPreference || "",
        flexible: !!worker.flexibleAvailability
      },
      profile_strength: profileStrengthFromState(appState),
      photo_url: worker.photo_url || null,
      photo_verified: !!worker.photoVerified
    };
  }

  function applyUserRow(appState, row) {
    if (!row) return;
    appState.user = appState.user || {};
    appState.user.id = row.id || appState.user.id;
    appState.user.phone = row.phone_number || appState.user.phone;
    appState.user.hasWorkerProfile = !!row.has_worker_profile;
    appState.user.hasEmployerProfile = !!row.has_employer_profile;
    appState.user.activeRole = row.active_role || appState.user.activeRole;
    appState.user.language = row.language || appState.user.language;
    appState.user.authenticated = true;
  }

  function applyWorkerRow(appState, row) {
    if (!row) return;
    appState.worker = appState.worker || {};
    appState.workerProfiles = appState.workerProfiles || {};
    appState.workerComplete = true;
    appState.defaultWorkerId = row.id;
    appState.worker.id = row.id;
    appState.worker.name = row.full_name || appState.worker.name || "";
    appState.worker.city = row.city || appState.worker.city || "";
    appState.worker.district = row.district || "";
    appState.worker.state = row.state || "";
    appState.worker.formatted_location = row.formatted_location || "";
    appState.worker.lat = row.lat || null;
    appState.worker.lng = row.lng || null;
    appState.worker.jobTypes = Array.isArray(row.preferred_jobs) ? row.preferred_jobs : [];
    appState.worker.skills = Array.isArray(row.skills) ? row.skills : [];
    appState.worker.photo_url = row.photo_url || "";
    appState.worker.photoVerified = !!row.photo_verified;
    appState.user = appState.user || {};
    appState.user.displayName = appState.worker.name || appState.user.displayName || "";
    appState.user.city = appState.worker.city || appState.user.city || "";
    appState.user.location = row.formatted_location || appState.user.location || "";
    appState.user.photoVerified = !!row.photo_verified;
    appState.user.photoVerificationStatus = row.photo_verified ? "verified" : "not_uploaded";
    appState.workerProfiles[row.id] = {
      workerId: row.id,
      userId: row.user_id,
      name: row.full_name || "",
      city: row.city || "",
      district: row.district || "",
      state: row.state || "",
      location: row.formatted_location || row.city || "",
      formatted_location: row.formatted_location || row.city || "",
      lat: row.lat || null,
      lng: row.lng || null,
      skills: appState.worker.skills.slice(),
      photo_url: row.photo_url || "",
      photo_verified: !!row.photo_verified,
      photoVerificationStatus: row.photo_verified ? "verified" : "not_uploaded",
      updatedAt: Date.now()
    };
  }

  async function hydrateSession(appState) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user) return null;

    var userResult = await supabase
      .from("users")
      .select("id, phone_number, has_worker_profile, has_employer_profile, active_role, language, is_suspended")
      .eq("id", activeSession.user.id)
      .maybeSingle();
    if (userResult.error && userResult.error.code !== "PGRST116") throw userResult.error;
    applyUserRow(appState, userResult.data);

    var workerResult = { data: null };
    if (userResult.data && userResult.data.has_worker_profile) {
      workerResult = await supabase
        .from("worker_profiles")
        .select("*")
        .eq("user_id", activeSession.user.id)
        .maybeSingle();
      if (workerResult.error && workerResult.error.code !== "PGRST116") throw workerResult.error;
      applyWorkerRow(appState, workerResult.data);
    }

    return { user: userResult.data || null, worker: workerResult.data || null };
  }

  async function saveWorkerProfile(appState, options) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user) return null;
    var markComplete = !options || options.markComplete !== false;

    var payload = workerPayload(appState, activeSession.user.id);
    var saved = await supabase
      .from("worker_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (saved.error) throw saved.error;

    if (markComplete) {
      var userUpdate = await supabase
        .from("users")
        .update({
          has_worker_profile: true,
          active_role: "worker",
          language: (appState.user && appState.user.language) || localStorage.getItem("kaamkaroLang") || "en"
        })
        .eq("id", activeSession.user.id);
      if (userUpdate.error) throw userUpdate.error;
    }

    if (markComplete) {
      applyWorkerRow(appState, saved.data);
      appState.user.hasWorkerProfile = true;
      appState.user.activeRole = "worker";
    }
    return saved.data;
  }

  async function uploadProfilePhoto(file, appState) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !file) return null;

    var ext = (file.name && file.name.split(".").pop()) || "jpg";
    var path = activeSession.user.id + "/profile-" + Date.now() + "." + ext.toLowerCase();
    var uploaded = await supabase.storage.from("profile-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: true
    });
    if (uploaded.error) throw uploaded.error;

    var publicUrl = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
    appState.worker = appState.worker || {};
    appState.user = appState.user || {};
    appState.worker.photo_url = publicUrl;
    appState.worker.photoVerified = true;
    appState.user.photoVerified = true;
    appState.user.photoVerificationStatus = "verified";
    await saveWorkerProfile(appState, { markComplete: !!appState.workerComplete });
    return publicUrl;
  }

  window.KaamKaroProfile = {
    hydrateSession: hydrateSession,
    saveWorkerProfile: saveWorkerProfile,
    uploadProfilePhoto: uploadProfilePhoto
  };
})();
