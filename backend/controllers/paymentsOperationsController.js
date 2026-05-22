const Settings = require("../models/schemas/settings");

// This endpoint only moves secrets server-side.
// Actual PayU link generation is intentionally not implemented here unless
// proper PayU integration details are added to the backend.
const createPaymentLink = async (req, res) => {
  try {
    const { amount, customerPhone, product } = req.body || {};
    if (!amount) return res.status(400).json({ error: "amount is required" });

    const settings = await Settings.findOne({}).lean();
    const key = settings?.payU_prod_key || process.env.PAYU_KEY;
    const salt = settings?.payU_prod_salt || process.env.PAYU_SALT;

    if (!key || !salt) {
      return res.status(500).json({
        error: "PayU credentials missing",
        details: "Set payU_prod_key/payU_prod_salt in settings or PAYU_KEY/PAYU_SALT in backend .env",
      });
    }

    // Conversion-only: do not expose key/salt to frontend.
    // Return a clear not-configured response for now.
    return res.status(501).json({
      error: "Payment link generation not configured",
      details: "Add PayU link generation implementation on backend (kept out to avoid adding new behavior).",
      paymentLink: null,
      request: { amount, customerPhone, product },
    });
  } catch (err) {
    res.status(500).json({ error: "Create payment link failed", details: err.message });
  }
};

module.exports = { createPaymentLink };

