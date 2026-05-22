const { buildMongoQuery } = require("./utils/queryBuilder");

const createController = (Model) => ({
  list: async (_req, res) => {
    try {
      const data = await Model.find({}).lean();
      res.json({ data });
    } catch (err) {
      res.status(500).json({ error: "List failed", details: err.message });
    }
  },

  query: async (req, res) => {
    try {
      const { filters = [], orderBy = [], limit, skip, countOnly } = req.body || {};
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
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      // Use findOne instead of findById to handle both ObjectIds and string IDs
      const data = await Model.findOne({ _id: id }).lean();
      if (!data) return res.status(404).json({ error: "Not found" });
      res.json({ data });
    } catch (err) {
      res.status(500).json({ error: "Get failed", details: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body.data || req.body;
      if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: "data is required" });
      const doc = await Model.create(data);
      res.json({ id: doc._id });
    } catch (err) {
      res.status(500).json({ error: "Create failed", details: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body.data || req.body;
      if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: "data is required" });
      await Model.findByIdAndUpdate(id, { $set: data });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Update failed", details: err.message });
    }
  },

  set: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body.data || req.body;
      if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: "data is required" });
      await Model.findByIdAndUpdate(id, { $set: data }, { upsert: true });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Set failed", details: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;
      await Model.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Delete failed", details: err.message });
    }
  },
});

module.exports = { createController };
