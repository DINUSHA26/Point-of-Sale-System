import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { orderAPI, refundAPI } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function ReturnModal({ open, onClose, orderId, onSuccess }) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState(null);
    const [returnItems, setReturnItems] = useState({});
    const [reason, setReason] = useState('Customer Request');
    const [refundMethod, setRefundMethod] = useState('CREDIT');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open && orderId) {
            loadOrderData();
        } else {
            setOrder(null);
            setReturnItems({});
            setReason('Customer Request');
            setRefundMethod('CREDIT');
        }
    }, [open, orderId]);

    const loadOrderData = async () => {
        try {
            setLoading(true);
            const res = await orderAPI.getById(orderId);
            setOrder(res.data);

            const initialMap = {};
            (res.data.items || []).forEach(item => {
                const availableQty = item.quantity - (item.returnedQuantity || 0);
                if (availableQty > 0) {
                    initialMap[item.id] = { selected: false, quantity: 1, max: availableQty, condition: 'GOOD', price: item.price / item.quantity };
                }
            });
            setReturnItems(initialMap);
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to load order data.', variant: 'destructive' });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleToggleItem = (id) => {
        setReturnItems(prev => ({
            ...prev,
            [id]: { ...prev[id], selected: !prev[id].selected }
        }));
    };

    const handleUpdateItem = (id, field, value) => {
        setReturnItems(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const calculateTotalRefund = () => {
        let sum = 0;
        Object.values(returnItems).forEach(item => {
            if (item.selected) sum += (item.quantity * item.price);
        });
        return sum;
    };

    const getSelectedItemsDTO = () => {
        return Object.entries(returnItems)
            .filter(([id, data]) => data.selected)
            .map(([id, data]) => ({
                orderItemId: parseInt(id),
                quantity: parseInt(data.quantity),
                condition: data.condition
            }));
    };

    const handleRefund = async () => {
        const itemsDto = getSelectedItemsDTO();
        if (itemsDto.length === 0) {
            toast({ title: 'Select Items', description: 'Please select at least one item to return.', variant: 'destructive' });
            return;
        }

        try {
            setSubmitting(true);
            const totalRefund = calculateTotalRefund();

            const payload = {
                originalOrderId: orderId,
                returnItems: itemsDto,
                reason,
                refundAmount: totalRefund,
                issueStoreCredit: refundMethod === 'CREDIT'
            };

            await refundAPI.processReturn(payload);
            toast({ title: 'Success', description: 'Refund processed successfully.' });
            onSuccess && onSuccess();
            onClose();
        } catch (e) {
            toast({ title: 'Error', description: e.response?.data?.message || 'Failed to process refund.', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleExchange = () => {
        const itemsDto = getSelectedItemsDTO();
        if (itemsDto.length === 0) {
            toast({ title: 'Select Items', description: 'Please select at least one item to exchange.', variant: 'destructive' });
            return;
        }

        // Attach full product context for the POS page
        const exchangeData = {
            originalOrderId: orderId,
            customerId: order?.customer?.id,
            customerName: order?.customer?.fullName,
            reason,
            items: itemsDto.map(dto => {
                const orderItem = order.items.find(i => i.id === dto.orderItemId);
                return {
                    ...dto,
                    product: orderItem.product,
                    price: orderItem.price / orderItem.quantity,
                    originalPrice: orderItem.originalPrice / orderItem.quantity
                };
            })
        };

        localStorage.setItem('exchangeData', JSON.stringify(exchangeData));
        toast({ title: 'Action needed', description: 'Redirecting to POS with your exchanged items loaded.' });
        navigate('/pos');
    };

    const totalRefund = calculateTotalRefund();
    const hasItems = Object.keys(returnItems).length > 0;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Return & Exchange - Order #{orderId}</DialogTitle>
                    <DialogDescription>
                        Select items to return, their condition, and specify the return method.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                ) : !hasItems ? (
                    <div className="p-4 text-center text-muted-foreground">All items in this order have already been returned, or no items exist.</div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto mt-2 p-2">
                        <div className="space-y-3">
                            <Label>Select Items</Label>
                            {order?.items?.map(line => {
                                const ri = returnItems[line.id];
                                if (!ri) return null; // fully returned

                                return (
                                    <div key={line.id} className={`p-3 border rounded-lg ${ri.selected ? 'border-primary ring-1 ring-primary' : 'border-border'} flex flex-col sm:flex-row gap-4 sm:items-center`}>
                                        <div className="flex items-center gap-3 w-full sm:w-1/3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4"
                                                checked={ri.selected}
                                                onChange={() => handleToggleItem(line.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{line.productName || line.product?.name}</p>
                                                <p className="text-xs text-muted-foreground">Max: {ri.max} unit(s)</p>
                                            </div>
                                        </div>

                                        {ri.selected && (
                                            <div className="flex items-center gap-3 w-full sm:w-2/3">
                                                <Input
                                                    type="number"
                                                    className="w-20"
                                                    min={1}
                                                    max={ri.max}
                                                    value={ri.quantity}
                                                    onChange={(e) => handleUpdateItem(line.id, 'quantity', parseInt(e.target.value) || 1)}
                                                />
                                                <Select value={ri.condition} onValueChange={(val) => handleUpdateItem(line.id, 'condition', val)}>
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue placeholder="Condition" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="GOOD">Good / Active</SelectItem>
                                                        <SelectItem value="DAMAGED">Damaged / Quarantine</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="E.g., wrong size" />
                            </div>
                            <div className="space-y-2">
                                <Label>Refund Method</Label>
                                <Select value={refundMethod} onValueChange={setRefundMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CREDIT">Issue Store Credit</SelectItem>
                                        <SelectItem value="ORIGINAL">Refund Payment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-4 border-t mt-4">
                            <p className="text-sm font-semibold">Total Refund Amount:</p>
                            <p className="text-xl font-bold">${totalRefund.toFixed(2)}</p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                    <Button variant="outline" onClick={handleExchange} disabled={submitting || !hasItems || totalRefund === 0}>
                        Start Exchange
                    </Button>
                    <Button onClick={handleRefund} disabled={submitting || !hasItems || totalRefund === 0}>
                        {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        Process Return & {refundMethod === 'CREDIT' ? 'Credit Note' : 'Refund'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
