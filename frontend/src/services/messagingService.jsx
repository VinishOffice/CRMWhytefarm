import apiClient from "./apiClient";

export const sendWatiTemplateMessage = async (payload) => {
  const { data } = await apiClient.post("/api/messaging/wati/send-template", payload);
  return data;
};

export const fetchWatiTemplates = async () => {
  const { data } = await apiClient.get("/api/messaging/wati/templates");
  return data;
};

export const fetchTextLocalTemplates = async () => {
  const { data } = await apiClient.get("/api/messaging/textlocal/templates");
  return data;
};

export const sendTextLocalSms = async (payload) => {
  const { data } = await apiClient.post("/api/messaging/textlocal/send-sms", payload);
  return data;
};

