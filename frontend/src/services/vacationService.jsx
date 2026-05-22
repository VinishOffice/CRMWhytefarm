import apiClient from "./apiClient";
import { toDate } from "../utils/dateUtils";

export const checkVacationStatus = async (customerId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  try {
    const res = await apiClient.post("/api/customers_vacation/query", {
      filters: [{ field: "customer_id", op: "==", value: customerId }]
    });
    const vacationQuerySnapshot = res.data?.data || [];

    let onVacation = false;
    vacationQuerySnapshot.forEach((vacationData) => {
      const startDate = toDate(vacationData.start_date);
      if (!startDate) return;
      startDate.setHours(0, 0, 0, 0);
      const endDate = toDate(vacationData.end_date);
      if (!endDate) return;
      endDate.setHours(23, 59, 59, 999);
      if (today >= startDate && today <= endDate) {
        onVacation = true;
      }
    });

    return onVacation;
  } catch (error) {
    console.error("Error fetching vacation data:", error);
    return false;
  }
};

export const checkOverlap = (newStart, newEnd, existingVacations, editId = null) => {
  const start = new Date(newStart).setHours(0, 0, 0, 0);
  const end = new Date(newEnd).setHours(23, 59, 59, 999);

  return existingVacations.some((vacation) => {
    if (editId && (vacation.id === editId || vacation._id === editId)) {
      return false;
    }
    const vacationStart = toDate(vacation.start_date).setHours(0, 0, 0, 0);
    const vacationEnd = toDate(vacation.end_date).setHours(23, 59, 59, 999);

    return (
      (start >= vacationStart && start <= vacationEnd) ||
      (end >= vacationStart && end <= vacationEnd) ||
      (start <= vacationStart && end >= vacationEnd)
    );
  });
};

export const addVacation = async (vacationData) => {
  // We'll perform the overlap check in the component or here
  return apiClient.post("/api/customers_vacation", vacationData);
};

export const updateVacation = async (id, vacationData) => {
  return apiClient.patch(`/api/customers_vacation/${id}`, vacationData);
};

export const getVacations = async (customerId) => {
  return apiClient.post("/api/customers_vacation/query", {
    filters: [{ field: "customer_id", op: "==", value: customerId }]
  });
};
