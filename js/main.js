
  var selectedConversationId = null;
  var publicProfileReturn = "jobs";
  var applicationsTab = "applied";

  var routeOrder = ["landing","otp","otpCode","role","workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress","jobs","applied","chat","search","applications","employerSetup","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","profile","employerProfile","notifications","menu","accountSettings","profileEdit","adminModeration","legal","report"];
  var routeOrder = ["landing","otp","otpCode","role","workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress","jobs","applied","chat","search","applications","employerPublicProfile","employerSetup","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","profile","employerProfile","notifications","menu","accountSettings","profileEdit","adminModeration","legal","report"];
  var workCategories = ["Delivery","Retail","Office Work","Helper","Driver","Cleaner","Waiter","Data Entry"];
  state.moderationLogs = state.moderationLogs || [];
  state.reports = state.reports || [];
  state.ratings = state.ratings || [];
  }
  function disconnectMatch(convo, removeChat) {
    if (!convo) return;
    state.applications = state.applications.filter(function (app) { return !(app.jobId === convo.jobId && app.workerId === convo.workerId); });
    if (removeChat !== false) {
      state.conversations = state.conversations.filter(function (c) { return c.id !== convo.id; });
      state.messages = state.messages.filter(function (m) { return m.conversationId !== convo.id; });
    } else {
      convo.status = "closed";
  function disconnectMatch(convo, reason) {
    if (!convo) return null;
    var now = Date.now();
    var app = state.applications.find(function (item) { return item.jobId === convo.jobId && item.workerId === convo.workerId; });
    if (app) {
      app.status = "Disconnected";
      app.disconnectedAt = now;
      app.disconnectReason = reason || "disconnected";
    }
    selectedConversationId = null;
    save();
  }
  function hideChatForCurrentUser(convo) {
    if (!convo) return;
    if (currentRole === "employer") {
      convo.deletedForEmployer = convo.deletedForEmployer || [];
      if (convo.deletedForEmployer.indexOf(currentUserId()) < 0) convo.deletedForEmployer.push(currentUserId());
    } else {
      convo.deletedForWorker = convo.deletedForWorker || [];
      if (convo.deletedForWorker.indexOf(currentUserId()) < 0) convo.deletedForWorker.push(currentUserId());
    convo.status = "disconnected";
    convo.disconnectedBy = currentUserId();
    convo.disconnectedAt = now;
    convo.disconnectedReason = reason || "disconnected";
    state.blockedPairs = state.blockedPairs || [];
    if (!state.blockedPairs.some(function (pair) { return pair.conversationId === convo.id; })) {
      state.blockedPairs.push({ conversationId: convo.id, workerId: convo.workerId, employerId: convo.employerId, reason: reason || "disconnected", createdAt: now });
    }
    state.applications = state.applications.filter(function (item) { return !(item.jobId === convo.jobId && item.workerId === convo.workerId); });
    state.conversations = state.conversations.filter(function (c) { return c.id !== convo.id; });
    state.messages = state.messages.filter(function (m) { return m.conversationId !== convo.id; });
    selectedConversationId = null;
    save();
    return { application: app, conversation: convo };
  }
    });
    expired.forEach(function (convo) { disconnectMatch(convo); });
    expired.forEach(function (convo) { disconnectMatch(convo, "inactive_12_days"); });
  }
  }
  async function disconnectMatchRemote(result) {
    if (!result) return;
    if (result.application) await updateApplicationStatusRemote(result.application);
    if (result.conversation) await updateConversationRemote(result.conversation);
  }
  function hasSubmittedRating(convo) {
    var employerScreens = ["employerSetup","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","employerProfile"];
    var workerScreens = ["workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress","jobs","applied","search","applications"];
    var workerScreens = ["workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress","jobs","applied","search","applications","employerPublicProfile"];
    if (employerScreens.indexOf(id) >= 0 && !(id === "employerSetup" && setupReturnRoute)) currentRole = "employer";
  function navScreenIds() {
    return ["jobs","applied","search","applications","profile","accountSettings","profileEdit","legal","report","notifications","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","employerProfile","chat"];
    return ["jobs","applied","search","applications","profile","accountSettings","profileEdit","legal","report","notifications","employerPublicProfile","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","employerProfile","chat"];
  }
  }
  function employerPublicData(job) {
    job = job || state.jobs.find(function (item) { return item.id === selectedJobId; }) || state.jobs[0] || {};
    var business = (job.businessId && state.businessProfiles && state.businessProfiles[job.businessId]) || currentBusinessProfile() || {};
    var createdAt = business.createdAt || job.createdAt || Date.now();
    var ageDays = Math.max(0, Math.floor((Date.now() - createdAt) / 86400000));
    var badge = ageDays > 180 ? "Verified Employer" : (ageDays > 90 ? "Trusted" : (ageDays > 30 ? "Active" : "New Employer"));
    return {
      name: business.businessName || job.companyName || job.employer || state.employer.business || "Employer",
      city: business.city || job.city || state.employer.city || state.user.city || "Location not set",
      type: business.type || state.employer.type || "Business",
      badge: badge,
      jobsPosted: state.jobs.filter(function (item) { return item.businessId === job.businessId || item.employer === job.employer; }).length || state.jobs.length,
      hires: state.applications.filter(function (app) { return app.status === "Hired"; }).length,
      joined: ageDays < 1 ? "Joined today" : (ageDays + " days on Kaam Karo"),
      safety: (job.reportCount || 0) > 2 ? "Under review" : "No active safety flags"
    };
  }
  function openPublicEmployerProfile(jobId) {
    selectedJobId = jobId || selectedJobId;
    publicProfileReturn = currentScreen || "jobs";
    show("employerPublicProfile");
  }
  function descriptionWordCount(text) {
    var badges = workerBadges().map(function (b) { return '<span class="badge ' + b.className + '">' + b.label + '</span>'; }).join("");
    var accepted = ["Accepted","Matched"].indexOf(app.status) >= 0;
    var convo = conversationForApp(app);
    var strength = profileStrength();
    byId("profileStatus").textContent = app.status;
    byId("fullWorkerProfile").innerHTML =
      '<div class="panel"><div class="toolbar">' + badges + workerPhotoBadgeHtml() + '</div><h1 class="title mt">' + w.name + '</h1><p class="sub">' + w.bio + '</p></div>' +
      '<div class="panel"><div class="kv"><span>Age</span><b>' + w.age + '</b></div><div class="kv"><span>City</span><b>' + w.city + '</b></div><div class="kv"><span>Experience</span><b>' + w.experience + '</b></div><div class="kv"><span>Availability</span><b>' + w.availability + '</b></div><div class="kv"><span>Preferred type</span><b>' + w.preferredType + '</b></div></div>' +
      '<div class="panel"><b>Skills</b><div class="toolbar">' + w.skills.map(function (s) { return '<span class="badge blue">' + s + '</span>'; }).join("") + '</div></div>';
      '<div class="panel profile-hero"><span class="avatar">' + initials(w.name || "Worker") + '</span><span class="grow"><h2>' + (w.name || "Worker") + '</h2><p>' + (w.city || "Location not set") + '</p><div class="toolbar">' + badges + workerPhotoBadgeHtml() + '</div></span></div>' +
      '<div class="panel"><div class="kv"><span>Profile strength</span><b>' + strength + '%</b></div><div class="progress"><span class="on" style="flex-basis:' + strength + '%"></span><span></span></div><p class="small">Safety note: Phone numbers and private account settings are never shown to employers.</p></div>' +
      '<button class="profile-card"><span><span>Location</span><b>' + workerLocationLine() + '</b></span></button>' +
      '<button class="profile-card"><span><span>Experience</span><b>' + workerExperienceLine() + '</b></span></button>' +
      '<button class="profile-card"><span><span>Preferred job types</span><b>' + ((w.jobTypes || []).join(", ") || w.preferredJob || "Open to suitable jobs") + '</b></span></button>' +
      '<button class="profile-card"><span><span>Availability</span><b>' + workerAvailabilityLine() + '</b></span></button>' +
      '<div class="panel"><b>Skills</b><div class="toolbar">' + ((w.skills || []).length ? w.skills.map(function (s) { return '<span class="badge blue">' + s + '</span>'; }).join("") : '<span class="small">No skills added yet</span>') + '</div></div>' +
      '<div class="metric-grid profile-metrics"><div class="metric-card"><span>Rating</span><b>New</b></div><div class="metric-card"><span>Completed jobs</span><b>0</b></div></div>';
    if (byId("workerProfileActions")) {
      byId("workerProfileActions").innerHTML = accepted
        ? '<button class="btn outline" data-open-conversation="' + (convo ? convo.id : "") + '">Chat</button><button class="btn danger" data-remove-accepted-app="' + app.id + '">Disconnect</button>'
        : '<button class="btn danger" data-reject-current>Reject</button><button class="btn primary" data-accept-current>Accept & Chat</button>';
    }
  }
  }
  function renderPublicEmployerProfile() {
    if (!byId("publicEmployerProfile")) return;
    var job = state.jobs.find(function (item) { return item.id === selectedJobId; }) || state.jobs[0] || {};
    var data = employerPublicData(job);
    byId("publicEmployerProfile").innerHTML =
      '<div class="panel profile-hero"><span class="avatar">' + initials(data.name) + '</span><span class="grow"><h2>' + data.name + '</h2><p>' + data.city + '</p><div class="toolbar"><span class="badge blue">' + data.badge + '</span><span class="badge">' + data.safety + '</span></div></span></div>' +
      '<div class="metric-grid profile-metrics"><div class="metric-card"><span>Jobs posted</span><b>' + data.jobsPosted + '</b></div><div class="metric-card"><span>Hires completed</span><b>' + data.hires + '</b></div></div>' +
      '<button class="profile-card"><span><span>Business type</span><b>' + data.type + '</b></span></button>' +
      '<button class="profile-card"><span><span>Location</span><b>Based in ' + data.city + '</b></span></button>' +
      '<button class="profile-card"><span><span>Account age</span><b>' + data.joined + '</b></span></button>' +
      '<button class="profile-card"><span><span>Rating</span><b>New</b></span></button>' +
      '<div class="panel small">Safety note: Kaam Karo does not show employer phone numbers, payment details, or private account settings here.</div>' +
      '<button class="btn outline mt" data-report="profile">Report employer</button>';
  }
  function renderAccountSettings() {
      var action = applicationsTab === "matched" ? '<button class="icon" data-remove-match="' + app.id + '"><svg><use href="#i-trash"></use></svg></button>' : '<button class="icon" data-withdraw-app="' + app.id + '"><svg><use href="#i-x"></use></svg></button>';
      return '<div class="list-row"><span class="tiny"><svg><use href="#i-briefcase"></use></svg></span><span class="grow"><b>' + job.title + '</b><br><span class="small">' + job.pay + ' - ' + job.city + '<br>Status: ' + statusText + '</span></span><span class="status-pill status-' + app.status.toLowerCase() + '">' + (applicationsTab === "matched" ? "Matched" : "Waiting") + '</span>' + (applicationsTab === "matched" && convo ? '<button class="icon" data-open-conversation="' + convo.id + '"><svg><use href="#i-message"></use></svg></button>' : '') + action + '</div>';
      return '<div class="list-row"><span class="tiny"><svg><use href="#i-briefcase"></use></svg></span><span class="grow"><b>' + job.title + '</b><br><span class="small">' + job.pay + ' - ' + job.city + '<br><button class="report-link" data-open-employer-profile="' + job.id + '">' + (job.employer || "Employer") + '</button><br>Status: ' + statusText + '</span></span><span class="status-pill status-' + app.status.toLowerCase() + '">' + (applicationsTab === "matched" ? "Matched" : "Waiting") + '</span>' + (applicationsTab === "matched" && convo ? '<button class="icon" data-open-conversation="' + convo.id + '"><svg><use href="#i-message"></use></svg></button>' : '') + action + '</div>';
    }).join("") : '<div class="panel small">' + (applicationsTab === "matched" ? "No matched jobs yet." : "No applications yet. Swipe right on a job to apply.") + '</div>');
    var pending = ["Interested","Viewed"].indexOf(app.status) >= 0;
    var actions = pending ? '<div class="applicant-actions"><button class="reject-btn" data-reject-app="' + app.id + '">X</button><button class="accept-btn" data-accept-app="' + app.id + '">Accept</button></div>' : '<div class="applicant-actions">' + (convo ? '<button class="accept-btn" data-open-conversation="' + convo.id + '">Chat</button>' : '') + '<button class="reject-btn" data-remove-accepted-app="' + app.id + '"><svg><use href="#i-trash"></use></svg></button></div>';
    var actions = pending ? '<div class="applicant-actions"><button class="reject-btn" data-reject-app="' + app.id + '">X</button><button class="accept-btn" data-accept-app="' + app.id + '">Accept</button></div>' : '<div class="applicant-actions"><button class="reject-btn" data-open-worker="' + w.id + '" data-job-id="' + job.id + '">View profile</button>' + (convo ? '<button class="accept-btn" data-open-conversation="' + convo.id + '">Chat</button>' : '') + '<button class="reject-btn" data-remove-accepted-app="' + app.id + '">Disconnect</button></div>';
    return '<div class="list-row"><button class="grow" style="border:0;background:transparent;text-align:left;padding:0;color:inherit" data-open-worker="' + w.id + '" data-job-id="' + job.id + '"><b>' + w.name + '</b><br><span class="small">' + w.age + ' - ' + w.city + ' - ' + w.experience + '<br>' + w.skills.slice(0,3).join(", ") + '</span><div class="mt">' + workerPhotoBadgeHtml() + '</div></button><span class="status-pill ' + statusClass(app.status) + '">' + app.status + '</span>' + actions + '</div>';
      '<div class="job-hero"><div><div class="pay">' + job.pay + '</div><h2>' + job.title + '</h2><p>Location: ' + job.distance + '</p></div><div><span class="badge">Employer: ' + job.badge + '</span><div class="job-hook mt">Start today - 2 shifts</div></div></div>' +
      '<div class="job-meta"><div class="trust-line">No fees required</div><div class="meta"><span>' + job.type + '</span><span>' + job.employer + '</span><span>Posted 3h ago</span><span>Hiring today</span></div><p class="small">' + job.desc + '</p><button class="report-link" data-report="job">Report job</button></div>' +
      '<div class="job-meta"><div class="trust-line">No fees required</div><div class="meta"><span>' + job.type + '</span><button class="report-link" data-open-employer-profile="' + job.id + '">' + job.employer + '</button><span>Posted 3h ago</span><span>Hiring today</span></div><p class="small">' + job.desc + '</p><button class="report-link" data-report="job">Report job</button></div>' +
      '</article><div class="swipe"><button class="circle danger-action" aria-label="Not interested" data-next-job><svg><use href="#i-x"></use></svg></button><button class="circle like-action" aria-label="Interested" data-apply-job="' + job.id + '"><svg><use href="#i-heart"></use></svg></button></div><div class="swipe-labels"><span>Not interested</span><span>Interested</span></div>';
      renderEmployerProfile,
      renderPublicEmployerProfile,
      renderAccountSettings,
  function isChatHidden(convo) {
    if (!convo || ["disconnected","expired","blocked","closed"].indexOf(convo.status) >= 0) return true;
    var list = currentRole === "employer" ? (convo.deletedForEmployer || []) : (convo.deletedForWorker || []);
  }
  function markReceivedMessagesSeen(convo) {
    if (!convo) return;
    var changed = false;
    state.messages.forEach(function (message) {
      if (message.conversationId !== convo.id) return;
      if (messageSenderId(message) === currentUserId()) return;
      if (message.deliveryStatus !== "seen" || message.status !== "seen") {
        message.deliveryStatus = "seen";
        message.status = "seen";
        message.seenAt = Date.now();
        changed = true;
      }
    });
    if (changed) save();
  }
  function isSameDay(a, b) {
      var fav = chatListTab === "all" ? '<button class="icon ' + (isFavourite ? "star-active" : "") + '" data-favourite-chat="' + convo.id + '">&#9733;</button>' : "";
      return '<div class="list-row conversation-row"><button class="grow" data-open-conversation="' + convo.id + '" style="border:0;background:transparent;text-align:left;color:inherit;padding:0"><b>' + conversationTitle(convo) + '</b><br><span class="small">' + job.title + ' - ' + job.city + '<br>' + (convo.lastMessage || "Start chat") + '</span></button><span><span class="badge blue">' + status + '</span>' + (unread ? '<span class="unread">' + unread + '</span>' : '') + '</span>' + fav + '<button class="icon" data-delete-chat="' + convo.id + '"><svg><use href="#i-trash"></use></svg></button></div>';
      return '<div class="list-row conversation-row"><button class="grow" data-open-conversation="' + convo.id + '" style="border:0;background:transparent;text-align:left;color:inherit;padding:0"><b>' + conversationTitle(convo) + '</b><br><span class="small">' + job.title + ' - ' + job.city + '<br>' + (convo.lastMessage || "Start chat") + '</span></button><span><span class="badge blue">' + status + '</span>' + (unread ? '<span class="unread">' + unread + '</span>' : '') + '</span>' + fav + '<button class="icon" data-delete-chat="' + convo.id + '" aria-label="Disconnect"><svg><use href="#i-trash"></use></svg></button></div>';
    }).join("");
    byId("chatSub").textContent = job.title + " - " + status;
    var titleBlock = document.querySelector("#chat .chat-title-block");
    if (titleBlock) {
      if (currentRole === "worker") titleBlock.setAttribute("data-open-employer-profile", job.id);
      else titleBlock.removeAttribute("data-open-employer-profile");
    }
    convo.lastActivityAt = Date.now();
    if (currentRole === "employer") convo.unreadEmployer = 0; else convo.unreadWorker = 0;
    markReceivedMessagesSeen(convo);
    save();
    if (!convo) return toast("Chat unlocks after employer accepts.");
    if (convo.status === "blocked") return toast("This chat is blocked.");
    if (["blocked","disconnected","expired","closed"].indexOf(convo.status) >= 0) return toast("This match is disconnected.");
    if ((state.blockedPairs || []).some(function (pair) { return pair.conversationId === convo.id; })) return toast("This match is disconnected.");
    setTimeout(function () { msg.status = "delivered"; msg.deliveryStatus = "delivered"; save(); renderChat(); }, 500);
    setTimeout(function () { msg.status = "seen"; msg.deliveryStatus = "seen"; save(); renderChat(); }, 1400);
  }
    if (deleteChat) {
      openModal("Delete this chat?", '<p class="small">You will lose this conversation from your chat list.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-delete-chat="' + deleteChat.dataset.deleteChat + '">Delete Chat</button></div>');
      openModal("Disconnect this match?", '<p class="small">This will remove the chat for both sides and you won’t be able to message each other unless you match again.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-delete-chat="' + deleteChat.dataset.deleteChat + '">Disconnect</button></div>');
      return;
      var delConvo = state.conversations.find(function (c) { return c.id === confirmDeleteChat.dataset.confirmDeleteChat; });
      hideChatForCurrentUser(delConvo);
      updateConversationRemote(delConvo);
      await disconnectMatchRemote(disconnectMatch(delConvo, "manual_disconnect"));
      closeModal();
      var removedConvo = conversationForApp(matchApp);
      disconnectMatch(removedConvo);
      updateConversationRemote(removedConvo);
      await disconnectMatchRemote(disconnectMatch(removedConvo, "worker_removed_match"));
      closeModal(); render(); return;
      var acceptedConvo = conversationForApp(acceptedApp);
      disconnectMatch(acceptedConvo);
      updateConversationRemote(acceptedConvo);
      await disconnectMatchRemote(disconnectMatch(acceptedConvo, "employer_removed_applicant"));
      closeModal(); render(); return;
      var reportConvo = currentConversation();
      state.auditLogs.unshift({ userId: currentUserId(), action: "chat_reported", reason: selectedReportReason + ": " + ((byId("reportDetails") && byId("reportDetails").value) || ""), jobSnapshot: null, timestamp: new Date().toISOString() });
      var reportDetails = (byId("reportDetails") && byId("reportDetails").value) || "";
      state.auditLogs.unshift({ userId: currentUserId(), action: "chat_reported", reason: selectedReportReason + ": " + reportDetails, jobSnapshot: null, timestamp: new Date().toISOString() });
      state.reports.unshift({ id: "report-" + Date.now(), reporterId: currentUserId(), chatId: reportConvo ? reportConvo.id : "", reason: selectedReportReason, details: reportDetails, status: "open", createdAt: Date.now() });
      if (reportConvo) {
        state.blockedPairs.push({ conversationId: reportConvo.id, workerId: reportConvo.workerId, employerId: reportConvo.employerId, reason: selectedReportReason, createdAt: Date.now() });
        disconnectMatch(reportConvo);
        await disconnectMatchRemote(disconnectMatch(reportConvo, "reported_" + selectedReportReason));
      }
    }
    if (event.target.closest("[data-public-profile-back]")) {
      show(publicProfileReturn || "jobs");
      return;
    }
    var block = event.target.closest("[data-block]");
      var detailJob = state.jobs.find(function (job) { return job.id === openJob.dataset.openJobModal; });
      if (detailJob) openModal(detailJob.title, '<div class="panel"><h2>' + detailJob.pay + '</h2><p class="small">' + detailJob.city + ' - ' + detailJob.type + ' - Posted 3h ago</p><span class="badge amber">Hiring today</span></div><p class="small mt">' + detailJob.desc + '</p><button class="btn primary mt" data-apply-job="' + detailJob.id + '">Apply</button>');
      if (detailJob) openModal(detailJob.title, '<div class="panel"><h2>' + detailJob.pay + '</h2><p class="small">' + detailJob.city + ' - ' + detailJob.type + ' - Posted 3h ago</p><span class="badge amber">Hiring today</span></div><p class="small mt">' + detailJob.desc + '</p><button class="btn outline mt" data-open-employer-profile="' + detailJob.id + '">' + (detailJob.employer || "View employer") + '</button><button class="btn primary mt" data-apply-job="' + detailJob.id + '">Apply</button>');
      return;
    }
    var openEmployerProfile = event.target.closest("[data-open-employer-profile]");
    if (openEmployerProfile) {
      closeModal();
      openPublicEmployerProfile(openEmployerProfile.dataset.openEmployerProfile);
      return;
    byId("chatSub").textContent = convos.length ? convos.length + " matched conversations" : "No conversations yet";
    var titleBlock = document.querySelector("#chat .chat-title-block");
    if (titleBlock) titleBlock.removeAttribute("data-open-employer-profile");
    convos = convos.filter(function (convo) { return !isChatHidden(convo); });
