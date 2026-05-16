(function () {
  "use strict";

  function config() {
    return window.KaamKaroSupabase && window.KaamKaroSupabase.config ? window.KaamKaroSupabase.config() : {};
  }

  function isLocalPrototype() {
    return window.location.protocol === "file:" ||
      (window.location.protocol === "http:" && ["localhost", "127.0.0.1", ""].indexOf(window.location.hostname) >= 0);
  }

  async function session() {
    var client = window.KaamKaroSupabase && window.KaamKaroSupabase.client ? window.KaamKaroSupabase.client() : null;
    if (!client) return null;
    var result = await client.auth.getSession();
    if (result.error) throw result.error;
    return result.data && result.data.session ? result.data.session : null;
  }

  async function api(path, body) {
    var cfg = config();
    var baseUrl = String(cfg.backendUrl || "").replace(/\/$/, "");
    if (!baseUrl) {
      if (isLocalPrototype()) return { ok: true, localBypass: true };
      throw new Error("Payment backend is not configured.");
    }
    var activeSession = await session();
    if (!activeSession || !activeSession.access_token) throw new Error("Please login again before payment.");
    var response = await fetch(baseUrl + path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + activeSession.access_token
      },
      body: JSON.stringify(body || {})
    });
    var text = await response.text();
    var data = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }

  function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-razorpay-checkout]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.dataset.razorpayCheckout = "true";
      script.onload = resolve;
      script.onerror = function () { reject(new Error("Could not load Razorpay. Please try again.")); };
      document.head.appendChild(script);
    });
  }

  async function payForBoost(job) {
    if (!job || !job.id) throw new Error("Job must be saved before payment.");
    var order = await api("/payments/create-order", { jobId: job.id });
    if (order.localBypass) return { ok: true, localBypass: true };
    await loadRazorpay();
    return new Promise(function (resolve, reject) {
      var checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Kaam Karo",
        description: "Boost job post",
        order_id: order.orderId,
        handler: async function (response) {
          try {
            var verified = await api("/payments/verify", {
              jobId: job.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            resolve(verified);
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: function () { reject(new Error("Payment was cancelled.")); }
        },
        theme: { color: "#08a63f" }
      });
      checkout.open();
    });
  }

  window.KaamKaroPayments = {
    payForBoost: payForBoost
  };
})();
