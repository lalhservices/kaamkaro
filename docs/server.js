require("dotenv").config();

const crypto = require("crypto");
const cors = require("cors");
const express = require("express");
const Razorpay = require("razorpay");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 8080;

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_SECRET"
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.warn(`Missing backend env vars: ${missingEnv.join(", ")}`);
}

const supabase = createClient(
  process.env.SUPABASE_URL || "http://localhost",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "missing-service-role-key",
  { auth: { persistSession: false } }
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "missing-key-id",
  key_secret: process.env.RAZORPAY_SECRET || "missing-key-secret"
});

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

function safeError(res, error, status = 500) {
  console.error(error);
  return res.status(status).json({ error: "Something went wrong. Please try again." });
}

async function requireUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Login required." });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: "Login required." });

    req.user = data.user;
    return next();
  } catch (error) {
    return safeError(res, error);
  }
}

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket.remoteAddress || "unknown";
}

function hashValue(value) {
  return crypto
    .createHash("sha256")
    .update(`${value || "unknown"}:${process.env.IP_HASH_SALT || "kaam-karo-dev-salt"}`)
    .digest("hex");
}

const safetyRules = [
  { term: "registration fee", reason: "asking for money to apply", severity: "high", action: "block" },
  { term: "joining fee", reason: "asking for money to apply", severity: "high", action: "block" },
  { term: "security deposit", reason: "asking for money to apply", severity: "high", action: "block" },
  { term: "processing fee", reason: "asking for money to apply", severity: "high", action: "block" },
  { term: "pay first", reason: "asking for money upfront", severity: "high", action: "block" },
  { term: "upi", reason: "payment request", severity: "medium", action: "review" },
  { term: "telegram", reason: "external contact push", severity: "medium", action: "review" },
  { term: "whatsapp only", reason: "external contact push", severity: "medium", action: "review" },
  { term: "adult service", reason: "adult or sexual services", severity: "high", action: "block" },
  { term: "escort", reason: "adult or sexual services", severity: "high", action: "block" },
  { term: "sexual", reason: "sexual content", severity: "high", action: "block" },
  { term: "drugs", reason: "illegal work", severity: "high", action: "block" },
  { term: "weapon", reason: "illegal work", severity: "high", action: "block" },
  { term: "gun", reason: "illegal work", severity: "high", action: "block" },
  { term: "gambling", reason: "illegal work", severity: "high", action: "block" },
  { term: "fake document", reason: "fake documents", severity: "high", action: "block" },
  { term: "child labour", reason: "child labour", severity: "high", action: "block" },
  { term: "abuse", reason: "harassment or abuse", severity: "medium", action: "review" },
  { term: "threat", reason: "threats", severity: "high", action: "block" }
];

const fallbackLocations = [
  { city: "Bainsa", district: "Shaheed Bhagat Singh Nagar", state: "Punjab", country: "India", formatted_location: "Bainsa, Shaheed Bhagat Singh Nagar, Punjab, India", place_id: "in-bainsa-sbsn-pb", lat: 31.105, lng: 76.38 },
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

function localLocationSearch(query) {
  const q = String(query || "").toLowerCase().trim();
  const rows = q ? fallbackLocations.filter((loc) => {
    return [loc.city, loc.district, loc.state, loc.formatted_location].join(" ").toLowerCase().includes(q);
  }) : fallbackLocations;
  return rows.slice(0, 8);
}

function addressComponent(components, type) {
  const match = components.find((item) => Array.isArray(item.types) && item.types.includes(type));
  return match ? match.long_name : "";
}

function normalizePlaceDetails(result, prediction) {
  const components = Array.isArray(result.address_components) ? result.address_components : [];
  const state = addressComponent(components, "administrative_area_level_1");
  const district = addressComponent(components, "administrative_area_level_3") ||
    addressComponent(components, "administrative_area_level_2") ||
    state;
  const city = addressComponent(components, "locality") ||
    addressComponent(components, "postal_town") ||
    addressComponent(components, "sublocality_level_1") ||
    addressComponent(components, "administrative_area_level_4") ||
    addressComponent(components, "administrative_area_level_3") ||
    (prediction && prediction.structured_formatting && prediction.structured_formatting.main_text) ||
    result.name ||
    district ||
    state;
  const country = addressComponent(components, "country") || "India";
  const geometry = result.geometry && result.geometry.location ? result.geometry.location : {};
  return {
    city,
    district: district || city,
    state: state || district || city,
    country,
    formatted_location: result.formatted_address || (prediction && prediction.description) || [city, district, state, country].filter(Boolean).join(", "),
    place_id: result.place_id || (prediction && prediction.place_id) || "",
    lat: geometry.lat == null ? null : Number(geometry.lat),
    lng: geometry.lng == null ? null : Number(geometry.lng)
  };
}

async function googleLocationSearch(query) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !query || typeof fetch !== "function") return [];
  const params = new URLSearchParams({
    input: query,
    components: "country:in",
    types: "geocode",
    key
  });
  const autocomplete = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`);
  if (!autocomplete.ok) return [];
  const json = await autocomplete.json();
  const predictions = Array.isArray(json.predictions) ? json.predictions.slice(0, 5) : [];
  const details = await Promise.all(predictions.map(async (prediction) => {
    const detailParams = new URLSearchParams({
      place_id: prediction.place_id,
      fields: "address_component,geometry,formatted_address,name,place_id",
      key
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${detailParams.toString()}`);
    if (!response.ok) return null;
    const detailJson = await response.json();
    return detailJson.result ? normalizePlaceDetails(detailJson.result, prediction) : null;
  }));
  return details.filter(Boolean);
}

function scanContent(text, context = "general") {
  const content = String(text || "").toLowerCase();
  const matches = safetyRules.filter((rule) => content.includes(rule.term));
  const hasHigh = matches.some((rule) => rule.severity === "high" || rule.action === "block");
  return {
    blocked: context === "chat" ? matches.length > 0 : hasHigh,
    requiresReview: matches.length > 0,
    severity: hasHigh ? "high" : (matches.length ? "medium" : "low"),
    riskScore: matches.reduce((score, rule) => score + (rule.severity === "high" ? 35 : 15), 0),
    reasons: [...new Set(matches.map((rule) => rule.reason))]
  };
}

async function logSecurityEvent({ userId, phoneNumber, action, reason, delta = 0, metadata = {}, req }) {
  const ipHash = req ? hashValue(clientIp(req)) : null;
  const deviceId = metadata.deviceId || metadata.device_id || null;
  const userAgent = (req && req.headers["user-agent"]) || metadata.userAgent || null;

  await supabase.from("security_events").insert({
    user_id: userId || null,
    phone_number: phoneNumber || null,
    device_id: deviceId,
    ip_hash: ipHash,
    user_agent: userAgent,
    action,
    risk_reason: reason || null,
    risk_score_delta: delta,
    metadata
  });

  if (userId && delta) {
    const { data: current } = await supabase
      .from("users")
      .select("risk_score")
      .eq("id", userId)
      .maybeSingle();
    const nextScore = Math.max(0, Math.min(100, (current?.risk_score || 0) + delta));
    await supabase
      .from("users")
      .update({
        risk_score: nextScore,
        requires_turnstile: nextScore >= 50,
        visibility_restricted: nextScore >= 70,
        posting_restricted: nextScore >= 90,
        chat_restricted: nextScore >= 90,
        review_status: nextScore >= 90 ? "restricted" : nextScore >= 70 ? "review" : nextScore >= 50 ? "watch" : "clear"
      })
      .eq("id", userId);
  }
}

async function isAdminUser(userId) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function getEmployerProfile(userId) {
  const { data, error } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "kaam-karo-backend" });
});

app.get("/locations/autocomplete", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < 2) return res.json({ locations: localLocationSearch(query) });
    const remote = await googleLocationSearch(query);
    res.json({ locations: remote.length ? remote.slice(0, 8) : localLocationSearch(query) });
  } catch (error) {
    console.error("Location autocomplete fallback:", error);
    res.json({ locations: localLocationSearch(req.query.q) });
  }
});

app.post("/security/signup-event", requireUser, async (req, res) => {
  try {
    const {
      phoneNumber,
      deviceId,
      setupStartedAt,
      setupCompletedAt,
      browserFingerprint
    } = req.body || {};
    const ipHash = hashValue(clientIp(req));
    const userAgent = req.headers["user-agent"] || "";
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: deviceCount }, { count: ipCount }] = await Promise.all([
      deviceId
        ? supabase.from("security_events").select("id", { count: "exact", head: true }).eq("device_id", deviceId).gte("created_at", since)
        : Promise.resolve({ count: 0 }),
      supabase.from("security_events").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since)
    ]);

    const setupSeconds = setupStartedAt && setupCompletedAt
      ? (new Date(setupCompletedAt).getTime() - new Date(setupStartedAt).getTime()) / 1000
      : null;
    const reasons = [];
    if ((deviceCount || 0) >= 3) reasons.push("same device created multiple accounts");
    if ((ipCount || 0) >= 5) reasons.push("same IP created multiple accounts");
    if (setupSeconds !== null && setupSeconds > 0 && setupSeconds < 20) reasons.push("setup completed unusually fast");

    const delta = reasons.length ? 20 : 0;
    const userPatch = {
      device_id: deviceId || null,
      ip_hash: ipHash,
      user_agent: userAgent
    };
    if (phoneNumber) userPatch.phone_number = phoneNumber;
    await supabase
      .from("users")
      .update(userPatch)
      .eq("id", req.user.id);

    await logSecurityEvent({
      userId: req.user.id,
      phoneNumber,
      action: "signup_event",
      reason: reasons.join(", ") || "normal signup",
      delta,
      metadata: { deviceId, browserFingerprint, setupSeconds, deviceCount, ipCount },
      req
    });

    res.json({
      ok: true,
      flagged: reasons.length > 0,
      requiresTurnstile: reasons.length > 0,
      reasons
    });
  } catch (error) {
    return safeError(res, error);
  }
});

app.post("/moderation/check-job", requireUser, async (req, res) => {
  try {
    const { title, description, salary, employerId } = req.body || {};
    const scan = scanContent(`${title || ""} ${description || ""} ${salary || ""}`, "job");

    if (scan.requiresReview) {
      await supabase.from("moderation_logs").insert({
        user_id: req.user.id,
        type: "job",
        content: `${title || ""}\n${description || ""}`.slice(0, 4000),
        risk_reason: scan.reasons.join(", "),
        severity: scan.severity,
        action_taken: scan.blocked ? "blocked" : "sent_to_review"
      });
      await logSecurityEvent({
        userId: req.user.id,
        action: "job_risk_detected",
        reason: scan.reasons.join(", "),
        delta: scan.severity === "high" ? 25 : 10,
        metadata: { employerId, riskScore: scan.riskScore },
        req
      });
    }

    res.json({
      ok: true,
      blocked: scan.blocked,
      requiresReview: scan.requiresReview,
      publishStatus: scan.requiresReview ? "pending_review" : "active",
      reasons: scan.reasons
    });
  } catch (error) {
    return safeError(res, error);
  }
});

app.post("/moderation/check-message", requireUser, async (req, res) => {
  try {
    const { chatId, message } = req.body || {};
    if (!chatId || !message) return res.status(400).json({ error: "Message is required." });

    const scan = scanContent(message, "chat");
    if (scan.requiresReview) {
      await supabase.from("moderation_logs").insert({
        user_id: req.user.id,
        type: "chat",
        content: String(message).slice(0, 4000),
        risk_reason: scan.reasons.join(", "),
        severity: scan.severity,
        action_taken: scan.blocked ? "blocked" : "review"
      });
      await logSecurityEvent({
        userId: req.user.id,
        action: "chat_message_flagged",
        reason: scan.reasons.join(", "),
        delta: scan.severity === "high" ? 30 : 10,
        metadata: { chatId, riskScore: scan.riskScore },
        req
      });
    }

    res.json({
      ok: true,
      blocked: scan.blocked,
      reasons: scan.reasons,
      warning: scan.blocked ? "Message blocked for safety" : null
    });
  } catch (error) {
    return safeError(res, error);
  }
});

app.post("/reports", requireUser, async (req, res) => {
  try {
    const {
      reportedUserId,
      jobId,
      chatId,
      reason,
      details
    } = req.body || {};
    if (!reason) return res.status(400).json({ error: "Report reason is required." });

    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: req.user.id,
        reported_user_id: reportedUserId || null,
        job_id: jobId || null,
        chat_id: chatId || null,
        reason,
        details: details || "",
        status: "open"
      })
      .select("id")
      .single();
    if (error) throw error;

    await logSecurityEvent({
      userId: reportedUserId || null,
      action: "report_submitted",
      reason,
      delta: reportedUserId ? 15 : 0,
      metadata: { reportId: data.id, jobId, chatId },
      req
    });

    res.json({ ok: true, reportId: data.id });
  } catch (error) {
    return safeError(res, error);
  }
});

app.get("/admin/review-queue", requireUser, async (req, res) => {
  try {
    if (!(await isAdminUser(req.user.id))) return res.status(403).json({ error: "Admin access required." });

    const [jobs, reports, moderationLogs, riskyUsers] = await Promise.all([
      supabase.from("jobs").select("*").eq("status", "pending_review").order("created_at", { ascending: false }).limit(50),
      supabase.from("reports").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50),
      supabase.from("moderation_logs").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
      supabase.from("users").select("id, phone_number, risk_score, review_status, created_at").in("review_status", ["watch", "review", "restricted"]).order("risk_score", { ascending: false }).limit(50)
    ]);

    for (const result of [jobs, reports, moderationLogs, riskyUsers]) {
      if (result.error) throw result.error;
    }

    res.json({
      ok: true,
      jobs: jobs.data || [],
      reports: reports.data || [],
      moderationLogs: moderationLogs.data || [],
      riskyUsers: riskyUsers.data || []
    });
  } catch (error) {
    return safeError(res, error);
  }
});

app.post("/payments/create-order", requireUser, async (req, res) => {
  try {
    const { jobId } = req.body || {};
    if (!jobId) return res.status(400).json({ error: "Job is required." });

    const employer = await getEmployerProfile(req.user.id);
    if (!employer) return res.status(403).json({ error: "Business profile required." });

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, employer_id")
      .eq("id", jobId)
      .eq("employer_id", employer.id)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) return res.status(403).json({ error: "Job not found." });

    const amount = 19900;
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `boost_${job.id}_${Date.now()}`,
      notes: {
        job_id: job.id,
        user_id: req.user.id
      }
    });

    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: req.user.id,
      job_id: job.id,
      razorpay_order_id: order.id,
      amount,
      status: "created"
    });
    if (paymentError) throw paymentError;

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    return safeError(res, error);
  }
});

app.post("/payments/verify", requireUser, async (req, res) => {
  try {
    const {
      jobId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body || {};

    if (!jobId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Payment verification details are required." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await supabase
        .from("payments")
        .update({ status: "failed", razorpay_payment_id })
        .eq("razorpay_order_id", razorpay_order_id)
        .eq("user_id", req.user.id);
      return res.status(400).json({ error: "Payment verification failed." });
    }

    const employer = await getEmployerProfile(req.user.id);
    if (!employer) return res.status(403).json({ error: "Business profile required." });

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status, risk_score")
      .eq("id", jobId)
      .eq("employer_id", employer.id)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) return res.status(403).json({ error: "Job not found." });

    const { error: paymentError } = await supabase
      .from("payments")
      .update({ status: "success", razorpay_payment_id })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", req.user.id);
    if (paymentError) throw paymentError;

    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({
        boosted: true,
        post_type: "boosted",
        status: Number(job.risk_score || 0) > 0 ? job.status : "active",
        expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq("id", job.id);
    if (jobUpdateError) throw jobUpdateError;

    res.json({ ok: true });
  } catch (error) {
    return safeError(res, error);
  }
});

app.listen(port, () => {
  console.log(`Kaam Karo backend listening on ${port}`);
});
