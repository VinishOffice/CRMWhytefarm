const mongoose = require("mongoose");
const CustomerData = require("../models/schemas/customersData");
const HubsUsersData = require("../models/schemas/hubsUsersData");

// Use dynamic model to ensure correct collection name
const looseSchema = new mongoose.Schema({}, { strict: false });
const CustomerActivities =
  mongoose.models["customer_activities"] ||
  mongoose.model("customer_activities", looseSchema, "customer_activities");

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof value === "object" && value.seconds) {
    const ms = value.seconds * 1000 + (value.nanoseconds || 0) / 1e6;
    return new Date(ms);
  }
  return null;
};

const search = async (req, res) => {
  try {
    const { startDate, endDate, customerId, limit = 5000 } = req.body || {};
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const start = toDate(startDate);
    const end = toDate(endDate);
    if (!start || !end) {
      return res.status(400).json({ error: "Invalid startDate/endDate" });
    }

    const query = {};
    if (customerId) query.customer_id = String(customerId);

    // created_date is often stored as ISO string; fetch broad then filter safely in JS
    const raw = await CustomerActivities.find(query).limit(Number(limit) || 5000).lean();

    let activities = raw
      .map((a) => ({
        ...a,
        created_date_parsed: toDate(a.created_date) || toDate(a.date) || null,
      }))
      .filter((a) => a.created_date_parsed && a.created_date_parsed >= start && a.created_date_parsed <= end)
      .sort((a, b) => (b.created_date_parsed?.getTime?.() || 0) - (a.created_date_parsed?.getTime?.() || 0));

    // Enrich missing customer details
    const missingCustomerIds = Array.from(
      new Set(
        activities
          .filter(
            (a) =>
              !a.customer_name ||
              !a.customer_phone ||
              !a.customer_address ||
              !a.hub_name ||
              !a.delivery_exe_id
          )
          .map((a) => a.customer_id)
          .filter(Boolean)
      )
    );

    const customerMap = new Map();
    if (missingCustomerIds.length) {
      const customers = await CustomerData.find({ customer_id: { $in: missingCustomerIds } }).lean();
      customers.forEach((c) => customerMap.set(c.customer_id, c));
    }

    activities = activities.map((a) => {
      const c = a.customer_id ? customerMap.get(a.customer_id) : null;
      return {
        ...a,
        customer_name: a.customer_name || c?.customer_name || "N/A",
        customer_phone: a.customer_phone || c?.customer_phone || "N/A",
        customer_address: a.customer_address || c?.customer_address || "N/A",
        hub_name: a.hub_name || c?.hub_name || "N/A",
        delivery_exe_id: a.delivery_exe_id || c?.delivery_exe_id || "N/A",
      };
    });

    // Delivery executives map (id -> name)
    const execIds = Array.from(
      new Set(activities.map((a) => a.delivery_exe_id).filter((x) => x && x !== "N/A"))
    );
    const execs = execIds.length
      ? await HubsUsersData.find({ hub_user_id: { $in: execIds } }).lean()
      : [];
    const deliveryExecutivesMap = {};
    execs.forEach((e) => {
      deliveryExecutivesMap[e.hub_user_id] = `${e.first_name || ""} ${e.last_name || ""}`.trim();
    });

    // Normalize output date for frontend (no Firestore toDate())
    const data = activities
      .filter((a) => a.description)
      .map((a) => {
        const { created_date_parsed, ...rest } = a;
        return {
          ...rest,
          created_date: created_date_parsed ? created_date_parsed.toISOString() : null,
        };
      });

    res.json({
      data,
      deliveryExecutivesMap,
    });
  } catch (err) {
    res.status(500).json({ error: "Activity search failed", details: err.message });
  }
};

module.exports = { search };

