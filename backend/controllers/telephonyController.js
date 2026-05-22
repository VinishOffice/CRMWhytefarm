const axios = require("axios");

const getKnowlarityCallLogs = async (req, res) => {
  try {
    const { customerPhone } = req.query;
    if (!customerPhone) {
      return res.status(400).json({ error: "customerPhone is required" });
    }

    const apiKey = process.env.KNOWLARITY_API_KEY;
    const auth = process.env.KNOWLARITY_AUTH;
    if (!apiKey || !auth) {
      console.warn("Knowlarity credentials missing: Returning mock call logs for local testing.");
      return res.json({
        data: {
          objects: [
            {
              "destination": "+917827998787",
              "Call_Type": 1,
              "start_time": "2026-03-19T15:20:00+05:30",
              "call_duration": 23,
              "call_recording": ""
            },
            {
              "destination": "+917827998787",
              "Call_Type": 1,
              "start_time": "2026-03-19T15:20:00+05:30",
              "call_duration": 2,
              "call_recording": ""
            },
            {
              "destination": "+919318466478",
              "Call_Type": 1,
              "start_time": "2026-03-17T09:44:00+05:30",
              "call_duration": 210,
              "call_recording": ""
            }
          ]
        }
      });
    }

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      Authorization: auth,
    };

    const encoded = encodeURIComponent(`+91${customerPhone}`);
    const url = `https://kpi.knowlarity.com/Basic/v1/account/calllog?customer_number=${encoded}`;
    const { data } = await axios.get(url, { headers });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Call logs fetch failed", details: err.message });
  }
};

const resolveAgentNumber = (userId) => {
  switch (String(userId || "")) {
    case "22626694":
      return "+919873876969";
    case "84904350":
      return "+918287088330";
    case "82469093":
      return "+919318466478";
    case "62013145":
      return "+917827980198";
    case "82212579":
      return "+917827998787";
    case "03478896":
      return "+919650515059";
    default:
      return null;
  }
};

const makeKnowlarityCall = async (req, res) => {
  try {
    const { customerPhone, userId, agentNumber } = req.body || {};
    if (!customerPhone) {
      return res.status(400).json({ error: "customerPhone is required" });
    }

    const xApiKey = process.env.KNOWLARITY_X_API_KEY;
    const auth = process.env.KNOWLARITY_AUTH;
    const callerId = process.env.KNOWLARITY_CALLER_ID;
    const kNumber = process.env.KNOWLARITY_K_NUMBER;
    const callerIdAlt = process.env.KNOWLARITY_CALLER_ID_ALT;
    const kNumberAlt = process.env.KNOWLARITY_K_NUMBER_ALT;

    if (!xApiKey || !auth || !callerId || !kNumber) {
      return res.status(500).json({
        error: "Knowlarity makecall credentials missing",
        details:
          "Set KNOWLARITY_X_API_KEY, KNOWLARITY_AUTH, KNOWLARITY_CALLER_ID, KNOWLARITY_K_NUMBER (and optional *_ALT) in backend .env",
      });
    }

    const agent = agentNumber || resolveAgentNumber(userId);
    if (!agent) {
      return res.status(400).json({ error: "agentNumber not resolved for user" });
    }

    const channel = "Basic";
    const apiUrl = `https://kpi.knowlarity.com/${channel}/v1/account/call/makecall`;
    const headers = {
      "x-api-key": xApiKey,
      Authorization: auth,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const normalizedCustomer =
      String(customerPhone).length === 10 ? `+91${customerPhone}` : String(customerPhone);

    const requestBody = {
      k_number: kNumber,
      agent_number: agent,
      customer_number: normalizedCustomer,
      caller_id: callerId,
    };

    let response = await axios.post(apiUrl, requestBody, { headers });
    if (response.status !== 200 && kNumberAlt && callerIdAlt) {
      const altBody = {
        ...requestBody,
        k_number: kNumberAlt,
        caller_id: callerIdAlt,
      };
      response = await axios.post(apiUrl, altBody, { headers });
    }

    res.json({ data: response.data });
  } catch (err) {
    res.status(500).json({ error: "Make call failed", details: err.message });
  }
};

module.exports = { getKnowlarityCallLogs, makeKnowlarityCall };

