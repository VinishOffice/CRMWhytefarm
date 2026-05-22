const axios = require("axios");

const getWatiConfig = () => {
  const endpoint = process.env.WATI_API_ENDPOINT;
  const token = process.env.WATI_API_KEY; // should be full "Bearer ..."
  if (!endpoint || !token) {
    return null;
  }
  return { endpoint, token };
};

const sendWatiTemplate = async (req, res) => {
  try {
    const cfg = getWatiConfig();
    if (!cfg) {
      return res.status(500).json({
        error: "WATI credentials missing",
        details: "Set WATI_API_ENDPOINT and WATI_API_KEY in backend .env",
      });
    }

    const { whatsappNumber, template_name, broadcast_name, parameters = [] } =
      req.body || {};
    if (!whatsappNumber || !template_name) {
      return res.status(400).json({ error: "whatsappNumber and template_name are required" });
    }

    const url = `${cfg.endpoint}/api/v1/sendTemplateMessage?whatsappNumber=${encodeURIComponent(
      whatsappNumber
    )}`;
    const payload = {
      whatsappNumber,
      template_name,
      broadcast_name: broadcast_name || "Campaign1",
      parameters,
    };

    const { data } = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json-patch+json",
        Authorization: cfg.token,
      },
    });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "WATI send failed", details: err.message });
  }
};

const listWatiTemplates = async (_req, res) => {
  try {
    const cfg = getWatiConfig();
    if (!cfg) {
      return res.status(500).json({
        error: "WATI credentials missing",
        details: "Set WATI_API_ENDPOINT and WATI_API_KEY in backend .env",
      });
    }

    const url = `${cfg.endpoint}/api/v1/getMessageTemplates?pageSize=200`;
    const { data } = await axios.post(url, null, {
      headers: {
        "Content-Type": "application/json-patch+json",
        Authorization: cfg.token,
      },
    });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "WATI templates fetch failed", details: err.message });
  }
};

const listTextLocalTemplates = async (_req, res) => {
  try {
    const apiKey = process.env.TEXTLOCAL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "TextLocal API key missing",
        details: "Set TEXTLOCAL_API_KEY in backend .env",
      });
    }
    const url = `https://api.textlocal.in/get_templates/?apikey=${encodeURIComponent(apiKey)}`;
    const { data, status } = await axios.get(url);
    res.status(200).json({ status, data });
  } catch (err) {
    res.status(500).json({ error: "TextLocal templates fetch failed", details: err.message });
  }
};

const sendTextLocalSms = async (req, res) => {
  try {
    const apiKey = process.env.TEXTLOCAL_API_KEY;
    const sender = process.env.TEXTLOCAL_SENDER || "WHYTEF";
    if (!apiKey) {
      return res.status(500).json({
        error: "TextLocal API key missing",
        details: "Set TEXTLOCAL_API_KEY in backend .env",
      });
    }

    const { phone_number, message } = req.body || {};
    if (!phone_number || !message) {
      return res.status(400).json({ error: "phone_number and message are required" });
    }

    const url = `https://api.textlocal.in/send/?apikey=${encodeURIComponent(
      apiKey
    )}&sender=${encodeURIComponent(sender)}&numbers=91${encodeURIComponent(
      phone_number
    )}&message=${encodeURIComponent(message)}`;

    const { data, status } = await axios.get(url);
    res.json({ status, data });
  } catch (err) {
    res.status(500).json({ error: "TextLocal SMS failed", details: err.message });
  }
};

module.exports = {
  sendWatiTemplate,
  listWatiTemplates,
  listTextLocalTemplates,
  sendTextLocalSms,
};

