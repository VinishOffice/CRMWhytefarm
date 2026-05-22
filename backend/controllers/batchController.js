const mongoose = require("mongoose");
const { getModel } = require("../models/dynamicModel");

const commitBatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { operations = [] } = req.body || {};
    const results = [];

    for (const op of operations) {
      const Model = getModel(op.collection);
      let result;
      if (op.op === "set") {
        result = await Model.updateOne(
          { _id: op.id },
          { $set: op.data },
          { upsert: true, session }
        );
      } else if (op.op === "update") {
        result = await Model.updateOne(
          { _id: op.id },
          { $set: op.data },
          { session }
        );
      } else if (op.op === "delete") {
        result = await Model.deleteOne({ _id: op.id }, { session });
      }
      results.push(result);
    }

    await session.commitTransaction();
    res.json({ ok: true, results });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: "Batch failed", details: err.message });
  } finally {
    session.endSession();
  }
};

module.exports = { commitBatch };
