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
      .select("id")
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
      .update({ boosted: true, post_type: "boosted" })
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
