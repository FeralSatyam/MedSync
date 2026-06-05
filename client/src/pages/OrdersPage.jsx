import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17L4 12"/>
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  Truck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
};

const STATUS_STEPS = [
  { key: 'pending',          label: 'Order Placed',      desc: 'Your order has been received',           Icon: Icons.Clock   },
  { key: 'confirmed',        label: 'Confirmed',          desc: 'Pharmacy confirmed your order',          Icon: Icons.Check   },
  { key: 'preparing',        label: 'Preparing',          desc: 'Pharmacy is packing your medicines',     Icon: Icons.Package },
  { key: 'out_for_delivery', label: 'Out for Delivery',   desc: 'Your order is on the way',               Icon: Icons.Truck   },
  { key: 'delivered',        label: 'Delivered',          desc: 'Your order has been delivered',          Icon: Icons.Check   },
];

const STATUS_LABEL = {
  pending:          { text: 'Pending',          cls: 'bg-amber-light text-amber'   },
  confirmed:        { text: 'Confirmed',         cls: 'bg-mint-light text-mint'     },
  preparing:        { text: 'Preparing',         cls: 'bg-mint-light text-mint'     },
  out_for_delivery: { text: 'Out for Delivery',  cls: 'bg-amber-light text-amber'   },
  delivered:        { text: 'Delivered',         cls: 'bg-mint-light text-mint'     },
  cancelled:        { text: 'Cancelled',         cls: 'bg-red-light text-red'       },
};

// Order Details Modal Component
function OrderDetailsModal({ order, onClose, onCancel }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isCancelled = order.status === 'cancelled';
  const isCancellable = !isCancelled && order.status !== 'delivered';
  const currentStep = STATUS_STEPS.findIndex((s) => s.key === order.status);

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    onCancel(order.orderId, cancelReason);
    setShowCancelConfirm(false);
    onClose();
  };

  const sl = STATUS_LABEL[order.status] || { text: order.status, cls: 'bg-faint text-muted' };

  return (
    <>
      <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl border border-border max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-navy">Order Details</h2>
              <p className="text-xs text-muted mt-0.5">{order.orderId}</p>
            </div>
            <button onClick={onClose} className="p-1 text-muted hover:text-navy rounded-lg">
              <Icons.Close />
            </button>
          </div>

          <div className="p-5 space-y-5">

            {/* Current Status Banner */}
            {isCancelled ? (
              <div className="bg-red-light border border-red rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="font-semibold text-red text-sm">Order Cancelled</p>
                </div>
                {order.cancelledReason && (
                  <p className="text-xs text-red ml-6">Reason: {order.cancelledReason}</p>
                )}
                {order.cancelledAt && (
                  <p className="text-xs text-red ml-6 mt-0.5">On {new Date(order.cancelledAt).toLocaleString()}</p>
                )}
              </div>
            ) : (
              <div className="bg-faint rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted mb-1">Current Status</p>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${sl.cls}`}>{sl.text}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Updated by pharmacy</p>
                  <p className="text-xs text-navy font-medium mt-0.5">{order.pharmacyName}</p>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            {!isCancelled && (
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-navy mb-4">Order Progress</p>
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const { Icon } = step;
                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isCompleted ? 'bg-mint text-white' : 'bg-faint text-muted'
                          } ${isCurrent ? 'ring-4 ring-mint/20' : ''}`}>
                            <Icon />
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 mt-0.5 ${idx < currentStep ? 'bg-mint' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="pb-3 pt-1 flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${isCompleted ? 'text-navy' : 'text-muted'}`}>
                            {step.label}
                            {isCurrent && (
                              <span className="ml-2 text-[10px] font-bold text-mint bg-mint-light px-2 py-0.5 rounded-full align-middle">Now</span>
                            )}
                          </p>
                          <p className="text-xs text-muted mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Info */}
            <div className="bg-faint rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-navy mb-1">Order Information</p>
              <div className="flex justify-between">
                <span className="text-muted">Pharmacy</span>
                <span className="font-medium text-navy">{order.pharmacyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Patient</span>
                <span className="font-medium text-navy">{order.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Placed on</span>
                <span className="text-navy">{new Date(order.orderDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery fee</span>
                <span className="font-medium text-navy">{order.deliveryFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Est. delivery</span>
                <span className="text-navy">{order.estimatedDelivery}</span>
              </div>
            </div>

            {/* Medicines */}
            <div>
              <p className="text-sm font-semibold text-navy mb-2">Medicines ({order.totalItems} {order.totalItems === 1 ? 'item' : 'items'})</p>
              <div className="space-y-2">
                {order.medicines.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 px-3 bg-faint rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-navy">{item.name}</p>
                      {item.strength && <p className="text-xs text-muted">{item.strength} {item.unit}</p>}
                    </div>
                    <span className="text-xs font-semibold text-mint bg-mint-light px-2 py-0.5 rounded-full">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <p className="text-sm font-semibold text-navy mb-1">Special Instructions</p>
                <p className="text-sm text-muted bg-faint p-3 rounded-xl">{order.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
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
