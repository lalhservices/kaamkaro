(function () {
  var currentLang = localStorage.getItem("kaamkaroLang") || localStorage.getItem("kkLang") || "en";
  var currentScreen = "landing";
  var currentRole = localStorage.getItem("kkRole") || "worker";
  var menuReturn = "jobs";
  var pointerStartX = 0;
  var activeFilter = "all";
  var jobIndex = 0;
  var swipeCount = Number(localStorage.getItem("kkSwipeCount") || "0");
  var appliedToday = Number(localStorage.getItem("kkAppliedToday") || "0");
  var selectedJobId = "clerk";
  var selectedWorkerId = "john";
  var currentLegal = "terms";
  var locationMode = "city";
  var activeCity = localStorage.getItem("kkActiveCity") || "";
  var payOpen = true;
  var postVisibility = "";
  var reportContext = "general";
  var selectedReportJobId = null;
  var selectedConversationId = null;
  var applicationsTab = "applied";
  var applicantsTab = "new";
  var chatListTab = "all";
  var selectedReportReason = "";
  var selectedLocations = {};
  var pendingRating = { score: 0, quick: "" };
  var editingProfileField = "";
  var editDraft = {};
  var editDirty = false;
  var pointerCard = null;
  var pointerDeltaX = 0;
  var lastSwipe = null;
  var undoTimer = null;
  var phoneUpdatePending = false;
  var pendingEmployerRoute = localStorage.getItem("kkPendingEmployerRoute") || "";
  var pendingWorkerRoute = localStorage.getItem("kkPendingWorkerRoute") || "";
  var setupReturnRoute = localStorage.getItem("kkSetupReturnRoute") || "";

  var routeOrder = ["landing","otp","otpCode","role","workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress","jobs","applied","chat","search","applications","employerSetup","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","profile","employerProfile","notifications","menu","accountSettings","profileEdit","adminModeration","legal","report"];
  var workCategories = ["Delivery","Retail","Office Work","Helper","Driver","Cleaner","Waiter","Data Entry"];
  var skillOptions = ["Cleaning","Driving","Customer Service","Data Entry","Excel","Inventory Handling","Food Service","Basic Accounting","Communication","Sales","Packing","Warehouse Work"];
  var defaultJobs = [
    { id: "clerk", title: "Office Clerk", pay: "Rs 18,000/month", city: "Delhi", distance: "2 km away", type: "Full-time", employer: "Rick Retail Store", badge: "Verified", visibility: "boost", remote: false, desc: "Counter billing, records and basic customer help." },
    { id: "driver", title: "Delivery Driver", pay: "Rs 700/day", city: "Delhi", distance: "Nearby", type: "Daily wage", employer: "City Logistics", badge: "New", remote: false, desc: "Local deliveries, licence required." },
    { id: "cashier", title: "Cashier", pay: "Rs 16,000/month", city: "Delhi", distance: "4 km away", type: "Full-time", employer: "Fresh Mart", badge: "Verified", remote: false, desc: "Billing counter and cash handling." },
    { id: "remote-data", title: "Data Entry", pay: "Rs 12,000/month", city: "Remote", distance: "Remote", type: "Remote", employer: "AdminWorks", badge: "Verified", remote: true, desc: "Basic typing and spreadsheet work." }
  ];
  function cloneJobs() {
    return defaultJobs.map(function (job) { return Object.assign({}, job); });
  }
  var state = JSON.parse(localStorage.getItem("kkState") || "null") || {
    workerComplete: false,
    employerComplete: false,
    worker: { id: "john", name: "", gender: "", age: "", city: "", experience: "", skills: [], jobTypes: [], availability: "", preferredJob: "Any Job", preferredType: "Full-time", bio: "", phoneVerified: true, startAvailability: "", availableDays: [], shiftPreference: "", flexibleAvailability: false },
    employer: { id: "", ownerId: "john", name: "", business: "", phone: "0000000000", type: "", city: "" },
    jobs: cloneJobs(),
    applications: [],
    conversations: [],
    messages: [],
    notifications: []
  };
  state.worker = state.worker || { id: "john", name: "", gender: "", age: "", city: "", experience: "", skills: [], availability: "", preferredJob: "Any Job", preferredType: "Full-time", bio: "", phoneVerified: true };
  state.worker.id = state.worker.id || "john";
  state.worker.skills = Array.isArray(state.worker.skills) ? state.worker.skills : [];
  state.worker.preferredJob = state.worker.preferredJob || "Any Job";
  state.worker.jobTypes = Array.isArray(state.worker.jobTypes) ? state.worker.jobTypes : [];
  state.employer = state.employer || { id: "", ownerId: "john", name: "", business: "", phone: "0000000000", type: "", city: "" };
  if (!Array.isArray(state.jobs) || !state.jobs.length) state.jobs = cloneJobs();
  state.applications = Array.isArray(state.applications) ? state.applications : [];
  state.auditLogs = state.auditLogs || [];
  state.moderationLogs = state.moderationLogs || [];
  state.ratings = state.ratings || [];
  state.blockedPairs = state.blockedPairs || [];
  state.conversations = state.conversations || [];
  state.messages = state.messages || [];
  state.notifications = state.notifications || [];
  state.defaultBusinessId = state.defaultBusinessId || "";
  state.businessProfiles = state.businessProfiles || {};
  state.defaultWorkerId = state.defaultWorkerId || "";
  state.workerProfiles = state.workerProfiles || {};
  state.user = state.user || { id: "user-demo", displayName: state.worker.name || "", phone: state.employer.phone || "", city: state.worker.city || "", location: state.worker.city || "" };
  state.user.id = state.user.id || "user-demo";
  state.user.displayName = state.user.displayName || state.worker.name || "";
  state.user.phone = state.user.phone || state.employer.phone || "";
  state.user.city = state.user.city || state.worker.city || "";
  state.user.location = state.user.location || state.user.city || "";
  state.user.phoneVerified = !!(state.user.phoneVerified || state.worker.phoneVerified);
  state.user.photoVerificationStatus = state.user.photoVerificationStatus || (state.user.photoVerified || state.worker.photoVerified ? "verified" : "not_uploaded");
  state.user.photoVerified = state.user.photoVerificationStatus === "verified";
  state.worker.photoVerified = state.user.photoVerificationStatus === "verified";
  var oldDemoName = ["John","Kumar"].join(" ");
  var oldDemoPhone = "987" + "654" + "3210";
  var oldDemoCity = "Jai" + "pur";
  if (!state.workerComplete && !state.defaultWorkerId) {
    state.worker.name = "";
    state.worker.gender = "";
    state.worker.age = "";
    state.worker.city = "";
    state.worker.experience = "";
    state.worker.skills = [];
    state.worker.jobTypes = [];
    state.worker.preferredJob = "Any Job";
    state.worker.startAvailability = "";
    state.worker.availableDays = [];
    state.worker.shiftPreference = "";
    state.worker.flexibleAvailability = false;
  } else {
    if (state.worker.name === oldDemoName) state.worker.name = "Aman Lalh";
    if (state.worker.city === oldDemoCity) state.worker.city = "Delhi";
  }
  if (state.employer.phone === oldDemoPhone) state.employer.phone = "0000000000";
  if (state.user.displayName === oldDemoName) state.user.displayName = state.worker.name || "";
  if (!state.user.phone || state.user.phone === oldDemoPhone) state.user.phone = "0000000000";
  if (!state.user.city || state.user.city === oldDemoCity) { state.user.city = "Delhi"; state.user.location = "Delhi"; }
  state.worker.startAvailability = state.worker.startAvailability || "";
  state.worker.availableDays = Array.isArray(state.worker.availableDays) ? state.worker.availableDays : [];
  state.worker.shiftPreference = state.worker.shiftPreference || "";
  state.worker.flexibleAvailability = !!state.worker.flexibleAvailability;
  if (!state.notifications.length) {
    state.notifications = [
      { id: "note-morning", text: "5 new jobs near you today", target: "jobs", read: false, createdAt: Date.now() - 60000 },
      { id: "note-evening", text: "2 employers viewed your profile", target: "applications", read: false, createdAt: Date.now() - 120000 }
    ];
  }
  state.employer.moderationStatus = state.employer.moderationStatus || "active";
  state.jobs.forEach(function (job) {
    job.status = job.status || "approved";
    job.reportCount = job.reportCount || 0;
    job.flagReasons = job.flagReasons || [];
    job.riskScore = job.riskScore || 0;
    job.createdAt = job.createdAt || (Date.now() - 86400000);
    job.expiresAt = job.expiresAt || (job.visibility === "boost" ? job.createdAt + 29 * 86400000 : job.createdAt + 15 * 86400000);
    if ((job.status || "approved") === "approved" && Date.now() > job.expiresAt) job.status = "Expired";
  });
  state.jobs = state.jobs.filter(function (job) { return !job.expiresAt || Date.now() < job.expiresAt + 60 * 86400000; });
  if (!state.jobs.some(function (job) { return (job.status || "approved") === "approved"; })) {
    state.jobs = cloneJobs().concat(state.jobs);
  }

  var moderationRules = {
    prohibited: [
      { reason: "Adult or sexual services", words: ["adult service","escort","prostitution","massage girl","call girl","sex work"] },
      { reason: "Drugs or narcotics", words: ["drug","narcotic","ganja","cocaine","heroin","mdma","charas"] },
      { reason: "Weapons or explosives", words: ["weapon","gun","pistol","explosive","bomb","ammunition"] },
      { reason: "Trafficking, forced labour or child labour", words: ["forced labour","bonded labour","child labour","minor worker","under 18"] },
      { reason: "Scam or upfront payment request", words: ["registration fee","security deposit","pay first","upfront payment","joining fee","processing fee"] },
      { reason: "Gambling, betting or money laundering", words: ["betting","gambling","casino","money laundering","hawala"] },
      { reason: "Harassment or unsafe work", words: ["harass","abuse allowed","unsafe work","no safety"] }
    ],
    suspicious: [
      { reason: "WhatsApp-only contact", words: ["whatsapp only","only whatsapp","whatsapp me","wa only"] },
      { reason: "No interview or direct joining", words: ["no interview","direct joining","join immediately no questions"] },
      { reason: "Discrimination language", words: ["only male","only female","no muslim","no hindu","caste","religion only"] }
    ]
  };

  var copy = {
    en: { heroTitle: "Jobs near you.", heroSub: "Apply in one swipe. Chat after employer accepts.", heroVisual: "Swipe. Match. Start work.", continue: "Continue", enter_phone: "Enter your phone number", send_otp: "Send OTP", verify_otp: "Verify & continue", find_work: "Looking for work", hire_workers: "Hiring workers", basic_details: "Basic details", job_type: "Job type", skills_experience: "Skills & experience", availability: "Availability", job_feed: "Job Feed", search_city: "Search city", all: "All", near_me: "Near Me", remote: "Remote", profile: "Profile", settings: "Settings", change_phone: "Change Phone Number", notifications: "Notifications", privacy: "Privacy", delete_account: "Delete Account", help: "Help & FAQ", refer: "Refer & Earn", logout: "Logout" },
    hi: { heroTitle: "आपके पास नौकरियां।", heroSub: "एक स्वाइप में आवेदन करें। नियोक्ता स्वीकार करे तो चैट करें।", heroVisual: "स्वाइप करें। मैच करें। काम शुरू करें।", continue: "आगे बढ़ें", enter_phone: "अपना मोबाइल नंबर दर्ज करें", send_otp: "ओटीपी भेजें", verify_otp: "ओटीपी सत्यापित करें", find_work: "काम ढूंढें", hire_workers: "काम पर रखें", basic_details: "बुनियादी जानकारी", job_type: "काम का प्रकार", skills_experience: "कौशल और अनुभव", availability: "उपलब्धता", job_feed: "नौकरियां", search_city: "शहर खोजें", all: "सभी", near_me: "मेरे पास", remote: "घर से काम", profile: "प्रोफाइल", settings: "सेटिंग्स", change_phone: "फोन नंबर बदलें", notifications: "नोटिफिकेशन", privacy: "प्राइवेसी", delete_account: "अकाउंट हटाएं", help: "मदद", refer: "दोस्तों को आमंत्रित करें", logout: "लॉगआउट" }
  };
  var legal = {
    terms: ["Terms & Conditions", "Kaam Karo connects workers and employers. Use truthful information, do not post illegal jobs, and do not ask workers to pay for employment."],
    privacy: ["Privacy Policy", "We use phone numbers for login, account safety and trusted job updates. We do not publicly show your phone number in the app."],
    refund: ["Refund Policy", "Boosted post payments are reviewed case by case. Refunds may apply when a paid post is not published due to platform issues."],
    guidelines: ["Community Guidelines", "Be respectful. Do not ask for money to give a job. Report fake jobs, unsafe messages or wrong salary details."]
  };

  function save() {
    localStorage.setItem("kkState", JSON.stringify(state));
    localStorage.setItem("kkActiveCity", activeCity || "");
  }
  function track(name) {
    var events = JSON.parse(localStorage.getItem("kkAnalytics") || "[]");
    events.push({ name: name, at: new Date().toISOString(), screen: currentScreen });
    localStorage.setItem("kkAnalytics", JSON.stringify(events.slice(-100)));
  }
  function snapshotJob(job) {
    return { id: job.id, title: job.title, pay: job.pay, city: job.city, type: job.type, employer: job.employer, desc: job.desc, status: job.status };
  }
  function audit(action, reason, job, userId) {
    state.auditLogs.unshift({ userId: userId || "admin-001", action: action, reason: reason, jobSnapshot: job ? snapshotJob(job) : null, timestamp: new Date().toISOString() });
    state.auditLogs = state.auditLogs.slice(0, 50);
    save();
  }
  var indiaLocations = [
    { city: "Gandhinagar", district: "Gandhinagar", state: "Gujarat", country: "India", formatted_location: "Gandhinagar, Gujarat, India", place_id: "in-gandhinagar-gj", lat: 23.2156, lng: 72.6369 },
    { city: "Gandhinagar", district: "Kolhapur", state: "Maharashtra", country: "India", formatted_location: "Gandhinagar, Kolhapur, Maharashtra, India", place_id: "in-gandhinagar-kolhapur-mh", lat: 16.705, lng: 74.243 },
    { city: "Gandhinagar District", district: "Gandhinagar", state: "Gujarat", country: "India", formatted_location: "Gandhinagar District, Gujarat, India", place_id: "in-gandhinagar-district-gj", lat: 23.223, lng: 72.65 },
    { city: "Balachaur", district: "Nawanshahr", state: "Punjab", country: "India", formatted_location: "Balachaur, Nawanshahr, Punjab, India", place_id: "in-balachaur-pb", lat: 31.06, lng: 76.3 },
    { city: "Chandigarh", district: "Chandigarh", state: "Chandigarh", country: "India", formatted_location: "Chandigarh, India", place_id: "in-chandigarh", lat: 30.7333, lng: 76.7794 },
    { city: "Delhi", district: "Delhi", state: "Delhi", country: "India", formatted_location: "Delhi, India", place_id: "in-delhi", lat: 28.6139, lng: 77.209 },
    { city: "Pune", district: "Pune", state: "Maharashtra", country: "India", formatted_location: "Pune, Maharashtra, India", place_id: "in-pune-mh", lat: 18.5204, lng: 73.8567 },
    { city: "Kochi", district: "Ernakulam", state: "Kerala", country: "India", formatted_location: "Kochi, Ernakulam, Kerala, India", place_id: "in-kochi-kl", lat: 9.9312, lng: 76.2673 },
    { city: "Hyderabad", district: "Hyderabad", state: "Telangana", country: "India", formatted_location: "Hyderabad, Telangana, India", place_id: "in-hyderabad-ts", lat: 17.385, lng: 78.4867 },
    { city: "Mumbai", district: "Mumbai", state: "Maharashtra", country: "India", formatted_location: "Mumbai, Maharashtra, India", place_id: "in-mumbai-mh", lat: 19.076, lng: 72.8777 },
    { city: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", country: "India", formatted_location: "Bengaluru, Karnataka, India", place_id: "in-bengaluru-ka", lat: 12.9716, lng: 77.5946 },
    { city: "Jaipur", district: "Jaipur", state: "Rajasthan", country: "India", formatted_location: "Jaipur, Rajasthan, India", place_id: "in-jaipur-rj", lat: 26.9124, lng: 75.7873 },
    { city: "Surat", district: "Surat", state: "Gujarat", country: "India", formatted_location: "Surat, Gujarat, India", place_id: "in-surat-gj", lat: 21.1702, lng: 72.8311 },
    { city: "Amritsar", district: "Amritsar", state: "Punjab", country: "India", formatted_location: "Amritsar, Punjab, India", place_id: "in-amritsar-pb", lat: 31.634, lng: 74.8723 },
    { city: "Karimnagar", district: "Karimnagar", state: "Telangana", country: "India", formatted_location: "Karimnagar, Telangana, India", place_id: "in-karimnagar-ts", lat: 18.4386, lng: 79.1288 },
    { city: "Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu", country: "India", formatted_location: "Tiruchirappalli, Tamil Nadu, India", place_id: "in-tiruchirappalli-tn", lat: 10.7905, lng: 78.7047 }
  ];
  function locationMatches(query) {
    var q = String(query || "").toLowerCase().trim();
    if (!q) return indiaLocations.slice(0, 8);
    return indiaLocations.filter(function (loc) {
      return [loc.city, loc.district, loc.state, loc.formatted_location].join(" ").toLowerCase().indexOf(q) >= 0;
    }).slice(0, 8);
  }
  function fillLocationDatalist(query) {
    var list = byId("locationSuggestions");
    if (!list) return;
    list.innerHTML = locationMatches(query).map(function (loc) { return '<option value="' + loc.formatted_location + '"></option>'; }).join("");
  }
  function selectedLocationFromInput(value) {
    var exact = String(value || "").trim().toLowerCase();
    return indiaLocations.find(function (loc) { return loc.formatted_location.toLowerCase() === exact; }) || null;
  }
  function saveLocationTo(target, loc) {
    if (!loc) return;
    selectedLocations[target] = loc;
    if (target === "workerBasic") {
      state.worker.city = loc.city; state.worker.district = loc.district; state.worker.state = loc.state; state.worker.country = loc.country; state.worker.formatted_location = loc.formatted_location; state.worker.place_id = loc.place_id; state.worker.lat = loc.lat; state.worker.lng = loc.lng;
      state.user.city = loc.city; state.user.district = loc.district; state.user.state = loc.state; state.user.country = loc.country; state.user.location = loc.formatted_location;
    }
    if (target === "postJob") {
      selectedLocations.postJob = loc;
    }
    if (target === "profileEdit") {
      editDraft.value = loc.formatted_location;
      editDraft.location = loc;
      markEditDirty();
    }
    save();
  }
  function renderHeroDynamicCard() {
    if (!byId("heroJobTitle") || !byId("heroJobMeta")) return;
    var titles = ["Chef","Driver","Electrician","Accountant","Nurse","Office Clerk","Retail Helper","Delivery Partner","Cleaner","Welder"];
    var cities = ["Delhi","Punjab","Kerala","Hyderabad","Pune","Surat","Chandigarh","Kochi","Amritsar","Jaipur"];
    var seed = Math.floor(Date.now() / 1000);
    byId("heroJobTitle").textContent = titles[seed % titles.length] + " job matched";
    byId("heroJobMeta").textContent = cities[(seed + 3) % cities.length] + " - " + ((seed % 10) + 1) + " km away";
  }
  function parseLocationParts(value) {
    var text = String(value || "").trim();
    var selected = selectedLocationFromInput(text);
    if (selected) return selected;
    var city = displayCity(text);
    var map = {
      chandigarh: { city: "Chandigarh", district: "Chandigarh", state: "Chandigarh", formatted_location: "Chandigarh" },
      balachaur: { city: "Balachaur", district: "Nawanshahr", state: "Punjab", formatted_location: "Balachaur, Punjab" },
      delhi: { city: "Delhi", district: "Delhi", state: "Delhi", formatted_location: "Delhi" },
      pune: { city: "Pune", district: "Pune", state: "Maharashtra", formatted_location: "Pune, Maharashtra" },
      kochi: { city: "Kochi", district: "Ernakulam", state: "Kerala", formatted_location: "Kochi, Kerala" },
      hyderabad: { city: "Hyderabad", district: "Hyderabad", state: "Telangana", formatted_location: "Hyderabad, Telangana" },
      amritsar: { city: "Amritsar", district: "Amritsar", state: "Punjab", formatted_location: "Amritsar, Punjab" },
      surat: { city: "Surat", district: "Surat", state: "Gujarat", formatted_location: "Surat, Gujarat" }
    };
    return map[city.toLowerCase()] || { city: city, district: "", state: "", country: "India", formatted_location: city, place_id: "", lat: null, lng: null };
  }
  function disconnectMatch(convo, removeChat) {
    if (!convo) return;
    state.applications = state.applications.filter(function (app) { return !(app.jobId === convo.jobId && app.workerId === convo.workerId); });
    if (removeChat !== false) {
      state.conversations = state.conversations.filter(function (c) { return c.id !== convo.id; });
      state.messages = state.messages.filter(function (m) { return m.conversationId !== convo.id; });
    } else {
      convo.status = "closed";
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
    }
    save();
  }
  function expireInactiveMatches() {
    var cutoff = Date.now() - 12 * 86400000;
    var expired = state.conversations.filter(function (convo) {
      return convo.status === "active" && (convo.lastActivityAt || convo.updatedAt || convo.createdAt || 0) < cutoff;
    });
    expired.forEach(function (convo) { disconnectMatch(convo); });
  }
  function markHiredConversation(convo) {
    if (!convo) return;
    convo.status = "hired";
    convo.updatedAt = Date.now();
    convo.lastActivityAt = Date.now();
    var hiredApp = state.applications.find(function (a) { return a.jobId === convo.jobId && a.workerId === convo.workerId; });
    if (hiredApp) hiredApp.status = "Hired";
    var now = Date.now();
    var text = "Hired! Employer has marked this job as hired.";
    state.messages.push({ id: "msg-" + now + "-hired", conversationId: convo.id, senderId: "rick", text: text, createdAt: now, status: "delivered", deliveryStatus: "delivered", flaggedRisk: false });
    convo.lastMessage = text;
    state.ratings.push({ id: "rating-pending-" + now, conversationId: convo.id, jobId: convo.jobId, workerId: convo.workerId, employerId: convo.employerId, status: "pending", createdAt: now, showAfter: now + 6 * 3600000 });
    save();
  }
  function hasSubmittedRating(convo) {
    if (!convo) return true;
    return state.ratings.some(function (rating) {
      return rating.conversationId === convo.id && rating.fromRole === currentRole && rating.status === "submitted";
    });
  }
  function t(key) { return copy[currentLang] && copy[currentLang][key] ? copy[currentLang][key] : (copy.en && copy.en[key] ? copy.en[key] : key); }
  function byId(id) { return document.getElementById(id); }
  function toast(message) {
    var node = byId("toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { node.classList.remove("show"); }, 1800);
  }
  function notify(text, target) {
    state.notifications.unshift({ id: "note-" + Date.now(), text: text, target: target || "notifications", read: false, createdAt: Date.now() });
    state.notifications = state.notifications.slice(0, 20);
    save();
  }
  function routeAfterOtp() {
    var hasWorker = hasWorkerProfile();
    var hasEmployer = hasEmployerProfile();
    var lastMode = localStorage.getItem("kkLastMode") || localStorage.getItem("kkRole");
    if (!hasWorker && !hasEmployer) return show("role");
    if (hasWorker && !hasEmployer) { currentRole = "worker"; localStorage.setItem("kkRole", "worker"); return show("jobs"); }
    if (hasEmployer && !hasWorker) { currentRole = "employer"; localStorage.setItem("kkRole", "employer"); return show("employerDash"); }
    if (lastMode === "employer") { currentRole = "employer"; localStorage.setItem("kkRole", "employer"); return show("employerDash"); }
    if (lastMode === "worker") { currentRole = "worker"; localStorage.setItem("kkRole", "worker"); return show("jobs"); }
    show("role");
  }
  function hasEmployerProfile() {
    return !!(state.employerComplete && state.defaultBusinessId && state.businessProfiles && state.businessProfiles[state.defaultBusinessId]);
  }
  function isEmployerRoute(id) {
    return ["employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","employerProfile"].indexOf(id) >= 0;
  }
  function goToEmployerRoute(targetRoute) {
    if (!hasEmployerProfile()) {
      pendingEmployerRoute = targetRoute || "employerDash";
      localStorage.setItem("kkPendingEmployerRoute", pendingEmployerRoute);
      if (!setupReturnRoute && ["landing","otp","otpCode","role"].indexOf(currentScreen) < 0) {
        setupReturnRoute = currentScreen || "jobs";
        localStorage.setItem("kkSetupReturnRoute", setupReturnRoute);
      }
      toast("Set up your business first.");
      return show("employerSetup");
    }
    return show(targetRoute || "employerDash");
  }
  function currentBusinessProfile() {
    return state.businessProfiles && state.defaultBusinessId ? state.businessProfiles[state.defaultBusinessId] : null;
  }
  function applyStructuredLocation(target, loc) {
    if (!loc) return;
    if (target === "user" || target === "accountLocation") {
      Object.assign(state.user, { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng });
    }
    if (target === "worker" || target === "accountLocation") {
      Object.assign(state.worker, { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng });
      if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) {
        Object.assign(state.workerProfiles[state.defaultWorkerId], { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng, updatedAt: Date.now() });
      }
    }
    if (target === "employer" || target === "accountLocation") {
      Object.assign(state.employer, { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng });
      var business = currentBusinessProfile();
      if (business) Object.assign(business, { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng });
    }
  }
  function hasWorkerProfile() {
    return !!(state.workerComplete && state.defaultWorkerId && state.workerProfiles && state.workerProfiles[state.defaultWorkerId]);
  }
  function isWorkerRoute(id) {
    return ["jobs","applied","search","applications","profile"].indexOf(id) >= 0;
  }
  function goToWorkerRoute(targetRoute) {
    if (!hasWorkerProfile()) {
      pendingWorkerRoute = targetRoute || "jobs";
      localStorage.setItem("kkPendingWorkerRoute", pendingWorkerRoute);
      if (!setupReturnRoute && ["landing","otp","otpCode","role"].indexOf(currentScreen) < 0) {
        setupReturnRoute = currentScreen || "employerDash";
        localStorage.setItem("kkSetupReturnRoute", setupReturnRoute);
      }
      toast("Create your worker profile first.");
      return show("workerBasic");
    }
    return show(targetRoute || "jobs");
  }
  function currentWorkerProfile() {
    return state.workerProfiles && state.defaultWorkerId ? state.workerProfiles[state.defaultWorkerId] : null;
  }
  function initials(value) {
    return String(value || "KK").trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join("") || "KK";
  }
  function workerLocationLine() {
    var city = state.worker.city || state.user.city || "your city";
    var region = state.worker.state && state.worker.state !== city ? city + ", " + state.worker.state : city;
    return "Based in " + region + ", available for nearby opportunities";
  }
  function workerExperienceLine() {
    if (!state.worker.experience) return "Experience details not added yet";
    return /experience|retail|customer/i.test(state.worker.experience) ? state.worker.experience : state.worker.experience + " experience in retail and customer-facing roles";
  }
  function workerWorkLine() {
    if (state.worker.jobTypes && state.worker.jobTypes.length) return "Open to " + state.worker.jobTypes.slice(0, 3).join(", ") + (state.worker.jobTypes.length > 3 ? " and more roles" : " roles");
    if (state.worker.workTypes && state.worker.workTypes.length) return "Open to " + state.worker.workTypes.join(", ").toLowerCase() + " roles";
    if (!state.worker.preferredJob || state.worker.preferredJob === "Any Job") return "Open to full-time and part-time roles";
    return /^open/i.test(state.worker.preferredJob) ? state.worker.preferredJob : "Open to " + state.worker.preferredJob + " roles";
  }
  function workerAvailabilityLine() {
    if (state.worker.flexibleAvailability) return "Open to any day and any time";
    var start = state.worker.startAvailability || "";
    var days = state.worker.availableDays || [];
    if (start === "On Demand") return "Available on demand, flexible schedule";
    if (start === "Specific Date") return "Available from a specific date for planned shifts";
    if (!start && !days.length && !state.worker.shiftPreference) return "Availability not added yet";
    if (!days.length || days.length === 7) return (start || "Available") + " for weekday and weekend shifts";
    return (start || "Available") + " on " + days.join(", ") + " for " + (state.worker.shiftPreference || "selected").toLowerCase() + " shifts";
  }
  function resetVisibilityChoice() {
    postVisibility = "";
    document.querySelectorAll(".visibility-plans .plan").forEach(function (plan) { plan.classList.remove("selected"); });
    var publish = byId("publishJobBtn");
    var error = byId("visibilityError");
    if (publish) publish.disabled = true;
    if (error) error.style.display = "none";
  }
  function flashJobCard(kind) {
    var card = document.querySelector("#jobFeed .job-card");
    if (!card) return;
    card.classList.remove("swipe-like", "swipe-skip");
    card.classList.add(kind === "like" ? "swipe-like" : "swipe-skip");
    clearTimeout(flashJobCard.timer);
    flashJobCard.timer = setTimeout(function () {
      card.classList.remove("swipe-like", "swipe-skip");
    }, 150);
  }
  function recordSwipe(applied) {
    swipeCount += 1;
    if (applied) appliedToday += 1;
    localStorage.setItem("kkSwipeCount", String(swipeCount));
    localStorage.setItem("kkAppliedToday", String(appliedToday));
    if (applied && appliedToday > 0 && appliedToday % 3 === 0) {
      setTimeout(function () { toast(appliedToday + " jobs applied today \uD83D\uDD25"); }, 850);
    }
  }
  function show(id) {
    var target = byId(id);
    if (!target) return toast("Please try again.");
    var employerScreens = ["employerSetup","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","employerProfile"];
    var workerScreens = ["workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress","jobs","applied","search","applications"];
    if (employerScreens.indexOf(id) >= 0 && !(id === "employerSetup" && setupReturnRoute)) currentRole = "employer";
    if (workerScreens.indexOf(id) >= 0 && !(id === "workerBasic" && setupReturnRoute)) currentRole = "worker";
    localStorage.setItem("kkRole", currentRole);
    localStorage.setItem("kkLastMode", currentRole);
    if (id === "menu" && currentScreen !== "menu") menuReturn = currentScreen;
    if ((id === "legal" || id === "report") && currentScreen !== id) menuReturn = currentScreen;
    var forward = routeOrder.indexOf(id) >= routeOrder.indexOf(currentScreen);
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.remove("active","was-left","was-right");
      if (screen.id !== id) screen.classList.add(forward ? "was-left" : "was-right");
    });
    target.classList.add("active");
    target.classList.remove("was-left","was-right");
    currentScreen = id;
    if (id === "verifyId") startPhotoCamera(); else stopPhotoCamera();
    var body = target.querySelector(".screen-body");
    if (body) body.scrollTop = 0;
    render();
    track("screen_" + id);
  }
  function navScreenIds() {
    return ["jobs","applied","search","applications","profile","accountSettings","profileEdit","legal","report","notifications","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","employerProfile","chat"];
  }
  function setupScreenBodies() {
    var navScreens = navScreenIds();
    document.querySelectorAll(".screen").forEach(function (screen) {
      if (!screen.querySelector(":scope > .screen-body")) {
        var body = document.createElement("div");
        body.className = "screen-body";
        Array.from(screen.childNodes).forEach(function (node) {
          if (node.nodeType === 1 && node.classList && node.classList.contains("header")) return;
          body.appendChild(node);
        });
        screen.appendChild(body);
      }
      screen.classList.toggle("has-header", !!screen.querySelector(":scope > .header"));
      screen.classList.toggle("has-nav", navScreens.indexOf(screen.id) >= 0);
    });
  }
  function renderAppHeader() {
    if (!byId("appHeader")) return;
    var source = byId(currentScreen) ? byId(currentScreen).querySelector(":scope > .header") : null;
    if (source) {
      var clone = source.cloneNode(true);
      if ((currentScreen === "employerSetup" || currentScreen === "workerBasic") && setupReturnRoute) {
        var homeButton = clone.querySelector("[data-go]");
        if (homeButton) {
          homeButton.removeAttribute("data-go");
          homeButton.setAttribute("data-setup-home", "true");
          homeButton.textContent = "Home";
        }
      }
      byId("appHeader").innerHTML = '<div class="header">' + clone.innerHTML + '</div>';
    } else {
      byId("appHeader").innerHTML = "";
    }
    var app = document.querySelector(".app");
    if (app) app.classList.toggle("has-header", !!source);
  }
  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem("kaamkaroLang", lang);
    localStorage.setItem("kkLang", lang);
    render();
  }
  function applyCopy() {
    document.documentElement.lang = currentLang === "hi" ? "hi" : "en";
    document.querySelectorAll("[data-lang]").forEach(function (button) { button.classList.toggle("active", button.dataset.lang === currentLang); });
    document.querySelectorAll("[data-i18n]").forEach(function (node) { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) { node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder)); });
  }
  function fillBasicDefaults() {
    fillLocationDatalist("");
    if (byId("locationSearch")) byId("locationSearch").value = state.worker.city || "";
    if (byId("businessName")) byId("businessName").value = state.employer.business || "";
    if (byId("contactName")) byId("contactName").value = state.employer.name || "";
    if (byId("businessType")) byId("businessType").value = state.employer.type || "";
    if (byId("businessPhone")) byId("businessPhone").value = state.employer.phone || (byId("phoneInput") ? byId("phoneInput").value : "") || "";
    if (byId("otpPhoneText")) byId("otpPhoneText").textContent = "+91 " + (((byId("phoneInput") && byId("phoneInput").value) || state.user.phone || state.employer.phone || "0000000000").trim());
  }
  function renderCategories() {
    if (!byId("workCategories")) return;
    byId("workCategories").innerHTML = workCategories.slice(0, 8).map(function (cat) {
      var selected = (state.worker.jobTypes || []).indexOf(cat) >= 0;
      return '<button class="choice ' + (selected ? "selected" : "") + '" data-work-cat="' + cat + '"><span class="ci">' + cat.slice(0,1) + '</span>' + cat + '</button>';
    }).join("");
    var any = document.querySelector("[data-any-job]");
    if (any) any.classList.toggle("selected", state.worker.preferredJob === "Any Job");
    if (byId("jobTypeCounter")) byId("jobTypeCounter").textContent = (state.worker.jobTypes || []).length ? state.worker.jobTypes.length + "/2 selected" : "Show all on";
    if (byId("selectedJobTypes")) {
      var base = state.worker.preferredJob === "Any Job" ? '<button class="chip selected" data-any-job>Show All Jobs</button>' : "";
      var selectedTypes = (state.worker.jobTypes || []).map(function (type) {
        return '<button class="chip selected skill-pill" data-remove-job-type="' + type + '">' + type + ' <span>x</span></button>';
      }).join("");
      byId("selectedJobTypes").innerHTML = base + selectedTypes;
    }
  }
  function renderPhotoStatus() {
    if (byId("photoStatus")) {
      byId("photoStatus").textContent = state.worker.photoVerified ? "Photo uploaded successfully" : "Verified accounts may appear more prominently to employers.";
    }
  }
  function profileStrength() {
    var phoneVerified = !!(state.user.phoneVerified || state.worker.phoneVerified);
    var photoVerified = state.user.photoVerificationStatus === "verified" || state.user.photoVerified === true || state.worker.photoVerified === true;
    if (phoneVerified && photoVerified) return 100;
    if (phoneVerified) return 70;
    return 0;
  }
  function renderPhotoBadge() {
    var slot = byId("photoBadgeSlot");
    if (!slot) return;
    if (state.user.photoVerificationStatus === "verified" || state.worker.photoVerified) {
      slot.innerHTML = '<span class="badge">Photo Verified</span>';
    } else {
      slot.innerHTML = '<button class="badge muted" data-go="verifyId">Verify Photo</button><p class="small mt">Complete your profile to increase visibility.</p>';
    }
  }
  function applyPhotoVerified(src) {
    state.user.photoVerificationStatus = "verified";
    state.user.photoVerified = true;
    state.worker.photoVerified = true;
    state.worker.photo_url = src || state.worker.photo_url || "local-photo-verified";
    if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) {
      state.workerProfiles[state.defaultWorkerId].photo_url = state.worker.photo_url;
      state.workerProfiles[state.defaultWorkerId].photoVerificationStatus = "verified";
      state.workerProfiles[state.defaultWorkerId].photo_verified = true;
      state.workerProfiles[state.defaultWorkerId].updatedAt = Date.now();
    }
    save();
  }
  function workerPhotoBadgeHtml() {
    return (state.user.photoVerificationStatus === "verified" || state.worker.photoVerified) ? '<span class="badge">Photo Verified</span>' : '<span class="small">No photo</span>';
  }
  function descriptionWordCount(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }
  function renderPostDescCounter() {
    var desc = byId("postDesc");
    if (!desc) return;
    var words = descriptionWordCount(desc.value);
    if (byId("postDescCounter")) byId("postDescCounter").textContent = words + " / 15 words minimum";
    if (byId("postDescError")) byId("postDescError").style.display = words > 0 && words < 15 ? "block" : "none";
  }
  function addDescriptionSentence(kind) {
    var desc = byId("postDesc");
    if (!desc) return;
    var suggestions = {
      tasks: "Daily tasks include helping customers, handling basic work, keeping the area clean, and supporting the team during busy hours.",
      shift: "Shift timing and working days will be discussed clearly before the worker starts the job.",
      experience: "Previous experience is preferred, but training can be provided if the worker is reliable and willing to learn.",
      location: "Exact workplace location and reporting instructions will be shared after the applicant is accepted.",
      tools: "Any uniform, tools, or special requirements will be explained before the first working day."
    };
    var sentence = suggestions[kind] || "";
    if (!sentence) return;
    desc.value = ((desc.value.trim() ? desc.value.trim() + "\n\n" : "") + sentence).slice(0, 700);
    renderPostDescCounter();
    desc.focus();
  }
  function openModal(title, body) {
    if (!byId("appModal")) return;
    byId("modalTitle").textContent = title;
    byId("modalBody").innerHTML = body;
    byId("appModal").classList.add("show");
  }
  function closeModal() {
    if (byId("appModal")) byId("appModal").classList.remove("show");
  }
  function showUndo(message) {
    if (!byId("undoBar")) return;
    byId("undoText").textContent = message || "Action done";
    byId("undoBar").classList.add("show");
    clearTimeout(undoTimer);
    undoTimer = setTimeout(function () { byId("undoBar").classList.remove("show"); lastSwipe = null; }, 5000);
  }
  function addWorkerJobType(type) {
    var value = String(type || "").trim();
    if (!value) return;
    state.worker.jobTypes = state.worker.jobTypes || [];
    if (state.worker.jobTypes.indexOf(value) >= 0) return;
    if (state.worker.jobTypes.length >= 2) return toast("Choose up to two job types.");
    state.worker.jobTypes.push(value);
    state.worker.preferredJob = state.worker.jobTypes.join(" / ");
    if (byId("workSearch")) byId("workSearch").value = "";
    save();
    renderCategories();
    toast(value + " added");
  }
  function displayCity(value) {
    return String(value || "").split(",")[0].trim();
  }
  function setActiveCity(value) {
    activeCity = displayCity(value);
    localStorage.setItem("kkActiveCity", activeCity);
    locationMode = "city";
    activeFilter = "all";
    if (byId("jobSearch")) byId("jobSearch").value = "";
    document.querySelectorAll("[data-filter]").forEach(function (chip) { chip.classList.toggle("selected", chip.dataset.filter === "all"); });
    jobIndex = 0;
    renderFeed();
    if (activeCity) toast("Showing " + activeCity);
  }
  function renderSkills() {
    byId("skillChips").innerHTML = skillOptions.map(function (skill) {
      return '<button class="chip ' + (state.worker.skills.indexOf(skill) >= 0 ? "preset-selected" : "") + '" data-skill="' + skill + '">' + skill + '</button>';
    }).join("");
    if (byId("skillCounter")) byId("skillCounter").textContent = state.worker.skills.length + " skills selected";
    if (byId("yourSkills")) {
      byId("yourSkills").innerHTML = state.worker.skills.length ? state.worker.skills.map(function (skill) {
        return '<button class="chip selected skill-pill" data-remove-skill="' + skill + '">' + skill + ' <span>x</span></button>';
      }).join("") : '<span class="small">No skills selected yet.</span>';
    }
  }
  function renderOnboardingAvailability() {
    if (!byId("onboardDays")) return;
    var days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    var selectedDays = state.worker.availableDays || [];
    var allSelected = days.every(function (day) { return selectedDays.indexOf(day) >= 0; });
    byId("onboardDays").innerHTML = days.map(function (day) {
      var selected = selectedDays.indexOf(day) >= 0;
      return '<button class="choice ' + (selected ? "selected" : "") + '" data-onboard-day="' + day + '"><span class="ci">' + (selected ? "OK" : "") + '</span>' + day + '</button>';
    }).join("");
    document.querySelectorAll("[data-onboard-start]").forEach(function (button) {
      button.classList.toggle("selected", button.dataset.onboardStart === state.worker.startAvailability);
    });
    var flexible = document.querySelector("[data-flexible-availability]");
    if (flexible) flexible.classList.toggle("selected", !!state.worker.flexibleAvailability);
    if (byId("onboardStartOptions")) byId("onboardStartOptions").classList.toggle("disabled-section", !!state.worker.flexibleAvailability);
    if (byId("onboardDays")) byId("onboardDays").classList.toggle("disabled-section", !!state.worker.flexibleAvailability);
    var allButton = document.querySelector("[data-onboard-all-days]");
    if (allButton) allButton.classList.toggle("disabled-section", !!state.worker.flexibleAvailability);
    if (byId("onboardShifts")) byId("onboardShifts").classList.toggle("disabled-section", !!state.worker.flexibleAvailability);
    var all = document.querySelector("[data-onboard-all-days]");
    if (all) all.classList.toggle("selected", allSelected);
    document.querySelectorAll("[data-onboard-shift]").forEach(function (button) {
      button.classList.toggle("selected", button.dataset.onboardShift === state.worker.shiftPreference);
    });
  }
  function startPhotoCamera() {
    var video = byId("photoCamera");
    var status = byId("photoCameraStatus");
    if (!video || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.textContent = "Camera is not available here. You can skip for now.";
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(function (stream) {
      video.srcObject = stream;
      if (status) status.textContent = "Camera ready. Keep one clear face in the frame.";
    }).catch(function () {
      if (status) status.textContent = "Camera permission was not allowed. You can continue without photo.";
    });
  }
  function stopPhotoCamera() {
    var video = byId("photoCamera");
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(function (track) { track.stop(); });
      video.srcObject = null;
    }
  }
  function renderPayPrefs() {
    if (!byId("payRange")) return;
    payOpen = state.worker.openAnyPay !== false;
    var open = document.querySelector("[data-open-pay]");
    if (open) open.classList.toggle("selected", payOpen);
    byId("payRange").style.display = payOpen ? "none" : "block";
    if (byId("payPref")) byId("payPref").value = state.worker.payRange || "";
    document.querySelectorAll("[data-pay-type]").forEach(function (button) {
      button.classList.toggle("selected", button.dataset.payType === (state.worker.payType || "Daily"));
    });
    document.querySelectorAll("[data-pay-range]").forEach(function (button) {
      button.classList.toggle("selected", button.dataset.payRange === state.worker.payRange);
    });
  }
  function filteredJobs(query) {
    var q = "";
    var selectedCity = activeCity || state.worker.city || state.user.city || "";
    var city = selectedCity.toLowerCase();
    var list = state.jobs.filter(function (job) {
      if ((job.status || "approved") !== "approved") return false;
      if (activeFilter === "remote" || locationMode === "remote") return job.remote;
      if (activeFilter === "near") return !job.remote;
      if (activeFilter === "all" && city) return job.remote || String(job.city || "").toLowerCase() === city;
      if (state.worker.preferredJob && state.worker.preferredJob !== "Any Job") {
        var pref = state.worker.preferredJob.toLowerCase().split(" / ")[0];
        if ((job.title + " " + job.type + " " + job.desc).toLowerCase().indexOf(pref) < 0 && activeFilter !== "all") return false;
      }
      if (q && (job.title + " " + job.city + " " + job.employer).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (!list.length) {
      if (byId("feedNotice")) byId("feedNotice").textContent = city ? "No jobs very close - showing nearby options in " + selectedCity + "." : "Showing nearby options.";
      list = state.jobs.filter(function (job) { return (job.status || "approved") === "approved" && (!job.remote || locationMode === "remote"); });
      if (!list.length) list = cloneJobs();
    } else {
      if (byId("feedNotice")) {
        if (activeFilter === "remote") byId("feedNotice").textContent = "You are seeing jobs you can do from home.";
        else if (activeFilter === "near") byId("feedNotice").textContent = "You are seeing jobs near you.";
        else if (activeCity) byId("feedNotice").textContent = "You are seeing jobs in " + activeCity + ".";
        else byId("feedNotice").textContent = "You are seeing jobs in " + (selectedCity || "your city") + " and remote jobs.";
      }
    }
    function payValue(job) {
      return Number(String(job.pay || "").replace(/[^\d]/g, "")) || 0;
    }
    function distanceValue(job) {
      if (job.remote) return 4;
      if (String(job.distance).toLowerCase().indexOf("near") >= 0) return 1;
      return Number(String(job.distance || "").replace(/[^\d.]/g, "")) || 8;
    }
    function score(job) {
      var text = (job.title + " " + job.desc + " " + job.type).toLowerCase();
      var skillMatch = (state.worker.skills || []).some(function (s) { return text.indexOf(String(s).toLowerCase().split(" ")[0]) >= 0; }) ? 40 : 0;
      var boost = (job.visibility === "boost" || job.badge === "Urgent") ? 100 : 0;
      return boost + skillMatch + Math.max(0, 25 - distanceValue(job) * 4) + Math.min(25, payValue(job) / 1000);
    }
    return list.sort(function (a, b) { return score(b) - score(a); });
  }
  function jobCard(job) {
    var applied = state.applications.find(function (a) { return a.jobId === job.id && a.workerId === state.worker.id; });
    return '<article class="job-card" data-open-job-modal="' + job.id + '">' +
      '<div class="job-hero"><div><div class="pay">' + job.pay + '</div><h2>' + job.title + '</h2><p>Location: ' + job.distance + '</p></div><div><span class="badge">Employer: ' + job.badge + '</span><div class="job-hook mt">Start today - 2 shifts</div></div></div>' +
      '<div class="job-meta"><div class="trust-line">No fees required</div><div class="meta"><span>' + job.type + '</span><span>' + job.employer + '</span><span>Posted 3h ago</span><span>Hiring today</span></div><p class="small">' + job.desc + '</p><button class="report-link" data-report="job">Report job</button></div>' +
      '</article><div class="swipe"><button class="circle danger-action" aria-label="Not interested" data-next-job><svg><use href="#i-x"></use></svg></button><button class="circle like-action" aria-label="Interested" data-apply-job="' + job.id + '"><svg><use href="#i-heart"></use></svg></button></div><div class="swipe-labels"><span>Not interested</span><span>Interested</span></div>';
  }
  function renderFeed() {
    if (!byId("jobFeed")) return;
    var list = filteredJobs("");
    if (jobIndex >= list.length) jobIndex = 0;
    var variation = swipeCount > 0 && swipeCount % 4 === 0 ? '<div class="panel small">Urgent hiring near you - verified employers only.</div>' : "";
    byId("jobFeed").innerHTML = list.length ? variation + '<div class="swipe-stack"><div class="stack-card third"></div><div class="stack-card second"></div>' + jobCard(list[jobIndex]) + '</div>' : '<div class="panel center"><h3>No jobs right now - try nearby areas</h3><p class="small">Try widening your choices.</p><button class="btn outline mt" data-go="workerLocation">Update availability</button><button class="btn outline mt" data-refresh-jobs>Refresh</button><button class="btn primary mt" data-go="workerWork">Search another city</button></div>';
    var label = activeFilter === "remote" ? "Remote" : (activeFilter === "near" ? "Nearby" : (activeCity || state.worker.city || state.user.city || "your city"));
    if (byId("feedSub")) byId("feedSub").textContent = label;
    if (byId("selectedCityChip")) byId("selectedCityChip").innerHTML = activeCity ? '<button class="chip selected" data-clear-city>' + activeCity + ' <span>x</span></button>' : "";
  }
  function applyToJob(id) {
    if (!hasWorkerProfile()) return goToWorkerRoute("jobs");
    selectedJobId = id || filteredJobs("")[jobIndex].id;
    var exists = state.applications.find(function (a) { return a.jobId === selectedJobId && a.workerId === state.worker.id; });
    if (!exists) {
      state.applications.push({ id: "app-" + Date.now(), jobId: selectedJobId, workerId: state.worker.id, status: "Interested", createdAt: Date.now() });
    } else if (exists.status === "Rejected") {
      exists.status = "Interested";
    }
    state.worker.active = true;
    save();
    track("application_created");
    lastSwipe = null;
    flashJobCard("like");
    toast("Applied");
    if (byId("undoBar")) byId("undoBar").classList.remove("show");
    recordSwipe(true);
    setTimeout(function () { toast("Employer will review your profile"); }, 500);
    show("applied");
    setTimeout(function () {
      if (currentScreen === "applied") show("jobs");
    }, 5000);
  }
  function nextJob() {
    var list = filteredJobs(byId("jobSearch") ? byId("jobSearch").value : "");
    if (!list.length) return;
    lastSwipe = { type: "skip", index: jobIndex };
    flashJobCard("skip");
    recordSwipe(false);
    jobIndex = (jobIndex + 1) % list.length;
    renderFeed();
    toast("Not interested");
    showUndo("Skipped job");
    track("job_swipe_left");
  }
  function renderSearch() {
    var q = byId("manualSearch") ? byId("manualSearch").value : "";
    var list = filteredJobs(q);
    if (!q.trim()) {
      byId("searchResults").innerHTML = '<div class="panel small">Search is optional. Swipe feed stays the fastest way to apply.</div>';
      return;
    }
    byId("searchResults").innerHTML = list.map(function (job) {
      return '<button class="list-row" data-select-job="' + job.id + '"><span class="tiny"><svg><use href="#i-briefcase"></use></svg></span><span class="grow"><b>' + job.title + '</b><br><span class="small">' + job.pay + ' - ' + job.city + ' - ' + job.distance + '</span></span><span class="status-text">Apply</span></button>';
    }).join("");
  }
  function renderWorkerApplications() {
    var allApps = state.applications.filter(function (a) { return a.workerId === state.worker.id; });
    var matchedApps = allApps.filter(function (a) { return ["Accepted","Matched"].indexOf(a.status) >= 0; });
    var appliedApps = allApps.filter(function (a) { return ["Interested","Viewed"].indexOf(a.status) >= 0; });
    var apps = applicationsTab === "matched" ? matchedApps : appliedApps;
    byId("matchedTag").textContent = matchedApps.length + " matched";
    var tabs = '<div class="toolbar"><button class="chip ' + (applicationsTab === "applied" ? "selected" : "") + '" data-applications-tab="applied">Applied</button><button class="chip ' + (applicationsTab === "matched" ? "selected" : "") + '" data-applications-tab="matched">Matched</button></div>';
    byId("workerApplications").innerHTML = tabs + (apps.length ? apps.map(function (app) {
      var job = state.jobs.find(function (j) { return j.id === app.jobId; }) || { title: "Job", employer: "Employer", pay: "", city: "" };
      var convo = conversationForApp(app);
      var statusText = applicationsTab === "matched" ? "Matched" : "Waiting for employer";
      var action = applicationsTab === "matched" ? '<button class="icon" data-remove-match="' + app.id + '"><svg><use href="#i-trash"></use></svg></button>' : '<button class="icon" data-withdraw-app="' + app.id + '"><svg><use href="#i-x"></use></svg></button>';
      return '<div class="list-row"><span class="tiny"><svg><use href="#i-briefcase"></use></svg></span><span class="grow"><b>' + job.title + '</b><br><span class="small">' + job.pay + ' - ' + job.city + '<br>Status: ' + statusText + '</span></span><span class="status-pill status-' + app.status.toLowerCase() + '">' + (applicationsTab === "matched" ? "Matched" : "Waiting") + '</span>' + (applicationsTab === "matched" && convo ? '<button class="icon" data-open-conversation="' + convo.id + '"><svg><use href="#i-message"></use></svg></button>' : '') + action + '</div>';
    }).join("") : '<div class="panel small">' + (applicationsTab === "matched" ? "No matched jobs yet." : "No applications yet. Swipe right on a job to apply.") + '</div>');
  }
  function appForSelected() { return state.applications.find(function (a) { return a.jobId === selectedJobId && a.workerId === selectedWorkerId; }); }
  function statusClass(status) { return "status-" + String(status || "Interested").toLowerCase(); }
  function renderApplicantCard(app) {
    var job = state.jobs.find(function (j) { return j.id === app.jobId; }) || { id: app.jobId, title: "Job" };
    var w = state.worker;
    var convo = conversationForApp(app);
    var pending = ["Interested","Viewed"].indexOf(app.status) >= 0;
    var actions = pending ? '<div class="applicant-actions"><button class="reject-btn" data-reject-app="' + app.id + '">X</button><button class="accept-btn" data-accept-app="' + app.id + '">Accept</button></div>' : '<div class="applicant-actions">' + (convo ? '<button class="accept-btn" data-open-conversation="' + convo.id + '">Chat</button>' : '') + '<button class="reject-btn" data-remove-accepted-app="' + app.id + '"><svg><use href="#i-trash"></use></svg></button></div>';
    return '<div class="list-row"><button class="grow" style="border:0;background:transparent;text-align:left;padding:0;color:inherit" data-open-worker="' + w.id + '" data-job-id="' + job.id + '"><b>' + w.name + '</b><br><span class="small">' + w.age + ' - ' + w.city + ' - ' + w.experience + '<br>' + w.skills.slice(0,3).join(", ") + '</span><div class="mt">' + workerPhotoBadgeHtml() + '</div></button><span class="status-pill ' + statusClass(app.status) + '">' + app.status + '</span>' + actions + '</div>';
  }
  function renderEmployer() {
    if (!hasEmployerProfile()) return;
    var apps = state.applications;
    var interested = apps.filter(function (a) { return ["Interested","Viewed"].indexOf(a.status) >= 0; }).length;
    var accepted = apps.filter(function (a) { return ["Accepted","Matched"].indexOf(a.status) >= 0; }).length;
    byId("dashTitle").textContent = interested ? interested + " applicants waiting" : "No applicants yet";
    byId("metricInterested").textContent = interested;
    byId("metricAccepted").textContent = accepted;
    byId("metricJobs").textContent = state.jobs.length;
    byId("dashJobs").innerHTML = (interested ? "" : '<div class="panel small">No applicants yet - boost your job to get more visibility.</div>') + state.jobs.slice(0,2).map(function (job) {
      var count = apps.filter(function (a) { return a.jobId === job.id; }).length;
      return '<button class="list-row" data-job-detail="' + job.id + '"><span class="tiny"><svg><use href="#i-briefcase"></use></svg></span><span class="grow"><b>' + job.title + '</b><br><span class="small">' + job.pay + ' - ' + job.city + '<br>12 workers viewed your job - 3 applied today</span></span><span class="status-text">' + count + ' applicants</span></button>';
    }).join("");
    var job = state.jobs.find(function (j) { return j.id === selectedJobId; }) || state.jobs[0];
    byId("jobDetailTitle").textContent = job.title;
    byId("jobDetailPay").textContent = job.pay;
    byId("jobDetailMeta").textContent = job.city + " - " + job.type + " - " + job.employer;
    var jobApps = apps.filter(function (a) { return a.jobId === job.id && (applicantsTab === "accepted" ? ["Accepted","Matched"].indexOf(a.status) >= 0 : ["Interested","Viewed"].indexOf(a.status) >= 0); });
    var applicantTabs = '<div class="toolbar"><button class="chip ' + (applicantsTab === "new" ? "selected" : "") + '" data-applicants-tab="new">New</button><button class="chip ' + (applicantsTab === "accepted" ? "selected" : "") + '" data-applicants-tab="accepted">Accepted</button></div>';
    byId("applicantList").innerHTML = applicantTabs + (jobApps.length ? jobApps.map(renderApplicantCard).join("") : '<div class="panel small">No applicants in this tab yet.</div>');
    var tabApps = apps.filter(function (a) { return applicantsTab === "accepted" ? ["Accepted","Matched"].indexOf(a.status) >= 0 : ["Interested","Viewed"].indexOf(a.status) >= 0; });
    byId("allApplicants").innerHTML = applicantTabs + (tabApps.length ? tabApps.map(renderApplicantCard).join("") : '<div class="panel small">No applicants in this tab yet.</div>');
    byId("talentCount").textContent = apps.length + " applicants";
    byId("employerJobsList").innerHTML = state.jobs.map(function (j) { return '<div class="list-row"><button class="grow" data-job-detail="' + j.id + '" style="border:0;background:transparent;text-align:left;color:inherit;padding:0"><b>' + j.title + '</b><br><span class="small">' + j.pay + ' - ' + j.city + '</span></button><span class="status-text">' + ((j.status || "approved") === "Expired" ? "Expired" : "Open") + '</span><button class="icon" data-repost-job="' + j.id + '"><svg><use href="#i-plus"></use></svg></button><button class="icon" data-delete-job="' + j.id + '"><svg><use href="#i-trash"></use></svg></button></div>'; }).join("");
  }
  function renderFullWorkerProfile() {
    var w = state.worker;
    var app = appForSelected() || { status: "Interested" };
    var badges = workerBadges().map(function (b) { return '<span class="badge ' + b.className + '">' + b.label + '</span>'; }).join("");
    byId("profileStatus").textContent = app.status;
    byId("profileStatus").className = "tag";
    byId("fullWorkerProfile").innerHTML =
      '<div class="panel"><div class="toolbar">' + badges + workerPhotoBadgeHtml() + '</div><h1 class="title mt">' + w.name + '</h1><p class="sub">' + w.bio + '</p></div>' +
      '<div class="panel"><div class="kv"><span>Age</span><b>' + w.age + '</b></div><div class="kv"><span>City</span><b>' + w.city + '</b></div><div class="kv"><span>Experience</span><b>' + w.experience + '</b></div><div class="kv"><span>Availability</span><b>' + w.availability + '</b></div><div class="kv"><span>Preferred type</span><b>' + w.preferredType + '</b></div></div>' +
      '<div class="panel"><b>Skills</b><div class="toolbar">' + w.skills.map(function (s) { return '<span class="badge blue">' + s + '</span>'; }).join("") + '</div></div>';
  }
  function renderEmployerProfile() {
    if (!byId("employerProfileName")) return;
    var business = currentBusinessProfile();
    byId("employerProfileName").textContent = business ? business.businessName : "Employer Profile";
    byId("employerProfileMeta").textContent = business ? (business.city || state.user.city || "Location") : "Business profile not set";
    if (byId("employerAvatar")) byId("employerAvatar").textContent = initials(business ? business.businessName : state.user.displayName);
    if (byId("employerBusinessText")) byId("employerBusinessText").textContent = business ? business.businessName : "Set up your business profile";
    if (byId("employerContactText")) byId("employerContactText").textContent = business ? business.contactPersonName : (state.user.displayName || "Contact person");
    if (byId("employerLocationText")) byId("employerLocationText").textContent = "Based in " + (business ? (business.city || state.user.city || "your city") : (state.user.city || "your city"));
    if (byId("employerTypeText")) byId("employerTypeText").textContent = business ? (business.type || "Business") : "Not set";
    if (byId("employerProfileBadges")) {
      var createdAt = business ? (business.createdAt || Date.now()) : Date.now();
      var ageDays = (Date.now() - createdAt) / 86400000;
      var badge = ageDays > 180 ? "Verified Employer" : (ageDays > 90 ? "Trusted" : (ageDays > 30 ? "Active" : "New Employer"));
      byId("employerProfileBadges").innerHTML = '<span class="badge blue">' + badge + '</span><span class="badge">Phone Verified</span>';
    }
    byId("employerOpenJobsView").textContent = state.jobs.length;
    if (byId("employerApplicantStatsView")) byId("employerApplicantStatsView").textContent = state.applications.length;
  }
  function renderAccountSettings() {
    var phone = state.user.phone || state.employer.phone || "";
    var displayName = state.user.displayName || state.worker.name || "Kaam Karo user";
    var city = state.user.city || state.worker.city || "";
    if (byId("drawerName")) byId("drawerName").textContent = displayName;
    if (byId("drawerPhone")) byId("drawerPhone").textContent = phone ? ("+91 " + phone) : "Secure phone login";
    if (!byId("accountNameView")) return;
    byId("accountNameView").textContent = displayName;
    byId("accountLocationView").textContent = city || "Add location";
    byId("accountPhone").textContent = phone ? ("+91 " + phone) : "Not added";
    var workerActive = hasWorkerProfile();
    var employerActive = hasEmployerProfile();
    byId("workerAccountStatus").textContent = workerActive ? "Active" : "Not set up";
    byId("employerAccountStatus").textContent = employerActive ? "Active" : "Not set up";
    if (byId("accountModeLine")) byId("accountModeLine").textContent = currentRole === "employer" ? "Employer" : "Worker";
    var deleteButton = byId("deleteAccountBtn");
    if (deleteButton) deleteButton.disabled = true;
    if (byId("deleteConfirmPhone")) byId("deleteConfirmPhone").value = "";
    if (byId("deletePhoneError")) byId("deletePhoneError").textContent = "";
  }
  function saveAccountSettings() {
    var name = byId("accountName").value.trim() || state.user.displayName || state.worker.name;
    var city = byId("accountLocation").value.trim() || state.user.city || state.worker.city;
    state.user.displayName = name;
    state.user.city = city;
    state.user.location = city;
    state.worker.name = name;
    state.worker.city = city;
    if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) {
      state.workerProfiles[state.defaultWorkerId].name = name;
      state.workerProfiles[state.defaultWorkerId].city = city;
      state.workerProfiles[state.defaultWorkerId].location = city;
      state.workerProfiles[state.defaultWorkerId].updatedAt = Date.now();
    }
    state.employer.name = name;
    state.employer.city = city;
    if (state.defaultBusinessId && state.businessProfiles[state.defaultBusinessId]) {
      state.businessProfiles[state.defaultBusinessId].contactPersonName = name;
      state.businessProfiles[state.defaultBusinessId].city = city;
    }
    save();
    render();
    toast("Account updated.");
  }
  function profileEditConfig(field) {
    var business = currentBusinessProfile();
    var configs = {
      accountName: { title: "Edit Name", label: "Name", value: state.user.displayName || state.worker.name || "", hint: "Used across profile, chat and employer contact.", type: "text" },
      accountLocation: { title: "Location", label: "Search city or area", value: state.user.city || state.worker.city || "", hint: "Choose the area used across Kaam Karo.", type: "location" },
      workerLocation: { title: "Location", label: "Search city or area", value: state.worker.city || state.user.city || "", hint: "Choose your work city", type: "location", suggestions: ["Delhi","Amritsar","Pune","Kochi","Surat","Tiruchirappalli","Karimnagar","Mumbai","Bengaluru","Hyderabad","Chandigarh","Jaipur"] },
      workerSkills: { title: "Edit Skills", label: "Type a skill", value: "", hint: "Keep selected skills visible and controlled.", type: "skills" },
      workerExperience: { title: "Experience", label: "Experience", value: state.worker.experience || "", hint: "Select one option.", type: "experience" },
      workerWork: { title: "Work Preferences", label: "Work preferences", value: "", hint: "Select the work types that fit you.", type: "work" },
      workerAvailability: { title: "Availability", label: "Availability", value: "", hint: "Select days and preferred shift.", type: "availability" },
      businessName: { title: "Edit Business Name", label: "Business name", value: business ? business.businessName : state.employer.business, hint: "Shown to workers on jobs and chat.", type: "text" },
      contactPerson: { title: "Edit Contact Person", label: "Contact person", value: business ? business.contactPersonName : state.employer.name, hint: "Used as the hiring contact.", type: "text" },
      employerLocation: { title: "Location", label: "Search city or area", value: business ? business.city : state.user.city, hint: "Choose the default hiring location.", type: "location" },
      businessType: { title: "Edit Business Type", label: "Business type", value: business ? business.type : state.employer.type, hint: "Example: Retail Shop, Office, Restaurant.", type: "text" }
    };
    return configs[field] || configs.accountName;
  }
  function markEditDirty() {
    editDirty = true;
    if (byId("profileEditSaveTop")) byId("profileEditSaveTop").disabled = false;
  }
  function openProfileEdit(field) {
    editingProfileField = field;
    var cfg = profileEditConfig(field);
    menuReturn = currentScreen;
    editDirty = false;
    editDraft = { value: cfg.value || "" };
    if (cfg.type === "skills") editDraft.skills = (state.worker.skills || []).slice();
    if (cfg.type === "work") editDraft.workTypes = (state.worker.workTypes || ["Full-time","Part-time"]).slice();
    if (cfg.type === "availability") {
      editDraft.days = (state.worker.availableDays || ["Monday","Tuesday","Friday"]).slice();
      editDraft.shift = state.worker.shiftPreference || "Morning";
      editDraft.start = state.worker.startAvailability || "Immediate";
    }
    byId("profileEditTitle").textContent = cfg.title;
    byId("profileEditHint").textContent = cfg.hint;
    show("profileEdit");
  }
  function renderProfileEdit() {
    if (!byId("profileEditBody")) return;
    var cfg = profileEditConfig(editingProfileField);
    if (byId("profileEditSaveTop")) byId("profileEditSaveTop").disabled = !editDirty;
    if (!editingProfileField) return;
    var body = byId("profileEditBody");
    if (cfg.type === "skills") {
      var suggested = ["Cleaning","Driving","Customer Service","Data Entry","Excel","Inventory Handling","Food Service","Basic Accounting","Communication","Sales","Packing","Warehouse Work"];
      body.innerHTML =
        '<div class="edit-card"><div class="section-label">Your Skills</div><div class="edit-chip-row">' + (editDraft.skills || []).map(function (skill) { return '<button class="edit-chip selected skill-remove" data-edit-remove-skill="' + skill + '">' + skill + '<span>x</span></button>'; }).join("") + '</div></div>' +
        '<div class="edit-card"><label>Add Skills</label><div class="input"><input id="profileEditInput" placeholder="Type a skill"></div><button class="btn outline mt" data-edit-add-skill>+ Add Skill</button></div>' +
        '<div class="edit-card"><div class="section-label">Suggested Skills</div><div class="edit-chip-row">' + suggested.map(function (skill) { return '<button class="edit-chip ' + ((editDraft.skills || []).indexOf(skill) >= 0 ? "selected" : "") + '" data-edit-suggest-skill="' + skill + '">' + skill + '</button>'; }).join("") + '</div></div>';
      return;
    }
    if (cfg.type === "experience") {
      var exp = ["No experience","Less than 1 year","1-2 years","2-5 years","5+ years"];
      body.innerHTML = '<div class="edit-card">' + exp.map(function (item) { var selected = editDraft.value === item || (!editDraft.value && item === "No experience"); return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-option="' + item + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + item + '</button>'; }).join("") + '</div>';
      return;
    }
    if (cfg.type === "work") {
      var types = ["Full-time","Part-time","Contract","Temporary","Internship"];
      body.innerHTML = '<div class="edit-card">' + types.map(function (item) { var selected = (editDraft.workTypes || []).indexOf(item) >= 0; return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-work="' + item + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + item + '</button>'; }).join("") + '</div>';
      return;
    }
    if (cfg.type === "availability") {
      var days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      var shifts = ["Morning","Afternoon","Evening"];
      var starts = ["Immediate","On Demand","Specific Date"];
      var allSelected = days.every(function (day) { return (editDraft.days || []).indexOf(day) >= 0; });
      body.innerHTML =
        '<div class="edit-card"><div class="section-label">Start Availability</div>' + starts.map(function (start) { var selected = editDraft.start === start; return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-start="' + start + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + start + '</button>'; }).join("") + '</div>' +
        '<div class="edit-card"><div class="section-label">Days</div><button class="option-row ' + (allSelected ? "selected" : "") + '" data-edit-all-days><span class="option-dot">' + (allSelected ? "OK" : "") + '</span>Select All Days</button><div class="grid mt">' + days.map(function (day) { var selected = (editDraft.days || []).indexOf(day) >= 0; return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-day="' + day + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + day + '</button>'; }).join("") + '</div></div>' +
        '<div class="edit-card"><div class="section-label">Shift preference</div>' + shifts.map(function (shift) { var selected = editDraft.shift === shift; return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-shift="' + shift + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + shift + '</button>'; }).join("") + '</div>';
      return;
    }
    if (cfg.type === "location") {
      var suggestions = locationMatches(editDraft.value || "");
      body.innerHTML =
        '<div class="edit-card"><label>' + cfg.label + '</label><div class="input"><input id="profileEditInput" placeholder="City, district, state" value="' + (editDraft.value || "") + '" data-location-input="profileEdit"></div></div>' +
        '<div class="edit-card"><div class="section-label">Suggestions</div>' + suggestions.map(function (loc) { return '<button class="option-row ' + (editDraft.value === loc.formatted_location ? "selected" : "") + '" data-edit-location="' + loc.place_id + '"><span class="option-dot">' + (editDraft.value === loc.formatted_location ? "OK" : "") + '</span>' + loc.formatted_location + '</button>'; }).join("") + '</div>';
      return;
    }
    body.innerHTML = '<div class="edit-card"><label>' + cfg.label + '</label><div class="input"><input id="profileEditInput" placeholder="Type here" value="' + (editDraft.value || "") + '"></div></div>';
  }
  function saveProfileEdit() {
    var input = byId("profileEditInput");
    var value = input ? input.value.trim() : (editDraft.value || "");
    var business = currentBusinessProfile();
    var cfg = profileEditConfig(editingProfileField);
    var selectedEditLocation = cfg.type === "location" ? (editDraft.location || selectedLocationFromInput(value)) : null;
    if (cfg.type === "location" && !selectedEditLocation) return toast("Please select a valid city or area from the list.");
    if (cfg.type !== "skills" && cfg.type !== "availability" && cfg.type !== "work" && !value) return toast("Please add a value.");
    if (editingProfileField === "accountName") {
      state.user.displayName = value;
      state.worker.name = value;
      state.employer.name = value;
      if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) state.workerProfiles[state.defaultWorkerId].name = value;
      if (business) business.contactPersonName = value;
    }
    if (editingProfileField === "accountLocation") {
      applyStructuredLocation("accountLocation", selectedEditLocation);
    }
    if (editingProfileField === "workerLocation") {
      applyStructuredLocation("user", selectedEditLocation);
      applyStructuredLocation("worker", selectedEditLocation);
    }
    if (editingProfileField === "workerSkills") state.worker.skills = (editDraft.skills || []).slice();
    if (editingProfileField === "workerExperience") state.worker.experience = value;
    if (editingProfileField === "workerWork") {
      state.worker.workTypes = (editDraft.workTypes || []).slice();
      state.worker.preferredJob = state.worker.workTypes.join(", ");
    }
    if (editingProfileField === "workerAvailability") {
      state.worker.availableDays = (editDraft.days || []).slice();
      state.worker.shiftPreference = editDraft.shift || "Morning";
      state.worker.startAvailability = editDraft.start || "Immediate";
      state.worker.availability = workerAvailabilityLine();
    }
    if (editingProfileField === "businessName") { state.employer.business = value; if (business) business.businessName = value; }
    if (editingProfileField === "contactPerson") { state.employer.name = value; state.user.displayName = value; if (business) business.contactPersonName = value; }
    if (editingProfileField === "employerLocation") { applyStructuredLocation("user", selectedEditLocation); applyStructuredLocation("employer", selectedEditLocation); }
    if (editingProfileField === "businessType") { state.employer.type = value; if (business) business.type = value; }
    save();
    toast("Updated successfully");
    show(menuReturn || (currentRole === "employer" ? "employerProfile" : "profile"));
  }
  function renderAdminQueue() {
    if (!hasEmployerProfile() && currentScreen !== "adminModeration") return;
    if (!byId("adminQueue")) return;
    var pending = state.jobs.filter(function (job) { return job.status === "pending_review"; }).sort(function (a, b) { return (b.riskScore || 0) - (a.riskScore || 0); });
    byId("adminPendingCount").textContent = pending.length + " pending";
    byId("adminQueue").innerHTML = pending.length ? pending.map(function (job) {
      return '<div class="panel"><div class="review-row"><span>Risk</span><b class="risk-score">' + (job.riskScore || 0) + '</b></div><h3>' + job.title + '</h3><p class="small">' + job.pay + ' - ' + job.city + ' - ' + job.type + '</p><p class="review-desc">' + job.desc + '</p><div class="kv"><span>Employer</span><b>' + job.employer + '</b></div><div class="kv"><span>Verification</span><b>' + (state.employer.phone ? "Phone verified" : "New") + '</b></div><div class="kv"><span>Previous posts</span><b>' + (job.previousPosts || 0) + '</b></div><div class="kv"><span>Reports</span><b>' + (job.reportCount || 0) + '</b></div><div class="flag-list">' + (job.flagReasons || []).map(function (r) { return '<span class="badge amber">' + r + '</span>'; }).join("") + '</div><div class="admin-actions"><button class="btn primary" data-admin-action="approve" data-job-id="' + job.id + '">Approve</button><button class="btn danger" data-admin-action="reject" data-job-id="' + job.id + '">Reject</button><button class="btn outline" data-admin-action="request_edit" data-job-id="' + job.id + '">Request Edit</button><button class="btn outline" data-admin-action="suspend" data-job-id="' + job.id + '">Suspend</button><button class="btn danger" data-admin-action="ban" data-job-id="' + job.id + '">Ban</button></div></div>';
    }).join("") : '<div class="panel small">No jobs waiting for review.</div>';
    byId("auditLogs").innerHTML = state.auditLogs.length ? state.auditLogs.slice(0, 8).map(function (log) {
      return '<div class="list-row"><span class="tiny"><svg><use href="#i-shield"></use></svg></span><span class="grow"><b>' + log.action + '</b><br><span class="small">' + log.reason + '<br>' + new Date(log.timestamp).toLocaleString() + '</span></span></div>';
    }).join("") : '<div class="panel small">No audit logs yet.</div>';
  }
  function chatAllowed(app) { return app && ["Accepted","Matched","Hired"].indexOf(app.status) >= 0; }
  function conversationForApp(app) { return app ? state.conversations.find(function (c) { return c.jobId === app.jobId && c.workerId === app.workerId; }) : null; }
  function isChatHidden(convo) {
    var list = currentRole === "employer" ? (convo.deletedForEmployer || []) : (convo.deletedForWorker || []);
    return list.indexOf(currentUserId()) >= 0;
  }
  function createConversation(app) {
    var existing = conversationForApp(app);
    if (existing) return existing;
    var job = state.jobs.find(function (j) { return j.id === app.jobId; }) || state.jobs[0];
    var now = Date.now();
    var starter = "Employer accepted your interest. You can now chat directly.";
    var convo = { id: "conv-" + now, jobId: app.jobId, workerId: app.workerId, employerId: "rick", status: "active", createdAt: now, updatedAt: now, lastActivityAt: now, lastMessage: starter, unreadWorker: 1, unreadEmployer: 0, favouriteWorker: false, favouriteEmployer: false, deletedForWorker: [], deletedForEmployer: [] };
    state.conversations.unshift(convo);
    state.messages.push({ id: "msg-" + now + "-system", conversationId: convo.id, senderId: "rick", text: starter, createdAt: now, status: "delivered", deliveryStatus: "delivered", flaggedRisk: false });
    app.status = "Matched";
    notify((state.employer.name || "Employer") + " accepted your application - start chat.", "chat");
    audit("conversation_created", "Employer accepted applicant", job, "system");
    save();
    return convo;
  }
  function currentConversation() { return selectedConversationId ? state.conversations.find(function (c) { return c.id === selectedConversationId; }) : null; }
  function conversationTitle(convo) {
    var job = state.jobs.find(function (j) { return j.id === convo.jobId; }) || state.jobs[0];
    return currentRole === "employer" ? state.worker.name : (state.employer.name || job.employer);
  }
  function riskText(text) {
    return ["registration fee","deposit","pay first","joining fee","send money","documents charge"].some(function (term) { return text.toLowerCase().indexOf(term) >= 0; });
  }
  function blockedSafetyReason(text) {
    var value = String(text || "").toLowerCase();
    var rules = [
      { reason: "weapons", words: ["weapon","gun","pistol","knife","bomb","explosive"] },
      { reason: "drugs", words: ["drug","cocaine","heroin","ganja","narcotic"] },
      { reason: "sexual content", words: ["sex","sexual","prostitution","escort","adult service"] },
      { reason: "harassment", words: ["harass","threat","kill","abuse","hate"] },
      { reason: "scam or payment request", words: ["registration fee","deposit","pay first","joining fee","send money"] },
      { reason: "illegal work", words: ["illegal","fake document","money laundering","betting"] }
    ];
    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i].words.some(function (word) { return value.indexOf(word) >= 0; })) return rules[i].reason;
    }
    return "";
  }
  function currentUserId() {
    return currentRole === "employer" ? "rick" : state.worker.id;
  }
  function messageSenderId(message) {
    if (message.senderId === "system" && String(message.text || "").indexOf("Employer accepted your interest") === 0) return "rick";
    return message.senderId;
  }
  function messageStatus(message) {
    return message.deliveryStatus || message.status || "sent";
  }
  function isSameDay(a, b) {
    var da = new Date(a);
    var db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  }
  function clockLabel(time) {
    var d = new Date(time);
    var hours = d.getHours();
    var suffix = hours >= 12 ? "pm" : "am";
    var hour12 = hours % 12 || 12;
    return String(hour12).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + " " + suffix;
  }
  function dayDiff(time) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var date = new Date(time);
    var start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return Math.round((today - start) / 86400000);
  }
  function dateSeparatorLabel(time) {
    var diff = dayDiff(time);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    var d = new Date(time);
    var label = d.getDate() + " " + d.toLocaleString("en", { month: "short" });
    if (d.getFullYear() !== new Date().getFullYear()) label += " " + d.getFullYear();
    return label;
  }
  function messageTimeLabel(time) {
    var diff = dayDiff(time);
    if (diff === 0) return clockLabel(time);
    if (diff === 1) return "Yesterday, " + clockLabel(time);
    return dateSeparatorLabel(time) + ", " + clockLabel(time);
  }
  function escapeHtml(text) {
    return String(text || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function renderMessageText(text) {
    return escapeHtml(text)
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\b(\d{10})\b/g, '<a href="tel:$1">$1</a>');
  }
  function renderChatMessages(convo, messages) {
    if (!messages.length) return '<div class="panel center"><p class="small">No messages yet<br>Start the conversation.</p></div>';
    return messages.map(function (message, index) {
      var prev = messages[index - 1];
      var next = messages[index + 1];
      var sender = messageSenderId(message);
      var mine = sender === currentUserId();
      var prevSame = prev && messageSenderId(prev) === sender && isSameDay(prev.createdAt, message.createdAt) && Math.abs(message.createdAt - prev.createdAt) <= 300000;
      var nextSame = next && messageSenderId(next) === sender && isSameDay(next.createdAt, message.createdAt) && Math.abs(next.createdAt - message.createdAt) <= 300000;
      var html = "";
      if (!prev || !isSameDay(prev.createdAt, message.createdAt)) html += '<div class="date-sep">' + dateSeparatorLabel(message.createdAt) + '</div>';
      var meta = !nextSame ? '<small>' + messageTimeLabel(message.createdAt) + (mine ? ' &middot; ' + messageStatus(message) : '') + '</small>' : '';
      html += '<div class="msg ' + (mine ? "right" : "left") + (prevSame ? " tight" : "") + ((prevSame || nextSame) ? " mid" : "") + '">' + renderMessageText(message.text) + (message.flaggedRisk ? '<br><b>Warning: Never pay money to get a job.</b>' : '') + meta + '</div>';
      return html;
    }).join("");
  }
  function renderChatList(convos) {
    byId("chat").classList.add("chat-no-composer");
    document.querySelector("#chat .quick").style.display = "none";
    document.querySelector("#chat .chat-input").style.display = "none";
    byId("chatTitle").textContent = "Chat";
    byId("chatSub").textContent = convos.length ? convos.length + " matched conversations" : "No conversations yet";
    convos = convos.filter(function (convo) { return !isChatHidden(convo); });
    if (chatListTab === "favourite") convos = convos.filter(function (convo) { return currentRole === "employer" ? convo.favouriteEmployer : convo.favouriteWorker; });
    var tabs = '<div class="toolbar"><button class="chip ' + (chatListTab === "all" ? "selected" : "") + '" data-chat-tab="all">All</button><button class="chip ' + (chatListTab === "favourite" ? "selected" : "") + '" data-chat-tab="favourite">Favourite</button></div>';
    if (!convos.length) {
      var cta = currentRole === "employer" ? '<button class="btn primary" data-go="applicants">View applicants</button><button class="btn outline mt" data-go="postJob">Post job</button>' : '<button class="btn primary" data-go="jobs">Find jobs</button>';
      byId("chatArea").innerHTML = tabs + '<div class="panel center"><h2>No conversations yet</h2><p class="small">Apply to jobs or accept applicants to start chatting.</p>' + cta + '</div>';
      return;
    }
    byId("chatArea").innerHTML = tabs + convos.map(function (convo) {
      var job = state.jobs.find(function (j) { return j.id === convo.jobId; }) || state.jobs[0];
      var unread = currentRole === "employer" ? convo.unreadEmployer : convo.unreadWorker;
      var status = convo.status === "hired" ? "Hired" : convo.status === "blocked" ? "Closed" : "Matched";
      var isFavourite = currentRole === "employer" ? !!convo.favouriteEmployer : !!convo.favouriteWorker;
      var fav = chatListTab === "all" ? '<button class="icon ' + (isFavourite ? "star-active" : "") + '" data-favourite-chat="' + convo.id + '">&#9733;</button>' : "";
      return '<div class="list-row conversation-row"><button class="grow" data-open-conversation="' + convo.id + '" style="border:0;background:transparent;text-align:left;color:inherit;padding:0"><b>' + conversationTitle(convo) + '</b><br><span class="small">' + job.title + ' - ' + job.city + '<br>' + (convo.lastMessage || "Start chat") + '</span></button><span><span class="badge blue">' + status + '</span>' + (unread ? '<span class="unread">' + unread + '</span>' : '') + '</span>' + fav + '<button class="icon" data-delete-chat="' + convo.id + '"><svg><use href="#i-trash"></use></svg></button></div>';
    }).join("");
  }
  function renderActiveChat(convo) {
    byId("chat").classList.toggle("chat-no-composer", convo.status === "blocked");
    var job = state.jobs.find(function (j) { return j.id === convo.jobId; }) || state.jobs[0];
    var status = convo.status === "hired" ? "Hired" : convo.status === "blocked" ? "Closed" : "Matched";
    byId("chatTitle").textContent = conversationTitle(convo);
    byId("chatSub").textContent = job.title + " - " + status;
    convo.lastActivityAt = Date.now();
    if (currentRole === "employer") convo.unreadEmployer = 0; else convo.unreadWorker = 0;
    save();
    var msgs = state.messages.filter(function (m) { return m.conversationId === convo.id; });
    var area = byId("chatArea");
    var wasAtBottom = !area || area.scrollHeight - area.scrollTop - area.clientHeight < 48;
    var ratingPrompt = convo.status === "hired" && !hasSubmittedRating(convo) ? '<button class="btn outline" data-open-rating>Leave a rating and feedback</button>' : '';
    area.innerHTML = renderChatMessages(convo, msgs) + (currentRole === "employer" && convo.status !== "hired" && convo.status !== "blocked" ? '<button class="btn outline" data-mark-hired>Mark as Hired</button>' : '') + (convo.status === "hired" ? '<button class="btn outline" data-hire-again>Hire Again</button>' + ratingPrompt : '') + (convo.status === "blocked" ? '<div class="panel small">This chat is blocked/closed. Messages are disabled.</div>' : '');
    var quicks = currentRole === "employer" ? ["Can you join tomorrow?","Please share experience","Come for interview","Share availability"] : ["I am available","Available today","Can start immediately","What are the timings?","Please share location","What is the salary?"];
    document.querySelector("#chat .quick").style.display = convo.status === "blocked" ? "none" : "flex";
    document.querySelector("#chat .quick").innerHTML = quicks.map(function (q) { return '<button data-quick="' + q + '">' + q + '</button>'; }).join("");
    document.querySelector("#chat .chat-input").style.display = convo.status === "blocked" ? "none" : "flex";
    if (wasAtBottom) area.scrollTop = area.scrollHeight;
    else area.insertAdjacentHTML("beforeend", '<button class="new-msg-indicator" data-scroll-chat-bottom>New messages down</button>');
  }
  function renderChat() {
    if (!byId("chatSafety")) return;
    byId("chatSafety").innerHTML = currentRole === "employer" ? 'Never pay money upfront to hire someone. <button data-report="chat">Report</button> suspicious messages.' : 'Never pay money to get a job. <button data-report="chat">Report</button> suspicious messages.';
    var convo = currentConversation();
    if (convo) renderActiveChat(convo); else renderChatList(state.conversations.filter(function (c) { return c.status !== "closed"; }));
  }
  function sendChatMessage(text) {
    var convo = currentConversation();
    if (!convo) return toast("Chat unlocks after employer accepts.");
    if (convo.status === "blocked") return toast("This chat is blocked.");
    if ((state.blockedPairs || []).some(function (pair) { return pair.conversationId === convo.id; })) return toast("This match is disconnected.");
    var blockedReason = blockedSafetyReason(text);
    if (blockedReason) {
      state.moderationLogs.unshift({ senderId: currentUserId(), receiverId: currentRole === "employer" ? convo.workerId : convo.employerId, chatId: convo.id, messageText: text, reason: blockedReason, createdAt: new Date().toISOString() });
      var count = state.moderationLogs.filter(function (log) { return log.senderId === currentUserId(); }).length;
      save();
      openModal("Message blocked for safety", '<p class="small">This message may break Kaam Karo safety rules. Please edit it before sending.</p>' + (count >= 3 ? '<p class="small"><b>Repeated unsafe messages may lead to account restriction.</b></p>' : '') + '<button class="btn primary mt" data-close-modal>Edit Message</button>');
      return;
    }
    var flagged = riskText(text);
    var msg = { id: "msg-" + Date.now(), conversationId: convo.id, senderId: currentRole === "employer" ? "rick" : state.worker.id, text: text, createdAt: Date.now(), status: "sent", deliveryStatus: "sent", flaggedRisk: flagged };
    state.messages.push(msg);
    convo.lastMessage = text;
    convo.updatedAt = Date.now();
    convo.lastActivityAt = Date.now();
    if (currentRole === "employer") convo.unreadWorker += 1; else convo.unreadEmployer += 1;
    if (flagged) {
      notify("Suspicious message detected - review safety warning.", "chat");
      toast("Warning: Never pay money to get a job.");
    } else if (currentRole === "worker") {
      setTimeout(function () { notify("New message from " + (state.employer.name || "employer") + ".", "chat"); toast("New message from employer"); }, 700);
    }
    save();
    renderChat();
    setTimeout(function () { msg.status = "delivered"; msg.deliveryStatus = "delivered"; save(); renderChat(); }, 500);
    setTimeout(function () { msg.status = "seen"; msg.deliveryStatus = "seen"; save(); renderChat(); }, 1400);
  }
  function profileComplete() {
    return !!(state.worker.name && state.worker.city && state.worker.preferredJob && state.worker.skills.length);
  }
  function workerBadges() {
    var badges = [];
    if (profileComplete()) badges.push({ label: "Profile Complete", className: "blue" });
    if (state.applications.some(function (a) { return a.workerId === state.worker.id; }) || state.worker.active) badges.push({ label: "Active", className: "amber" });
    return badges.slice(0, 3);
  }
  function setApplicationStatus(appId, status) {
    var app = state.applications.find(function (a) { return a.id === appId; }) || appForSelected();
    if (!app) return;
    app.status = status;
    selectedJobId = app.jobId;
    selectedWorkerId = app.workerId;
    var convo = null;
    if (status === "Accepted") {
      convo = createConversation(app);
      selectedConversationId = convo.id;
    }
    save();
    render();
    if (status === "Accepted") {
      toast("Matched. Chat is open.");
      track("employer_accept_match");
      show("chat");
    } else {
      toast("Application rejected.");
      track("employer_reject");
    }
  }
  function renderNavs() {
    function nav(target, icon, label, activeScreens) {
      return '<button class="' + (activeScreens.indexOf(currentScreen) >= 0 ? "active" : "") + '" data-go="' + target + '"><b><svg><use href="#' + icon + '"></use></svg></b>' + label + '</button>';
    }
    var unread = state.conversations.reduce(function (sum, c) { return sum + (currentRole === "employer" ? c.unreadEmployer : c.unreadWorker); }, 0);
    var chatLabel = 'Chat' + (unread ? '<span class="nav-badge">' + unread + '</span>' : '');
    var worker = nav("jobs", "i-home", "Home", ["jobs", "applied", "search"]) + nav("applications", "i-briefcase", "Applications", ["applications"]) + nav("chat", "i-message", chatLabel, ["chat"]) + nav("profile", "i-user", "Profile", ["profile", "accountSettings", "profileEdit", "legal", "report", "notifications"]);
    var employer = nav("employerDash", "i-home", "Dashboard", ["employerDash", "employerJobs", "employerJobDetail", "postJob", "jobVisibility", "published"]) + nav("applicants", "i-briefcase", "Applicants", ["applicants", "workerProfileView"]) + nav("chat", "i-message", chatLabel, ["chat"]) + nav("employerProfile", "i-user", "Profile", ["employerProfile", "accountSettings", "profileEdit", "legal", "report", "notifications"]);
    var navScreens = navScreenIds();
    if (byId("bottomNav")) {
      byId("bottomNav").innerHTML = currentRole === "employer" ? employer : worker;
      byId("bottomNav").style.display = navScreens.indexOf(currentScreen) >= 0 ? "grid" : "none";
    }
    var app = document.querySelector(".app");
    if (app) app.classList.toggle("has-bottom-nav", navScreens.indexOf(currentScreen) >= 0);
  }
  function renderLegal() {
    var item = legal[currentLegal] || legal.terms;
    byId("legalTitle").textContent = item[0];
    byId("legalBody").innerHTML = '<p>' + item[1] + '</p><div class="policy-links"><a href="legal/terms-and-conditions.html" target="_blank" rel="noopener">Terms</a><a href="legal/privacy-policy.html" target="_blank" rel="noopener">Privacy</a><a href="legal/refund-policy.html" target="_blank" rel="noopener">Refund</a><a href="legal/acceptable-use-policy.html" target="_blank" rel="noopener">Acceptable Use</a></div>';
  }
  function renderNotifications() {
    if (!byId("notificationList")) return;
    byId("notificationList").innerHTML = state.notifications.length ? state.notifications.map(function (n) {
      return '<button class="list-row" data-go="' + (n.target || "jobs") + '"><span class="tiny"><svg><use href="#i-bell"></use></svg></span><span class="grow"><b>' + n.text + '</b><br><span class="small">' + new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</span></span>' + (!n.read ? '<span class="badge amber">New</span>' : '') + '</button>';
    }).join("") : '<div class="panel small">No notifications yet.</div>';
  }
  function renderJobReview() {
    if (!byId("reviewTitle")) return;
    var title = byId("postTitle").value.trim() || "Job title";
    var pay = getPostPayDisplay() || "Pay not added";
    var city = byId("postLocation").value.trim() || "Location not added";
    var type = byId("postType").value || "Full-time";
    var desc = byId("postDesc").value.trim() || "Description preview will appear here.";
    byId("reviewTitle").textContent = title;
    byId("reviewPay").textContent = pay;
    byId("reviewLocation").textContent = city;
    byId("reviewType").textContent = type;
    byId("reviewDesc").textContent = desc.length > 110 ? desc.slice(0, 110) + "..." : desc;
    if (byId("publishJobBtn")) byId("publishJobBtn").disabled = !postVisibility;
  }
  function renderPublished() {
    if (!byId("publishedTitle")) return;
    var job = state.jobs[0];
    if (job && job.status === "pending_review") {
      byId("publishedTitle").textContent = "Sent for review";
      byId("publishedSub").textContent = "This job will go live after Kaam Karo approves it.";
    } else {
      byId("publishedTitle").textContent = "Job is live";
      byId("publishedSub").textContent = "Workers can now apply. Applicants will appear in your dashboard.";
    }
  }
  function getPostPayDisplay() {
    var amount = byId("postPayAmount").value.trim();
    var period = byId("postPayPeriod").value;
    return amount && period ? "Rs " + amount + " " + period : "";
  }
  function employerPostCount() {
    return state.jobs.filter(function (job) { return job.businessId === state.defaultBusinessId; }).length;
  }
  function analyzeJobDraft(draft) {
    var text = [
      draft.title,
      draft.desc,
      (currentBusinessProfile() && currentBusinessProfile().businessName) || "",
      draft.city,
      draft.pay,
      byId("postType").value || ""
    ].join(" ").toLowerCase();
    var reasons = [];
    var rejected = false;
    moderationRules.prohibited.forEach(function (rule) {
      if (rule.words.some(function (word) { return text.indexOf(word) >= 0; })) {
        rejected = true;
        if (reasons.indexOf(rule.reason) < 0) reasons.push(rule.reason);
      }
    });
    moderationRules.suspicious.forEach(function (rule) {
      if (rule.words.some(function (word) { return text.indexOf(word) >= 0; }) && reasons.indexOf(rule.reason) < 0) reasons.push(rule.reason);
    });
    var amount = Number((byId("postPayAmount").value || "").replace(/[^\d]/g, ""));
    if (amount && amount > 80000 && draft.desc.length < 80) reasons.push("Very high pay with vague work");
    if (employerPostCount() < 3) reasons.push("First 3 employer jobs require manual review");
    return { rejected: rejected, reasons: reasons, riskScore: reasons.length * 20 + (rejected ? 60 : 0) };
  }
  function render() {
    [
      applyCopy,
      renderAppHeader,
      fillBasicDefaults,
      renderCategories,
      renderSkills,
      renderOnboardingAvailability,
      renderPayPrefs,
      renderPhotoStatus,
      renderPhotoBadge,
      renderNavs,
      function () { if (byId("jobFeed")) renderFeed(); },
      function () { if (byId("searchResults")) renderSearch(); },
      function () { if (byId("workerApplications")) renderWorkerApplications(); },
      renderEmployer,
      renderFullWorkerProfile,
      renderEmployerProfile,
      renderAccountSettings,
      renderProfileEdit,
      renderAdminQueue,
      renderChat,
      renderLegal,
      renderNotifications,
      renderJobReview,
      renderPostDescCounter,
      expireInactiveMatches,
      renderHeroDynamicCard,
      renderPublished,
      function () {
        var profileBadges = workerBadges();
        if (byId("profileName")) byId("profileName").textContent = state.worker.name || "Worker Profile";
        if (byId("profileMeta")) byId("profileMeta").textContent = state.worker.city || state.user.city || "Location not set";
        if (byId("workerAvatar")) {
          if (state.worker.photo_url && String(state.worker.photo_url).indexOf("data:image") === 0) byId("workerAvatar").innerHTML = '<img src="' + state.worker.photo_url + '" alt="">';
          else byId("workerAvatar").textContent = initials(state.worker.name || state.user.displayName);
        }
    if (byId("profileBadges")) byId("profileBadges").innerHTML = profileBadges.map(function (b) { return '<span class="badge ' + b.className + '">' + b.label + '</span>'; }).join("");
        var strength = profileStrength();
        if (byId("profileStrengthText")) byId("profileStrengthText").textContent = strength + "%";
        if (byId("profileStrengthBar")) byId("profileStrengthBar").style.width = strength + "%";
        if (byId("profileStrengthStar")) byId("profileStrengthStar").style.left = strength + "%";
        if (byId("workerSwitchCta")) byId("workerSwitchCta").textContent = hasEmployerProfile() ? "Switch to Hiring" : "SETUP HIRING";
        if (byId("employerSwitchCta")) byId("employerSwitchCta").textContent = hasWorkerProfile() ? "Switch to Job Search" : "SETUP JOB SEARCH";
        if (byId("workerProfileLocationText")) byId("workerProfileLocationText").textContent = workerLocationLine();
        if (byId("workerProfileExperienceText")) byId("workerProfileExperienceText").textContent = workerExperienceLine();
        if (byId("workerProfileWorkText")) byId("workerProfileWorkText").textContent = workerWorkLine();
        if (byId("workerProfileAvailabilityText")) byId("workerProfileAvailabilityText").textContent = workerAvailabilityLine();
        if (byId("workerProfileSkillsText")) byId("workerProfileSkillsText").textContent = (state.worker.skills || []).join(", ") || "No skills added yet";
      }
    ].forEach(function (step) {
      try {
        step();
      } catch (error) {
        console.warn("Kaam Karo render step skipped:", error);
      }
    });
  }
  function finishWorker() {
    state.workerComplete = true;
    var workerId = state.defaultWorkerId || state.worker.id || ("worker-" + Date.now());
    state.defaultWorkerId = workerId;
    state.worker.id = workerId;
    if (byId("workerName") && byId("workerName").value.trim()) state.worker.name = byId("workerName").value.trim();
    if (byId("workerGender") && byId("workerGender").value) state.worker.gender = byId("workerGender").value;
    if (byId("workerAge") && byId("workerAge").value.trim()) state.worker.age = byId("workerAge").value.trim();
    var finalWorkerLocation = byId("workerCity") ? (selectedLocations.workerBasic || selectedLocationFromInput(byId("workerCity").value.trim())) : null;
    if (finalWorkerLocation) {
      applyStructuredLocation("user", finalWorkerLocation);
      applyStructuredLocation("worker", finalWorkerLocation);
    }
    state.worker.preferredJob = state.worker.preferredJob || "Any Job";
    state.worker.availability = workerAvailabilityLine();
    state.user.displayName = state.worker.name;
    state.user.city = state.worker.city;
    state.user.location = state.worker.formatted_location || state.worker.city;
    state.workerProfiles[workerId] = {
      workerId: workerId,
      userId: "user-demo",
      name: state.worker.name,
      gender: state.worker.gender,
      age: state.worker.age,
      city: state.worker.city,
      district: state.worker.district || "",
      state: state.worker.state || "",
      country: state.worker.country || "India",
      location: state.worker.formatted_location || state.worker.city,
      formatted_location: state.worker.formatted_location || state.worker.city,
      place_id: state.worker.place_id || "",
      lat: state.worker.lat || null,
      lng: state.worker.lng || null,
      workPreference: (state.worker.jobTypes && state.worker.jobTypes.length) ? state.worker.jobTypes.join(", ") : state.worker.preferredJob,
      skills: state.worker.skills.slice(),
      experience: state.worker.experience || "Fresher",
      availability: state.worker.availability,
      startAvailability: state.worker.startAvailability,
      availableDays: (state.worker.availableDays || []).slice(),
      shiftPreference: state.worker.shiftPreference,
      locationPreference: locationMode,
      preferredPay: state.worker.openAnyPay ? "Open to any pay" : (state.worker.payRange || ""),
      photoVerificationStatus: state.user.photoVerificationStatus || "not_uploaded",
      trustBadges: workerBadges().map(function (badge) { return badge.label; }),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    var nextWorkerRoute = pendingWorkerRoute || "jobs";
    pendingWorkerRoute = "";
    setupReturnRoute = "";
    localStorage.removeItem("kkPendingWorkerRoute");
    localStorage.removeItem("kkSetupReturnRoute");
    save();
    track("worker_onboarding_complete");
    show(nextWorkerRoute);
  }
  function validateJobDraft() {
    var title = byId("postTitle").value.trim();
    var pay = getPostPayDisplay();
    var amount = byId("postPayAmount").value.trim();
    var period = byId("postPayPeriod").value;
    var city = byId("postLocation").value.trim();
    var location = selectedLocations.postJob || selectedLocationFromInput(city);
    var desc = byId("postDesc").value.trim();
    if (!title) return toast("Job title required.");
    if (!amount) return toast("Salary required.");
    if (!period) return toast("Salary type required.");
    if (!city) return toast("Location required.");
    if (!location) return toast("Please select a valid city or area from the list.");
    if (desc.length > 700) return toast("Job description must be 700 characters or less.");
    if (descriptionWordCount(desc) < 15) {
      if (byId("postDescError")) byId("postDescError").style.display = "block";
      return toast("Please add at least 15 words so workers understand the job clearly.");
    }
    if (byId("postDescError")) byId("postDescError").style.display = "none";
    return { title: title, pay: pay, city: location.city, location: location, desc: desc, type: byId("postType").value };
  }
  function addPostedJob() {
    if (!hasEmployerProfile()) return goToEmployerRoute("postJob");
    var draft = validateJobDraft();
    if (!draft) return;
    if (!postVisibility) {
      if (byId("visibilityError")) byId("visibilityError").style.display = "block";
      return toast("Please select a visibility option.");
    }
    if (!byId("jobRules").checked) {
      byId("jobRulesError").style.display = "block";
      return toast("Please confirm the job is genuine before publishing.");
    }
    byId("jobRulesError").style.display = "none";
    var moderation = analyzeJobDraft(draft);
    if (moderation.rejected) {
      var rejectedBusiness = currentBusinessProfile();
      audit("rejected", moderation.reasons.join(", "), { id: "draft-" + Date.now(), title: draft.title, pay: draft.pay, city: draft.city, type: draft.type, employer: rejectedBusiness ? rejectedBusiness.businessName : "Business", desc: draft.desc, status: "rejected" }, "system");
      toast("This job cannot be published. Please review posting rules.");
      return;
    }
    var status = moderation.reasons.length ? "pending_review" : "approved";
    var business = currentBusinessProfile();
    var postLocation = draft.location || parseLocationParts(draft.city);
    var created = Date.now();
    var job = { id: "job-" + created, businessId: state.defaultBusinessId, employerId: state.worker.id, companyName: business.businessName, title: draft.title, pay: draft.pay, city: postLocation.city, district: postLocation.district, state: postLocation.state, formatted_location: postLocation.formatted_location, distance: "Nearby", type: draft.type, employer: business.businessName, badge: postVisibility === "boost" ? "Urgent" : "New", visibility: postVisibility, remote: draft.type === "Remote", desc: draft.desc, status: status, riskScore: moderation.riskScore, flagReasons: moderation.reasons, reportCount: 0, previousPosts: employerPostCount(), createdAt: created, expiresAt: created + (postVisibility === "boost" ? 29 : 15) * 86400000 };
    state.jobs.unshift(job);
    save();
    audit(status === "approved" ? "approved" : "pending_review", status === "approved" ? "Auto-approved" : moderation.reasons.join(", "), job, "system");
    track(postVisibility === "boost" ? "employer_job_boosted_posted" : "employer_job_free_posted");
    show("published");
  }
  function performAccountDelete() {
    var keepJobs = state.jobs.filter(function (job) { return !job.employerId && !job.businessId; });
    state.workerComplete = false;
    state.employerComplete = false;
    state.workerProfiles = {};
    state.businessProfiles = {};
    state.defaultWorkerId = "";
    state.defaultBusinessId = "";
    state.applications = [];
    state.conversations = [];
    state.messages = [];
    state.notifications = [];
    state.jobs = keepJobs;
    state.user = { id: "user-demo", displayName: "", phone: "", city: "", location: "", phoneVerified: false, photoVerificationStatus: "not_uploaded", photoVerified: false };
    state.worker = { id: "john", name: "", gender: "", age: "", city: "", experience: "", skills: [], jobTypes: [], availability: "", preferredJob: "Any Job", preferredType: "Full-time", bio: "", phoneVerified: false, photoVerified: false, startAvailability: "", availableDays: [], shiftPreference: "", flexibleAvailability: false };
    state.employer = { id: "", ownerId: "john", name: "", business: "", phone: "", type: "", city: "" };
    localStorage.removeItem("kkPendingWorkerRoute");
    localStorage.removeItem("kkPendingEmployerRoute");
    localStorage.removeItem("kkRole");
    localStorage.removeItem("kkLastMode");
    save();
    closeModal();
    show("landing");
    toast("Account deleted");
  }
  document.addEventListener("click", async function (event) {
    var lang = event.target.closest("[data-lang]");
    if (lang) return setLang(lang.dataset.lang);
    var descChip = event.target.closest("[data-desc-chip]");
    if (descChip) { addDescriptionSentence(descChip.dataset.descChip); return; }
    if (event.target.closest("[data-confirm-delete-account]")) { performAccountDelete(); return; }
    var legalLink = event.target.closest("[data-legal]");
    if (legalLink) { currentLegal = legalLink.dataset.legal; show("legal"); return; }
    var menuBack = event.target.closest("[data-menu-back]");
    if (menuBack) { show(menuReturn || "jobs"); return; }
    var chatBack = event.target.closest("[data-chat-back]");
    if (chatBack) {
      if (selectedConversationId) { selectedConversationId = null; renderChat(); return; }
      show(menuReturn || (currentRole === "employer" ? "employerDash" : "jobs"));
      return;
    }
    var report = event.target.closest("[data-report]");
    if (report) {
      reportContext = report.dataset.report || "general";
      if (reportContext === "job") {
        var list = filteredJobs(byId("jobSearch") ? byId("jobSearch").value : "");
        selectedReportJobId = list[jobIndex] ? list[jobIndex].id : selectedJobId;
      }
      show("report");
      return;
    }
    var reportReason = event.target.closest("[data-report-reason]");
    if (reportReason) {
      var reason = reportReason.dataset.reportReason;
      if (reportContext === "chat") {
        selectedReportReason = reason;
        openModal("Tell us what happened", '<label class="input"><textarea id="reportDetails" placeholder="Tell us what happened"></textarea></label><p class="small mt">Reporting this chat will disconnect this match and remove the conversation for both sides.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-report-disconnect>Report and Disconnect</button></div>');
        return;
      }
      if (reportContext === "job" && selectedReportJobId) {
        var reportedJob = state.jobs.find(function (job) { return job.id === selectedReportJobId; });
        if (reportedJob) {
          reportedJob.reportCount = (reportedJob.reportCount || 0) + 1;
          reportedJob.flagReasons = reportedJob.flagReasons || [];
          if (reportedJob.flagReasons.indexOf(reason) < 0) reportedJob.flagReasons.push(reason);
          reportedJob.riskScore = (reportedJob.riskScore || 0) + 15;
          if (reportedJob.status === "approved") reportedJob.status = "pending_review";
          audit("job_reported", reason, reportedJob, state.worker.id);
          save();
        }
      }
      toast("Report submitted: " + reason);
      show(menuReturn || "jobs");
      return;
    }
    var adminAction = event.target.closest("[data-admin-action]");
    if (adminAction) {
      var adminJob = state.jobs.find(function (job) { return job.id === adminAction.dataset.jobId; });
      if (!adminJob) return;
      var action = adminAction.dataset.adminAction;
      if (action === "approve") adminJob.status = "approved";
      if (action === "reject") adminJob.status = "rejected";
      if (action === "request_edit") adminJob.status = "pending_review";
      if (action === "suspend") { state.employer.moderationStatus = "suspended"; adminJob.status = "removed"; }
      if (action === "ban") { state.employer.moderationStatus = "banned"; adminJob.status = "removed"; }
      audit(action, "Admin moderation action", adminJob, "admin-001");
      save();
      toast("Admin action saved.");
      render();
      return;
    }
    var openConversation = event.target.closest("[data-open-conversation]");
    if (openConversation) { selectedConversationId = openConversation.dataset.openConversation; show("chat"); return; }
    var dashboardTarget = event.target.closest("[data-dashboard-target]");
    if (dashboardTarget) { applicantsTab = dashboardTarget.dataset.dashboardTarget; show("applicants"); return; }
    var repostJob = event.target.closest("[data-repost-job]");
    if (repostJob) {
      var repost = state.jobs.find(function (job) { return job.id === repostJob.dataset.repostJob; });
      if (repost) {
        byId("postTitle").value = repost.title || "";
        byId("postPayAmount").value = String(repost.pay || "").replace(/[^\d]/g, "");
        byId("postLocation").value = repost.formatted_location || repost.city || "";
        selectedLocations.postJob = selectedLocationFromInput(byId("postLocation").value) || parseLocationParts(byId("postLocation").value);
        byId("postType").value = repost.type || "Full Time";
        byId("postDesc").value = repost.desc || "";
        renderPostDescCounter();
        show("postJob");
      }
      return;
    }
    var deleteJob = event.target.closest("[data-delete-job]");
    if (deleteJob) {
      openModal("Delete this job?", '<p class="small">This job will be removed from the employer job list.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-delete-job="' + deleteJob.dataset.deleteJob + '">Delete</button></div>');
      return;
    }
    var confirmDeleteJob = event.target.closest("[data-confirm-delete-job]");
    if (confirmDeleteJob) {
      state.jobs = state.jobs.filter(function (job) { return job.id !== confirmDeleteJob.dataset.confirmDeleteJob; });
      state.applications = state.applications.filter(function (app) { return app.jobId !== confirmDeleteJob.dataset.confirmDeleteJob; });
      save(); closeModal(); render(); return;
    }
    var appTab = event.target.closest("[data-applications-tab]");
    if (appTab) { applicationsTab = appTab.dataset.applicationsTab; renderWorkerApplications(); return; }
    var applicantTab = event.target.closest("[data-applicants-tab]");
    if (applicantTab) { applicantsTab = applicantTab.dataset.applicantsTab; renderEmployer(); return; }
    var chatTab = event.target.closest("[data-chat-tab]");
    if (chatTab) { chatListTab = chatTab.dataset.chatTab; renderChat(); return; }
    var favChat = event.target.closest("[data-favourite-chat]");
    if (favChat) {
      var favConvo = state.conversations.find(function (c) { return c.id === favChat.dataset.favouriteChat; });
      if (favConvo) {
        var nextFav = currentRole === "employer" ? !favConvo.favouriteEmployer : !favConvo.favouriteWorker;
        if (currentRole === "employer") favConvo.favouriteEmployer = nextFav; else favConvo.favouriteWorker = nextFav;
        save(); renderChat(); toast(nextFav ? "Added to favourites." : "Removed from favourites.");
      }
      return;
    }
    var deleteChat = event.target.closest("[data-delete-chat]");
    if (deleteChat) {
      openModal("Delete this chat?", '<p class="small">You will lose this conversation from your chat list.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-delete-chat="' + deleteChat.dataset.deleteChat + '">Delete Chat</button></div>');
      return;
    }
    var confirmDeleteChat = event.target.closest("[data-confirm-delete-chat]");
    if (confirmDeleteChat) {
      var delConvo = state.conversations.find(function (c) { return c.id === confirmDeleteChat.dataset.confirmDeleteChat; });
      hideChatForCurrentUser(delConvo);
      closeModal();
      renderChat();
      return;
    }
    var withdrawApp = event.target.closest("[data-withdraw-app]");
    if (withdrawApp) {
      openModal("Withdraw this application?", '<p class="small">You will not be considered for this job anymore.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-withdraw-app="' + withdrawApp.dataset.withdrawApp + '">Withdraw</button></div>');
      return;
    }
    var confirmWithdraw = event.target.closest("[data-confirm-withdraw-app]");
    if (confirmWithdraw) {
      state.applications = state.applications.filter(function (app) { return app.id !== confirmWithdraw.dataset.confirmWithdrawApp; });
      save(); closeModal(); render(); return;
    }
    var removeMatch = event.target.closest("[data-remove-match]");
    if (removeMatch) {
      openModal("Leave this job?", '<p class="small">This will remove the match and delete the chat.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-remove-match="' + removeMatch.dataset.removeMatch + '">Remove Match</button></div>');
      return;
    }
    var confirmRemoveMatch = event.target.closest("[data-confirm-remove-match]");
    if (confirmRemoveMatch) {
      var matchApp = state.applications.find(function (app) { return app.id === confirmRemoveMatch.dataset.confirmRemoveMatch; });
      disconnectMatch(conversationForApp(matchApp));
      closeModal(); render(); return;
    }
    var removeAccepted = event.target.closest("[data-remove-accepted-app]");
    if (removeAccepted) {
      openModal("Remove this applicant?", '<p class="small">This will disconnect the match and delete the chat for both sides.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-remove-accepted="' + removeAccepted.dataset.removeAcceptedApp + '">Remove Applicant</button></div>');
      return;
    }
    var confirmRemoveAccepted = event.target.closest("[data-confirm-remove-accepted]");
    if (confirmRemoveAccepted) {
      var acceptedApp = state.applications.find(function (app) { return app.id === confirmRemoveAccepted.dataset.confirmRemoveAccepted; });
      disconnectMatch(conversationForApp(acceptedApp));
      closeModal(); render(); return;
    }
    if (event.target.closest("[data-confirm-report-disconnect]")) {
      var reportConvo = currentConversation();
      state.auditLogs.unshift({ userId: currentUserId(), action: "chat_reported", reason: selectedReportReason + ": " + ((byId("reportDetails") && byId("reportDetails").value) || ""), jobSnapshot: null, timestamp: new Date().toISOString() });
      if (reportConvo) {
        state.blockedPairs.push({ conversationId: reportConvo.id, workerId: reportConvo.workerId, employerId: reportConvo.employerId, reason: selectedReportReason, createdAt: Date.now() });
        disconnectMatch(reportConvo);
      }
      closeModal(); toast("Report submitted."); show(currentRole === "employer" ? "employerDash" : "jobs"); return;
    }
    if (event.target.closest("[data-scroll-chat-bottom]")) {
      var chatArea = byId("chatArea");
      if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }
    var block = event.target.closest("[data-block]");
    if (block) {
      var blocked = currentConversation();
      if (blocked) {
        blocked.status = "blocked";
        audit("chat_blocked", "User blocked conversation", state.jobs.find(function (j) { return j.id === blocked.jobId; }), currentRole === "employer" ? "rick" : state.worker.id);
        save();
        renderChat();
      }
      toast("Blocked. This chat is now closed.");
      return;
    }
    if (event.target.closest("[data-mark-hired]")) {
      openModal("Confirm hire?", '<p class="small">Are you satisfied with this hire?</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn primary" data-confirm-hired>Yes, Mark as Hired</button></div>');
      return;
    }
    if (event.target.closest("[data-confirm-hired]")) {
      markHiredConversation(currentConversation());
      closeModal();
      toast("Worker marked as hired.");
      render();
      return;
    }
    if (event.target.closest("[data-hire-again]")) { toast("Hire Again ready for backend."); return; }
    if (event.target.closest("[data-open-rating]")) {
      pendingRating = { score: 0, quick: "" };
      openModal("How was your experience?", '<div class="toolbar">' + [1,2,3,4,5].map(function (n) { return '<button class="chip rating-star" data-rating-star="' + n + '">&#9733;</button>'; }).join("") + '</div><div class="toolbar mt">' + ["Not good","Okay","Good","Great","Excellent"].map(function (q) { return '<button class="chip" data-rating-quick="' + q + '">' + q + '</button>'; }).join("") + '</div><label class="input mt"><textarea id="ratingComment" placeholder="Write a short feedback..."></textarea></label><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn primary" data-submit-rating>Submit Feedback</button></div>');
      return;
    }
    var ratingStar = event.target.closest("[data-rating-star]");
    if (ratingStar) { pendingRating.score = Number(ratingStar.dataset.ratingStar || 0); ratingStar.parentElement.querySelectorAll(".chip").forEach(function (b) { b.classList.remove("selected"); }); ratingStar.classList.add("selected"); return; }
    var ratingQuick = event.target.closest("[data-rating-quick]");
    if (ratingQuick) { pendingRating.quick = ratingQuick.dataset.ratingQuick; ratingQuick.parentElement.querySelectorAll(".chip").forEach(function (b) { b.classList.remove("selected"); }); ratingQuick.classList.add("selected"); return; }
    if (event.target.closest("[data-submit-rating]")) {
      var ratedConvo = currentConversation();
      if (!pendingRating.score) return toast("Choose a star rating.");
      state.ratings.push({ id: "rating-" + Date.now(), conversationId: ratedConvo.id, jobId: ratedConvo.jobId, userId: currentUserId(), fromRole: currentRole, rating: pendingRating.score, quick: pendingRating.quick, comment: byId("ratingComment") ? byId("ratingComment").value.trim() : "", status: "submitted", createdAt: Date.now() });
      save(); closeModal(); toast("Feedback submitted"); renderChat(); return;
    }
    var quick = event.target.closest("[data-quick]");
    if (quick) { sendChatMessage(quick.dataset.quick); return; }
    if (event.target.closest("[data-close-modal]") || event.target.id === "appModal") { closeModal(); return; }
    var settingsModal = event.target.closest("[data-settings-modal]");
    if (settingsModal) {
      var kind = settingsModal.dataset.settingsModal;
      if (kind === "phone") openModal("Change Phone Number", '<p class="small">We will verify your new number with OTP.</p><button class="btn primary mt" data-change-phone-flow>Start OTP</button>');
      if (kind === "notifications") openModal("Notifications", '<div class="list"><label class="settings-card"><span><span>Job matches</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Chat messages</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Application updates</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Marketing</span><b>Off</b></span><input type="checkbox"></label></div><button class="btn primary mt" data-save-modal="Notifications saved">Save</button>');
      if (kind === "privacy") openModal("Privacy", '<div class="list"><label class="settings-card"><span><span>Show location</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Show selfie</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Pause profile</span><b>Off</b></span><input type="checkbox"></label></div><button class="btn primary mt" data-save-modal="Privacy saved">Save</button>');
      if (kind === "faq") openModal("Help & FAQ", '<div class="list"><div class="panel small"><b>How do I apply?</b><br>Swipe right on a job.</div><div class="panel small"><b>When can I chat?</b><br>Chat unlocks after employer accepts.</div><div class="panel small"><b>Is photo required?</b><br>No, it is optional.</div></div>');
      if (kind === "refer") openModal("Refer & Earn", '<p class="small">Share Kaam Karo with friends looking for work.</p><label class="input mt"><input value="https://kaamkaro.app/ref/demo" readonly></label><button class="btn primary mt" data-save-modal="Referral link copied">Copy link</button>');
      return;
    }
    if (event.target.closest("[data-change-phone-flow]")) { phoneUpdatePending = true; closeModal(); show("otp"); toast("Enter new phone number"); return; }
    var saveModal = event.target.closest("[data-save-modal]");
    if (saveModal) { closeModal(); toast(saveModal.dataset.saveModal + " OK"); return; }
    var openJob = event.target.closest("[data-open-job-modal]");
    if (openJob && !event.target.closest("button")) {
      var detailJob = state.jobs.find(function (job) { return job.id === openJob.dataset.openJobModal; });
      if (detailJob) openModal(detailJob.title, '<div class="panel"><h2>' + detailJob.pay + '</h2><p class="small">' + detailJob.city + ' - ' + detailJob.type + ' - Posted 3h ago</p><span class="badge amber">Hiring today</span></div><p class="small mt">' + detailJob.desc + '</p><button class="btn primary mt" data-apply-job="' + detailJob.id + '">Apply</button>');
      return;
    }
    if (event.target.closest("[data-undo-swipe]")) {
      if (lastSwipe && lastSwipe.type === "skip") { jobIndex = lastSwipe.index; renderFeed(); }
      byId("undoBar").classList.remove("show");
      lastSwipe = null;
      toast("Swipe undone");
      return;
    }
    if (event.target.closest("[data-refresh-jobs]")) { jobIndex = 0; renderFeed(); toast("Jobs refreshed"); return; }
    if (event.target.closest("[data-confirm-logout]")) {
      closeModal();
      try {
        if (window.KaamKaroAuth) await window.KaamKaroAuth.logout();
      } catch (error) {
        console.warn("Logout skipped:", error);
      }
      byId("phoneInput").value = "";
      if (byId("otpInput")) byId("otpInput").value = "";
      track("logout");
      show("landing");
      toast("Logged out.");
      return;
    }
    if (event.target.closest("[data-logout]")) {
      openModal("Logout", '<p class="small">Are you sure you want to logout?</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-logout>Logout</button></div>');
      return;
    }
    var editProfile = event.target.closest("[data-edit-profile]");
    if (editProfile) {
      openProfileEdit(editProfile.dataset.editProfile);
      return;
    }
    var editOption = event.target.closest("[data-edit-option]");
    if (editOption) { editDraft.value = editOption.dataset.editOption; markEditDirty(); renderProfileEdit(); return; }
    var editLocation = event.target.closest("[data-edit-location]");
    if (editLocation) {
      var pickedEditLocation = indiaLocations.find(function (loc) { return loc.place_id === editLocation.dataset.editLocation; });
      if (pickedEditLocation) saveLocationTo("profileEdit", pickedEditLocation);
      renderProfileEdit();
      return;
    }
    var editWork = event.target.closest("[data-edit-work]");
    if (editWork) {
      editDraft.workTypes = editDraft.workTypes || [];
      var workIndex = editDraft.workTypes.indexOf(editWork.dataset.editWork);
      if (workIndex >= 0) editDraft.workTypes.splice(workIndex, 1); else editDraft.workTypes.push(editWork.dataset.editWork);
      markEditDirty(); renderProfileEdit(); return;
    }
    var editDay = event.target.closest("[data-edit-day]");
    if (editDay) {
      editDraft.days = editDraft.days || [];
      var dayIndex = editDraft.days.indexOf(editDay.dataset.editDay);
      if (dayIndex >= 0) editDraft.days.splice(dayIndex, 1); else editDraft.days.push(editDay.dataset.editDay);
      markEditDirty(); renderProfileEdit(); return;
    }
    if (event.target.closest("[data-edit-all-days]")) {
      var allDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      var currentlyAll = allDays.every(function (day) { return (editDraft.days || []).indexOf(day) >= 0; });
      editDraft.days = currentlyAll ? [] : allDays.slice();
      markEditDirty(); renderProfileEdit(); return;
    }
    var editStart = event.target.closest("[data-edit-start]");
    if (editStart) { editDraft.start = editStart.dataset.editStart; markEditDirty(); renderProfileEdit(); return; }
    var editShift = event.target.closest("[data-edit-shift]");
    if (editShift) { editDraft.shift = editShift.dataset.editShift; markEditDirty(); renderProfileEdit(); return; }
    var suggestSkill = event.target.closest("[data-edit-suggest-skill]");
    if (suggestSkill) {
      editDraft.skills = editDraft.skills || [];
      if (editDraft.skills.indexOf(suggestSkill.dataset.editSuggestSkill) < 0) editDraft.skills.push(suggestSkill.dataset.editSuggestSkill);
      markEditDirty(); renderProfileEdit(); return;
    }
    var removeEditSkill = event.target.closest("[data-edit-remove-skill]");
    if (removeEditSkill) {
      editDraft.skills = (editDraft.skills || []).filter(function (skill) { return skill !== removeEditSkill.dataset.editRemoveSkill; });
      markEditDirty(); renderProfileEdit(); return;
    }
    if (event.target.closest("[data-edit-add-skill]")) {
      var skillInput = byId("profileEditInput");
      var newSkill = skillInput ? skillInput.value.trim() : "";
      if (newSkill) {
        editDraft.skills = editDraft.skills || [];
        if (editDraft.skills.indexOf(newSkill) < 0) editDraft.skills.push(newSkill);
        markEditDirty(); renderProfileEdit();
      }
      return;
    }
    if (event.target.closest("[data-save-profile-edit]")) {
      saveProfileEdit();
      return;
    }
    var accountProfile = event.target.closest("[data-account-profile]");
    if (accountProfile) {
      if (accountProfile.dataset.accountProfile === "worker") {
        currentRole = "worker";
        localStorage.setItem("kkRole", "worker");
        goToWorkerRoute("profile");
      } else {
        currentRole = "employer";
        localStorage.setItem("kkRole", "employer");
        goToEmployerRoute("employerProfile");
      }
      return;
    }
    if (event.target.closest("[data-delete-account]")) {
      var expectedDeletePhone = (state.user.phone || state.employer.phone || "").replace(/\D/g, "").slice(-10);
      if (byId("deleteConfirmPhone").value.replace(/\D/g, "") !== expectedDeletePhone) return toast("Type your mobile number to confirm.");
      openModal("Are you absolutely sure?", '<p>This cannot be undone. All your data and history will be removed.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-delete-account>Permanently Delete</button></div>');
      return;
    }
    if (event.target.closest("[data-profile-tab]")) {
      if (currentRole === "employer") goToEmployerRoute("employerProfile"); else goToWorkerRoute("profile");
      return;
    }
    var switchMode = event.target.closest("[data-switch-mode]");
    if (switchMode) {
      var targetMode = switchMode.dataset.switchMode;
      setupReturnRoute = currentScreen;
      localStorage.setItem("kkSetupReturnRoute", setupReturnRoute);
      if (targetMode === "employer") {
        if (hasEmployerProfile()) {
          setupReturnRoute = "";
          localStorage.removeItem("kkSetupReturnRoute");
          currentRole = "employer";
          localStorage.setItem("kkRole", currentRole);
          toast("Hire Workers mode.");
          show("employerDash");
        } else {
          pendingEmployerRoute = "employerDash";
          localStorage.setItem("kkPendingEmployerRoute", pendingEmployerRoute);
          toast("Set up your business first.");
          show("employerSetup");
        }
      } else {
        if (hasWorkerProfile()) {
          setupReturnRoute = "";
          localStorage.removeItem("kkSetupReturnRoute");
          currentRole = "worker";
          localStorage.setItem("kkRole", currentRole);
          toast("Find Work mode.");
          show("jobs");
        } else {
          pendingWorkerRoute = "jobs";
          localStorage.setItem("kkPendingWorkerRoute", pendingWorkerRoute);
          toast("Create your worker profile first.");
          show("workerBasic");
        }
      }
      return;
    }
    if (event.target.closest("[data-setup-home]")) {
      var homeRoute = setupReturnRoute || (currentRole === "employer" ? "employerDash" : "jobs");
      setupReturnRoute = "";
      pendingEmployerRoute = "";
      pendingWorkerRoute = "";
      localStorage.removeItem("kkSetupReturnRoute");
      localStorage.removeItem("kkPendingEmployerRoute");
      localStorage.removeItem("kkPendingWorkerRoute");
      show(homeRoute);
      return;
    }
    var go = event.target.closest("[data-go]");
    if (go) {
      var targetRoute = go.dataset.go;
      if (targetRoute === "workerBasic" && !state.workerComplete && !state.defaultWorkerId) {
        state.worker.name = "";
        state.worker.gender = "";
        state.worker.age = "";
        state.worker.city = "";
        state.worker.experience = "";
        state.worker.skills = [];
        state.worker.jobTypes = [];
        state.worker.preferredJob = "Any Job";
        state.worker.startAvailability = "";
        state.worker.availableDays = [];
        state.worker.shiftPreference = "";
        state.worker.flexibleAvailability = false;
        save();
      }
      if (targetRoute === "chat") {
        if (currentRole === "employer") goToEmployerRoute("chat"); else goToWorkerRoute("chat");
      } else if (isEmployerRoute(targetRoute)) {
        goToEmployerRoute(targetRoute);
      } else if (isWorkerRoute(targetRoute)) {
        goToWorkerRoute(targetRoute);
      } else {
        show(targetRoute);
      }
      return;
    }
    if (event.target.closest("[data-send-otp]")) {
      var phone = byId("phoneInput").value.replace(/\D/g, "");
      if (phone.length !== 10) return toast("Enter a valid 10 digit phone number.");
      try {
        var otpRequest = window.KaamKaroAuth ? await window.KaamKaroAuth.sendOtp(phone) : { phone: phone, mode: "demo" };
        state.employer.phone = otpRequest.phone;
        state.user.phone = otpRequest.phone;
        save();
        track("otp_requested");
        show("otpCode");
      } catch (error) {
        console.warn("OTP request failed:", error);
        toast(error.message || "Something went wrong. Please try again.");
      }
      return;
    }
    if (event.target.closest("[data-verify-otp]")) {
      var otp = byId("otpInput").value.replace(/\D/g, "");
      if (otp.length !== 4 && !(window.KaamKaroAuth && window.KaamKaroAuth.isSupabaseConfigured())) return toast("Enter the 4 digit OTP code.");
      try {
        var authResult = window.KaamKaroAuth ? await window.KaamKaroAuth.verifyOtp(state.user.phone || state.employer.phone || byId("phoneInput").value, otp) : { phone: state.user.phone || state.employer.phone, user: null };
        state.user.id = authResult.user && authResult.user.id ? authResult.user.id : state.user.id;
        state.user.phone = authResult.phone || state.user.phone || state.employer.phone;
        state.employer.phone = state.user.phone;
        state.worker.phoneVerified = true;
        state.user.phoneVerified = true;
        state.worker.active = true;
        save();
        track("otp_verified");
        if (phoneUpdatePending) { phoneUpdatePending = false; toast("Phone number updated OK"); show("accountSettings"); return; }
        routeAfterOtp();
      } catch (error) {
        console.warn("OTP verification failed:", error);
        toast(error.message || "Something went wrong. Please try again.");
      }
      return;
    }
    if (event.target.closest("[data-change-number]")) { show("otp"); return; }
    if (event.target.closest("[data-resend-otp]")) { toast("OTP sent again."); track("otp_resend"); return; }
    var workerBasic = event.target.closest("[data-worker-basic]");
    if (workerBasic) {
      state.worker.name = byId("workerName").value.trim();
      state.worker.gender = byId("workerGender").value;
      state.worker.age = byId("workerAge").value.trim();
      var workerLocation = selectedLocations.workerBasic || selectedLocationFromInput(byId("workerCity").value.trim());
      if (!workerLocation) return toast("Please select a valid city or area from the list.");
      applyStructuredLocation("user", workerLocation);
      applyStructuredLocation("worker", workerLocation);
      save();
      show("workerWork");
      return;
    }
    var anyJob = event.target.closest("[data-any-job]");
    if (anyJob) { state.worker.preferredJob = "Any Job"; state.worker.jobTypes = []; save(); renderCategories(); toast("All jobs will be shown."); return; }
    var addJobType = event.target.closest("[data-add-job-type]");
    if (addJobType) { addWorkerJobType(byId("workSearch") ? byId("workSearch").value : ""); return; }
    var workCat = event.target.closest("[data-work-cat]");
    if (workCat) { addWorkerJobType(workCat.dataset.workCat); return; }
    var removeJobType = event.target.closest("[data-remove-job-type]");
    if (removeJobType) {
      state.worker.jobTypes = (state.worker.jobTypes || []).filter(function (type) { return type !== removeJobType.dataset.removeJobType; });
      if (!state.worker.jobTypes.length) state.worker.preferredJob = "Any Job";
      save(); renderCategories(); return;
    }
    var skill = event.target.closest("[data-skill]");
    if (skill) {
      var i = state.worker.skills.indexOf(skill.dataset.skill);
      if (i >= 0) state.worker.skills.splice(i, 1); else state.worker.skills.push(skill.dataset.skill);
      save(); renderSkills(); return;
    }
    var removeSkill = event.target.closest("[data-remove-skill]");
    if (removeSkill) {
      state.worker.skills = state.worker.skills.filter(function (s) { return s !== removeSkill.dataset.removeSkill; });
      save(); renderSkills(); return;
    }
    var addSkill = event.target.closest("[data-add-skill]");
    if (addSkill) {
      var value = byId("manualSkill").value.trim();
      if (value && state.worker.skills.indexOf(value) < 0) state.worker.skills.push(value);
      byId("manualSkill").value = "";
      save(); renderSkills(); return;
    }
    var exp = event.target.closest("[data-exp]");
    if (exp) { state.worker.experience = exp.dataset.exp; exp.parentElement.querySelectorAll(".choice").forEach(function (c) { c.classList.remove("selected"); }); exp.classList.add("selected"); save(); return; }
    var onboardStart = event.target.closest("[data-onboard-start]");
    if (onboardStart) { state.worker.flexibleAvailability = false; state.worker.startAvailability = onboardStart.dataset.onboardStart; save(); renderOnboardingAvailability(); return; }
    if (event.target.closest("[data-onboard-all-days]")) {
      state.worker.flexibleAvailability = false;
      var allDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      var hasAllDays = allDays.every(function (day) { return (state.worker.availableDays || []).indexOf(day) >= 0; });
      state.worker.availableDays = hasAllDays ? [] : allDays.slice();
      save(); renderOnboardingAvailability(); return;
    }
    var onboardDay = event.target.closest("[data-onboard-day]");
    if (onboardDay) {
      state.worker.flexibleAvailability = false;
      state.worker.availableDays = state.worker.availableDays || [];
      var onboardDayIndex = state.worker.availableDays.indexOf(onboardDay.dataset.onboardDay);
      if (onboardDayIndex >= 0) state.worker.availableDays.splice(onboardDayIndex, 1); else state.worker.availableDays.push(onboardDay.dataset.onboardDay);
      save(); renderOnboardingAvailability(); return;
    }
    var onboardShift = event.target.closest("[data-onboard-shift]");
    if (onboardShift) { state.worker.flexibleAvailability = false; state.worker.shiftPreference = onboardShift.dataset.onboardShift; save(); renderOnboardingAvailability(); return; }
    if (event.target.closest("[data-flexible-availability]")) {
      state.worker.flexibleAvailability = !state.worker.flexibleAvailability;
      if (state.worker.flexibleAvailability) {
        state.worker.startAvailability = "";
        state.worker.availableDays = [];
        state.worker.shiftPreference = "";
      }
      save(); renderOnboardingAvailability(); return;
    }
    if (event.target.closest("[data-upload-photo]")) {
      if (byId("photoCameraStatus")) byId("photoCameraStatus").textContent = "Take a clear photo of your face (head and shoulders).";
      if (byId("photoFile")) byId("photoFile").click();
      else {
        applyPhotoVerified("local-photo-verified");
        toast("Photo uploaded successfully");
      }
      return;
    }
    if (event.target.closest("[data-add-city]")) { setActiveCity(byId("jobSearch") ? byId("jobSearch").value : ""); return; }
    if (event.target.closest("[data-clear-city]")) { activeCity = ""; localStorage.removeItem("kkActiveCity"); renderFeed(); return; }
    var locMode = event.target.closest("[data-location-mode]");
    if (locMode) { locationMode = locMode.dataset.locationMode; locMode.parentElement.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); }); locMode.classList.add("selected"); if (byId("locationHint")) byId("locationHint").textContent = locationMode === "remote" ? "Showing remote work." : "Showing nearby options."; return; }
    var openPay = event.target.closest("[data-open-pay]");
    if (openPay) {
      payOpen = !payOpen;
      state.worker.openAnyPay = payOpen;
      openPay.classList.toggle("selected", payOpen);
      byId("payRange").style.display = payOpen ? "none" : "block";
      save();
      return;
    }
    var payType = event.target.closest("[data-pay-type]");
    if (payType) {
      state.worker.payType = payType.dataset.payType;
      payType.parentElement.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); });
      payType.classList.add("selected");
      save();
      return;
    }
    var payRange = event.target.closest("[data-pay-range]");
    if (payRange) {
      state.worker.payRange = payRange.dataset.payRange;
      byId("payPref").value = state.worker.payRange;
      byId("payRanges").querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); });
      payRange.classList.add("selected");
      save();
      return;
    }
    var visibility = event.target.closest("[data-visibility]");
    if (visibility) {
      postVisibility = visibility.dataset.visibility;
      visibility.parentElement.querySelectorAll(".plan").forEach(function (p) { p.classList.remove("selected"); });
      visibility.classList.add("selected");
      if (byId("publishJobBtn")) byId("publishJobBtn").disabled = false;
      if (byId("visibilityError")) byId("visibilityError").style.display = "none";
      return;
    }
    var finish = event.target.closest("[data-finish-worker]");
    if (finish) { finishWorker(); return; }
    var finishEmp = event.target.closest("[data-finish-employer]");
    if (finishEmp) {
      state.employerComplete = true;
      var businessId = state.defaultBusinessId || ("biz-" + Date.now());
      state.defaultBusinessId = businessId;
      state.employer.id = businessId;
      state.employer.ownerId = state.worker.id;
      state.employer.business = byId("businessName").value.trim();
      state.employer.name = byId("contactName").value.trim();
      state.employer.phone = byId("businessPhone").value.trim() || state.employer.phone;
      state.employer.type = byId("businessType").value || byId("businessTypeOther").value || state.employer.type;
      var businessLocation = parseLocationParts(state.worker.city || state.user.city || "");
      state.employer.city = businessLocation.city || "";
      state.employer.district = businessLocation.district;
      state.employer.state = businessLocation.state;
      state.employer.formatted_location = businessLocation.formatted_location;
      state.user.displayName = state.employer.name || state.user.displayName;
      state.user.city = state.employer.city || state.user.city;
      state.user.location = state.user.city;
      state.businessProfiles[businessId] = { businessId: businessId, ownerId: state.worker.id, businessName: state.employer.business, contactPersonName: state.employer.name, city: state.employer.city, district: state.employer.district, state: state.employer.state, formatted_location: state.employer.formatted_location, phone: state.employer.phone, type: state.employer.type, createdAt: Date.now() };
      var nextEmployerRoute = pendingEmployerRoute || "employerDash";
      pendingEmployerRoute = "";
      setupReturnRoute = "";
      localStorage.removeItem("kkPendingEmployerRoute");
      localStorage.removeItem("kkSetupReturnRoute");
      save(); track("employer_setup_complete"); show(nextEmployerRoute); return;
    }
    var filter = event.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      locationMode = activeFilter === "remote" ? "remote" : (activeFilter === "near" ? "near" : "city");
      if (activeFilter === "near" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function () {}, function () {}, { enableHighAccuracy: false, timeout: 2500, maximumAge: 600000 });
      }
      jobIndex = 0;
      filter.parentElement.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); });
      filter.classList.add("selected");
      renderFeed();
      return;
    }
    var applyJob = event.target.closest("[data-apply-job]");
    if (applyJob) { applyToJob(applyJob.dataset.applyJob); return; }
    var next = event.target.closest("[data-next-job]");
    if (next) { nextJob(); return; }
    var selectJob = event.target.closest("[data-select-job]");
    if (selectJob) { applyToJob(selectJob.dataset.selectJob); return; }
    var jobDetail = event.target.closest("[data-job-detail]");
    if (jobDetail) { selectedJobId = jobDetail.dataset.jobDetail; show("employerJobDetail"); return; }
    var openWorker = event.target.closest("[data-open-worker]");
    if (openWorker) {
      selectedWorkerId = openWorker.dataset.openWorker;
      selectedJobId = openWorker.dataset.jobId || selectedJobId;
      var viewedApp = appForSelected();
      if (viewedApp && viewedApp.status === "Interested") { viewedApp.status = "Viewed"; notify("Employer viewed your profile.", "applications"); save(); }
      show("workerProfileView");
      return;
    }
    var rejectApp = event.target.closest("[data-reject-app]");
    if (rejectApp) { setApplicationStatus(rejectApp.dataset.rejectApp, "Rejected"); return; }
    var acceptApp = event.target.closest("[data-accept-app]");
    if (acceptApp) { setApplicationStatus(acceptApp.dataset.acceptApp, "Accepted"); return; }
    if (event.target.closest("[data-reject-current]")) { setApplicationStatus(null, "Rejected"); return; }
    if (event.target.closest("[data-accept-current]")) { setApplicationStatus(null, "Accepted"); return; }
    if (event.target.closest("[data-review-job]")) {
      if (validateJobDraft()) { resetVisibilityChoice(); show("jobVisibility"); }
      return;
    }
    if (event.target.closest("[data-post-job]")) { addPostedJob(); return; }
    var toastTarget = event.target.closest("[data-toast]");
    if (toastTarget) toast(toastTarget.dataset.toast);
  });
  document.addEventListener("input", function (event) {
    if (event.target.matches("[data-location-input]")) {
      fillLocationDatalist(event.target.value);
      var exactLocation = selectedLocationFromInput(event.target.value);
      if (exactLocation) saveLocationTo(event.target.dataset.locationInput, exactLocation);
      else {
        delete selectedLocations[event.target.dataset.locationInput];
        if (event.target.dataset.locationInput === "profileEdit") editDraft.location = null;
      }
    }
    if (event.target.id === "jobSearch") { jobIndex = 0; renderFeed(); }
    if (event.target.id === "manualSearch") renderSearch();
    if (event.target.id === "postDesc") renderPostDescCounter();
    if (event.target.id === "locationSearch") { state.worker.city = event.target.value.trim() || state.worker.city; save(); renderFeed(); }
    if (event.target.id === "profileEditInput") {
      editDraft.value = event.target.value.trim();
      if (editingProfileField !== "workerSkills") markEditDirty();
    }
    if (event.target.id === "jobRules" && event.target.checked) byId("jobRulesError").style.display = "none";
    if (event.target.id === "deleteConfirmPhone") {
      var typedDeletePhone = event.target.value.replace(/\D/g, "").slice(0, 10);
      event.target.value = typedDeletePhone;
      var expectedPhone = (state.user.phone || state.employer.phone || "").replace(/\D/g, "").slice(-10);
      var matches = typedDeletePhone === expectedPhone && expectedPhone.length === 10;
      byId("deleteAccountBtn").disabled = !matches;
      if (byId("deletePhoneError")) byId("deletePhoneError").textContent = typedDeletePhone.length === 10 && !matches ? "Number does not match this account." : "";
    }
    if (event.target.id === "payPref") { state.worker.payRange = event.target.value.trim(); state.worker.openAnyPay = false; save(); }
  });
  document.addEventListener("change", function (event) {
    if (event.target.id === "photoFile") {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      if (byId("photoCameraStatus")) byId("photoCameraStatus").textContent = "Checking photo...";
      var reader = new FileReader();
      reader.onload = function () {
        applyPhotoVerified(String(reader.result || "local-photo-verified"));
        if (byId("photoCameraStatus")) byId("photoCameraStatus").textContent = "Photo uploaded successfully";
        stopPhotoCamera();
        toast("Photo uploaded successfully");
        render();
      };
      reader.readAsDataURL(file);
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.target.id === "workSearch" && event.key === "Enter") {
      event.preventDefault();
      addWorkerJobType(event.target.value);
    }
    if (event.target.id === "jobSearch" && event.key === "Enter") {
      event.preventDefault();
      setActiveCity(event.target.value);
    }
  });
  document.addEventListener("pointerdown", function (event) {
    pointerCard = event.target.closest("#jobFeed .job-card");
    if (!pointerCard) return;
    pointerStartX = event.clientX;
    pointerDeltaX = 0;
    pointerCard.style.transition = "none";
  });
  document.addEventListener("pointermove", function (event) {
    if (!pointerStartX || !pointerCard) return;
    pointerDeltaX = event.clientX - pointerStartX;
    var width = pointerCard.offsetWidth || 320;
    var progress = Math.min(1, Math.abs(pointerDeltaX) / width);
    var rotate = Math.max(-10, Math.min(10, pointerDeltaX / 18));
    var resistance = Math.sign(pointerDeltaX) * Math.pow(Math.abs(pointerDeltaX), .96);
    var scale = 1 - progress * .035;
    pointerCard.style.transform = "translateX(" + resistance + "px) rotate(" + rotate + "deg) scale(" + scale + ")";
    pointerCard.classList.toggle("swipe-like", pointerDeltaX > 22);
    pointerCard.classList.toggle("swipe-skip", pointerDeltaX < -22);
  });
  document.addEventListener("pointerup", function (event) {
    if (!pointerStartX || !pointerCard) return;
    var card = pointerCard;
    var delta = pointerDeltaX || (event.clientX - pointerStartX);
    var threshold = (card.offsetWidth || 320) * .32;
    pointerStartX = 0;
    pointerCard = null;
    pointerDeltaX = 0;
    card.style.transition = "transform .24s cubic-bezier(.16,.9,.2,1)";
    if (delta < -threshold) {
      card.style.transform = "translateX(-118vw) rotate(-10deg) scale(.96)";
      setTimeout(function () { nextJob(); card.style.transform = ""; }, 210);
      return;
    }
    if (delta > threshold) {
      card.style.transform = "translateX(118vw) rotate(10deg) scale(.98)";
      var list = filteredJobs("");
      if (list.length) setTimeout(function () { track("job_swipe_right"); applyToJob(list[jobIndex].id); card.style.transform = ""; }, 210);
      return;
    }
    card.classList.remove("swipe-like", "swipe-skip");
    card.style.transition = "transform .28s cubic-bezier(.18,1.35,.28,1)";
    card.style.transform = "translateX(0) rotate(0deg) scale(1)";
    setTimeout(function () { card.style.transition = ""; card.style.transform = ""; }, 290);
  });
  byId("sendChat").addEventListener("click", function () {
    var text = byId("chatText").value.trim();
    if (!text) return;
    sendChatMessage(text);
    byId("chatText").value = "";
  });
  byId("chatText").addEventListener("keydown", function (event) {
    if (event.key === "Enter") byId("sendChat").click();
  });
  window.kkGo = show;
  setupScreenBodies();
  document.querySelectorAll(".screen > nav.nav").forEach(function (nav) { nav.remove(); });
  document.querySelectorAll(".screen:not(.active)").forEach(function (screen) { screen.classList.add("was-right"); });
  fillBasicDefaults();
  if (byId("payRange")) byId("payRange").style.display = "none";
  render();
})();
