const mongoose = require("mongoose");
const OrderHistory = require("../models/schemas/orderHistory");
const Orders = require("../models/schemas/orders");
const Customers = require("../models/schemas/customersData");
const HubsUsers = require("../models/schemas/hubsUsersData");
const Hubs = require("../models/schemas/hubsData");
const Products = require("../models/schemas/productsData");
const Subscriptions = require("../models/schemas/subscriptionsData");
const CashCollection = require("../models/schemas/cashCollection");
const CustomerActivities = require("../models/schemas/customerActivities");
const CafeMaster = require("../models/schemas/cafeMaster");

// dynamic models for collections not in strict schemas
const b2bOrdersSchema = new mongoose.Schema({}, { strict: false });
const B2bOrders =
  mongoose.models["b2b_orders"] ||
  mongoose.model("b2b_orders", b2bOrdersSchema, "b2b_orders");

const report = async (req, res) => {
  try {
    const { deliveryDate, hubName, deliveryExeId, status, orderType } =
      req.body || {};

    const query = {};
    if (deliveryDate) query.delivery_date = deliveryDate;
    if (hubName) query.hub_name = hubName;
    if (deliveryExeId) query.delivery_exe_id = deliveryExeId;
    if (status) query.status = status;
    if (orderType) query.order_type = orderType;

    const orders = await OrderHistory.find(query).lean();

    const uniqueOrdersMap = new Map();
    let delivered = 0;
    let pending = 0;
    let cancelled = 0;

    for (const order of orders) {
      if (!uniqueOrdersMap.has(order.order_id)) {
        uniqueOrdersMap.set(order.order_id, order);
        if (order.status === "0") pending += 1;
        else if (order.status === "1") delivered += 1;
        else if (order.status === "2") cancelled += 1;
      }
    }

    const uniqueOrders = Array.from(uniqueOrdersMap.values()).sort((a, b) =>
      (a.customer_name || "").localeCompare(b.customer_name || "")
    );

    const deliveryExecs = await HubsUsers.find({ role: "Delivery Executive" })
      .lean();
    const deliveryExecutivesMap = {};
    deliveryExecs.forEach((d) => {
      deliveryExecutivesMap[d.hub_user_id] = `${d.first_name || ""} ${
        d.last_name || ""
      }`.trim();
    });

    res.json({
      orders: uniqueOrders,
      counts: { delivered, pending, cancelled },
      deliveryExecutivesMap,
    });
  } catch (err) {
    res.status(500).json({ error: "Order report failed", details: err.message });
  }
};

const sheet = async (req, res) => {
  try {
    const { date, hubName, deliveryExeId } = req.body || {};
    if (!date || !hubName) {
      return res.status(400).json({ error: "date and hubName are required" });
    }

    const query = {
      delivery_date: date,
      hub_name: hubName,
      status: { $ne: "2" },
    };
    if (deliveryExeId) query.delivery_exe_id = deliveryExeId;

    const orders = await OrderHistory.find(query).sort({ location: 1 }).lean();
    const customerIds = Array.from(
      new Set(orders.map((o) => String(o.customer_id)))
    ).filter(Boolean);

    const customers = await Customers.find({
      customer_id: { $in: customerIds },
    }).lean();

    const walletMap = {};
    customers.forEach((c) => {
      walletMap[String(c.customer_id)] = c.wallet_balance || 0;
    });

    res.json({ orders, walletMap });
  } catch (err) {
    res.status(500).json({ error: "Order sheet failed", details: err.message });
  }
};

const hubDeliveryOptions = async (_req, res) => {
  try {
    const [hubs, products] = await Promise.all([
      Hubs.find({}).lean(),
      Products.find({}).lean(),
    ]);
    res.json({ hubs, products });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Options fetch failed", details: err.message });
  }
};

const hubDeliveryReport = async (req, res) => {
  try {
    const { date, reportType, hubName, productName, packageUnit } = req.body || {};
    if (!date) return res.status(400).json({ error: "date is required" });

    const match = { delivery_date: date };
    if (hubName) match.hub_name = hubName;
    if (productName) match.product_name = productName;
    if (packageUnit) match.package_unit = packageUnit;

    const groupId = reportType === "Hubwise" ? {
      hub_name: "$hub_name",
      product_name: "$product_name",
      package_unit: "$package_unit",
    } : {
      product_name: "$product_name",
      package_unit: "$package_unit",
    };

    const data = await OrderHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupId,
          quantity: { $sum: "$quantity" },
          unit_price: { $first: "$price" },
          category: { $first: "$category" },
        },
      },
      {
        $project: {
          _id: 0,
          hub_name: "$_id.hub_name",
          product_name: "$_id.product_name",
          packaging: "$_id.package_unit",
          unit_price: 1,
          category: 1,
          quantity: 1,
        },
      },
      { $sort: { product_name: 1 } },
    ]);

    res.json({ data });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Hub delivery report failed", details: err.message });
  }
};

const b2bSummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date is required" });

    const orders = await B2bOrders.find({ delivery_date: date }).lean();
    const cafeIds = orders.map((o) => o.cafe_id).filter(Boolean);
    const cafes = await CafeMaster.find({ cafe_id: { $in: cafeIds } }).lean();
    const cafeMap = {};
    cafes.forEach((c) => {
      cafeMap[c.cafe_id] = c.cafe_location || "";
    });

    const data = orders.map((d) => ({
      id: d._id,
      cafe_id: d.cafe_id,
      cafe_name: d.delivering_to || d.cafe_name || "",
      cafe_location: d.cafe_location || cafeMap[d.cafe_id] || "",
      order_date: d.delivery_timestamp || d.created_date || null,
      status: d.status === 1 ? "delivered" : d.status === 2 ? "cancelled" : "pending",
      total_qty: d.quantity || d.total_quantity || 0,
    }));

    const total = data.reduce((s, o) => s + Number(o.total_qty || 0), 0);
    const delivered = data
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + Number(o.total_qty || 0), 0);
    const pending = data
      .filter((o) => o.status === "pending")
      .reduce((s, o) => s + Number(o.total_qty || 0), 0);

    res.json({ orders: data, summary: [delivered, pending, total] });
  } catch (err) {
    res.status(500).json({ error: "B2B summary failed", details: err.message });
  }
};

const b2bMissing = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date is required" });

    const cafes = await CafeMaster.find({}).lean();
    const orders = await B2bOrders.find({ delivery_date: date }).lean();
    const orderedIds = new Set(
      orders.map((o) => String(o.cafe_id || "").trim().toLowerCase())
    );

    const missing = cafes
      .filter((c) => (c.type || "").toLowerCase() === "cafe")
      .filter((c) => {
        const id = String(c.cafe_id || "").trim().toLowerCase();
        return id && !orderedIds.has(id);
      })
      .map((c) => ({
        cafe_id: String(c.cafe_id || "").trim().toLowerCase(),
        cafe_name: c.cafe_name || "(No Name)",
        type: c.type || "-",
        cafe_location: c.cafe_location || c.cafe_address || "-",
      }));

    res.json({ data: missing });
  } catch (err) {
    res.status(500).json({ error: "Missing cafes failed", details: err.message });
  }
};

const onetimeReport = async (req, res) => {
  try {
    const { date, hubName, deliveryExeId, status, firstTime } = req.body || {};
    const query = { order_type: "OT" };
    if (date) query.delivery_date = date;
    if (hubName) query.hub_name = hubName;
    if (deliveryExeId) query.delivery_exe_id = deliveryExeId;
    if (status) query.status = status;

    let orders = await OrderHistory.find(query).lean();

    if (firstTime) {
      const filtered = [];
      for (const order of orders) {
        const count = await OrderHistory.countDocuments({
          customer_id: order.customer_id,
          product_name: order.product_name,
          delivery_date: { $lt: order.delivery_date },
        });
        if (count === 0) filtered.push(order);
      }
      orders = filtered;
    }

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "One-time report failed", details: err.message });
  }
};

const codList = async (_req, res) => {
  try {
    const orders = await Orders.find({}).sort({ createdAt: -1 }).lean();
    const enriched = orders.map((o) => ({ ...o, platform: "Website" }));
    res.json({ orders: enriched });
  } catch (err) {
    res.status(500).json({ error: "COD list failed", details: err.message });
  }
};

const codUpdateItem = async (req, res) => {
  try {
    const {
      customer_id,
      next_delivery_date,
      product,
      qty,
      price_per_unit,
      status,
      reason,
      agent_name,
    } = req.body || {};

    if (!customer_id || !next_delivery_date || !product) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orders = await Orders.find({ customer_id: customer_id }).lean();
    for (const doc of orders) {
      const updatedItems = (doc.items || []).map((item) =>
        item.next_delivery_date === next_delivery_date &&
        item.product === product &&
        item.qty === qty &&
        item.price_per_unit === price_per_unit
          ? {
              ...item,
              status,
              updatedAt: new Date(),
              requested_at: new Date(),
              cancel_reason: status === "Reject" ? reason : null,
              agent_name,
            }
          : item
      );
      await Orders.updateOne(
        { _id: doc._id },
        { $set: { items: updatedItems, updatedAt: new Date() } }
      );
    }

    if (status === "Accept") {
      const customer = await Customers.findOne({ customer_id }).lean();
      const productDoc = await Products.findOne({ productName: product }).lean();

      if (customer && productDoc) {
        const SID = `${Date.now()}`;
        const subscriptionData = {
          coupon_code: "",
          created_date: new Date(),
          customer_address: customer.customer_address,
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          customer_phone: customer.customer_phone,
          delivered_by: customer.hub_name,
          delivering_to: customer.customer_address,
          end_date: null,
          friday: 0,
          hub_name: customer.hub_name,
          next_delivery_date,
          package_unit:
            productDoc.packagingOptions?.[0]?.packaging +
            productDoc.packagingOptions?.[0]?.pkgUnit,
          price: price_per_unit,
          product_name: product,
          quantity: qty,
          resume_date: null,
          saturday: 0,
          status: "1",
          subscription_id: SID,
          subscription_type: "One Time",
          sunday: 0,
          thrusday: 0,
          tuesday: 0,
          updated_date: new Date(),
          wednesday: 0,
        };
        await Subscriptions.create(subscriptionData);

        const newCredit = Number(customer.credit_limit || 0) +
          Number(qty * price_per_unit || 0);
        await Customers.updateOne(
          { customer_id },
          { $set: { credit_limit: newCredit, updated_date: new Date() } }
        );

        const exec = await HubsUsers.findOne({ hub_user_id: customer.delivery_exe_id }).lean();
        const cashData = {
          amount: qty * price_per_unit,
          collected_amount: 0,
          created_date: new Date(),
          customer_address: customer.customer_address,
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          customer_phone: customer.customer_phone,
          date: next_delivery_date,
          delivery_exe_id: customer.delivery_exe_id,
          delivery_executive_name: exec ? `${exec.first_name || ""}${exec.last_name || ""}` : "",
          delivery_executive_phone: exec?.phone_no || "",
          description: "",
          status: 0,
          updated_date: new Date(),
        };
        await CashCollection.create(cashData);

        const logData = {
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          customer_phone: customer.customer_phone,
          customer_address: customer.customer_address,
          hub_name: customer.hub_name,
          delivery_exe_id: customer.delivery_exe_id,
          user: agent_name,
          object: "Order",
          action: "One-Time Order",
          description: `One-Time order is created with Subscription ID: ${SID} by ${agent_name}`,
          date: new Date(),
          created_date: new Date(),
        };
        await CustomerActivities.create(logData);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "COD update failed", details: err.message });
  }
};

module.exports = {
  report,
  sheet,
  hubDeliveryOptions,
  hubDeliveryReport,
  b2bSummary,
  b2bMissing,
  onetimeReport,
  codList,
  codUpdateItem,
};
