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

  function isUuid(value) {
    return /^[0-9a-f-]{36}$/i.test(String(value || ""));
  }

  function statusToRemote(status) {
    var map = {
      Interested: "applied",
      Viewed: "viewed",
      Accepted: "matched",
      Matched: "matched",
      Hired: "hired",
      Rejected: "rejected",
      Withdrawn: "withdrawn",
      Disconnected: "disconnected"
    };
    return map[status] || String(status || "applied").toLowerCase();
  }

  function statusFromRemote(status) {
    var map = {
      applied: "Interested",
      viewed: "Viewed",
      matched: "Matched",
      hired: "Hired",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
      disconnected: "Disconnected"
    };
    return map[status] || "Interested";
  }

  function rowToApplication(row) {
    return {
      id: row.id,
      jobId: row.job_id,
      workerId: row.worker_id,
      employerId: row.employer_id,
      status: statusFromRemote(row.status),
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
      matchedAt: row.matched_at ? new Date(row.matched_at).getTime() : null,
      hiredAt: row.hired_at ? new Date(row.hired_at).getTime() : null,
      disconnectedAt: row.disconnected_at ? new Date(row.disconnected_at).getTime() : null,
      disconnectReason: row.disconnect_reason || ""
    };
  }

  async function hydrateApplications(appState) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user) return null;
    var result = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (result.error) throw result.error;
    appState.applications = (result.data || []).map(rowToApplication);
    return result.data || [];
  }

  async function saveApplication(appState, app, job) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !app || !job) return null;
    if (!isUuid(app.workerId) || !isUuid(job.id) || !isUuid(job.businessId || app.employerId)) return null;
    var remoteStatus = statusToRemote(app.status);
    var payload = {
      job_id: job.id,
      worker_id: app.workerId,
      employer_id: job.businessId || app.employerId,
      status: remoteStatus,
      matched_at: remoteStatus === "matched" ? new Date().toISOString() : null,
      hired_at: remoteStatus === "hired" ? new Date().toISOString() : null,
      last_activity_at: new Date().toISOString()
    };
    var result = isUuid(app.id)
      ? await supabase.from("applications").update(payload).eq("id", app.id).select("*").single()
      : await supabase.from("applications").upsert(payload, { onConflict: "worker_id,job_id" }).select("*").single();
    if (result.error) throw result.error;
    Object.assign(app, rowToApplication(result.data));
    return result.data;
  }

  async function updateApplicationStatus(appState, app) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !app || !isUuid(app.id)) return null;
    var status = statusToRemote(app.status);
    var payload = {
      status: status,
      last_activity_at: new Date().toISOString()
    };
    if (status === "matched") payload.matched_at = new Date().toISOString();
    if (status === "hired") payload.hired_at = new Date().toISOString();
    if (status === "rejected") payload.rejected_at = new Date().toISOString();
    if (status === "withdrawn") payload.withdrawn_at = new Date().toISOString();
    if (status === "disconnected") {
      payload.disconnected_at = app.disconnectedAt ? new Date(app.disconnectedAt).toISOString() : new Date().toISOString();
      payload.disconnect_reason = app.disconnectReason || "disconnected";
    }
    var result = await supabase.from("applications").update(payload).eq("id", app.id).select("*").single();
    if (result.error) throw result.error;
    Object.assign(app, rowToApplication(result.data));
    return result.data;
  }

  window.KaamKaroApplications = {
    hydrateApplications: hydrateApplications,
    saveApplication: saveApplication,
    updateApplicationStatus: updateApplicationStatus
  };
})();
