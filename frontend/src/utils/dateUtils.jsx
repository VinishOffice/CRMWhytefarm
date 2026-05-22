import moment from "moment";

export const toDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === "string") return new Date(dateValue);
  if (dateValue.seconds) return new Date(dateValue.seconds * 1000); // For Firestore-like timestamps if any
  return new Date(dateValue);
};

export const normalizeDateValue = (dateValue) => {
  const date = toDate(dateValue);
  if (date) {
    date.setHours(0, 0, 0, 0);
  }
  return date;
};

export const formatDisplayDate = (dateValue) => {
  return moment(toDate(dateValue)).format("DD-MM-YYYY");
};

export const formatApiDate = (dateValue) => {
  return moment(toDate(dateValue)).format("YYYY-MM-DD");
};

export const getTomorrowDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return today;
};

export const now = () => new Date();

export const fromDate = (date) => toDate(date);

export const serverTimestamp = () => new Date();

export const fromSecondsNanoseconds = (seconds, nanoseconds = 0) => {
  return new Date(seconds * 1000 + nanoseconds / 1000000);
};
