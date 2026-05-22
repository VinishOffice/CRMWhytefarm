import apiClient from "./apiClient";

export const listCommunicationHistory = async () => {
  const { data } = await apiClient.get("/api/communication_history");
  return data;
};

export const createCommunicationHistory = async (payload) => {
  const { data } = await apiClient.post("/api/communication_history", { data: payload });
  return data;
};

