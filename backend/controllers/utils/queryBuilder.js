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

module.exports = { buildMongoQuery };
