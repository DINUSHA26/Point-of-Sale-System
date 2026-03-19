import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderAPI, storeAPI } from '../lib/api';
import { useToast } from '../components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, Receipt, Printer, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ReceiptModal } from '../components/ReceiptModal';
import { ReturnModal } from '../components/ReturnModal';

export default function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    paymentType: 'all',
    orderStatus: 'all',
    searchId: '',
  });

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam && !loading) {
      setTimeout(() => scrollToOrder(orderIdParam), 500);
    }
  }, [loading, searchParams]);

  const scrollToOrder = async (orderId) => {
    let element = document.getElementById(`order-${orderId}`);

    if (!element && orderId) {
      // If order not in list, try to search for it
      setFilters(prev => ({ ...prev, searchId: orderId.toString() }));
      toast({
        title: "Searching...",
        description: `Fetching Order #${orderId}`,
      });
      // Wait for re-render
      setTimeout(() => {
        const newElement = document.getElementById(`order-${orderId}`);
        if (newElement) {
          newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          newElement.classList.add('transition-all', 'duration-500', 'ring-4', 'ring-indigo-500', 'ring-offset-2', 'bg-indigo-500/10', 'dark:bg-indigo-500/20', 'scale-[1.01]', 'z-10');
          setTimeout(() => {
            newElement.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2', 'bg-indigo-500/10', 'dark:bg-indigo-500/20', 'scale-[1.01]', 'z-10');
          }, 2500);
        }
      }, 1000);
      return;
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a premium highlight effect
      element.classList.add('transition-all', 'duration-500', 'ring-4', 'ring-indigo-500', 'ring-offset-2', 'bg-indigo-500/10', 'dark:bg-indigo-500/20', 'scale-[1.01]', 'z-10');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2', 'bg-indigo-500/10', 'dark:bg-indigo-500/20', 'scale-[1.01]', 'z-10');
      }, 2500);
    } else {
      toast({
        title: "Order not found",
        description: `Order #${orderId} could not be located.`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      let storeData;
      try {
        if (user?.role === 'ROLE_OWNER') {
          const response = await storeAPI.getByAdmin();
          storeData = response.data;
        } else {
          const response = await storeAPI.getByEmployee();
          storeData = response.data;
        }
      } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 404) {
          setStore(null);
          setOrders([]);
          return;
        }
        throw error;
      }
      setStore(storeData);

      if (storeData?.id) {
        const filterParams = {};
        if (filters.paymentType !== 'all') filterParams.paymentType = filters.paymentType;
        if (filters.orderStatus !== 'all') filterParams.orderStatus = filters.orderStatus;

        const response = await orderAPI.getByStore(storeData.id, filterParams);
        let fetchedOrders = Array.isArray(response.data) ? response.data : [];

        if (filters.searchId) {
          fetchedOrders = fetchedOrders.filter(o =>
            o.id.toString().includes(filters.searchId)
          );
        }

        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = (orderId) => {
    setSelectedOrderId(orderId);
    setShowReceipt(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="mt-2 p-4 rounded-lg border border-dashed border-emerald-500/20 bg-emerald-500/10">
          <p className="text-sm text-emerald-200">
            No store found yet. Create a store in{' '}
            <a href="/store-settings" className="font-medium text-emerald-400 hover:underline hover:text-emerald-300">
              Store Settings
            </a>{' '}
            before viewing orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">View and manage orders</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search Order ID..."
              className="pl-9 w-[200px]"
              value={filters.searchId}
              onChange={(e) => setFilters({ ...filters, searchId: e.target.value })}
            />
          </div>
          <Select
            value={filters.paymentType}
            onValueChange={(value) => setFilters({ ...filters, paymentType: value })}
          >
            <SelectTrigger className="w-[180px] text-slate-900 dark:text-gray-100">
              <SelectValue placeholder="Payment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.orderStatus}
            onValueChange={(value) => setFilters({ ...filters, orderStatus: value })}
          >
            <SelectTrigger className="w-[180px] text-slate-900 dark:text-gray-100">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {!Array.isArray(orders) || orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} id={`order-${order.id}`} className="transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${order.paymentType === 'CASH' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                        order.paymentType === 'CARD' ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' :
                          'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                        }`}>
                        {order.paymentType?.replace('_', ' ')}
                      </span>
                      {order.parentOrderId && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20 uppercase tracking-tight">
                            EXCHANGE BILL
                          </span>
                          <button
                            onClick={() => scrollToOrder(order.parentOrderId)}
                            className="px-2 py-1 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all cursor-pointer uppercase tracking-tight"
                          >
                            ORIGINAL: #{order.parentOrderId}
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt && format(new Date(order.createdAt), 'PPpp')}
                    </p>
                    {order.customer && (
                      <p className="text-sm mt-1">
                        Customer: {order.customer.fullName}
                      </p>
                    )}
                    {order.cashier && (
                      <p className="text-sm text-muted-foreground">
                        Cashier: {order.cashier.fullName}
                      </p>
                    )}
                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm flex items-center gap-2 group/item">
                            <span className="text-muted-foreground group-hover/item:text-foreground transition-colors">
                              {item.productName || item.product?.name || 'Product'}
                              <span className="mx-1 text-[10px] opacity-70">×</span>
                              {item.quantity}
                              <span className="mx-1 text-[10px] opacity-50">@</span>
                              <span className="font-medium text-foreground">${item.price?.toFixed(2)}</span>
                            </span>
                            {item.returnStatus && item.returnStatus !== 'NOT_RETURNED' && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${item.returnStatus === 'FULLY_RETURNED'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                                {item.returnStatus.replace('_', ' ')}
                                {item.linkedOrderId && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); scrollToOrder(item.linkedOrderId); }}
                                    className="ml-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 transition-all border border-indigo-500/20 normal-case font-bold text-[9px]"
                                  >
                                    REF: #{item.linkedOrderId}
                                  </button>
                                )}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent tracking-tighter">
                      ${order.totalAmount?.toFixed(2) || '0.00'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedOrderId(order.id); setShowReturn(true); }}
                        className="flex items-center gap-2"
                      >
                        Refund
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReceipt(order.id)}
                        className="flex items-center gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        View Receipt
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        orderId={selectedOrderId}
      />

      {showReturn && (
        <ReturnModal
          open={showReturn}
          onClose={() => setShowReturn(false)}
          orderId={selectedOrderId}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
