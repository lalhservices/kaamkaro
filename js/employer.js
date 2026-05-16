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

  function applyEmployerRow(appState, row) {
    if (!row) return;
    appState.employerComplete = true;
    appState.defaultBusinessId = row.id;
    appState.businessProfiles = appState.businessProfiles || {};
    appState.employer = appState.employer || {};
    appState.employer.id = row.id;
    appState.employer.ownerId = row.user_id;
    appState.employer.business = row.business_name || "";
    appState.employer.name = appState.user && appState.user.displayName ? appState.user.displayName : appState.employer.name || "";
    appState.employer.city = row.city || "";
    appState.employer.district = row.district || "";
    appState.employer.state = row.state || "";
    appState.employer.formatted_location = row.formatted_location || row.city || "";
    appState.businessProfiles[row.id] = {
      businessId: row.id,
      ownerId: row.user_id,
      businessName: row.business_name || "",
      contactPersonName: appState.employer.name || "",
      city: row.city || "",
      district: row.district || "",
      state: row.state || "",
      formatted_location: row.formatted_location || row.city || "",
      trustBadge: row.trust_badge || "New Employer",
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    };
    appState.user = appState.user || {};
    appState.user.hasEmployerProfile = true;
  }

  async function hydrateEmployer(appState) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user) return null;
    var result = await supabase
      .from("employer_profiles")
      .select("*")
      .eq("user_id", activeSession.user.id)
      .maybeSingle();
    if (result.error && result.error.code !== "PGRST116") throw result.error;
    if (result.data) applyEmployerRow(appState, result.data);
    return result.data || null;
  }

  async function saveEmployerProfile(appState) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user) return null;
    var employer = appState.employer || {};
    var payload = {
      user_id: activeSession.user.id,
      business_name: employer.business || "Business",
      city: employer.city || (appState.user && appState.user.city) || "",
      district: employer.district || "",
      state: employer.state || "",
      formatted_location: employer.formatted_location || employer.city || "",
      lat: employer.lat || null,
      lng: employer.lng || null
    };
    var saved = await supabase
      .from("employer_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (saved.error) throw saved.error;

    var userUpdate = await supabase
      .from("users")
      .update({
        has_employer_profile: true,
        active_role: "employer",
        language: (appState.user && appState.user.language) || localStorage.getItem("kaamkaroLang") || "en"
      })
      .eq("id", activeSession.user.id);
    if (userUpdate.error) throw userUpdate.error;

    applyEmployerRow(appState, saved.data);
    appState.user.activeRole = "employer";
    return saved.data;
  }

  window.KaamKaroEmployer = {
    hydrateEmployer: hydrateEmployer,
    saveEmployerProfile: saveEmployerProfile
  };
})();
