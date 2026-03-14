import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trash2, Plus } from 'lucide-react';
import { storeSettingsAPI } from '../lib/api';
import { useToast } from './ui/use-toast';

export function BrandsManager({ storeId }) {
    const [brands, setBrands] = useState([]);
    const [name, setName] = useState('');
    const { toast } = useToast();

    const loadData = async () => {
        try {
            const res = await storeSettingsAPI.getBrands(storeId);
            setBrands(res.data || []);
        } catch { }
    };

    useEffect(() => { loadData(); }, [storeId]);

    const handleCreate = async () => {
        if (!name) return;
        try {
            await storeSettingsAPI.createBrand(storeId, name);
            setName('');
            loadData();
            toast({ title: 'Success', description: 'Brand created' });
        } catch {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to create brand' });
        }
    };

    const handleDelete = async (id) => {
        try {
            await storeSettingsAPI.deleteBrand(id);
            loadData();
            toast({ title: 'Success', description: 'Brand deleted' });
        } catch {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to delete' });
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Manage Brands</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="Brand name" value={name} onChange={e => setName(e.target.value)} />
                    <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Add</Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {brands.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{b.name}</span>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function RacksManager({ storeId }) {
    const [racks, setRacks] = useState([]);
    const [name, setName] = useState('');
    const { toast } = useToast();

    const loadData = async () => {
        try {
            const res = await storeSettingsAPI.getRacks(storeId);
            setRacks(res.data || []);
        } catch { }
    };

    useEffect(() => { loadData(); }, [storeId]);

    const handleCreate = async () => {
        if (!name) return;
        try {
            await storeSettingsAPI.createRack(storeId, name);
            setName('');
            loadData();
            toast({ title: 'Success', description: 'Rack created' });
        } catch {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to create rack' });
        }
    };

    const handleDelete = async (id) => {
        try {
            await storeSettingsAPI.deleteRack(id);
            loadData();
            toast({ title: 'Success', description: 'Rack deleted' });
        } catch {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to delete' });
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Manage Racks</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="Rack identifier" value={name} onChange={e => setName(e.target.value)} />
                    <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Add</Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {racks.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{b.name}</span>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function ShelvesManager({ storeId }) {
    const [shelves, setShelves] = useState([]);
    const [name, setName] = useState('');
    const { toast } = useToast();

    const loadData = async () => {
        try {
            const res = await storeSettingsAPI.getShelves(storeId);
            setShelves(res.data || []);
        } catch { }
    };

    useEffect(() => { loadData(); }, [storeId]);

    const handleCreate = async () => {
        if (!name) return;
        try {
            await storeSettingsAPI.createShelf(storeId, name);
            setName('');
            loadData();
            toast({ title: 'Success', description: 'Shelf created' });
        } catch {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to create shelf' });
        }
    };

    const handleDelete = async (id) => {
        try {
            await storeSettingsAPI.deleteShelf(id);
            loadData();
            toast({ title: 'Success', description: 'Shelf deleted' });
        } catch {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to delete' });
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Manage Shelves</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="Shelf identifier" value={name} onChange={e => setName(e.target.value)} />
                    <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Add</Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {shelves.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{b.name}</span>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function AttributesManager({ storeId }) {
    const [attributes, setAttributes] = useState([]);
    const [name, setName] = useState('');
    const [values, setValues] = useState('');
    const { toast } = useToast();

    const loadData = async () => {
        try {
            const res = await storeSettingsAPI.getAttributes(storeId);
            setAttributes(res.data || []);
        } catch { }
    };

    useEffect(() => { loadData(); }, [storeId]);

    const handleCreate = async () => {
        if (!name || !values) return;
        try {
            await storeSettingsAPI.createAttribute(storeId, name, values.split(',').map(v => v.trim()).filter(Boolean));
            setName('');
            setValues('');
            loadData();
            toast({ title: 'Success', description: 'Attribute created' });
        } catch {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to create attribute' });
        }
    };

    const handleDelete = async (id) => {
        try {
            await storeSettingsAPI.deleteAttribute(id);
            loadData();
            toast({ title: 'Success', description: 'Attribute deleted' });
        } catch {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to delete' });
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Manage Attributes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                    <Input placeholder="Attribute name (e.g. Color)" value={name} onChange={e => setName(e.target.value)} />
                    <Input placeholder="Values (comma separated e.g. Red, Blue, Green)" value={values} onChange={e => setValues(e.target.value)} />
                    <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Add Attribute</Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto mt-4">
                    {attributes.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                                <div className="font-semibold">{b.name}</div>
                                <div className="text-sm text-muted-foreground">{b.values.join(', ')}</div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
