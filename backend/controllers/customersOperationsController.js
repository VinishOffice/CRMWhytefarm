const CustomerData = require("../models/schemas/customersData");
const SubscriptionsData = require("../models/schemas/subscriptionsData");
const BulkUpdateQuantity = require("../models/schemas/bulkUpdateQuantity");
const CustomerVacation = require("../models/schemas/customersVacation");
const CreditLimitHistory = require("../models/schemas/creditLimitHistory");
const CustomerActivities = require("../models/schemas/customerActivities");
const OrderHistory = require("../models/schemas/orderHistory");
const Payments = require("../models/schemas/payments");
const WalletHistory = require("../models/schemas/walletHistory");
const HubsUsersData = require("../models/schemas/hubsUsersData");

const formatDateOnly = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

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

const parseYmd = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const ymdToday = () => formatDateOnly(new Date());

const generateTxnId = () => {
  const now = Date.now();
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${now % 100000000}${rand}`;
};

const lowCreditReport = async (req, res) => {
  try {
    const { deliveryDate } = req.body || {};
    const base = deliveryDate ? new Date(deliveryDate) : new Date();
    if (!deliveryDate) base.setDate(base.getDate() + 1);

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

    const [vacations, bulkRows, nonCustomSubs, customSubs] = await Promise.all([
      CustomerVacation.find({
        start_date: { $lte: dateStr },
        end_date: { $gte: dateStr },
      }).lean(),
      BulkUpdateQuantity.find({
        delivery_date: { $gte: startOfDay(base), $lte: endOfDay(base) },
      }).lean(),
      SubscriptionsData.find({
        subscription_type: { $ne: "Custom" },
        next_delivery_date: dateStr,
        status: "1",
      }).lean(),
      SubscriptionsData.find({
        subscription_type: "Custom",
        status: "1",
        [dayOfWeek]: { $gte: 1 },
      }).lean(),
    ]);

    const vacationed = new Set(vacations.map((v) => v.customer_id).filter(Boolean));
    const bulkMap = new Map();
    bulkRows.forEach((r) => {
      if (r.subscription_id) bulkMap.set(r.subscription_id, Number(r.quantity || 0));
    });

    const subscriptionMap = new Map(); // customer_id -> { total_price }
    const addSub = (sub, isCustom) => {
      if (!sub?.customer_id) return;
      if (vacationed.has(sub.customer_id)) return;

      let qty = Number(sub.quantity || 0);
      if (bulkMap.has(sub.subscription_id)) qty = Number(bulkMap.get(sub.subscription_id));
      else if (isCustom) qty = Number(sub[dayOfWeek] || 0);

      const price = Number(sub.price || 0);
      const amount = price * qty;
      if (!subscriptionMap.has(sub.customer_id)) subscriptionMap.set(sub.customer_id, 0);
      subscriptionMap.set(sub.customer_id, subscriptionMap.get(sub.customer_id) + amount);
    };

    nonCustomSubs.forEach((s) => addSub(s, false));
    customSubs.forEach((s) => addSub(s, true));

    const customerIds = Array.from(subscriptionMap.keys());
    if (!customerIds.length) {
      return res.json({
        data: [],
        totals: { totalCreditRequired: 0, totalOrdersAmount: 0 },
        meta: { deliveryDate: dateStr, dayOfWeek },
      });
    }

    const customers = await CustomerData.find({ customer_id: { $in: customerIds } }).lean();
    const custMap = new Map(customers.map((c) => [c.customer_id, c]));

    let totalCreditRequired = 0;
    let totalOrdersAmount = 0;
    const data = [];

    customerIds.forEach((cid) => {
      const customer = custMap.get(cid);
      if (!customer) return;

      const total_price = Number(subscriptionMap.get(cid) || 0);
      const wallet_balance = Number(customer.wallet_balance || 0);
      const credit_limit = Number(customer.credit_limit || 0);

      let requiredBalance = 0;
      let isBalanceSufficient = true;

      if (wallet_balance < 0) {
        if (credit_limit < total_price) {
          isBalanceSufficient = false;
          requiredBalance = total_price;
        }
      } else {
        if (wallet_balance + credit_limit < total_price) {
          isBalanceSufficient = false;
          requiredBalance = total_price - wallet_balance;
        }
      }

      if (!isBalanceSufficient) {
        totalCreditRequired += requiredBalance;
        totalOrdersAmount += total_price;
        data.push({
          ...customer,
          total_price,
          requiredBalance,
          isBalanceSufficient,
        });
      }
    });

    res.json({
      data,
      totals: { totalCreditRequired, totalOrdersAmount },
      meta: { deliveryDate: dateStr, dayOfWeek },
    });
  } catch (err) {
    res.status(500).json({ error: "Low credit report failed", details: err.message });
  }
};

const todayCreditHistory = async (_req, res) => {
  try {
    const today = ymdToday();
    const rows = await CreditLimitHistory.find({ credit_date: today })
      .sort({ created_date: -1 })
      .lean();
    res.json({ data: rows, meta: { credit_date: today } });
  } catch (err) {
    res.status(500).json({ error: "Credit history fetch failed", details: err.message });
  }
};

const giveCredit = async (req, res) => {
  try {
    const { items = [], userId, userName, user } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items is required" });
    }

    const todayStr = ymdToday();
    const nowIso = new Date().toISOString();

    const customerIds = Array.from(
      new Set(items.map((i) => i.customer_id).filter(Boolean))
    );
    const customers = await CustomerData.find({ customer_id: { $in: customerIds } }).lean();
    const custMap = new Map(customers.map((c) => [c.customer_id, c]));

    const customerOps = [];
    const historyDocs = [];
    const activityDocs = [];

    items.forEach((row) => {
      const cid = row.customer_id;
      if (!cid) return;
      const customer = custMap.get(cid);
      if (!customer) return;

      const newCreditLimit = Math.max(0, Math.trunc(Number(row.requiredBalance || row.credit_limit || 0)));

      customerOps.push({
        updateOne: {
          filter: { customer_id: cid },
          update: { $set: { credit_limit: newCreditLimit, updated_date: nowIso } },
        },
      });

      historyDocs.push({
        txn_id: generateTxnId(),
        credit_limit: newCreditLimit,
        customer_phone: customer.customer_phone,
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        status: "1",
        user: user || "Admin",
        created_date: nowIso,
        credit_date: todayStr,
        user_name: userName,
        userId,
      });

      activityDocs.push({
        customer_id: cid,
        user: user || "Admin",
        description: `Credit limit updated to ${newCreditLimit} by ${userName || "Admin"}`,
        created_date: nowIso,
        action: "Credit Limit",
        object: "Customer",
        customer_name: customer.customer_name,
        customer_phone: customer.customer_phone,
        customer_address: customer.customer_address,
        hub_name: customer.hub_name,
        delivery_exe_id: customer.delivery_exe_id,
      });
    });

    if (customerOps.length) await CustomerData.bulkWrite(customerOps, { ordered: false });
    if (historyDocs.length) await CreditLimitHistory.insertMany(historyDocs, { ordered: false });
    if (activityDocs.length) await CustomerActivities.insertMany(activityDocs, { ordered: false });

    res.json({ ok: true, updated: customerOps.length });
  } catch (err) {
    res.status(500).json({ error: "Give credit failed", details: err.message });
  }
};

const lifecycleOptions = async (_req, res) => {
  try {
    const [hubs, sources] = await Promise.all([
      CustomerData.distinct("hub_name"),
      CustomerData.distinct("source"),
    ]);
    res.json({
      hubs: (hubs || []).filter(Boolean).sort(),
      sources: (sources || []).filter(Boolean).sort(),
    });
  } catch (err) {
    res.status(500).json({ error: "Lifecycle options failed", details: err.message });
  }
};

const lifecycleReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerStage,
      hubName,
      source,
      lastDeliveryDate,
      daysSinceLastOrder,
    } = req.body || {};

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const start = parseYmd(startDate);
    const end = parseYmd(endDate);
    if (!start || !end) {
      return res.status(400).json({ error: "Invalid startDate/endDate" });
    }

    const customers = await CustomerData.aggregate([
      {
        $addFields: {
          registered_date_parsed: {
            $dateFromString: {
              dateString: "$registered_date",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $match: {
          registered_date_parsed: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          registered_date_parsed: 0,
        },
      },
    ]);

    const customerIds = customers.map((c) => c.customer_id).filter(Boolean);
    if (!customerIds.length) return res.json({ data: [] });

    const [ordersAgg, paymentsAgg, walletAgg, activeSubsAgg, allSubsAgg, execs] =
      await Promise.all([
        OrderHistory.aggregate([
          { $match: { customer_id: { $in: customerIds } } },
          { $sort: { delivery_timestamp: -1 } },
          {
            $group: {
              _id: "$customer_id",
              orderCount: { $sum: 1 },
              totalOrderAmount: { $sum: { $ifNull: ["$total_amount", 0] } },
              lastDeliveryDate: { $first: "$delivery_timestamp" },
              lastOrderAmount: { $first: "$total_amount" },
              firstOrderDate: { $last: "$delivery_timestamp" },
            },
          },
        ]),
        Payments.aggregate([
          {
            $addFields: {
              timestamp_parsed: {
                $dateFromString: {
                  dateString: "$timestamp",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },
          { $match: { customer_id: { $in: customerIds } } },
          { $sort: { timestamp_parsed: -1 } },
          {
            $group: {
              _id: "$customer_id",
              lastRechargeDate: { $first: "$timestamp_parsed" },
              totalRechargeAmount: { $sum: { $ifNull: ["$amount", 0] } },
            },
          },
        ]),
        WalletHistory.aggregate([
          {
            $addFields: {
              created_date_parsed: {
                $dateFromString: {
                  dateString: "$created_date",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },
          { $match: { customer_id: { $in: customerIds } } },
          { $sort: { created_date_parsed: -1 } },
          {
            $group: {
              _id: "$customer_id",
              ledger_balance: { $first: "$current_wallet_balance" },
            },
          },
        ]),
        SubscriptionsData.aggregate([
          { $match: { customer_id: { $in: customerIds }, status: "1" } },
          { $group: { _id: "$customer_id", activeSubCount: { $sum: 1 } } },
        ]),
        SubscriptionsData.aggregate([
          { $match: { customer_id: { $in: customerIds } } },
          {
            $group: {
              _id: "$customer_id",
              count: { $sum: 1 },
              types: { $addToSet: "$subscription_type" },
            },
          },
        ]),
        HubsUsersData.find({ hub_user_id: { $in: customers.map((c) => c.delivery_exe_id).filter(Boolean) } })
          .lean(),
      ]);

    const ordersMap = new Map(ordersAgg.map((o) => [o._id, o]));
    const paymentsMap = new Map(paymentsAgg.map((p) => [p._id, p]));
    const walletMap = new Map(walletAgg.map((w) => [w._id, w]));
    const activeSubsMap = new Map(activeSubsAgg.map((s) => [s._id, s]));
    const allSubsMap = new Map(allSubsAgg.map((s) => [s._id, s]));
    const execMap = new Map(
      execs.map((e) => [e.hub_user_id, `${e.first_name || ""} ${e.last_name || ""}`.trim() || "N/A"])
    );

    const now = new Date();
    const daysMin = daysSinceLastOrder ? Number(daysSinceLastOrder) : null;
    const lastDeliveryYmd = lastDeliveryDate ? formatDateOnly(new Date(lastDeliveryDate)) : null;

    const data = customers
      .map((c) => {
        const cid = c.customer_id;
        const o = ordersMap.get(cid) || {};
        const p = paymentsMap.get(cid) || {};
        const w = walletMap.get(cid) || {};
        const a = activeSubsMap.get(cid) || {};
        const all = allSubsMap.get(cid) || { count: 0, types: [] };

        const orderCount = Number(o.orderCount || 0);
        const totalOrderAmount = Number(o.totalOrderAmount || 0);
        const lastDelivery = o.lastDeliveryDate ? new Date(o.lastDeliveryDate) : null;
        const firstOrder = o.firstOrderDate ? new Date(o.firstOrderDate) : null;
        const lastOrderAmount = Number(o.lastOrderAmount || 0);

        const monthsLifespan =
          firstOrder && lastDelivery
            ? Math.max(1, (now.getFullYear() - firstOrder.getFullYear()) * 12 + (now.getMonth() - firstOrder.getMonth()) || 1)
            : 1;
        const avgOrderValue = orderCount ? totalOrderAmount / orderCount : 0;
        const purchaseFrequency = orderCount / monthsLifespan;
        const LTV = Math.round(avgOrderValue * purchaseFrequency * monthsLifespan);

        const daysSince =
          lastDelivery ? Math.floor((now.getTime() - lastDelivery.getTime()) / (1000 * 60 * 60 * 24)) : null;

        let stage = "Lead";
        const types = Array.isArray(all.types) ? all.types : [];
        if (all.count === 0) stage = "Lead";
        else if (all.count > 1 || types.some((t) => t !== "One Time")) stage = "Subscriber";
        else if (all.count === 1 && types[0] === "One Time") stage = "Customer";

        return {
          ...c,
          orderCount,
          lastDeliveryDate: lastDelivery,
          lastOrderAmount,
          daysSinceLastOrder: daysSince,
          LTV,
          totalOrderAmount,
          lastRechargeDate: p.lastRechargeDate ? new Date(p.lastRechargeDate) : null,
          totalRechargeAmount: Number(p.totalRechargeAmount || 0),
          ledger_balance: w.ledger_balance ?? "0",
          activeSubCount: a.activeSubCount ?? "-",
          customer_stage: stage,
          delivery_boy_name: c.delivery_exe_id ? execMap.get(c.delivery_exe_id) || "N/A" : "N/A",
        };
      })
      .filter((row) => {
        if (customerStage && row.customer_stage !== customerStage) return false;
        if (hubName && row.hub_name !== hubName) return false;
        if (source && String(row.source || "").toLowerCase().indexOf(String(source).toLowerCase()) === -1) return false;
        if (lastDeliveryYmd) {
          const d = row.lastDeliveryDate ? formatDateOnly(new Date(row.lastDeliveryDate)) : "";
          if (d !== lastDeliveryYmd) return false;
        }
        if (daysMin !== null && daysMin !== undefined && daysMin !== "") {
          if (row.daysSinceLastOrder === null || row.daysSinceLastOrder < daysMin) return false;
        }
        return true;
      });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Lifecycle report failed", details: err.message });
  }
};

module.exports = {
  lowCreditReport,
  todayCreditHistory,
  giveCredit,
  lifecycleOptions,
  lifecycleReport,
};

