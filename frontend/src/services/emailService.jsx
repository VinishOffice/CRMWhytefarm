import apiClient from "./apiClient";

export const listEmailsForCustomer = async (customer_email) => {
  const { data } = await apiClient.post("/api/email/list", { customer_email });
  return data;
};

export const sendCustomerEmail = async ({ subject, message, recipient }) => {
  const { data } = await apiClient.post("/api/email/send", { subject, message, recipient });
  return data;
};

