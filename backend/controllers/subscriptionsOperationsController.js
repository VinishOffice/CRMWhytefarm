const Subscriptions = require("../models/schemas/subscriptionsData");
const Customers = require("../models/schemas/customersData");
const Hubs = require("../models/schemas/hubsData");
const Products = require("../models/schemas/productsData");
const CustomerActivities = require("../models/schemas/customerActivities");
const CustomersVacation = require("../models/schemas/customersVacation");
const WalletHistory = require("../models/schemas/walletHistory");
const OrderHistory = require("../models/schemas/orderHistory");
const ConversationLogs = require("../models/schemas/conversationLogs");

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

const formatDateOnly = (value) => {
  const d = toDate(value);
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const inDateRange = (value, start, end) => {
  const d = toDate(value);
  if (!d) return false;
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

const options = async (_req, res) => {
  try {
    const [hubs, products, utmSourcesRaw, agentsRaw] = await Promise.all([
      Hubs.find({}).lean(),
      Products.find({}).lean(),
      Subscriptions.find({ utm_source: { $ne: null } }).lean(),
      ConversationLogs.find({}).lean(),
    ]);

    const utmSet = new Set();
    utmSourcesRaw.forEach((s) => {
      if (s.utm_source) utmSet.add(s.utm_source);
    });

    const agentSet = new Set();
    agentsRaw.forEach((a) => {
      if (a.created_by) agentSet.add(a.created_by);
    });

    res.json({
      hubs,
      products,
      utmSources: Array.from(utmSet),
      agents: Array.from(agentSet),
    });
  } catch (err) {
    res.status(500).json({ error: "Options fetch failed", details: err.message });
  }
};

const report = async (req, res) => {
  try {
    const {
      productNames = [],
      hubNames = [],
      utmSources = [],
      customerPhone,
      customerName,
      startDate,
      endDate,
      status,
      subscriptionType,
    } = req.body || {};

    const query = {};
    if (productNames.length) query.product_name = { $in: productNames };
    if (hubNames.length) query.hub_name = { $in: hubNames };
    if (utmSources.length) query.utm_source = { $in: utmSources };
    if (customerPhone) query.customer_phone = customerPhone;
    if (customerName) query.customer_name = customerName;
    if (status) query.status = status;
    if (subscriptionType) query.subscription_type = subscriptionType;

    if (startDate || endDate) {
      query.start_date = {};
      if (startDate) query.start_date.$gte = startDate;
      if (endDate) query.start_date.$lte = endDate;
    }

    const subs = await Subscriptions.find(query).lean();

    const activeIds = subs
      .filter((s) => s.status === "1" && s.customer_id)
      .map((s) => s.customer_id);
    const customerMap = new Map();
    if (activeIds.length) {
      const customers = await Customers.find({ customer_id: { $in: activeIds } }).lean();
      customers.forEach((c) => {
        customerMap.set(c.customer_id, c.customer_email || "N/A");
      });
    }

    const data = subs.map((s) => ({
      ...s,
      email: s.status === "1" ? customerMap.get(s.customer_id) || "N/A" : "-",
    }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Subscription report failed", details: err.message });
  }
};

const futureOrders = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      hub,
      product,
      orderType,
      registerStartDate,
      registerEndDate,
    } = req.body || {};

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const subs = await Subscriptions.find({ status: "1" }).lean();

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRange = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d));
    }

    const results = [];
    const customerIds = new Set();

    subs.forEach((data) => {
      const subscriptionType = data.subscription_type;
      const customerId = data.customer_id;
      if (customerId) customerIds.add(customerId);

      const baseInfo = {
        customer_id: customerId,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        hub: data.delivered_by || data.hub_name || "",
        order_type: subscriptionType || "",
        subscription_id: data.subscription_id || "",
      };

      dateRange.forEach((date) => {
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        const deliveryDate = formatDateOnly(date);
        let shouldInclude = false;

        if (subscriptionType === "Everyday") {
          shouldInclude = true;
        } else if (subscriptionType === "Custom" && Number(data[dayName] || 0) > 0) {
          shouldInclude = true;
        } else if (subscriptionType === "On-Interval") {
          const startSub = toDate(data.start_date) || new Date(data.start_date);
          const interval = Number(data.interval || 0);
          if (interval > 0 && startSub) {
            const daysSinceStart = Math.floor((date - startSub) / (1000 * 60 * 60 * 24));
            shouldInclude = daysSinceStart % interval === 0 && daysSinceStart >= 0;
          }
        } else if (subscriptionType === "One Time") {
          shouldInclude = data.next_delivery_date === deliveryDate;
        }

        if (!shouldInclude) return;

        if (Array.isArray(data.cart_data) && data.cart_data.length > 0) {
          data.cart_data.forEach((item) => {
            if (item.quantity > 0) {
              results.push({
                ...baseInfo,
                scheduled_date: deliveryDate,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.price,
                amount: item.quantity * item.price,
              });
            }
          });
        } else if (data.product_name && Number(data.quantity || 0) > 0) {
          results.push({
            ...baseInfo,
            scheduled_date: deliveryDate,
            product_name: data.product_name,
            quantity: data.quantity,
            unit_price: data.price,
            amount: data.quantity * data.price,
          });
        }
      });
    });

    const customers = await Customers.find({ customer_id: { $in: Array.from(customerIds) } }).lean();
    const customerMap = new Map();
    customers.forEach((c) => {
      customerMap.set(c.customer_id, formatDateOnly(c.registered_date));
    });

    let merged = results.map((item) => ({
      ...item,
      registered_date: customerMap.get(item.customer_id) || "",
    }));

    if (hub) merged = merged.filter((item) => item.hub === hub);
    if (product) merged = merged.filter((item) => item.product_name === product);
    if (orderType) merged = merged.filter((item) => item.order_type === orderType);

    if (registerStartDate || registerEndDate) {
      const rs = registerStartDate ? new Date(registerStartDate) : null;
      const re = registerEndDate ? new Date(registerEndDate) : null;
      merged = merged.filter((item) => {
        if (!item.registered_date) return false;
        const d = new Date(item.registered_date);
        if (rs && d < rs) return false;
        if (re && d > re) return false;
        return true;
      });
    }

    res.json({ data: merged });
  } catch (err) {
    res.status(500).json({ error: "Future order report failed", details: err.message });
  }
};

const pausedReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body || {};
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const activities = await CustomerActivities.find({ description: /paused/i }).lean();
    const pausedIds = new Set();
    const pausedDateMap = {};

    activities.forEach((activity) => {
      if (!inDateRange(activity.created_date, start, end)) return;
      const description = activity.description || "";
      const parts = description.split(" ");
      const subId = parts[2] || parts[1];
      if (!subId) return;
      pausedIds.add(subId);

      const created = toDate(activity.created_date);
      if (created) {
        const formatted = created.toLocaleDateString("en-GB").replace(/\//g, "-");
        pausedDateMap[subId] = formatted;
      }
    });

    const pausedIdsArr = Array.from(pausedIds);
    if (!pausedIdsArr.length) return res.json({ data: [], pausedDateMap });

    const subs = await Subscriptions.find({
      subscription_id: { $in: pausedIdsArr },
      status: "0",
    }).lean();

    const filteredSubs = subs.filter(
      (s) => s.subscription_type !== "One Time" && s.reason !== "cron"
    );

    const customerIds = Array.from(new Set(filteredSubs.map((s) => s.customer_id)));
    const customers = await Customers.find({ customer_id: { $in: customerIds } }).lean();
    const customerMap = new Map();
    customers.forEach((c) => {
      customerMap.set(c.customer_id, c);
    });

    const merged = filteredSubs.map((sub) => {
      const customer = customerMap.get(sub.customer_id) || {};
      return {
        ...sub,
        current_wallet_balance: customer.wallet_balance || "0",
        source: customer.source || "-",
        email: customer.customer_email || "-",
      };
    });

    res.json({
      data: merged,
      pausedDateMap,
      hubs: Array.from(new Set(filteredSubs.map((s) => s.hub_name).filter(Boolean))),
      products: Array.from(new Set(filteredSubs.map((s) => s.product_name).filter(Boolean))),
      subscriptionTypes: Array.from(new Set(filteredSubs.map((s) => s.subscription_type).filter(Boolean))),
    });
  } catch (err) {
    res.status(500).json({ error: "Paused report failed", details: err.message });
  }
};

const autoPausedReport = async (req, res) => {
  try {
    const { autoPauseStart, autoPauseEnd } = req.body || {};
    if (!autoPauseStart) {
      return res.status(400).json({ error: "autoPauseStart is required" });
    }

    const query = {
      reason: "cron",
      status: "0",
      paused_date: { $gte: autoPauseStart },
    };
    if (autoPauseEnd) query.paused_date.$lte = autoPauseEnd;

    const subs = await Subscriptions.find(query).lean();
    const filteredSubs = subs.filter((sub) => {
      const type = (sub.subscription_type || "").toLowerCase().replace(/\s/g, "");
      return type !== "onetime";
    });

    const customerIds = Array.from(new Set(filteredSubs.map((s) => s.customer_id)));

    const [customers, walletEntries, orderEntries, convoEntries, activities] = await Promise.all([
      Customers.find({ customer_id: { $in: customerIds } }).lean(),
      WalletHistory.find({ customer_id: { $in: customerIds } }).lean(),
      OrderHistory.find({ customer_id: { $in: customerIds } }).lean(),
      ConversationLogs.find({ customer_id: { $in: customerIds } }).lean(),
      CustomerActivities.find({ customer_id: { $in: customerIds } }).lean(),
    ]);

    const customerMap = new Map(customers.map((c) => [c.customer_id, c]));
    const walletMap = new Map();
    const orderMap = new Map();
    const convoMap = new Map();
    const activityMap = new Map();

    walletEntries.forEach((d) => {
      if (!walletMap.has(d.customer_id)) walletMap.set(d.customer_id, []);
      walletMap.get(d.customer_id).push(d);
    });
    orderEntries.forEach((d) => {
      if (!orderMap.has(d.customer_id)) orderMap.set(d.customer_id, []);
      orderMap.get(d.customer_id).push(d);
    });
    convoEntries.forEach((d) => {
      if (!convoMap.has(d.customer_id)) convoMap.set(d.customer_id, []);
      convoMap.get(d.customer_id).push(d);
    });
    activities.forEach((d) => {
      if (d.reason === "cron" && d.action === "Auto Pause" && d.object) {
        activityMap.set(d.object, d.description || "-");
      }
    });

    const merged = filteredSubs.map((sub) => {
      const customer = customerMap.get(sub.customer_id) || {};
      const walletList = walletMap.get(sub.customer_id) || [];
      const orderList = orderMap.get(sub.customer_id) || [];
      const convoList = convoMap.get(sub.customer_id) || [];

      const walletLastRecharge = walletList
        .filter((w) => ["Credit", "credit"].includes(w.type))
        .sort((a, b) => (toDate(b.created_date) || 0) - (toDate(a.created_date) || 0))[0];

      const lastOrder = orderList
        .sort((a, b) => (toDate(b.delivery_timestamp) || 0) - (toDate(a.delivery_timestamp) || 0))[0];

      const latestAgent =
        customer.agent_name ||
        convoList.sort((a, b) => (toDate(b.created_at) || 0) - (toDate(a.created_at) || 0))[0]?.created_by ||
        "-";

      return {
        ...sub,
        customer_name: customer.customer_name || "-",
        customer_phone: customer.customer_phone || "-",
        customer_email: customer.customer_email || "-",
        agent_name: latestAgent,
        wallet: customer.wallet_balance,
        last_order_date: lastOrder ? formatDateOnly(lastOrder.delivery_timestamp) : "-",
        last_recharge_date: walletLastRecharge ? formatDateOnly(walletLastRecharge.created_date) : "-",
        description: activityMap.get(sub.subscription_id) || "-",
      };
    });

    const hubs = Array.from(new Set((await Hubs.find({}).lean()).map((h) => h.hub_name)));
    const products = Array.from(new Set(filteredSubs.map((s) => s.product_name).filter(Boolean)));
    const agents = Array.from(new Set((await ConversationLogs.find({}).lean()).map((c) => c.created_by).filter(Boolean)));

    res.json({
      data: merged,
      hubs,
      products,
      agents,
    });
  } catch (err) {
    res.status(500).json({ error: "Auto paused report failed", details: err.message });
  }
};

const currentSubscriptions = async (req, res) => {
  try {
    const { hubNames = [], productNames = [] } = req.body || {};
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateOnly(tomorrow);
    const weekDay = tomorrow.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    const query = { status: "1", next_delivery_date: tomorrowStr };
    if (hubNames.length) query.hub_name = { $in: hubNames };
    if (productNames.length) query.product_name = { $in: productNames };

    const subs = await Subscriptions.find(query).lean();

    const vacations = await CustomersVacation.find({}).lean();
    const vacationedIds = new Set();
    vacations.forEach((v) => {
      const start = toDate(v.start_date);
      const end = toDate(v.end_date);
      if (!start || !end) return;
      const t = new Date(tomorrowStr);
      if (t >= start && t <= end) vacationedIds.add(v.customer_id);
    });

    const filtered = subs
      .filter((s) => !vacationedIds.has(s.customer_id))
      .map((s) => {
        const weekdayQty = Number(s[weekDay] || 0);
        const finalQuantity = weekdayQty > 0 ? weekdayQty : s.quantity;
        return { ...s, finalQuantity };
      });

    const totalQuantity = filtered.reduce((sum, s) => sum + Number(s.finalQuantity || 0), 0);

    res.json({ data: filtered, totalQuantity });
  } catch (err) {
    res.status(500).json({ error: "Current subscriptions failed", details: err.message });
  }
};

module.exports = {
  options,
  report,
  futureOrders,
  pausedReport,
  autoPausedReport,
  currentSubscriptions,
};
