import apiClient from "./apiClient";

export const fetchPredictiveAnalysis = async (payload) => {
  const { data } = await apiClient.post("/api/analytics/operations/predictive-analysis", payload);
  return data;
};

