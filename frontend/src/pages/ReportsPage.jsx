import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reportAPI, storeAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    Calendar, DollarSign, ShoppingCart, Package, TrendingUp, Loader2,
    History, PieChart as PieIcon, ClipboardList, Users2, ArrowUpRight,
    ArrowDownRight, Download, Filter, Search, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

const customTooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    color: 'hsl(var(--foreground))',
};

export default function ReportsPage() {
    const { user } = useAuth();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const reportType = searchParams.get('type') || 'daily';

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProfit: 0 });
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [period, setPeriod] = useState('DAILY');

    const reportConfig = {
        daily: { title: 'Daily Sales Report', icon: TrendingUp, api: 'getDailySales' },
        product: { title: 'Product Sales Report', icon: Package, api: 'getItemSales' },
        monthly: { title: 'Monthly/Yearly Sales', icon: History, api: 'getProfitLoss' },
        'profit-loss': { title: 'Profit & Loss Report', icon: PieIcon, api: 'getProfitLoss' },
        inventory: { title: 'Inventory Status Report', icon: ClipboardList, api: 'getInventoryReport' },
        staff: { title: 'Staff Performance Report', icon: Users2, api: 'getStaffSales' },
    };

    const currentConfig = reportConfig[reportType] || reportConfig.daily;

    useEffect(() => {
        const fetchStore = async () => {
            try {
                let res;
                if (user?.role === 'ROLE_OWNER') {
                    res = await storeAPI.getByAdmin();
                } else {
                    res = await storeAPI.getByEmployee();
                }
                if (res.data?.id) {
                    setStore(res.data);
                }
            } catch (e) {
                console.error('Error fetching store:', e);
            }
        };
        fetchStore();
    }, [user]);

    useEffect(() => {
        if (!store?.id) return;
        loadReport();
    }, [store, reportType, dateRange.startDate, dateRange.endDate, period]);

    const loadReport = async () => {
        setLoading(true);
        try {
            let res;
            const apiMethod = currentConfig.api;

            if (reportType === 'inventory') {
                res = await reportAPI[apiMethod](store.id);
            } else if (reportType === 'profit-loss' || reportType === 'monthly') {
                res = await reportAPI[apiMethod](store.id, dateRange.startDate, dateRange.endDate, period);
            } else {
                res = await reportAPI[apiMethod](store.id, dateRange.startDate, dateRange.endDate);
            }

            const reportData = res.data || [];
            setData(reportData);

            // Calculate overall stats
            if (reportType === 'daily' || reportType === 'profit-loss' || reportType === 'monthly') {
                const totalRevenue = reportData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
                const totalOrders = reportData.reduce((sum, item) => sum + (item.totalOrders || 0), 0);
                const totalProfit = reportData.reduce((sum, item) => sum + (item.grossProfit || 0), 0);
                setStats({ totalRevenue, totalOrders, totalProfit });
            } else if (reportType === 'product') {
                const totalRevenue = reportData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
                const totalUnits = reportData.reduce((sum, item) => sum + (item.totalQuantitySold || 0), 0);
                setStats({ totalRevenue, totalUnits });
            }
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (reportType === 'monthly' && period === 'MONTHLY') {
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        if (reportType === 'monthly' && period === 'YEARLY') {
            return d.getFullYear().toString();
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading && !data.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="space-y-4">
                <h1 className="text-3xl font-bold">Reports</h1>
                <p className="text-muted-foreground">Create a store to view reports</p>
            </div>
        );
    }

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{currentConfig.title}</h1>
                    <p className="text-muted-foreground mt-1">Manage and analyze your business performance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row items-end gap-4">
                        {reportType !== 'inventory' && (
                            <>
                                <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={dateRange.startDate}
                                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                            className="bg-background/50 border-border/50 focus:border-primary/50 [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={dateRange.endDate}
                                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                            className="bg-background/50 border-border/50 focus:border-primary/50 [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                                {(reportType === 'profit-loss' || reportType === 'monthly') && (
                                    <div className="space-y-2 w-full lg:w-48">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</Label>
                                        <Select value={period} onValueChange={setPeriod}>
                                            <SelectTrigger className="bg-background/50 border-border/50">
                                                <SelectValue placeholder="Select Period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DAILY">Daily</SelectItem>
                                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                <SelectItem value="YEARLY">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}
                        <Button onClick={loadReport} className="w-full lg:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            <Filter className="h-4 w-4 mr-2" />
                            Update View
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Highlights */}
            {reportType === 'daily' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SummaryCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="emerald" />
                    <SummaryCard title="Transactions" value={stats.totalOrders} icon={ShoppingCart} color="blue" />
                    <SummaryCard title="Avg Sale" value={formatCurrency(stats.totalRevenue / (stats.totalOrders || 1))} icon={TrendingUp} color="amber" />
                    <SummaryCard title="Top Payment" value={data.length ? Object.entries(data[0].paymentBreakdown || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A' : 'N/A'} icon={PieIcon} color="purple" />
                </div>
            )}

            {reportType === 'profit-loss' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard title="Gross Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="emerald" />
                    <SummaryCard title="Cost of Goods" value={formatCurrency(data.reduce((s, i) => s + (i.totalCost || 0), 0))} icon={Package} color="red" />
                    <SummaryCard title="Net Profit" value={formatCurrency(stats.totalProfit)} icon={TrendingUp} color="blue" />
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className={cn("col-span-1 lg:col-span-2 overflow-hidden", (reportType === 'inventory' || reportType === 'staff') && "lg:col-span-3")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                        <div>
                            <CardTitle className="text-xl font-bold">Data Visualization</CardTitle>
                            <CardDescription>Visual performance overview</CardDescription>
                        </div>
                        <currentConfig.icon className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {data.length > 0 ? (
                            <div className="h-[400px] w-full mt-4">
                                {renderChart(reportType, data, period, formatCurrency, formatDate, COLORS)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Package className="h-12 w-12 mb-4 opacity-20" />
                                <p>No data available for the selected range</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {reportType !== 'inventory' && reportType !== 'staff' && (
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Key Insights</CardTitle>
                            <CardDescription>Top contributing factors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {reportType === 'daily' && data.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold">Current Date Payments</h4>
                                        <div className="space-y-3">
                                            {Object.entries(data[0].paymentBreakdown || {}).map(([method, amount], i) => (
                                                <div key={method} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                        <span className="text-sm font-medium">{method}</span>
                                                    </div>
                                                    <span className="text-sm font-bold">{formatCurrency(amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {reportType === 'product' && data.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold">Best Selling Category</h4>
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                            <p className="text-2xl font-bold text-primary">{data[0].category}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Driving most of your volume this month</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Table View */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Detailed Breakdown</CardTitle>
                            <CardDescription>Source data for this report</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search records..." className="pl-9 bg-background/50 h-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border border-border/50 overflow-hidden overflow-x-auto">
                        {renderTable(reportType, data, formatCurrency, formatDate)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function SummaryCard({ title, value, icon: Icon, color }) {
    const colorClasses = {
        emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
        blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
        amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
        purple: "from-purple-500 to-violet-600 shadow-purple-500/20",
        red: "from-rose-500 to-red-600 shadow-red-500/20",
    };

    return (
        <Card className="border-none shadow-md bg-card/60 hover:bg-card transition-colors">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={cn("h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", colorClasses[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
                        <p className="text-2xl font-black truncate">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function renderChart(type, data, period, formatCurrency, formatDate, COLORS) {
    if (type === 'daily' || type === 'profit-loss' || type === 'monthly') {
        const isProfitLoss = type === 'profit-loss';
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={customTooltipStyle}
                        labelFormatter={formatDate}
                        formatter={(val) => [formatCurrency(val), ""]}
                    />
                    <Area type="monotone" dataKey="totalRevenue" name="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    {isProfitLoss && (
                        <Area type="monotone" dataKey="netIncome" name="Net Profit" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        );
    }

    if (type === 'product') {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="productName"
                        type="category"
                        tick={{ fontSize: 11, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                    />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="totalRevenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    }

    if (type === 'inventory') {
        const lowStock = data.filter(i => i.isLowStock).length;
        const healthy = data.length - lowStock;
        const chartData = [
            { name: 'Low Stock', value: lowStock },
            { name: 'Healthy', value: healthy }
        ];

        return (
            <div className="flex flex-col lg:flex-row items-center justify-between h-full w-full gap-4 lg:gap-8 overflow-hidden">
                <div className="flex-1 w-full h-full min-h-[250px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius="65%"
                                outerRadius="90%"
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                            >
                                <Cell fill="#ef4444" className="drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                <Cell fill="#10b981" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            </Pie>
                            <Tooltip contentStyle={customTooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 w-full lg:w-64">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 shadow-md">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/70">Alerts</span>
                        </div>
                        <p className="text-3xl font-black text-red-500">{lowStock}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Items to restock</p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-md">
                        <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Stable</span>
                        </div>
                        <p className="text-3xl font-black text-emerald-500">{healthy}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Items healthy</p>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'staff') {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="staffName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="totalSales" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    }

    return null;
}

function renderTable(type, data, formatCurrency, formatDate) {
    const commonHeaderClass = "px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/30";
    const commonCellClass = "px-6 py-4 whitespace-nowrap text-sm border-t border-border/40";

    if (type === 'daily' || type === 'monthly') {
        return (
            <table className="min-w-full divide-y divide-border/40">
                <thead>
                    <tr>
                        <th className={commonHeaderClass}>Date</th>
                        <th className={commonHeaderClass}>Orders</th>
                        <th className={commonHeaderClass}>Avg Order</th>
                        <th className={commonHeaderClass + " text-right"}>Revenue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card/10">
                    {data.map((item, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className={commonCellClass}>{formatDate(item.date)}</td>
                            <td className={commonCellClass}>{item.totalOrders}</td>
                            <td className={commonCellClass}>{formatCurrency(item.averageOrderValue)}</td>
                            <td className={commonCellClass + " text-right font-bold text-emerald-500"}>{formatCurrency(item.totalRevenue)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    if (type === 'product') {
        return (
            <table className="min-w-full divide-y divide-border/40">
                <thead>
                    <tr>
                        <th className={commonHeaderClass}>Product Name</th>
                        <th className={commonHeaderClass}>Category</th>
                        <th className={commonHeaderClass}>Sold</th>
                        <th className={commonHeaderClass}>Orders</th>
                        <th className={commonHeaderClass + " text-right"}>Revenue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card/10">
                    {data.map((item, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className={commonCellClass + " font-medium"}>{item.productName}</td>
                            <td className={commonCellClass}>{item.category}</td>
                            <td className={commonCellClass}>{item.totalQuantitySold}</td>
                            <td className={commonCellClass}>{item.numberOfOrders}</td>
                            <td className={commonCellClass + " text-right font-bold text-emerald-500"}>{formatCurrency(item.totalRevenue)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    if (type === 'profit-loss') {
        return (
            <table className="min-w-full divide-y divide-border/40">
                <thead>
                    <tr>
                        <th className={commonHeaderClass}>Period</th>
                        <th className={commonHeaderClass}>Revenue</th>
                        <th className={commonHeaderClass}>Cost</th>
                        <th className={commonHeaderClass + " text-right"}>Profit</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card/10">
                    {data.map((item, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className={commonCellClass}>{formatDate(item.date)}</td>
                            <td className={commonCellClass}>{formatCurrency(item.totalRevenue)}</td>
                            <td className={commonCellClass + " text-rose-500"}>({formatCurrency(item.totalCost)})</td>
                            <td className={commonCellClass + " text-right font-bold text-blue-500"}>{formatCurrency(item.netIncome)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    if (type === 'inventory') {
        return (
            <table className="min-w-full divide-y divide-border/40">
                <thead>
                    <tr>
                        <th className={commonHeaderClass}>SKU</th>
                        <th className={commonHeaderClass}>Product</th>
                        <th className={commonHeaderClass}>Current Stock</th>
                        <th className={commonHeaderClass}>Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card/10">
                    {data.map((item, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className={commonCellClass + " font-mono text-xs"}>{item.sku}</td>
                            <td className={commonCellClass + " font-medium"}>{item.productName}</td>
                            <td className={commonCellClass}>{item.currentStock}</td>
                            <td className={commonCellClass}>
                                {item.isLowStock ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Low Stock
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        Healthy
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    if (type === 'staff') {
        return (
            <table className="min-w-full divide-y divide-border/40">
                <thead>
                    <tr>
                        <th className={commonHeaderClass}>Staff Name</th>
                        <th className={commonHeaderClass}>Total Bills</th>
                        <th className={commonHeaderClass + " text-right"}>Total Sales</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card/10">
                    {data.map((item, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className={commonCellClass + " font-medium"}>{item.staffName}</td>
                            <td className={commonCellClass}>{item.totalBills}</td>
                            <td className={commonCellClass + " text-right font-bold text-primary"}>{formatCurrency(item.totalSales)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return null;
}
