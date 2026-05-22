import apiClient from "./apiClient";

export const fetchOrderReport = async (payload) => {
  const { data } = await apiClient.post("/api/orders/operations/report", payload);
  return data;
};

export const fetchOrderSheet = async (payload) => {
  const { data } = await apiClient.post("/api/orders/operations/sheet", payload);
  return data;
};

export const fetchHubDeliveryOptions = async () => {
  const { data } = await apiClient.get("/api/orders/operations/hub-delivery-options");
  return data;
};

export const fetchHubDeliveryReport = async (payload) => {
  const { data } = await apiClient.post("/api/orders/operations/hub-delivery-report", payload);
  return data;
};

export const fetchB2BSummary = async (date) => {
  const { data } = await apiClient.get("/api/orders/operations/b2b-summary", {
    params: { date },
  });
  return data;
};

export const fetchB2BMissing = async (date) => {
  const { data } = await apiClient.get("/api/orders/operations/b2b-missing", {
    params: { date },
  });
  return data;
};

export const fetchOnetimeReport = async (payload) => {
  const { data } = await apiClient.post("/api/orders/operations/onetime-report", payload);
  return data;
};

export const fetchCodList = async () => {
  const { data } = await apiClient.get("/api/orders/operations/cod");
  return data;
};

export const updateCodItem = async (payload) => {
  const { data } = await apiClient.post("/api/orders/operations/cod/update", payload);
  return data;
};

export const queryCollection = async (collection, payload) => {
  const { data } = await apiClient.post(`/api/${collection}/query`, payload);
  return data;
};

export const listCollection = async (collection) => {
  const { data } = await apiClient.get(`/api/${collection}`);
  return data;
};
