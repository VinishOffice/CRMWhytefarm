const Customers = require("../models/schemas/customersData");
const WalletHistory = require("../models/schemas/walletHistory");
const Payments = require("../models/schemas/payments");
const OrderHistory = require("../models/schemas/orderHistory");
const Subscriptions = require("../models/schemas/subscriptionsData");
const HubsUsers = require("../models/schemas/hubsUsersData");

const getLatestMap = (docs, keyField) => {
  const map = {};
  docs.forEach((d) => {
    const id = String(d[keyField] || "");
    if (id && !map[id]) map[id] = d;
  });
  return map;
};

const report = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const [customers, hubsUsers, wallet, payments, deliveries, subs, total] =
      await Promise.all([
        Customers.find({}).skip(skip).limit(limit).lean(),
        HubsUsers.find({}).lean(),
        WalletHistory.find({})
          .sort({ timestamp: -1, created_date: -1, _id: -1 })
          .limit(1000)
          .lean(),
        Payments.find({})
          .sort({ timestamp: -1, created_date: -1, _id: -1 })
          .limit(1000)
          .lean(),
        OrderHistory.find({})
          .sort({ delivery_timestamp: -1, created_date: -1, _id: -1 })
          .limit(1000)
          .lean(),
        Subscriptions.find({}).lean(),
        Customers.countDocuments({}),
      ]);

    const hubUsersMap = {};
    hubsUsers.forEach((u) => {
      const deliveryUserId = u.hub_user_id || u._id;
      const deliveryUserName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
      if (deliveryUserId) {
        hubUsersMap[String(deliveryUserId)] = deliveryUserName || "-";
      }
    });

    const walletMap = getLatestMap(wallet, "customer_id");
    const rechargeMap = getLatestMap(payments, "customer_id");
    const deliveryMap = getLatestMap(deliveries, "customer_id");
    const subMap = getLatestMap(subs, "customer_id");

    const result = customers.map((c) => {
      const customer_id = String(c.customer_id || "");
      const walletData = walletMap[customer_id];
      const rechargeData = rechargeMap[customer_id];
      const deliveryData = deliveryMap[customer_id];
      const nextSubData = subMap[customer_id];

      const wallet_balance =
        walletData?.current_wallet_balance ?? c.wallet_balance ?? 0;

      const lastRecharge = rechargeData?.timestamp || rechargeData?.created_date || null;
      const lastDelivery =
        deliveryData?.delivery_timestamp || deliveryData?.created_date || null;

      let next_delivery_date = null;
      const ts = nextSubData?.next_delivery_date;
      if (ts) next_delivery_date = ts;

      const delivery_boy_id = c.delivery_boy_id || c.delivery_exe_id;
      const delivery_boy = hubUsersMap[String(delivery_boy_id)] || "-";

      return {
        ...c,
        wallet_balance,
        current_wallet_balance: wallet_balance,
        lastRecharge,
        lastDelivery,
        next_delivery_date,
        delivery_boy,
      };
    });

    res.json({
      data: result,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Wallet report failed", details: err.message });
  }
};

const reconcile = async (req, res) => {
  try {
    const { customer_id, last_correct_txn_id } = req.body || {};
    if (!customer_id || !last_correct_txn_id) {
      return res.status(400).json({ error: "customer_id and last_correct_txn_id are required" });
    }

    const txns = await WalletHistory.find({ customer_id: String(customer_id) })
      .sort({ created_date: -1, timestamp: -1, _id: -1 })
      .lean();

    let final_balance = null;
    const wrong = [];

    for (const t of txns) {
      if (t.txn_id !== last_correct_txn_id) {
        wrong.push(t);
      } else {
        final_balance = Number(t.current_wallet_balance);
        break;
      }
    }

    if (final_balance === null) {
      return res.status(404).json({ error: "Last correct transaction not found" });
    }

    wrong.reverse();

    for (const t of wrong) {
      const type = (t.type || "").toLowerCase();
      if (type === "credit") final_balance += Number(t.amount || 0);
      if (type === "debit") final_balance -= Number(t.amount || 0);
      await WalletHistory.updateOne(
        { _id: t._id },
        { $set: { current_wallet_balance: final_balance } }
      );
    }

    await Customers.updateOne(
      { customer_id: String(customer_id) },
      { $set: { wallet_balance: final_balance } }
    );

    res.json({ ok: true, wallet_balance: final_balance });
  } catch (err) {
    res.status(500).json({ error: "Reconcile failed", details: err.message });
  }
};

const verifyLedger = async (req, res) => {
  try {
    const { customer_id } = req.body || {};
    if (!customer_id) {
      return res.status(400).json({ error: "customer_id is required" });
    }

    const txns = await WalletHistory.find({ customer_id: String(customer_id) })
      .sort({ created_date: 1, timestamp: 1, _id: 1 })
      .lean();

    let calculated_balance = 0;
    txns.forEach((t) => {
      const type = (t.type || "").toLowerCase();
      const amt = Number(t.amount || 0);
      if (type === "credit") calculated_balance += amt;
      else if (type === "debit") calculated_balance -= amt;
    });

    const customer = await Customers.findOne({ customer_id: String(customer_id) }).lean();
    const current_balance = customer?.wallet_balance ?? 0;

    res.json({
      customer_id,
      calculated_balance,
      current_balance,
      in_sync: Math.abs(calculated_balance - current_balance) < 0.01,
      diff: calculated_balance - current_balance,
    });
  } catch (err) {
    res.status(500).json({ error: "Verify ledger failed", details: err.message });
  }
};

module.exports = { report, reconcile, verifyLedger };
