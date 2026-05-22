import apiClient from "./apiClient";

export const fetchWalletReport = async () => {
  const res = await apiClient.get("/api/wallet/report");
  return res.data?.data || [];
};

export const reconcileWallet = async (customer_id, last_correct_txn_id) => {
  const res = await apiClient.post("/api/wallet/reconcile", {
    customer_id,
    last_correct_txn_id,
  });
  return res.data;
};

export const verifyWalletLedger = async (customer_id) => {
  const res = await apiClient.post("/api/wallet/verify-ledger", { customer_id });
  return res.data;
};

export const getWalletHistory = async (customer_id, filters = {}) => {
  const queryParams = {
    filters: [{ field: "customer_id", op: "==", value: customer_id }],
    orderBy: [{ field: "created_date", direction: "desc" }]
  };

  if (filters.startDate) {
    queryParams.filters.push({ field: "created_date", op: ">=", value: filters.startDate });
  }
  if (filters.endDate) {
    queryParams.filters.push({ field: "created_date", op: "<=", value: filters.endDate });
  }
  if (filters.type && filters.type !== "all") {
    queryParams.filters.push({ field: "type", op: "==", value: filters.type });
  }

  const res = await apiClient.post("/api/wallet_history/query", queryParams);
  return res.data;
};

export const addWalletTransaction = async (data) => {
  const res = await apiClient.post("/api/wallet_history", data);
  return res.data;
};

export const getCreditLimitHistory = async (customer_id) => {
  const res = await apiClient.post("/api/credit_limit_history/query", {
    filters: [{ field: "customer_id", op: "==", value: customer_id }],
    orderBy: [{ field: "created_date", direction: "desc" }]
  });
  return res.data;
};

export const addCreditLimitHistory = async (data) => {
  const res = await apiClient.post("/api/credit_limit_history", data);
  return res.data;
};

export const updateCustomerData = async (internalId, updateData) => {
  const res = await apiClient.patch(`/api/customers_data/${internalId}`, updateData);
  return res.data;
};
