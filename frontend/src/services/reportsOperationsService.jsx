import apiClient from "./apiClient";

export const fetchReportOptions = async () => {
  const { data } = await apiClient.get("/api/reports/operations/options");
  return data;
};

export const fetchCumulativeSalesReport = async (payload) => {
  const { data } = await apiClient.post("/api/reports/operations/cumulative-sales", payload);
  return data;
};

export const fetchSalesReport = async (payload) => {
  const { data } = await apiClient.post("/api/reports/operations/sales", payload);
  return data;
};

export const fetchReturnReport = async (payload) => {
  const { data } = await apiClient.post("/api/reports/operations/return", payload);
  return data;
};

