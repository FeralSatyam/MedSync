import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { getUserOrders, cancelOrder } from '../api/orderApi';
import { useAuthStore } from '../store/authStore';

const Icons = {
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18L9 12L15 6"/>
    </svg>
  ),
  Package: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m8-4v18"/>
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6L18 18"/>
    </svg>
  ),
};

// Order Details Modal Component
function OrderDetailsModal({ order, onClose, onCancel }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const orderUrl = `${window.location.origin}/order-tracking/${order.orderId}`;

  useEffect(() => {
    QRCode.toDataURL(orderUrl, { width: 200, margin: 1 }, (err, url) => {
      if (!err) {
        setQrCodeUrl(url);
      }
    });
  }, [orderUrl]);

  const statusColors = {
    pending: 'bg-amber-light text-amber',
    confirmed: 'bg-mint-light text-mint',
    preparing: 'bg-mint-light text-mint',
    out_for_delivery: 'bg-amber-light text-amber',
    delivered: 'bg-mint-light text-mint',
    cancelled: 'bg-red-light text-red',
  };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    onCancel(order.orderId, cancelReason);
    setShowCancelConfirm(false);
    onClose();
  };

  const isCancellable = order.status !== 'delivered' && order.status !== 'cancelled';

  return (
    <>
      <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl border border-border max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-border p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-navy">Order Details</h2>
            <button onClick={onClose} className="text-muted hover:text-navy">
              <Icons.Close />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {order.status === 'cancelled' && (
              <div className="bg-red-light border border-red rounded-lg p-3">
                <p className="text-sm font-medium text-red">Order Cancelled</p>
                <p className="text-xs text-red mt-1">Reason: {order.cancelledReason || 'User requested cancellation'}</p>
              </div>
            )}

            {/* QR Code Section */}
            <div className="bg-faint rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-navy mb-2">Order QR Code</p>
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="Order QR Code" className="w-40 h-40 mx-auto mb-2" />
              )}
              <p className="text-xs text-muted">Scan to track your order</p>
            </div>

            {/* Order Info */}
            <div>
              <p className="text-sm font-medium text-navy mb-2">Order Information</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Order ID:</span>
                  <span className="font-medium">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span className={`rounded-full text-xs font-semibold px-2.5 py-0.5 ${statusColors[order.status]}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Pharmacy:</span>
                  <span className="font-medium">{order.pharmacyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Patient:</span>
                  <span className="font-medium">{order.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Date:</span>
                  <span>{new Date(order.orderDate).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Medicines */}
            <div>
              <p className="text-sm font-medium text-navy mb-2">Medicines ({order.totalItems} items)</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {order.medicines.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-navy">{item.name}</p>
                      <p className="text-xs text-muted">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-faint rounded-lg p-3">
              <p className="text-sm font-medium text-navy mb-2">Delivery Information</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Delivery Fee:</span>
                  <span className="font-medium">{order.deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Est. Delivery:</span>
                  <span>{order.estimatedDelivery}</span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div>
                <p className="text-sm font-medium text-navy mb-1">Special Instructions</p>
                <p className="text-sm text-muted bg-faint p-2 rounded-lg">{order.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {isCancellable && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 border border-red text-red rounded-full py-2.5 text-sm font-semibold hover:bg-red-light transition-colors"
                >
                  Cancel Order
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-mint text-white rounded-full py-2.5 text-sm font-semibold hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-[10001] flex items-center justify-center p-4" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-white rounded-2xl border border-border max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Cancel Order</h3>
            <p className="text-muted mb-4">Are you sure you want to cancel this order?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-navy mb-1">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you're cancelling..."
                rows={3}
                className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 border border-border bg-white text-navy rounded-full py-2.5 text-sm font-semibold hover:bg-faint"
              >
                No, Keep Order
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 border border-red text-red rounded-full py-2.5 text-sm font-semibold hover:bg-red-light"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Order Card Component
function OrderCard({ order, onViewDetails, onCancel }) {
  const statusColors = {
    pending: 'bg-amber-light text-amber',
    confirmed: 'bg-mint-light text-mint',
    preparing: 'bg-mint-light text-mint',
    out_for_delivery: 'bg-amber-light text-amber',
    delivered: 'bg-mint-light text-mint',
    cancelled: 'bg-red-light text-red',
  };

  const isCancelled = order.status === 'cancelled';
  const canCancel = !isCancelled && order.status !== 'delivered';

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-shadow ${isCancelled ? 'border-red-light opacity-70' : 'border-border'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-muted">Order ID</p>
          <p className="font-semibold text-navy">{order.orderId}</p>
        </div>
        <span className={`rounded-full text-xs font-semibold px-2.5 py-0.5 ${statusColors[order.status]}`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-muted">{order.pharmacyName}</p>
        <p className="text-xs text-muted mt-1">{new Date(order.orderDate).toLocaleDateString()}</p>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-navy">{order.totalItems} items</p>
          <p className="text-xs text-muted">{order.deliveryFee} delivery</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(order)}
            className="flex items-center gap-1 bg-mint text-white rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-90"
          >
            <Icons.Eye />
            View Details
          </button>
          {canCancel && (
            <button
              onClick={() => onCancel(order)}
              className="flex items-center gap-1 border border-red text-red rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-red-light"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Orders Page Component - ALL HOOKS MUST BE INSIDE THIS FUNCTION
export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [cancellingOrder, setCancellingOrder] = useState(null);

  // Get current user from auth store - THIS IS A HOOK, MUST BE INSIDE COMPONENT
  const currentUser = useAuthStore((s) => s.user);
  const userId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    loadOrders();
  }, [userId]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getUserOrders(userId);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      await cancelOrder(orderId, reason);
      toast.success('Order cancelled successfully');
      await loadOrders();
      setCancellingOrder(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const handleCancelClick = (order) => {
    setCancellingOrder(order);
  };

  const getFilteredOrders = () => {
    if (activeTab === 'active') {
      return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    } else if (activeTab === 'history') {
      return orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    }
    return orders;
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 h-16">
          <button onClick={() => navigate(-1)} className="p-2 text-muted hover:bg-faint rounded-lg transition-colors">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-navy">My Orders</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'text-mint border-b-2 border-mint'
                : 'text-muted hover:text-navy'
            }`}
          >
            Active Orders
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-mint border-b-2 border-mint'
                : 'text-muted hover:text-navy'
            }`}
          >
            Order History
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-mint border-b-2 border-mint'
                : 'text-muted hover:text-navy'
            }`}
          >
            All Orders
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-border p-5">
            <div className="w-20 h-20 bg-faint rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.Package />
            </div>
            <h3 className="text-navy font-semibold mb-2">
              {activeTab === 'active' ? 'No active orders' : activeTab === 'history' ? 'No order history' : 'No orders yet'}
            </h3>
            <p className="text-muted text-sm mb-4">
              {activeTab === 'active' ? 'Your active orders will appear here' : 'Your order history will appear here'}
            </p>
            <button
              onClick={() => navigate('/pharmacy')}
              className="bg-mint text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90"
            >
              Browse Pharmacies
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onViewDetails={handleViewDetails}
                onCancel={handleCancelClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={handleCancelOrder}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-[10001] flex items-center justify-center p-4" onClick={() => setCancellingOrder(null)}>
          <div className="bg-white rounded-2xl border border-border max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Cancel Order</h3>
            <p className="text-muted mb-4">Are you sure you want to cancel order <strong>{cancellingOrder.orderId}</strong>?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-navy mb-1">Reason for cancellation</label>
              <textarea
                value={cancellingOrder.cancelReason || ''}
                onChange={(e) => setCancellingOrder({ ...cancellingOrder, cancelReason: e.target.value })}
                placeholder="Please tell us why you're cancelling..."
                rows={3}
                className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancellingOrder(null)}
                className="flex-1 border border-border bg-white text-navy rounded-full py-2.5 text-sm font-semibold hover:bg-faint"
              >
                No, Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(cancellingOrder.orderId, cancellingOrder.cancelReason || 'User requested cancellation')}
                className="flex-1 border border-red text-red rounded-full py-2.5 text-sm font-semibold hover:bg-red-light"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
