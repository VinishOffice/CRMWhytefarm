import apiClient from "./apiClient";

export const fetchKnowlarityCallLogs = async (customerPhone) => {
  const { data } = await apiClient.get("/api/telephony/knowlarity/calllogs", {
    params: { customerPhone },
  });
  return data;
};

export const makeKnowlarityCall = async (payload) => {
  const { data } = await apiClient.post("/api/telephony/knowlarity/makecall", payload);
  return data;
};

