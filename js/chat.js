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

  function rowToConversation(row) {
    return {
      id: row.id,
      applicationId: row.application_id,
      jobId: "",
      workerId: row.worker_id,
      employerId: row.employer_id,
      status: row.status || "active",
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
      lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at).getTime() : Date.now(),
      disconnectedBy: row.disconnected_by || "",
      disconnectedReason: row.disconnected_reason || "",
      lastMessage: "",
      unreadWorker: 0,
      unreadEmployer: 0,
      favouriteWorker: !!row.worker_favourite,
      favouriteEmployer: !!row.employer_favourite,
      deletedForWorker: row.deleted_by_worker ? [row.worker_id] : [],
      deletedForEmployer: row.deleted_by_employer ? [row.employer_id] : []
    };
  }

  function localSender(appState, senderUserId, activeUserId) {
    if (senderUserId === activeUserId) return localOwnSender(appState);
    return appState && appState.user && appState.user.activeRole === "employer" ? (appState.worker && appState.worker.id) || "worker" : "rick";
  }

  function localOwnSender(appState) {
    return appState && appState.user && appState.user.activeRole === "employer" ? "rick" : (appState.worker && appState.worker.id) || "worker";
  }

  function rowToMessage(row, appState, activeUserId) {
    return {
      id: row.id,
      conversationId: row.chat_id,
      senderId: localSender(appState, row.sender_id, activeUserId),
      text: row.message,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      status: row.delivery_status || "sent",
      deliveryStatus: row.delivery_status || "sent",
      flaggedRisk: !!row.blocked_by_filter,
      isSystem: row.message_type === "system"
    };
  }

  async function hydrateChats(appState) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user) return null;
    var chatResult = await supabase
      .from("chats")
      .select("*")
      .order("updated_at", { ascending: false });
    if (chatResult.error) throw chatResult.error;
    appState.conversations = (chatResult.data || []).map(rowToConversation);
    var chatIds = appState.conversations.map(function (chat) { return chat.id; });
    if (!chatIds.length) {
      appState.messages = [];
      return chatResult.data || [];
    }
    var msgResult = await supabase
      .from("messages")
      .select("*")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: true });
    if (msgResult.error) throw msgResult.error;
    appState.messages = (msgResult.data || []).map(function (row) {
      return rowToMessage(row, appState, activeSession.user.id);
    });
    appState.conversations.forEach(function (convo) {
      var latest = appState.messages.filter(function (msg) { return msg.conversationId === convo.id; }).slice(-1)[0];
      if (latest) {
        convo.lastMessage = latest.text;
        convo.jobId = (appState.applications.find(function (app) { return app.id === convo.applicationId; }) || {}).jobId || convo.jobId;
      }
    });
    return chatResult.data || [];
  }

  async function saveConversation(appState, convo, app) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !convo || !app) return null;
    if (!isUuid(app.id) || !isUuid(app.workerId) || !isUuid(app.employerId)) return null;
    var payload = {
      application_id: app.id,
      worker_id: app.workerId,
      employer_id: app.employerId,
      status: convo.status === "active" ? "active" : convo.status || "active",
      worker_favourite: !!convo.favouriteWorker,
      employer_favourite: !!convo.favouriteEmployer,
      last_message_at: new Date(convo.updatedAt || Date.now()).toISOString(),
      last_activity_at: new Date(convo.lastActivityAt || Date.now()).toISOString(),
      expires_at: new Date((convo.lastActivityAt || Date.now()) + 12 * 86400000).toISOString(),
      deleted_by_worker: !!(convo.deletedForWorker && convo.deletedForWorker.length),
      deleted_by_employer: !!(convo.deletedForEmployer && convo.deletedForEmployer.length)
    };
    var result = await supabase
      .from("chats")
      .upsert(payload, { onConflict: "application_id" })
      .select("*")
      .single();
    if (result.error) throw result.error;
    var oldId = convo.id;
    Object.assign(convo, rowToConversation(result.data), { jobId: app.jobId, lastMessage: convo.lastMessage || "" });
    (appState.messages || []).forEach(function (message) {
      if (message.conversationId === oldId) message.conversationId = convo.id;
    });
    return result.data;
  }

  async function saveMessage(appState, convo, message) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !convo || !message || !isUuid(convo.id)) return null;
    var payload = {
      chat_id: convo.id,
      sender_id: activeSession.user.id,
      message: message.text || "",
      message_type: message.isSystem ? "system" : "text",
      delivery_status: message.deliveryStatus || message.status || "sent",
      is_system: !!message.isSystem,
      is_blocked: false,
      blocked_by_filter: !!message.flaggedRisk
    };
    var result = await supabase.from("messages").insert(payload).select("*").single();
    if (result.error) throw result.error;
    message.id = result.data.id;
    return result.data;
  }

  async function updateConversation(appState, convo) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !convo || !isUuid(convo.id)) return null;
    var result = await supabase
      .from("chats")
      .update({
        status: convo.status || "active",
        worker_favourite: !!convo.favouriteWorker,
        employer_favourite: !!convo.favouriteEmployer,
        last_activity_at: new Date(convo.lastActivityAt || Date.now()).toISOString(),
        last_message_at: new Date(convo.updatedAt || Date.now()).toISOString(),
        deleted_by_worker: !!(convo.deletedForWorker && convo.deletedForWorker.length),
        deleted_by_employer: !!(convo.deletedForEmployer && convo.deletedForEmployer.length),
        disconnected_by: convo.disconnectedBy || null,
        disconnected_reason: convo.disconnectedReason || null
      })
      .eq("id", convo.id)
      .select("*")
      .single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function saveModerationLog(appState, log) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !log) return null;
    var result = await supabase.from("moderation_logs").insert({
      user_id: activeSession.user.id,
      type: "chat",
      content: log.messageText || "",
      risk_reason: log.reason || "unsafe message",
      severity: "medium",
      action_taken: "blocked"
    });
    if (result.error) throw result.error;
    return true;
  }

  window.KaamKaroChat = {
    hydrateChats: hydrateChats,
    saveConversation: saveConversation,
    saveMessage: saveMessage,
    updateConversation: updateConversation,
    saveModerationLog: saveModerationLog
  };
})();
