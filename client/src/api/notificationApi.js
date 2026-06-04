import axiosInstance from './axiosInstance';

export const getNotifications = async () => {
  const response = await axiosInstance.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axiosInstance.put('/notifications/mark-all-read');
  return response.data;
};

export const placeOrderFromNotification = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/place-order`);
  return response.data;
};
