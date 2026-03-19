import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { imageAPI, productAPI, categoryAPI, storeAPI, storeSettingsAPI } from '../lib/api';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Search, Loader2, Upload, X } from 'lucide-react';
import CategoryManager from '../components/CategoryManager';

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const isCategoriesOnly = location.pathname === '/categories';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [racks, setRacks] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [attributes, setAttributes] = useState([]);

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    mrp: '',
    sellingPrice: '',
    discountPercentage: '',
    image: '',
    categoryId: '',
    brandId: '',
    rackId: '',
    shelfId: '',
    hasVariants: false,
    variants: [],
    selectedAttributes: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      handleOpenDialog();
    }
  }, [location.search]);

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
          setProducts([]);
          setCategories([]);
          return;
        }
        throw error;
      }
      setStore(storeData);

      if (storeData?.id) {
        const [
          productsResponse,
          categoriesResponse,
          brandsRes,
          racksRes,
          shelvesRes,
          attrsRes
        ] = await Promise.all([
          productAPI.getByStore(storeData.id).catch(() => ({ data: [] })),
          categoryAPI.getByStore(storeData.id).catch(() => ({ data: [] })),
          storeSettingsAPI.getBrands(storeData.id).catch(() => ({ data: [] })),
          storeSettingsAPI.getRacks(storeData.id).catch(() => ({ data: [] })),
          storeSettingsAPI.getShelves(storeData.id).catch(() => ({ data: [] })),
          storeSettingsAPI.getAttributes(storeData.id).catch(() => ({ data: [] })),
        ]);

        setProducts(productsResponse.data || []);
        setCategories(categoriesResponse.data || []);
        setBrands(brandsRes.data || []);
        setRacks(racksRes.data || []);
        setShelves(shelvesRes.data || []);
        setAttributes(attrsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        mrp: product.mrp || '',
        sellingPrice: product.sellingPrice || '',
        discountPercentage: product.discountPercentage || '',
        image: product.image || '',
        categoryId: product.categoryId || product.category?.id || '',
        brandId: product.brandId || '',
        rackId: product.rackId || '',
        shelfId: product.shelfId || '',
        hasVariants: product.hasVariants || false,
        variants: product.variants || [],
        selectedAttributes: {}
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        description: '',
        mrp: '',
        sellingPrice: '',
        discountPercentage: '',
        image: '',
        categoryId: '',
        brandId: '',
        rackId: '',
        shelfId: '',
        hasVariants: false,
        variants: [],
        selectedAttributes: {}
      });
    }
    setDialogOpen(true);
  };

  const generateVariants = () => {
    const selectedKeys = Object.keys(formData.selectedAttributes);
    if (selectedKeys.length === 0) return;

    let combinations = [{}];

    for (const key of selectedKeys) {
      const values = formData.selectedAttributes[key];
      if (!values || values.length === 0) continue;

      const newCombinations = [];
      for (const combination of combinations) {
        for (const value of values) {
          newCombinations.push({ ...combination, [key]: value });
        }
      }
      combinations = newCombinations;
    }

    const newVariants = combinations.map((combination, index) => {
      const variantNamePart = Object.values(combination).join('-');
      return {
        sku: `${formData.sku}-${variantNamePart}`.toUpperCase(),
        mrp: formData.mrp || 0,
        sellingPrice: formData.sellingPrice || 0,
        attributeValues: combination,
      };
    });

    setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        storeId: store.id,
        mrp: parseFloat(formData.mrp) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        brandId: formData.brandId ? parseInt(formData.brandId) : null,
        rackId: formData.rackId ? parseInt(formData.rackId) : null,
        shelfId: formData.shelfId ? parseInt(formData.shelfId) : null,
      };

      if (editingProduct) {
        await productAPI.update(editingProduct.id, productData);
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        await productAPI.create(productData);
        toast({ title: "Success", description: "Product created successfully" });
      }

      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await imageAPI.upload(file);
      setFormData({ ...formData, image: res.data.url });
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast({ title: "Success", description: "Product deleted successfully" });
      loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete product", variant: "destructive" });
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchCat = true;
    if (filterCategory !== 'all') {
      const selectedId = parseInt(filterCategory);
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
      const pCatId = p.category?.id || p.categoryId;
      matchCat = categoryFamily.includes(pCatId);
    }

    return matchSearch && matchCat;
  });

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
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="mt-2 p-4 rounded-lg border border-dashed border-emerald-500/20 bg-emerald-500/10">
          <p className="text-sm text-emerald-200">
            You don&apos;t have a store yet. Create a store in{' '}
            <a href="/store-settings" className="font-medium text-emerald-400 hover:underline hover:text-emerald-300">
              Store Settings
            </a>{' '}
            before managing products.
          </p>
        </div>
      </div>
    );
  }

  if (isCategoriesOnly) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage product categories and sub-categories</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <CategoryManager
              storeId={store.id}
              onCategoryChange={(cats) => setCategories(cats)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
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
                  return buildFlatTree(categories).map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {'\u00A0'.repeat(c.depth * 3)}
                      {c.depth > 0 ? '↳ ' : ''}
                      {c.name}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 flex items-start gap-3">
                      {product.image ? (
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                          <span className="text-[10px] text-muted-foreground text-center">No Img</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{product.name}</h3>
                          {product.discountPercentage > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                              {product.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          SKU: {product.sku || 'N/A'}
                        </p>
                        {product.discountPercentage > 0 ? (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground line-through">
                              ${product.sellingPrice}
                            </p>
                            <p className="text-sm font-medium text-green-400">
                              ${(product.sellingPrice * (1 - product.discountPercentage / 100)).toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-medium mt-2">
                            ${product.sellingPrice || product.mrp || 0}
                          </p>
                        )}
                        <div className="flex gap-2 text-xs text-muted-foreground mt-2 flex-wrap">
                          {product.category && <span className="bg-muted px-2 py-0.5 rounded-full">{product.category.name}</span>}
                          {product.brandName && <span className="bg-muted px-2 py-0.5 rounded-full">{product.brandName}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product information' : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Left Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mrp">MRP</Label>
                    <Input id="mrp" type="number" step="0.01" value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price *</Label>
                    <Input id="sellingPrice" type="number" step="0.01" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">Discount %</Label>
                    <Input id="discountPercentage" type="number" step="0.01" min="0" max="100" value={formData.discountPercentage} onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })} placeholder="0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <div className="flex flex-col gap-4">
                    {formData.image && (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setFormData({ ...formData, image: '' })} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                          {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Click to upload image</span>
                            </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                      </div>
                      <div className="w-px h-24 bg-border hidden sm:block" />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="image-url">Or Image URL</Label>
                        <Input id="image-url" placeholder="https://example.com/image.jpg" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Taxonomies & Variants */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.categoryId?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
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
                          return buildFlatTree(categories).map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {'\u00A0'.repeat(c.depth * 3)}
                              {c.depth > 0 ? '↳ ' : ''}
                              {c.name}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Select value={formData.brandId?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, brandId: parseInt(value) })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rack</Label>
                    <Select value={formData.rackId?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, rackId: parseInt(value) })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {racks.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shelf</Label>
                    <Select value={formData.shelfId?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, shelfId: parseInt(value) })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {shelves.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Variants Section */}
                <Card className="border shadow-none">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Product Variants</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="hasVariants" className="text-xs">Enable</Label>
                        <input
                          type="checkbox"
                          id="hasVariants"
                          checked={formData.hasVariants}
                          onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                      </div>
                    </div>
                  </CardHeader>

                  {formData.hasVariants && (
                    <CardContent className="p-4 pt-0 space-y-4">
                      <div className="space-y-3">
                        {attributes.map((attr) => (
                          <div key={attr.id} className="space-y-1">
                            <Label className="text-xs">{attr.name}</Label>
                            <div className="flex flex-wrap gap-2">
                              {attr.values.map(val => {
                                const isSelected = formData.selectedAttributes[attr.name]?.includes(val);
                                return (
                                  <span
                                    key={val}
                                    onClick={() => {
                                      const currentSelected = formData.selectedAttributes[attr.name] || [];
                                      let newSelected;
                                      if (isSelected) {
                                        newSelected = currentSelected.filter(v => v !== val);
                                      } else {
                                        newSelected = [...currentSelected, val];
                                      }
                                      setFormData({
                                        ...formData,
                                        selectedAttributes: { ...formData.selectedAttributes, [attr.name]: newSelected }
                                      });
                                    }}
                                    className={`px-2 py-1 text-xs border rounded cursor-pointer transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                                  >
                                    {val}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button type="button" size="sm" variant="secondary" onClick={generateVariants} className="w-full text-xs">
                        Generate Combinations
                      </Button>

                      {formData.variants.length > 0 && (
                        <div className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-2">
                          <Label className="text-xs">Combinations</Label>
                          {formData.variants.map((v, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-muted/50 p-2 rounded text-xs border">
                              <div className="font-semibold flex-1">
                                {Object.values(v.attributeValues).join(' / ')}
                              </div>
                              <Input
                                className="w-24 h-7 text-xs"
                                placeholder="SKU"
                                value={v.sku}
                                onChange={(e) => {
                                  let newVars = [...formData.variants];
                                  newVars[idx].sku = e.target.value;
                                  setFormData({ ...formData, variants: newVars });
                                }}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
