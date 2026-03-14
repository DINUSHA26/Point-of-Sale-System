import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Users,
  UserCog,
  Boxes,
  FileText,
  RotateCcw,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Tags,
  Layers,
  Archive,
  Grid3X3,
  Dna,
  PieChart,
  History,
  TrendingUp,
  ClipboardList,
  Users2,
  UserPlus,
  Percent,
  Ticket,
  Gift
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { ModeToggle } from '../mode-toggle';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS Terminal', href: '/pos', icon: ShoppingCart },
  {
    name: 'Products',
    icon: Package,
    submenu: [
      { name: 'All Products', href: '/products', icon: Archive },
      { name: 'Add Product', href: '/products?action=add', icon: PlusCircle },
      { name: 'Categories', href: '/categories', icon: Tags },
      { name: 'Brands', href: '/brands', icon: Layers },
      { name: 'Attributes', href: '/attributes', icon: Dna },
      { name: 'Racks', href: '/racks', icon: Grid3X3 },
      { name: 'Shelves', href: '/shelves', icon: Boxes },
    ]
  },
  { name: 'Orders', href: '/orders', icon: Receipt },
  { name: 'Employees', href: '/employees', icon: UserCog },
  { name: 'Inventory', href: '/inventory', icon: Boxes },
  {
    name: 'Customer Management',
    icon: Users,
    submenu: [
      { name: 'All Customers', href: '/customers?type=all', icon: Users },
      { name: 'Add Customer', href: '/customers?action=add', icon: UserPlus },
    ]
  },
  {
    name: 'Discount & Promotion Management',
    icon: Percent,
    submenu: [
      { name: 'Seasonal discounts for product', href: '/promotions?type=seasonal', icon: Percent },
      { name: 'Coupon codes', href: '/promotions?type=coupons', icon: Ticket },
      { name: 'Buy 1 get 1 offers', href: '/promotions?type=bogo', icon: Gift },
      { name: 'Member discounts', href: '/promotions?type=members', icon: Users },
      { name: 'Loyalty point config for customers', href: '/promotions?type=loyalty', icon: Settings }
    ]
  },
  {
    name: 'Reports',
    icon: FileText,
    submenu: [
      { name: 'Daily Sales', href: '/reports?type=daily', icon: TrendingUp },
      { name: 'Product Sales', href: '/reports?type=product', icon: Archive },
      { name: 'Monthly/Yearly', href: '/reports?type=monthly', icon: History },
      { name: 'Profit & Loss', href: '/reports?type=profit-loss', icon: PieChart },
      { name: 'Inventory Report', href: '/reports?type=inventory', icon: ClipboardList },
      { name: 'Staff Sales', href: '/reports?type=staff', icon: Users2 },
      { name: 'Shift History', href: '/shift-reports', icon: History },
    ]
  },
  { name: 'Store Settings', href: '/store-settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState(['Products']); // Keep Products expanded by default

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (name) => {
    setExpandedMenus(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 transform transition-all duration-300 ease-in-out lg:translate-x-0",
          "bg-card border-r border-border",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
                <img src="/pos-logo.png" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  CDZ POS
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">SaaS Platform</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
            {navigation.map((item) => {
              const hasSubmenu = !!item.submenu;
              const isExpanded = expandedMenus.includes(item.name);
              const isActive = location.pathname === item.href ||
                (hasSubmenu && item.submenu.some(sub => location.pathname === sub.href));
              const Icon = item.icon;

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => {
                      if (hasSubmenu) {
                        toggleMenu(item.name);
                      } else {
                        navigate(item.href);
                        setSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                      isActive && !hasSubmenu
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span>{item.name}</span>
                    {hasSubmenu && (
                      <div className="ml-auto">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    )}
                  </button>

                  {hasSubmenu && isExpanded && (
                    <div className="ml-4 pl-4 border-l border-border space-y-1 mt-1">
                      {item.submenu.map((sub) => {
                        const isSubActive = location.pathname === sub.href ||
                          (sub.href.includes('?') && location.pathname + location.search === sub.href);
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.name}
                            onClick={() => {
                              navigate(sub.href);
                              setSidebarOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                              isSubActive
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span>{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="mb-3 px-4 py-3 rounded-xl bg-accent/50 border border-border cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigate('/profile-settings')}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    user?.fullName?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.role?.replace('ROLE_', '')}</p>
                </div>
                <Settings className="ml-auto h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 transition-all duration-300">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-foreground">
                  {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ModeToggle />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/50 border border-border">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">{user?.fullName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
