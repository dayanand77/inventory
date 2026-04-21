import apiClient from "./api";

export async function fetchNotifications() {
  const response = await apiClient.get("/notifications");
  return response.data.notifications;
}

export async function generateLowStockNotifications() {
  const response = await apiClient.post("/notifications/generate-low-stock");
  return response.data.notifications;
}

export async function markNotificationRead(notificationId) {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`);
  return response.data.notification;
}
