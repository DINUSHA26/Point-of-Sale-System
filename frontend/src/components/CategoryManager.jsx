import { useState, useEffect } from 'react';
import { categoryAPI } from '../lib/api';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

export default function CategoryManager({ storeId, onCategoryChange }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', parentCategoryId: '' });
  const [expandedCats, setExpandedCats] = useState([]);

  useEffect(() => {
    if (storeId) {
      loadCategories();
    }
  }, [storeId]);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getByStore(storeId);
      setCategories(response.data || []);
      if (onCategoryChange) {
        onCategoryChange(response.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        parentCategoryId: category.parentCategoryId?.toString() || 'root'
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', parentCategoryId: 'root' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const categoryData = {
        name: formData.name,
        storeId: storeId,
        parentCategoryId: formData.parentCategoryId === 'root' ? null : parseInt(formData.parentCategoryId)
      };

      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, categoryData);
        toast({ title: "Success", description: "Category updated successfully" });
      } else {
        await categoryAPI.create(categoryData);
        toast({ title: "Success", description: "Category created successfully" });
      }

      setDialogOpen(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category? All sub-categories will be affected.')) return;

    try {
      await categoryAPI.delete(id);
      toast({ title: "Success", description: "Category deleted successfully" });
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    }
  };

  const toggleExpand = (id) => {
    setExpandedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const buildTree = (cats) => {
    const map = {};
    const roots = [];
    cats.forEach(c => {
      map[c.id] = { ...c, children: [] };
    });
    cats.forEach(c => {
      if (c.parentCategoryId && map[c.parentCategoryId]) {
        map[c.parentCategoryId].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  };

  const tree = buildTree(categories);

  const renderItem = (item, depth = 0) => {
    const isExpanded = expandedCats.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="space-y-1">
        <div
          className="flex items-center gap-2 group hover:bg-accent/50 p-2 rounded-lg transition-colors border border-transparent hover:border-border"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(item.id)} className="text-muted-foreground p-0.5 hover:bg-accent rounded">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <div className="w-5" />}

          <span className={`flex-1 text-sm ${depth === 0 ? 'font-bold text-emerald-500' : 'font-medium'}`}>
            {item.name}
            {depth === 0 && <span className="ml-2 text-[10px] font-normal px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">Main Category</span>}
          </span>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(item)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {item.children.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-bold">Category Hierarchy</h3>
          <p className="text-xs text-muted-foreground">Organize your catalog into main and sub-categories</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="space-y-1 border rounded-xl p-4 bg-card/50">
        {tree.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            <p>No categories found. Start by adding a main category.</p>
          </div>
        ) : (
          tree.map(root => renderItem(root))
        )}
      </div>

      {/* Re-import icons if missed */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-500">
              {editingCategory ? <Edit className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
            <DialogDescription>
              Defines where your products appear in the catalog.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-sm font-bold">Name *</Label>
              <Input
                id="categoryName"
                placeholder="e.g. Men's Wear or Shirts"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentCategory" className="text-sm font-bold">Parent Category</Label>
              <Select
                value={formData.parentCategoryId}
                onValueChange={(val) => setFormData({ ...formData, parentCategoryId: val })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Is this a sub-category?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">None (It's a Main Category)</SelectItem>
                  {categories
                    .filter(c => !editingCategory || (c.id !== editingCategory.id))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="px-8">
                Cancel
              </Button>
              <Button type="submit" className="px-8 bg-emerald-600 hover:bg-emerald-700">
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Fixed missing icon imports in the component above
import { PlusCircle } from 'lucide-react';
