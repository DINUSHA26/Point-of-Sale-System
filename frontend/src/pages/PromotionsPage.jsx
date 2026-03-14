import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Ticket, Percent, Gift, Users, Settings, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function PromotionsPage() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'all';
    const { toast } = useToast();

    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'SEASONAL',
        discountValue: 0,
        discountUnit: 'PERCENTAGE',
        couponCode: '',
        startDate: '',
        endDate: '',
        buyQuantity: 1,
        getQuantity: 1,
        minPurchaseAmount: 0,
        active: true
    });

    useEffect(() => {
        loadPromotions();
    }, [type]);

    const getEnumState = (t) => {
        const up = t.toUpperCase();
        if (up === 'COUPONS') return 'COUPON';
        if (up === 'MEMBERS') return 'MEMBER';
        return up;
    };

    const loadPromotions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/promotions', {
                params: type !== 'all' ? { type: getEnumState(type) } : {}
            });
            setPromotions(res.data || []);
        } catch (err) {
            toast({ title: "Error", description: "Failed to load promotions", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (promo = null) => {
        if (promo) {
            setEditingPromotion(promo);
            setFormData({
                ...promo,
                startDate: promo.startDate ? promo.startDate.split('T')[0] : '',
                endDate: promo.endDate ? promo.endDate.split('T')[0] : '',
            });
        } else {
            setEditingPromotion(null);
            setFormData({
                name: '',
                description: '',
                type: type !== 'all' ? getEnumState(type) : 'SEASONAL',
                discountValue: 0,
                discountUnit: 'PERCENTAGE',
                couponCode: '',
                startDate: '',
                endDate: '',
                buyQuantity: 1,
                getQuantity: 1,
                minPurchaseAmount: 0,
                active: true
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPromotion) {
                await api.put(`/api/promotions/${editingPromotion.id}`, formData);
            } else {
                await api.post('/api/promotions', formData);
            }
            setDialogOpen(false);
            loadPromotions();
            toast({ title: "Success", description: "Promotion saved successfully" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to save promotion", variant: "destructive" });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/api/promotions/${id}`);
            loadPromotions();
            toast({ title: "Success", description: "Promotion deleted" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    };

    const getPageTitle = () => {
        switch (type) {
            case 'seasonal': return 'Seasonal Discounts';
            case 'coupons': return 'Coupon Codes';
            case 'bogo': return 'BOGO Offers';
            case 'members': return 'Member Discounts';
            case 'loyalty': return 'Loyalty Configuration';
            default: return 'All Promotions';
        }
    };

    const getIcon = (t) => {
        switch (t.toLowerCase()) {
            case 'seasonal': return <Percent className="h-5 w-5 text-emerald-500" />;
            case 'coupon': return <Ticket className="h-5 w-5 text-blue-500" />;
            case 'bogo': return <Gift className="h-5 w-5 text-purple-500" />;
            case 'member': return <Users className="h-5 w-5 text-amber-500" />;
            default: return <Settings className="h-5 w-5 text-slate-500" />;
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Add {type === 'all' ? 'Promotion' : 'Offer'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo) => (
                    <Card key={promo.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                {getIcon(promo.type)}
                                {promo.name}
                            </CardTitle>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(promo)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {promo.type === 'BOGO' ? `${promo.buyQuantity} + ${promo.getQuantity}` :
                                    promo.discountUnit === 'PERCENTAGE' ? `${promo.discountValue}% OFF` : `$${promo.discountValue} OFF`}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
                            {promo.couponCode && (
                                <div className="mt-2 text-xs font-mono bg-slate-100 p-1 rounded inline-block">
                                    CODE: {promo.couponCode}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingPromotion ? 'Edit' : 'Create'} Promotion</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={formData.type} onValueChange={val => setFormData({ ...formData, type: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SEASONAL">Seasonal</SelectItem>
                                        <SelectItem value="COUPON">Coupon</SelectItem>
                                        <SelectItem value="BOGO">BOGO</SelectItem>
                                        <SelectItem value="MEMBER">Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Active</Label>
                                <Select value={formData.active.toString()} onValueChange={val => setFormData({ ...formData, active: val === 'true' })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.type === 'COUPON' && (
                            <div className="space-y-2">
                                <Label>Coupon Code</Label>
                                <Input value={formData.couponCode} onChange={e => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })} required />
                            </div>
                        )}

                        {formData.type === 'BOGO' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Buy Qty</Label>
                                    <Input type="number" value={formData.buyQuantity} onChange={e => setFormData({ ...formData, buyQuantity: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Get Qty</Label>
                                    <Input type="number" value={formData.getQuantity} onChange={e => setFormData({ ...formData, getQuantity: parseInt(e.target.value) })} />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Value</Label>
                                    <Input type="number" value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit</Label>
                                    <Select value={formData.discountUnit} onValueChange={val => setFormData({ ...formData, discountUnit: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                            <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit">Save Promotion</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
