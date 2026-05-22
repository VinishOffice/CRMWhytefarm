import apiClient from "./apiClient";

export const createCustomerActivity = async (activityData) => {
  return apiClient.post("/api/customer_activities", {
    ...activityData,
    date: activityData.date || new Date().toISOString(),
    created_date: activityData.created_date || new Date().toISOString(),
  });
};

export const getCustomerActivities = async (customerId, limit = 50) => {
  return apiClient.post("/api/customer_activities/query", {
    filters: [{ field: "customer_id", op: "==", value: customerId }],
    orderBy: [{ field: "created_date", direction: "desc" }],
    limit,
  });
};

export const searchCustomerActivities = async (filters, limit = 50) => {
  return apiClient.post("/api/customer_activities/query", {
    filters,
    orderBy: [{ field: "created_date", direction: "desc" }],
    limit,
  });
};
