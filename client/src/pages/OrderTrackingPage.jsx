import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrderById } from '../api/orderApi';

const Icons = {
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18L9 12L15 6"/>
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17L4 12"/>
    </svg>
  ),
  Package: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m8-4v18"/>
    </svg>
  ),
  Location: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
      <circle cx="12" cy="9" r="3"/>
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      // Fallback to localStorage
      const orders = JSON.parse(localStorage.getItem('medsync_orders') || '[]');
      const foundOrder = orders.find(o => o.orderId === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        toast.error('Order not found');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    return steps.indexOf(status);
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Icons.Clock, description: 'Your order has been placed' },
    { key: 'confirmed', label: 'Confirmed', icon: Icons.Check, description: 'Pharmacy has confirmed your order' },
    { key: 'preparing', label: 'Preparing', icon: Icons.Package, description: 'Pharmacy is preparing your medicines' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Icons.Location, description: 'Your order is on the way' },
    { key: 'delivered', label: 'Delivered', icon: Icons.Check, description: 'Your order has been delivered' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4"></div>
          <p className="text-muted">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentStep = getStatusStep(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 h-16">
          <button onClick={() => navigate(-1)} className="p-2 text-muted hover:bg-faint rounded-lg transition-colors">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-navy">Track Order</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Cancelled Order Banner */}
        {isCancelled && (
          <div className="bg-red-light border border-red rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-light rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-red">Order Cancelled</p>
                <p className="text-sm text-red mt-1">Reason: {order.cancelledReason || 'User requested cancellation'}</p>
                <p className="text-xs text-red mt-2">Cancelled on: {new Date(order.cancelledAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-muted">Order ID</p>
              <p className="font-semibold text-navy">{order.orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Placed on</p>
              <p className="text-sm text-navy">{new Date(order.orderDate).toLocaleDateString()}</p>
              <p className="text-xs text-muted">{new Date(order.orderDate).toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Status:</span>
              <span className={`font-semibold capitalize ${
                isCancelled ? 'text-red' :
                order.status === 'delivered' ? 'text-mint' : 'text-mint'
              }`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Status Timeline - Only show if not cancelled */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-border p-5 mb-4">
            <h2 className="font-semibold text-navy mb-4">Order Status</h2>
            <div className="relative">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStep;
                const isCurrent = idx === currentStep;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex items-start mb-6 last:mb-0">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted ? 'bg-mint text-white' : 'bg-faint text-muted'
                      } ${isCurrent ? 'ring-4 ring-mint-light scale-105' : ''}`}>
                        <Icon />
                      </div>
                      {idx < statusSteps.length - 1 && (
                        <div className={`absolute top-10 left-5 w-0.5 h-12 ${
                          idx < currentStep ? 'bg-mint' : 'bg-border'
                        }`} />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className={`font-semibold ${isCompleted ? 'text-navy' : 'text-muted'}`}>
                        {step.label}
                      </p>
                      <p className={`text-xs mt-1 ${isCompleted ? 'text-muted' : 'text-muted'}`}>
                        {step.description}
                      </p>
                      {isCurrent && (
                        <span className="inline-block mt-2 text-xs text-mint bg-mint-light px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pharmacy Details */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-4">
          <h2 className="font-semibold text-navy mb-3">Pharmacy Details</h2>
          <div className="space-y-2">
            <p className="font-medium text-navy">{order.pharmacyName}</p>
            <p className="text-sm text-muted flex items-start gap-2">
              <Icons.Location />
              <span>{order.pharmacyAddress}</span>
            </p>
            <p className="text-sm text-muted flex items-center gap-2">
              <Icons.Clock />
              <span>Estimated Delivery: {order.estimatedDelivery}</span>
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-4">
          <h2 className="font-semibold text-navy mb-3">Order Items</h2>
          <div className="space-y-3">
            {order.medicines.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pb-3 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-navy">{item.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted">Quantity: {item.quantity}</p>
                    {item.type === 'custom' && (
                      <span className="text-xs text-muted bg-faint px-2 py-0.5 rounded-full">Custom</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex justify-between">
              <span className="text-muted">Delivery Fee:</span>
              <span className="font-medium">{order.deliveryFee}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-2">Special Instructions</h2>
            <p className="text-sm text-muted bg-faint p-3 rounded-lg">{order.notes}</p>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted">Need help? Contact support at support@medsync.com</p>
        </div>
      </div>
    </div>
  );
}
