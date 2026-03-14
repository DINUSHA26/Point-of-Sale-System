import { useState, useEffect } from 'react';
import { customerAPI, storeAPI, orderAPI } from '../lib/api';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Edit, Trash2, Search, Loader2, History, Mail } from 'lucide-react';

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    loyaltyPoints: 0,
  });

  // Purchase History State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        fullName: customer.fullName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        loyaltyPoints: customer.loyaltyPoints || 0,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        loyaltyPoints: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerAPI.update(editingCustomer.id, formData);
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } else {
        await customerAPI.create(formData);
        toast({
          title: "Success",
          description: "Customer created successfully",
        });
      }

      setDialogOpen(false);
      loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save customer",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      await customerAPI.delete(id);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = async (customer) => {
    setViewingCustomer(customer);
    setHistoryOpen(true);
    setLoadingOrders(true);
    try {
      const response = await orderAPI.getByCustomer(customer.id);
      setCustomerOrders(response.data || []);
    } catch (error) {
      console.error('Error loading purchase history:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase history",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredCustomers = Array.isArray(customers) ? customers.filter(c =>
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  ) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customers</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleViewHistory(customer)}
                    >
                      <h3 className="font-semibold hover:text-emerald-600 transition-colors">{customer.fullName}</h3>
                      {customer.email && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {customer.email}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <span className="font-medium">Phone:</span> {customer.phone}
                        </p>
                      )}
                      {customer.address && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <span className="font-medium">Address:</span> {customer.address}
                        </p>
                      )}
                      <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        {customer.loyaltyPoints || 0} Points
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update customer information' : 'Add a new customer'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            {editingCustomer && (
              <div className="space-y-2">
                <Label htmlFor="loyaltyPoints">Loyalty Points</Label>
                <Input
                  id="loyaltyPoints"
                  type="number"
                  value={formData.loyaltyPoints}
                  onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCustomer ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Purchase History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Purchase History - {viewingCustomer?.fullName}
            </DialogTitle>
            <DialogDescription>
              View all previous purchases, quantities, and total amounts.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-slate-50/10 rounded-lg border border-dashed">
                No purchase history found for this customer.
              </div>
            ) : (
              <div className="space-y-4">
                {customerOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 py-3 border-b flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-medium">Order #{order.id}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] gap-1 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={async () => {
                            try {
                              await orderAPI.emailReceipt(order.id);
                              toast({
                                title: "Success",
                                description: "Receipt emailed to customer",
                              });
                            } catch (err) {
                              toast({
                                title: "Error",
                                description: "Failed to send email. Ensure customer has a valid email.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Mail className="h-3 w-3" />
                          Email Receipt
                        </Button>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">${order.totalAmount?.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground uppercase">{order.paymentType}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-border">
                          <tr>
                            <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs">Product</th>
                            <th className="text-right py-2 px-4 font-medium text-muted-foreground text-xs">Qty</th>
                            <th className="text-right py-2 px-4 font-medium text-muted-foreground text-xs">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items?.map((item, idx) => (
                            <tr key={idx} className="border-b border-border last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-2 px-4">
                                <div className="font-medium">{item.productName || 'Unknown Product'}</div>
                                {item.productSku && <div className="text-xs text-muted-foreground">SKU: {item.productSku}</div>}
                              </td>
                              <td className="py-2 px-4 text-right tabular-nums">{item.quantity}</td>
                              <td className="py-2 px-4 text-right tabular-nums">${item.price?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
