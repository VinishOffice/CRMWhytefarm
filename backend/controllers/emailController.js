const axios = require("axios");
const ConversationLog = require("../models/schemas/conversationLogs");
const Customers = require("../models/schemas/customersData");

const getUpstreamConfig = () => {
  const baseURL = process.env.EMAIL_API_URL || "https://api.whytefarms.com/api/v1";
  const apiKey = process.env.EMAIL_API_KEY;
  return { baseURL, apiKey };
};

const listEmails = async (req, res) => {
  try {
    const { customer_email } = req.body || {};
    if (!customer_email) {
      return res.status(400).json({ error: "customer_email is required" });
    }

    const { baseURL, apiKey } = getUpstreamConfig();
    if (!apiKey) {
      return res.status(500).json({
        error: "EMAIL_API_KEY missing",
        details: "Set EMAIL_API_KEY in backend .env",
      });
    }

    const { data } = await axios.post(
      `${baseURL}/list_emails`,
      { customer_email },
      {
        headers: {
          "Content-Type": "application/json",
          API_KEY: apiKey,
        },
      }
    );

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "List emails failed", details: err.message });
  }
};

const sendEmail = async (req, res) => {
  try {
    const { subject, message, recipient, customer_id, sender_name } = req.body || {};
    if (!subject || !message || !recipient) {
      return res.status(400).json({ error: "subject, message, recipient are required" });
    }

    const { baseURL, apiKey } = getUpstreamConfig();
    if (!apiKey) {
      return res.status(500).json({
        error: "EMAIL_API_KEY missing",
        details: "Set EMAIL_API_KEY in backend .env",
      });
    }
    
    const { data } = await axios.post(
      `${baseURL}/send_email`,
      { subject, message, recipient },
      {
        headers: {
          "Content-Type": "application/json",
          API_KEY: apiKey,
        },
      }
    );

    // ✅ Log to CRM Conversation History
    if (customer_id) {
      const customer = await Customers.findOne({ customer_id }).lean();
      await ConversationLog.create({
        customer_id: String(customer_id),
        customer_email: recipient,
        customer_name: customer?.customer_name || recipient,
        customer_phone: customer?.customer_phone || "",
        interaction_type: "Email",
        conversation_notes: `Subject: ${subject}\n\n${message}`,
        created_at: new Date(),
        created_by: sender_name || "CRM Admin",
      });
    }

    res.json({ data, ok: true });
  } catch (err) {
    res.status(500).json({ error: "Send email failed", details: err.message });
  }
};

module.exports = { listEmails, sendEmail };

