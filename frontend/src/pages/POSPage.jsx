import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { productAPI, customerAPI, orderAPI, storeAPI, billingAPI, categoryAPI, refundAPI } from '../lib/api';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone, Loader2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';

export default function POSPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customers, setCustomers] = useState([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState('CASH');
  const [secondaryPaymentType, setSecondaryPaymentType] = useState(null);
  const [cashTendered, setCashTendered] = useState('');
  const [loading, setLoading] = useState(true);
  const [exchangeData, setExchangeData] = useState(null);

  // Receipt State
  const [receiptOrderId, setReceiptOrderId] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // UI State
  const [isCustomerSectionOpen, setIsCustomerSectionOpen] = useState(false);

  useEffect(() => {
    loadStoreAndProducts();
    const storedExchange = localStorage.getItem('exchangeData');
    if (storedExchange) {
      try {
        const parsed = JSON.parse(storedExchange);
        setExchangeData(parsed);
        if (parsed.customerId) {
          setSelectedCustomer({ id: parsed.customerId, fullName: parsed.customerName });
          setIsCustomerSectionOpen(true);
        } else if (parsed.customerName) {
          setCustomerName(parsed.customerName);
          setIsCustomerSectionOpen(true);
        }

        const returnCartItems = parsed.items.map(retItem => ({
          isReturn: true,
          originalOrderItemId: retItem.orderItemId,
          condition: retItem.condition,
          product: retItem.product,
          quantity: -retItem.quantity,
          price: retItem.price,
          originalPrice: retItem.originalPrice
        }));
        setCart(returnCartItems);
      } catch (e) {
        console.error("Failed to parse exchange data", e);
      }
    }
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const loadStoreAndProducts = async () => {
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
          setProducts([]);
          setFilteredProducts([]);
          setCategories([]);
          return;
        }
        throw error;
      }
      setStore(storeData);

      if (storeData?.id) {
        const [productsResponse, categoriesResponse] = await Promise.all([
          productAPI.getByStore(storeData.id).catch(() => ({ data: [] })),
          categoryAPI.getByStore(storeData.id).catch(() => ({ data: [] })),
        ]);
        setProducts(productsResponse.data || []);
        setFilteredProducts(productsResponse.data || []);
        setCategories(categoriesResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading store/products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      const selectedId = parseInt(selectedCategory);

      // Find all sub-category IDs recursively
      const getAllChildIds = (parentId) => {
        let ids = [parentId];
        categories
          .filter(c => c.parentCategoryId === parentId)
          .forEach(c => {
            ids = [...ids, ...getAllChildIds(c.id)];
          });
        return ids;
      };

      const categoryFamily = getAllChildIds(selectedId);
      filtered = filtered.filter(p => {
        const pCatId = p.category?.id || p.categoryId;
        return categoryFamily.includes(pCatId);
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product.id === product.id && !item.isReturn);

    // Calculate discounted price
    const basePrice = product.sellingPrice || product.mrp || 0;
    const discountPercentage = product.discountPercentage || 0;
    const discountedPrice = basePrice * (1 - discountPercentage / 100);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        price: discountedPrice,
        originalPrice: basePrice,
      }]);
    }
  };

  const updateCartQuantity = (productId, delta, isReturn = false) => {
    setCart(cart.map(item => {
      if (item.product.id === productId && !!item.isReturn === !!isReturn) {
        if (isReturn) return item; // Don't allow changing return quantity in POS easily
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId, isReturn = false) => {
    setCart(cart.filter(item => !(item.product.id === productId && !!item.isReturn === !!isReturn)));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  };

  const getTotalDiscount = () => {
    return getSubtotal() - getTotal();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }
    setPaymentType('CASH');
    setSecondaryPaymentType(null);
    setCashTendered('');
    setPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    const totalAmount = getTotal();

    // Validation for cash payments
    const isCashPayment = paymentType === 'CASH' || secondaryPaymentType === 'CASH';
    const amountToPayInCash = paymentType === 'CASH'
      ? totalAmount
      : (secondaryPaymentType === 'CASH' ? totalAmount - (selectedCustomer?.storeCredit || 0) : 0);

    if (isCashPayment) {
      if (!cashTendered || cashTendered.trim() === '') {
        toast({
          title: "Cash Payment Error",
          description: "Please enter the cash amount provided by the customer.",
          variant: "destructive",
        });
        return;
      }
      if (Number(cashTendered) < amountToPayInCash) {
        toast({
          title: "Cash Payment Error",
          description: `Cash tendered ($${cashTendered}) is less than amount due ($${amountToPayInCash.toFixed(2)})`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const orderData = {
        storeId: store.id,
        customerId: selectedCustomer?.id || null,
        customerName: !selectedCustomer && customerName ? customerName : null,
        customerPhone: !selectedCustomer && customerPhone ? customerPhone : null,
        cashier: {
          id: user.id,
        },
        paymentType: paymentType === 'STORE_CREDIT' && secondaryPaymentType ? 'SPLIT' : paymentType,
        totalAmount: totalAmount < 0 ? 0 : totalAmount,
        payments: paymentType === 'STORE_CREDIT' && secondaryPaymentType ? [
          { paymentType: 'STORE_CREDIT', amount: Number(selectedCustomer?.storeCredit || 0) },
          {
            paymentType: secondaryPaymentType,
            amount: Number(totalAmount - (selectedCustomer?.storeCredit || 0)),
            cashTendered: secondaryPaymentType === 'CASH' ? Number(cashTendered) : null,
            changeAmount: secondaryPaymentType === 'CASH' ? Number(cashTendered) - (totalAmount - (selectedCustomer?.storeCredit || 0)) : null
          }
        ] : [
          {
            paymentType: paymentType,
            amount: Number(totalAmount),
            cashTendered: paymentType === 'CASH' ? Number(cashTendered) : null,
            changeAmount: paymentType === 'CASH' ? Number(cashTendered) - totalAmount : null
          }
        ],
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
          isReturn: item.isReturn
        })),
      };

      let response;
      if (exchangeData) {
        const payload = {
          originalOrderId: exchangeData.originalOrderId,
          returnItems: cart.filter(i => i.isReturn).map(i => ({
            orderItemId: i.originalOrderItemId,
            quantity: Math.abs(i.quantity),
            condition: i.condition
          })),
          reason: exchangeData.reason || 'Exchange checkout',
          refundAmount: totalAmount < 0 ? Math.abs(totalAmount) : 0,
          issueStoreCredit: totalAmount < 0,
          exchangeOrder: cart.filter(i => !i.isReturn).length > 0 ? {
            ...orderData,
            totalAmount: totalAmount > 0 ? totalAmount : 0,
            items: cart.map(i => ({
              productId: i.product.id,
              quantity: i.quantity,
              price: i.price
            }))
          } : null
        };

        const refRes = await refundAPI.processReturn(payload);
        response = { data: refRes.data.exchangeOrder || { id: refRes.data.id, isRefund: true } };
        localStorage.removeItem('exchangeData');
        setExchangeData(null);
      } else {
        response = await orderAPI.create(orderData);
      }

      toast({
        title: "Success",
        description: exchangeData ? "Exchange & Order processed successfully!" : "Order created successfully!",
      });

      // Show receipt or refund note
      if (!response.data.isRefund) {
        setReceiptOrderId(response.data.id || response.data.orderId);
      }
      setShowReceipt(true);

      // Clear cart and reset state
      setCart([]);
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentDialogOpen(false);
      setPaymentType('CASH');
      setIsCustomerSectionOpen(false); // Close customer section

      // Reload products to update inventory
      loadStoreAndProducts();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create order",
        variant: "destructive",
      });
    }
  };

  const searchCustomers = async (query) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }
    try {
      const response = await customerAPI.search(query);
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
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
        <h1 className="text-3xl font-bold">POS</h1>
        <div className="mt-2 p-4 rounded-lg border border-dashed border-emerald-500/20 bg-emerald-500/10">
          <p className="text-sm text-emerald-200">
            You don&apos;t have a store yet. Create a store in{' '}
            <a href="/store-settings" className="font-medium text-emerald-400 hover:underline hover:text-emerald-300">
              Store Settings
            </a>{' '}
            before processing sales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      {/* Product Selection */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(() => {
                    const buildFlatTree = (cats, parentId = null, depth = 0) => {
                      let result = [];
                      cats
                        .filter(c => (c.parentCategoryId === parentId) || (parentId === null && !c.parentCategoryId))
                        .forEach(c => {
                          result.push({ ...c, depth });
                          result = [...result, ...buildFlatTree(cats, c.id, depth + 1)];
                        });
                      return result;
                    };
                    return buildFlatTree(categories).map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {'\u00A0'.repeat(cat.depth * 3)}
                        {cat.depth > 0 ? '↳ ' : ''}
                        {cat.name}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto">
              {filteredProducts.map((product) => {
                const hasDiscount = product.discountPercentage > 0;
                const basePrice = product.sellingPrice || product.mrp || 0;
                const discountedPrice = hasDiscount ? basePrice * (1 - product.discountPercentage / 100) : basePrice;

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 border rounded-lg hover:border-emerald-500/50 hover:bg-emerald-50/5 dark:hover:bg-emerald-500/10 text-left transition-all duration-200 relative flex flex-col bg-card hover:shadow-lg hover:shadow-emerald-500/10 group"
                  >
                    {hasDiscount && (
                      <span className="absolute top-2 right-2 z-10 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-600 border border-green-500/30">
                        {product.discountPercentage}% OFF
                      </span>
                    )}
                    {product.image ? (
                      <div className="w-full aspect-square mb-3 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square mb-3 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                        <span className="text-muted-foreground text-xs">No Image</span>
                      </div>
                    )}
                    <div className="font-medium text-sm pr-8 leading-tight mb-1 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{product.name}</div>
                    {hasDiscount ? (
                      <div className="mt-1">
                        <div className="text-[10px] text-muted-foreground line-through">
                          ${basePrice.toFixed(2)}
                        </div>
                        <div className="text-xs font-medium text-green-600">
                          ${discountedPrice.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1 group-hover:text-foreground/80 transition-colors">
                        ${basePrice.toFixed(2)}
                      </div>
                    )}
                    {product.sku && (
                      <div className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors">SKU: {product.sku}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <div className="flex flex-col space-y-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* Collapsible Customer Selection */}
            <div className="mb-4 border rounded-lg p-2">
              <button
                onClick={() => setIsCustomerSectionOpen(!isCustomerSectionOpen)}
                className="flex items-center justify-between w-full text-sm font-medium"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {selectedCustomer ? (
                    <span className="text-green-600">{selectedCustomer.fullName}</span>
                  ) : (
                    <span>Customer (Optional)</span>
                  )}
                </div>
                {isCustomerSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {isCustomerSectionOpen && (
                <div className="mt-3 space-y-3">
                  {/* Search Existing */}
                  <div className="relative">
                    <Label className="text-xs text-muted-foreground mb-1 block">Search Existing</Label>
                    <Input
                      placeholder="Search by name, phone or email..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        searchCustomers(e.target.value);
                      }}
                    />
                    {customers.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto ring-1 ring-black/5">
                        {customers.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCustomerSearch(customer.fullName);
                              setCustomerName(customer.fullName);
                              setCustomerPhone(customer.phone);
                              setCustomers([]);
                              setIsCustomerSectionOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors text-sm border-b last:border-0 border-border/50 group"
                          >
                            <div className="font-medium group-hover:text-emerald-500 transition-colors uppercase tracking-tight text-[11px]">
                              {customer.fullName}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {customer.phone || customer.email || 'No contact info'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!selectedCustomer && (
                    <>
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-2 text-xs text-gray-400">OR QUICK ADD</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">New Customer Name</Label>
                          <Input
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Enter name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Phone Number</Label>
                          <Input
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="Enter phone"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedCustomer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-500 h-8 mt-2"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearch('');
                        setCustomerName('');
                        setCustomerPhone('');
                      }}
                    >
                      Remove Selected Customer
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Cart is empty
                </p>
              ) : (
                cart.map((item) => {
                  const hasDiscount = item.originalPrice > item.price;
                  return (
                    <div key={item.product.id} className="flex items-center justify-between p-2 border rounded-lg gap-3 bg-card">
                      {item.product.image ? (
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 border border-border">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex-shrink-0 border border-border flex items-center justify-center">
                          <span className="text-[9px] text-muted-foreground">No Img</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {item.isReturn && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-600 border border-red-500/30 flex-shrink-0">RETURN</span>}
                          <div className="font-medium text-sm truncate">{item.product.name}</div>
                          {hasDiscount && !item.isReturn && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-600 border border-green-500/30 flex-shrink-0">
                              {item.product.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {hasDiscount && (
                            <span className="line-through mr-2">${item.originalPrice.toFixed(2)}</span>
                          )}
                          ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!item.isReturn && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.product.id, -1, false)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                        <span className="text-sm w-8 text-center">{Math.abs(item.quantity)}</span>
                        {!item.isReturn && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.product.id, 1, false)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeFromCart(item.product.id, item.isReturn)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total */}
            <div className="border-t pt-4 space-y-2">
              {getTotalDiscount() > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${getTotalDiscount().toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>Choose how the customer will pay</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="UPI">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    UPI
                  </div>
                </SelectItem>
                <SelectItem value="CARD">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </div>
                </SelectItem>
                <SelectItem value="STORE_CREDIT">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Store Credit
                    {selectedCustomer && (
                      <span className="text-[10px] text-green-600 ml-1">
                        (Avl: ${selectedCustomer.storeCredit?.toFixed(2) || '0.00'})
                      </span>
                    )}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {paymentType === 'STORE_CREDIT' && selectedCustomer && (
              <div className="space-y-3">
                <div className={`p-2 rounded text-xs border ${(selectedCustomer.storeCredit || 0) < getTotal()
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  }`}>
                  {(selectedCustomer.storeCredit || 0) < getTotal()
                    ? `Insufficient Credit! Missing: $${(getTotal() - (selectedCustomer.storeCredit || 0)).toFixed(2)}`
                    : `Remaining Credit after purchase: $${((selectedCustomer.storeCredit || 0) - getTotal()).toFixed(2)}`
                  }
                </div>

                {(selectedCustomer.storeCredit || 0) < getTotal() && (
                  <div className="space-y-2 p-2 border rounded-md bg-muted/30">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Remainder Payment Method</Label>
                    <Select value={secondaryPaymentType} onValueChange={setSecondaryPaymentType}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Cash Tendered Input */}
            {(paymentType === 'CASH' || (paymentType === 'STORE_CREDIT' && secondaryPaymentType === 'CASH')) && (
              <div className="space-y-2 p-3 border rounded-lg bg-orange-500/10 border-orange-500/20">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-orange-600 dark:text-orange-400">CASH TENDERED</Label>
                  <span className="text-[10px] text-orange-500 font-medium">
                    Due: ${paymentType === 'CASH' ? getTotal().toFixed(2) : (getTotal() - (selectedCustomer?.storeCredit || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-orange-400" />
                  <Input
                    type="number"
                    placeholder="Enter amount provided"
                    className="pl-8 border-orange-500/50 focus:ring-orange-500 bg-background/50"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    autoFocus
                  />
                </div>
                {cashTendered && Number(cashTendered) >= (paymentType === 'CASH' ? getTotal() : (getTotal() - (selectedCustomer?.storeCredit || 0))) && (
                  <div className="flex justify-between items-center pt-2 border-t border-orange-500/20 mt-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">CHANGE DUE:</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      ${(Number(cashTendered) - (paymentType === 'CASH' ? getTotal() : (getTotal() - (selectedCustomer?.storeCredit || 0)))).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg border border-border/50 shadow-inner">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="text-foreground">${getTotal().toFixed(2)}</span>
              </div>
              {getTotal() < 0 && (
                <div className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 p-2 rounded border border-indigo-500/20">
                  REFUND BALANCE: ${Math.abs(getTotal()).toFixed(2)} will be issued as Store Credit to {selectedCustomer?.fullName || 'the customer'}.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processPayment}>
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        orderId={receiptOrderId}
      />
    </div>
  );
}
