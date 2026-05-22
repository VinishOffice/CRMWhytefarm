const mongoose = require("mongoose");
const Hubs = require("../models/schemas/hubsData");
const HubsUsers = require("../models/schemas/hubsUsersData");
const Products = require("../models/schemas/productsData");
const CashCollection = require("../models/schemas/cashCollection");

// Use loose model to support legacy fields not in strict schema
const looseSchema = new mongoose.Schema({}, { strict: false });
const OrderHistory =
  mongoose.models["order_history"] ||
  mongoose.model("order_history", looseSchema, "order_history");

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatYmd = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const options = async (_req, res) => {
  try {
    const [hubs, products, deliveryExecs] = await Promise.all([
      Hubs.find({}).lean(),
      Products.find({ publishOnApp: true }).lean(),
      HubsUsers.find({ role: "Delivery Executive" }).lean(),
    ]);

    res.json({
      hubs: hubs.map((h) => h.hub_name).filter(Boolean),
      products: products
        .map((p) => p.productName || p.product_name)
        .filter(Boolean),
      deliveryExecutives: deliveryExecs.map((d) => ({
        hub_user_id: d.hub_user_id,
        hub_name: d.hub_name,
        name: `${d.first_name || ""} ${d.last_name || ""}`.trim(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Report options failed", details: err.message });
  }
};

const cumulativeSales = async (req, res) => {
  try {
    const { startDate, endDate, hubName, deliveryExeId } = req.body || {};
    const start = toDate(startDate);
    const end = toDate(endDate);
    if (!start || !end) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const match = {
      delivery_timestamp: { $gte: start, $lte: end },
      status: { $ne: "2" },
    };
    if (hubName) match.hub_name = hubName;
    if (deliveryExeId) match.delivery_exe_id = deliveryExeId;

    const data = await OrderHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            product_name: "$product_name",
            package_unit: "$package_unit",
            price: "$price",
          },
          quantity: { $sum: { $toDouble: "$quantity" } },
          unit_price: { $first: "$price" },
        },
      },
      {
        $project: {
          _id: 0,
          product_name: "$_id.product_name",
          package_unit: "$_id.package_unit",
          price: "$_id.price",
          quantity: { $toInt: "$quantity" },
          totalSellingPrice: {
            $multiply: [{ $toDouble: "$_id.price" }, "$quantity"],
          },
        },
      },
      { $sort: { product_name: 1, package_unit: 1 } },
    ]);

    const totals = data.reduce(
      (acc, r) => {
        acc.quantity += Number(r.quantity || 0);
        acc.price += Number(r.totalSellingPrice || 0);
        return acc;
      },
      { quantity: 0, price: 0 }
    );

    res.json({ data, totals });
  } catch (err) {
    res.status(500).json({ error: "Cumulative sales failed", details: err.message });
  }
};

const salesReport = async (req, res) => {
  try {
    const { startDate, endDate, hubName, deliveryExeId, productName } = req.body || {};
    const start = toDate(startDate);
    const end = toDate(endDate);
    if (!start || !end) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const match = {
      delivery_date: { $gte: formatYmd(start), $lte: formatYmd(end) },
      status: { $ne: "2" },
    };
    if (hubName) match.hub_name = hubName;
    if (deliveryExeId) match.delivery_exe_id = deliveryExeId;
    if (productName) match.product_name = productName;

    const rows = await OrderHistory.find(match).lean();
    const data = rows.map((sale) => {
      const creditLimit = Number(sale.utilised_credit_limit) || 0;
      const walletBalance = Number(sale.utilised_wallet_balance) || 0;
      const fallback = Number(sale.total_amount) || 0;
      const total_amount =
        creditLimit === 0 && walletBalance === 0 ? fallback : creditLimit + walletBalance;
      return { ...sale, total_amount };
    });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Sales report failed", details: err.message });
  }
};

const returnReport = async (req, res) => {
  try {
    const { date, hubName } = req.body || {};
    if (!date || !hubName) {
      return res.status(400).json({ error: "date and hubName are required" });
    }
    const d = toDate(date);
    if (!d) return res.status(400).json({ error: "Invalid date" });
    const formattedDate = formatYmd(d);

    const orders = await OrderHistory.find({
      delivery_date: formattedDate,
      delivered_by: hubName,
    }).lean();

    const execMap = new Map(); // name -> report
    orders.forEach((order) => {
      const exec = order.delivery_executive || "N/A";
      if (!execMap.has(exec)) {
        execMap.set(exec, {
          delivery_executive: exec,
          phone_no: order.delivery_phone || "",
          hub_name: [],
          products: [],
          quantity: [],
          delivered: [],
          remaining: [],
        });
      }

      const r = execMap.get(exec);
      const hub = order.delivered_by || order.hub_name || "N/A";
      const product = order.product_name || "N/A";
      const qty = Number(order.quantity || 0);
      const deliveredStatus = order.status;
      const isDelivered = deliveredStatus === 1 || deliveredStatus === "1";

      if (!r.hub_name.includes(hub)) r.hub_name.push(hub);
      if (!r.products.includes(product)) {
        r.products.push(product);
        r.quantity.push(0);
        r.delivered.push(0);
        r.remaining.push(0);
      }
      const idx = r.products.indexOf(product);
      r.quantity[idx] += qty;
      if (isDelivered) r.delivered[idx] += qty;
      else r.remaining[idx] += qty;
    });

    const reportData = Array.from(execMap.values());

    const cashRows = await CashCollection.find({ date: formattedDate }).lean();
    const cashTotals = {};
    let totalAmount = 0;
    cashRows.forEach((row) => {
      const phone = row.delivery_executive_phone;
      const amount = Number(row.amount || 0);
      totalAmount += amount;
      if (!phone) return;
      cashTotals[phone] = (cashTotals[phone] || 0) + amount;
    });

    res.json({ data: reportData, cashTotals, totalAmount, date: formattedDate });
  } catch (err) {
    res.status(500).json({ error: "Return report failed", details: err.message });
  }
};

module.exports = { options, cumulativeSales, salesReport, returnReport };

