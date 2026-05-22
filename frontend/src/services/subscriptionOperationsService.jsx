import apiClient from "./apiClient";

export const fetchSubscriptionOptions = async () => {
  const { data } = await apiClient.get("/api/subscriptions/operations/options");
  return data;
};

export const fetchSubscriptionReport = async (payload) => {
  const { data } = await apiClient.post("/api/subscriptions/operations/report", payload);
  return data;
};

export const fetchFutureOrders = async (payload) => {
  const { data } = await apiClient.post("/api/subscriptions/operations/future-orders", payload);
  return data;
};

export const fetchPausedSubscriptions = async (payload) => {
  const { data } = await apiClient.post("/api/subscriptions/operations/paused", payload);
  return data;
};

export const fetchAutoPausedSubscriptions = async (payload) => {
  const { data } = await apiClient.post("/api/subscriptions/operations/auto-paused", payload);
  return data;
};

export const fetchCurrentSubscriptions = async (payload) => {
  const { data } = await apiClient.post("/api/subscriptions/operations/current", payload);
  return data;
};

export const createCashCollection = async (payload) => {
  const { data } = await apiClient.post("/api/cash_collection", { data: payload });
  return data;
};

export const createRechargeLink = async (payload) => {
  const { data } = await apiClient.post("/api/recharge_link", { data: payload });
  return data;
};
