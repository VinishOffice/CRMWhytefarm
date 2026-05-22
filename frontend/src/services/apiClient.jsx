import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:5123");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default apiClient;
