import axiosInstance from './axiosInstance';

// Get all orders for a user
export const getUserOrders = async (userId) => {
  const response = await axiosInstance.get(`/orders?userId=${userId}`);
  return response.data;
};

// Get order by ID
export const getOrderById = async (orderId) => {
  const response = await axiosInstance.get(`/orders/${orderId}`);
  return response.data;
};

// Create new order
export const createOrder = async (orderData) => {
  const response = await axiosInstance.post('/orders', orderData);
  return response.data;
};

// Cancel order
export const cancelOrder = async (orderId, reason) => {
  const response = await axiosInstance.put(`/orders/${orderId}/cancel`, { reason });
  return response.data;
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  const response = await axiosInstance.put(`/orders/${orderId}/status`, { status });
  return response.data;
};

// Delete order
export const deleteOrder = async (orderId) => {
  const response = await axiosInstance.delete(`/orders/${orderId}`);
  return response.data;
};