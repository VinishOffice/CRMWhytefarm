const { getModel } = require("../models/dynamicModel");

const buildMongoQuery = (filters = []) => {
  const query = {};
  filters.forEach(({ field, op, value }) => {
    switch (op) {
      case "==":
        query[field] = value;
        break;
      case "!=":
        query[field] = { $ne: value };
        break;
      case ">":
        query[field] = { $gt: value };
        break;
      case ">=":
        query[field] = { $gte: value };
        break;
      case "<":
        query[field] = { $lt: value };
        break;
      case "<=":
        query[field] = { $lte: value };
        break;
      case "in":
        query[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
      case "array-contains":
        query[field] = value;
        break;
      case "array-contains-any":
        query[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
      default:
        query[field] = value;
        break;
    }
  });
  return query;
};

const list = async (req, res) => {
  try {
    const { collection } = req.params;
    const Model = getModel(collection);
    const data = await Model.find({}).lean();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "List failed", details: err.message });
  }
};

const query = async (req, res) => {
  try {
    const { collection } = req.params;
    const { filters = [], orderBy = [], limit, skip, countOnly } = req.body || {};
    const Model = getModel(collection);
    const mongoQuery = buildMongoQuery(filters);
    let cursor = Model.find(mongoQuery);

    if (orderBy && orderBy.length > 0) {
      const sort = {};
      orderBy.forEach((o) => {
        if (o?.field) sort[o.field] = o.direction === "desc" ? -1 : 1;
      });
      cursor = cursor.sort(sort);
    }

    if (typeof skip === "number") cursor = cursor.skip(skip);
    if (typeof limit === "number") cursor = cursor.limit(limit);

    if (countOnly) {
      const count = await Model.countDocuments(mongoQuery);
      return res.json({ count });
    }

    const data = await cursor.lean();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Query failed", details: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { collection, id } = req.params;
    const Model = getModel(collection);
    const data = await Model.findById(id).lean();
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Get failed", details: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { collection } = req.params;
    const { data } = req.body || {};
    if (!data) return res.status(400).json({ error: "data is required" });
    const Model = getModel(collection);
    const doc = await Model.create(data);
    res.json({ id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Create failed", details: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { data } = req.body || {};
    if (!data) return res.status(400).json({ error: "data is required" });
    const Model = getModel(collection);
    await Model.findByIdAndUpdate(id, { $set: data });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message });
  }
};

const set = async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { data } = req.body || {};
    if (!data) return res.status(400).json({ error: "data is required" });
    const Model = getModel(collection);
    await Model.findByIdAndUpdate(id, { $set: data }, { upsert: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Set failed", details: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { collection, id } = req.params;
    const Model = getModel(collection);
    await Model.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
};

module.exports = {
  list,
  query,
  getById,
  create,
  update,
  set,
  remove,
};
