const SubscriptionsData = require("../models/schemas/subscriptionsData");
const BulkUpdateQuantity = require("../models/schemas/bulkUpdateQuantity");
const CustomerVacation = require("../models/schemas/customersVacation");

const formatDateOnly = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDmy = (d) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${d.getFullYear()}`;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const predictiveAnalysis = async (req, res) => {
  try {
    const { date } = req.body || {};
    const base = date ? new Date(date) : new Date();
    if (!date) base.setDate(base.getDate() + 1);

    const dateStr = formatDateOnly(base);
    const weekdays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayOfWeek = weekdays[base.getDay()];

    const [bulkRows, vacations, customSubs, nonCustomSubs] = await Promise.all([
      BulkUpdateQuantity.find({
        delivery_date: { $gte: startOfDay(base), $lte: endOfDay(base) },
      }).lean(),
      CustomerVacation.find({
        start_date: { $lte: dateStr },
        end_date: { $gte: dateStr },
      }).lean(),
      SubscriptionsData.find({
        subscription_type: "Custom",
        status: "1",
        [dayOfWeek]: { $gte: 1 },
      }).lean(),
      SubscriptionsData.find({
        subscription_type: { $ne: "Custom" },
        status: "1",
        next_delivery_date: dateStr,
      }).lean(),
    ]);

    const vacationed = new Set(vacations.map((v) => v.customer_id).filter(Boolean));
    const bulkMap = new Map();
    bulkRows.forEach((r) => {
      if (r.subscription_id) bulkMap.set(r.subscription_id, Number(r.quantity || 0));
    });

    const productPackagingMap = new Map(); // key -> qty
    const add = (sub, isCustom) => {
      if (!sub?.customer_id) return;
      if (vacationed.has(sub.customer_id)) return;

      let qty = Number(sub.quantity || 0);
      if (bulkMap.has(sub.subscription_id)) qty = Number(bulkMap.get(sub.subscription_id));
      else if (isCustom) qty = Number(sub[dayOfWeek] || 0);

      const key = `${sub.product_name || ""}__${sub.package_unit || ""}__${Number(sub.price || 0)}`;
      productPackagingMap.set(key, (productPackagingMap.get(key) || 0) + qty);
    };

    customSubs.forEach((s) => add(s, true));
    nonCustomSubs.forEach((s) => add(s, false));

    const data = Array.from(productPackagingMap.entries()).map(([key, quantity]) => {
      const [product_name, packaging, price] = key.split("__");
      return {
        product_name,
        packaging,
        unit_price: Number(price || 0),
        quantity,
        analysisDate: formatDmy(base),
        day: dayOfWeek,
      };
    });

    res.json({ data, meta: { date: dateStr, day: dayOfWeek } });
  } catch (err) {
    res.status(500).json({ error: "Predictive analysis failed", details: err.message });
  }
};

module.exports = { predictiveAnalysis };

