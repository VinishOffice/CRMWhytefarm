import apiClient from "./apiClient";

export const createPaymentLink = async (payload) => {
  const { data } = await apiClient.post("/api/payments/operations/create-payment-link", payload);
  return data;
};

