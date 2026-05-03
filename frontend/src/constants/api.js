import { Platform } from "react-native";

function normalizeApiBase(url) {
  return url.trim().replace(/\/+$/, "");
}

/** Reads EXPO_PUBLIC_API_BASE_URL from frontend/.env (Expo inlines at build). */
function resolveEnvApiBase() {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!raw || typeof raw !== "string") return null;
  let base = normalizeApiBase(raw);
  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }
  return base;
}

// Get your PC's IP address from `ipconfig`
const YOUR_PC_IP = "10.205.126.53";

const ANDROID_EMULATOR_API = "http://10.0.2.2:5000/api";
const PHYSICAL_PHONE_API = `http://${YOUR_PC_IP}:5000/api`;
const WEB_API = "http://localhost:5000/api";

// Set USE_EMULATOR = true for Android emulator, false for physical phone
const USE_EMULATOR = false;

export const API_BASE_URL = (() => {
  const fromEnv = resolveEnvApiBase();
  if (fromEnv) return fromEnv;

  if (Platform.OS === "android") {
    return USE_EMULATOR ? ANDROID_EMULATOR_API : PHYSICAL_PHONE_API;
  }
  return WEB_API;
})();

export const API_TIMEOUT_MS = 15000;

// ==================== API ENDPOINTS ====================
export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: "/auth/register",
  AUTH_LOGIN: "/auth/login",
  AUTH_PROFILE: "/auth/profile",
  AUTH_VERIFY_TOKEN: "/auth/verify-token",

  // Rooms
  ROOMS: "/rooms",
  ROOMS_AVAILABLE: "/rooms/available",
  ROOMS_STATISTICS: "/rooms/statistics",
  ROOMS_PUBLIC: "/rooms/public",
  ROOMS_SEARCH: "/rooms/search",
  ROOMS_SORT_PRICE: "/rooms/sort/price",
  ROOMS_TYPE: (type) => `/rooms/type/${type}`,
  ROOMS_STATUS: (status) => `/rooms/status/${status}`,
  ROOMS_CAPACITY: (capacity) => `/rooms/capacity/${capacity}`,
  ROOMS_PRICE_RANGE: "/rooms/price-range",
  ROOM_BY_ID: (id) => `/rooms/${id}`,
  ROOM_RESIDENTS: (id) => `/rooms/${id}/residents`,
  ROOM_IMAGES: (id) => `/rooms/${id}/images`,
  ROOM_IMAGE: (id, index) => `/rooms/${id}/images/${index}`,
  ROOM_STATUS: (id) => `/rooms/${id}/status`,
  ROOM_REMINDER: (id) => `/rooms/${id}/reminder`,

  // Residents
  RESIDENTS: "/residents",
  RESIDENTS_SEARCH: "/residents/search",
  RESIDENTS_STATUS: (status) => `/residents/status/${status}`,
  RESIDENTS_ROOM: (roomId) => `/residents/room/${roomId}`,
  RESIDENT_BY_ID: (id) => `/residents/${id}`,
  RESIDENT_ROOM: (id) => `/residents/${id}/room`,
  RESIDENT_STATUS: (id) => `/residents/${id}/status`,
  RESIDENT_HISTORY: (id) => `/residents/${id}/history`,
  RESIDENT_PROFILE_IMAGE: (id) => `/residents/${id}/profile-image`,

  // Visitors
  VISITORS_REQUEST: "/visitors/request",
  VISITORS_REQUESTS: "/visitors/requests",
  VISITORS_PENDING: "/visitors/pending",
  VISITORS_APPROVED: "/visitors/approved",
  VISITORS_STATISTICS: "/visitors/statistics",
  VISITOR_BY_ID: (id) => `/visitors/${id}`,
  VISITOR_APPROVE: (id) => `/visitors/${id}/approve`,
  VISITOR_REJECT: (id) => `/visitors/${id}/reject`,
  VISITOR_CHECK_IN: (id) => `/visitors/${id}/check-in`,
  VISITOR_CHECK_OUT: (id) => `/visitors/${id}/check-out`,

  // Payments
  PAYMENTS: "/payments",
  PAYMENTS_RESIDENT: (residentId) => `/payments/resident/${residentId}`,
  PAYMENTS_MONTH: (month) => `/payments/month/${month}`,
  PAYMENTS_STATUS: (status) => `/payments/status/${status}`,
  PAYMENTS_STATISTICS: "/payments/statistics",
  PAYMENT_BY_ID: (id) => `/payments/${id}`,
  PAYMENT_STATUS: (id) => `/payments/${id}/status`,
  PAYMENT_PAY: (id) => `/payments/${id}/pay`,
  PAYMENT_PROCESS_CARD: (id) => `/payments/${id}/process-card`,

  // Complaints
  COMPLAINTS: "/complaints",
  COMPLAINTS_RESIDENT: (residentId) => `/complaints/resident/${residentId}`,
  COMPLAINTS_STATUS: (status) => `/complaints/status/${status}`,
  COMPLAINTS_PRIORITY: (priority) => `/complaints/priority/${priority}`,
  COMPLAINTS_STATISTICS: "/complaints/statistics",
  COMPLAINT_BY_ID: (id) => `/complaints/${id}`,
  COMPLAINT_STATUS: (id) => `/complaints/${id}/status`,
  COMPLAINT_RESOLVE: (id) => `/complaints/${id}/resolve`,
  COMPLAINT_RATE: (id) => `/complaints/${id}/rate`,

  // Attendance
  ATTENDANCE_MARK: "/attendance/mark",
  ATTENDANCE: "/attendance",
  ATTENDANCE_RESIDENT: (residentId) => `/attendance/resident/${residentId}`,
  ATTENDANCE_DATE: (date) => `/attendance/date/${date}`,
  ATTENDANCE_REPORT: "/attendance/report",
  ATTENDANCE_STATISTICS: "/attendance/statistics",
  ATTENDANCE_BY_ID: (id) => `/attendance/${id}`,

  // Food
  FOOD_PREFERENCE: "/attendance/food/preference",
  FOOD_PREFERENCE_RESIDENT: (residentId) => `/attendance/food/preference/${residentId}`,
  FOOD_PREFERENCE_BY_ID: (id) => `/attendance/food/preference/${id}`,
  FOOD_MENU: "/attendance/food/menu",

  // Cleaning
  CLEANING: "/cleaning",
  CLEANING_BY_ID: (id) => `/cleaning/${id}`,
  CLEANING_STATUS: (id) => `/cleaning/${id}/status`,
  CLEANING_ROOM: (roomId) => `/cleaning/room/${roomId}`,
};
