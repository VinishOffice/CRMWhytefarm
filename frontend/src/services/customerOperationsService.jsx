import apiClient from "./apiClient";

export const fetchLowCreditReport = async (payload) => {
  const { data } = await apiClient.post("/api/customers/operations/low-credit-report", payload);
  return data;
};

export const fetchTodayCreditHistory = async () => {
  const { data } = await apiClient.get("/api/customers/operations/credit-history/today");
  return data;
};

export const giveCreditToCustomers = async (payload) => {
  const { data } = await apiClient.post("/api/customers/operations/give-credit", payload);
  return data;
};

export const fetchLifecycleOptions = async () => {
  const { data } = await apiClient.get("/api/customers/operations/lifecycle/options");
  return data;
};

export const fetchLifecycleReport = async (payload) => {
  const { data } = await apiClient.post("/api/customers/operations/lifecycle/report", payload);
  return data;
};

