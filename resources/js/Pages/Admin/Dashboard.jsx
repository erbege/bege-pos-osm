import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, RadialBarChart, RadialBar
} from 'recharts';

export default function Dashboard({
    metrics, charts, topMenus, recentOrders,
    financial, workforce, reservations, customers,
    paymentBreakdown, weeklyComparison, branchComparison, isOwner
}) {
    const {
        todaysSales, salesGrowth, totalOrdersToday, orderGrowth,
        avgOrderValue, aovGrowth, activeTables, totalTables,
        lowStockCount, pendingPOCount
    } = metrics;
    const { salesTrend, hourlyDistribution, categoryStats } = charts;

    const fmt = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const fmtNumber = (val) => new Intl.NumberFormat('id-ID').format(val);
    const fmtCompact = (val) => {
        if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
        if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`;
        return fmt(val);
    };

    const COLORS = ['#E84C30', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
    const PAYMENT_COLORS = { Cash: '#10B981', QRIS: '#3B82F6', Transfer: '#8B5CF6', EDC: '#F59E0B', gateway: '#EC4899' };

    // ─── Shared Tooltip ────────────────────────────────────────────
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1A1A1A] border border-white/10 p-3 rounded-lg shadow-xl">
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-[#E84C30] font-bold text-lg">{fmt(payload[0].value)}</p>
                    {payload[0].payload.orders !== undefined && (
                        <p className="text-white/60 text-[10px] mt-1 uppercase tracking-tighter">
                            {payload[0].payload.orders} Transactions
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    const WeeklyTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1A1A1A] border border-white/10 p-3 rounded-lg shadow-xl">
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">{label}</p>
                    {payload.map((p, i) => (
                        <p key={i} className="text-sm font-bold" style={{ color: p.fill || p.color }}>
                            {p.name}: {fmtCompact(p.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // ─── Growth Badge ──────────────────────────────────────────────
    const GrowthBadge = ({ value, label = 'vs yesterday' }) => (
        <div className={`flex items-center gap-1 text-[11px] ${value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {value >= 0 ? '↑' : '↓'} {Math.abs(value)}%
            <span className="text-white/20 ml-1">{label}</span>
        </div>
    );

    // ─── Section Header ────────────────────────────────────────────
    const SectionHeader = ({ title, subtitle }) => (
        <div className="mb-0">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h4>
            {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
        </div>
    );

    // ─── KPI Card ──────────────────────────────────────────────────
    const KPICard = ({ label, value, growth, growthLabel, color, icon, subtitle }) => (
        <div className="bg-[#2D2D2D] border border-white/5 rounded-lg p-4 hover:border-opacity-40 transition-all duration-300 group"
             style={{ '--hover-color': color }}
             onMouseEnter={e => e.currentTarget.style.borderColor = color + '33'}
             onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
        >
            <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
                    <h3 className="text-2xl font-bold text-white mb-1 truncate">{value}</h3>
                    {growth !== undefined && growth !== null ? (
                        <GrowthBadge value={growth} label={growthLabel} />
                    ) : subtitle ? (
                        <div className="text-[11px] text-white/40 italic">{subtitle}</div>
                    ) : null}
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
                    {icon}
                </div>
            </div>
        </div>
    );

    // ─── Insight Card (glass style) ────────────────────────────────
    const InsightCard = ({ children, className = '' }) => (
        <div className={`bg-[#2D2D2D] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all duration-300 ${className}`}>
            {children}
        </div>
    );

    // ─── Stat Row ──────────────────────────────────────────────────
    const StatRow = ({ label, value, color, total }) => {
        const pct = total > 0 ? (value / total) * 100 : 0;
        return (
            <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-white/60">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs font-mono text-white/80 w-6 text-right">{value}</span>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout title="Admin Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6 pb-12">
                {/* ════════════════════════════════════════════════════════════
                    HEADER
                ════════════════════════════════════════════════════════════ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-normal text-white">Executive Overview</h1>
                        <p className="text-white/40 text-sm">Real-time performance monitoring and business insights.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-white/30 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        LIVE UPDATE: {new Date().toLocaleTimeString('id-ID')}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    KPI CARDS — Primary Row (3 columns)
                ════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <KPICard
                        label="Revenue Hari Ini"
                        value={fmt(todaysSales)}
                        growth={salesGrowth}
                        color="#E84C30"
                        icon={<svg className="w-5 h-5 text-[#E84C30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    />
                    <KPICard
                        label="Total Pesanan"
                        value={fmtNumber(totalOrdersToday)}
                        growth={orderGrowth}
                        color="#10B981"
                        icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>}
                    />
                    <KPICard
                        label="Rata-rata Order"
                        value={fmt(avgOrderValue)}
                        growth={aovGrowth}
                        color="#3B82F6"
                        icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>}
                    />

                    <KPICard
                        label="Profit Margin"
                        value={`${financial.profitMargin}%`}
                        growth={financial.incomeGrowth}
                        growthLabel="vs bulan lalu"
                        color="#8B5CF6"
                        icon={<svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>}
                    />
                    <KPICard
                        label="Meja Aktif"
                        value={`${activeTables} / ${totalTables}`}
                        subtitle="Saat ini terisi"
                        color="#F59E0B"
                        icon={<svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>}
                    />
                    <KPICard
                        label="Inventory Alert"
                        value={lowStockCount}
                        subtitle={`${pendingPOCount} PO pending`}
                        color="#EF4444"
                        icon={<svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                    />
                </div>

                {/* ════════════════════════════════════════════════════════════
                    REVENUE CHARTS ROW
                ════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* 30-Day Revenue Trend */}
                    <InsightCard className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <SectionHeader title="Revenue Performance" subtitle="Tren revenue 30 hari terakhir" />
                        </div>
                        <div className="h-[280px] w-full">
                            {salesTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E84C30" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#E84C30" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickFormatter={(val) => `${(val/1000000).toFixed(1)}jt`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="revenue" stroke="#E84C30" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-white/10 uppercase tracking-[0.2em] text-[10px] font-bold">
                                    <svg className="w-12 h-12 mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                    Insufficient data for trend
                                </div>
                            )}
                        </div>
                    </InsightCard>

                    {/* Weekly Comparison */}
                    <InsightCard>
                        <SectionHeader title="Perbandingan Mingguan" subtitle="Minggu ini vs minggu lalu" />
                        <div className="h-[280px] w-full mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyComparison} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                                    <YAxis hide />
                                    <Tooltip content={<WeeklyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="lastWeek" name="Minggu Lalu" fill="rgba(255,255,255,0.08)" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="thisWeek" name="Minggu Ini" fill="#E84C30" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </InsightCard>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    OPERATIONS INTELLIGENCE
                ════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Peak Hours */}
                    <InsightCard>
                        <SectionHeader title="Jam Ramai" subtitle="Distribusi penjualan per jam hari ini" />
                        <div className="h-[240px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} interval={3} />
                                    <YAxis hide />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', borderRadius: '8px' }} itemStyle={{ color: '#E84C30' }} />
                                    <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
                                        {hourlyDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? '#E84C30' : 'rgba(255,255,255,0.05)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </InsightCard>

                    {/* Payment Method Breakdown */}
                    <InsightCard>
                        <SectionHeader title="Metode Pembayaran" subtitle="Breakdown pembayaran hari ini" />
                        <div className="h-[200px] w-full mt-4">
                            {paymentBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentBreakdown.map(p => ({ name: p.method, value: p.total }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {paymentBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.method] || COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(val) => fmt(val)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-white/10 uppercase tracking-widest text-[10px] font-bold italic">Belum ada transaksi</div>
                            )}
                        </div>
                        {/* Payment Legend */}
                        <div className="mt-2 grid grid-cols-2 gap-1">
                            {paymentBreakdown.map((p, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px]">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PAYMENT_COLORS[p.method] || COLORS[i % COLORS.length] }} />
                                    <span className="text-white/50 uppercase tracking-wider truncate">{p.method}</span>
                                    <span className="text-white/80 font-mono ml-auto">{p.count}x</span>
                                </div>
                            ))}
                        </div>
                    </InsightCard>

                    {/* Category Revenue */}
                    <InsightCard>
                        <SectionHeader title="Revenue per Kategori" subtitle="Breakdown kategori 7 hari terakhir" />
                        <div className="h-[200px] w-full mt-4">
                            {categoryStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="revenue">
                                            {categoryStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ fontSize: '12px' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-[10px] text-white/50 uppercase tracking-widest">{value}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-white/10 uppercase tracking-widest text-[10px] font-bold italic">No data</div>
                            )}
                        </div>
                    </InsightCard>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    BUSINESS INSIGHTS ROW
                ════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Financial Health */}
                    <InsightCard>
                        <SectionHeader title="Kesehatan Keuangan" subtitle="P&L bulan berjalan" />
                        <div className="mt-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/50">Pemasukan</span>
                                <span className="text-sm font-bold text-emerald-400">{fmtCompact(financial.totalIncome)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/50">Pengeluaran</span>
                                <span className="text-sm font-bold text-red-400">{fmtCompact(financial.totalExpense)}</span>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/70 font-semibold">Laba Bersih</span>
                                <span className={`text-lg font-bold ${financial.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {fmtCompact(financial.netProfit)}
                                </span>
                            </div>
                            {/* Profit Margin Gauge */}
                            <div className="mt-2">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest">Profit Margin</span>
                                    <span className="text-xs font-mono text-white/70">{financial.profitMargin}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{
                                            width: `${Math.min(Math.max(financial.profitMargin, 0), 100)}%`,
                                            background: financial.profitMargin >= 20 ? 'linear-gradient(90deg, #10B981, #34D399)' : financial.profitMargin >= 10 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #EF4444, #F87171)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </InsightCard>

                    {/* Workforce Pulse */}
                    <InsightCard>
                        <SectionHeader title="Kehadiran SDM" subtitle="Snapshot hari ini" />
                        <div className="mt-5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-white">{workforce.attendanceRate}%</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Tingkat Hadir</div>
                                </div>
                                <div className="flex-1 h-16">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Hadir', value: workforce.present - workforce.late },
                                                    { name: 'Terlambat', value: workforce.late },
                                                    { name: 'Absen', value: workforce.absent },
                                                ]}
                                                cx="50%" cy="50%" innerRadius={20} outerRadius={30} dataKey="value" paddingAngle={3}
                                            >
                                                <Cell fill="#10B981" stroke="none" />
                                                <Cell fill="#F59E0B" stroke="none" />
                                                <Cell fill="#EF4444" stroke="none" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <StatRow label="Hadir Tepat Waktu" value={workforce.present - workforce.late} color="#10B981" total={workforce.totalEmployees} />
                            <StatRow label="Terlambat" value={workforce.late} color="#F59E0B" total={workforce.totalEmployees} />
                            <StatRow label="Tidak Hadir" value={workforce.absent} color="#EF4444" total={workforce.totalEmployees} />
                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] text-white/30 uppercase tracking-widest">Pengajuan Cuti</span>
                                <span className="text-xs font-mono text-amber-400">{workforce.pendingLeaves} pending</span>
                            </div>
                        </div>
                    </InsightCard>

                    {/* Reservation Pipeline */}
                    <InsightCard>
                        <SectionHeader title="Pipeline Reservasi" subtitle="Reservasi hari ini & mendatang" />
                        <div className="mt-5">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-white">{reservations.totalToday}</div>
                                    <div className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">Hari Ini</div>
                                </div>
                                <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-400">{reservations.upcomingCount}</div>
                                    <div className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">7 Hari Kedepan</div>
                                </div>
                            </div>
                            <StatRow label="Confirmed" value={reservations.confirmed} color="#3B82F6" total={reservations.totalToday || 1} />
                            <StatRow label="Checked In" value={reservations.checkedIn} color="#10B981" total={reservations.totalToday || 1} />
                            <StatRow label="Completed" value={reservations.completed} color="#8B5CF6" total={reservations.totalToday || 1} />
                            <StatRow label="No Show" value={reservations.noShow} color="#EF4444" total={reservations.totalToday || 1} />
                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest">Rata-rata Tamu</span>
                                </div>
                                <span className="text-xs font-mono text-white/70">{reservations.avgGuests} pax</span>
                            </div>
                        </div>
                    </InsightCard>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    TOP PERFORMERS & RECENT ACTIVITY
                ════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Top Sellers */}
                    <InsightCard className="overflow-hidden p-0 flex flex-col">
                        <div className="p-4 border-b border-white/5">
                            <SectionHeader title="Menu Terlaris" subtitle="Penjualan tertinggi 7 hari terakhir" />
                        </div>
                        <div className="flex-1">
                            {topMenus.length > 0 ? (
                                <table className="w-full">
                                    <tbody>
                                        {topMenus.map((menu, i) => (
                                            <tr key={i} className="group hover:bg-white/[0.02] transition-all">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                            i === 0 ? 'bg-[#E84C30]/20 text-[#E84C30]' :
                                                            i === 1 ? 'bg-amber-500/15 text-amber-400' :
                                                            i === 2 ? 'bg-blue-500/15 text-blue-400' :
                                                            'bg-white/5 text-white/20'
                                                        }`}>
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm text-white font-medium">{menu.name}</div>
                                                            <div className="text-[10px] text-white/30 uppercase">{fmtNumber(menu.total_qty)} terjual</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="text-sm text-white font-mono">{fmtCompact(menu.total_revenue)}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-white/10 uppercase tracking-widest text-[10px] font-bold">Belum ada penjualan</div>
                            )}
                        </div>
                    </InsightCard>

                    {/* Top Customers */}
                    <InsightCard className="overflow-hidden p-0 flex flex-col">
                        <div className="p-4 border-b border-white/5">
                            <SectionHeader title="Pelanggan VIP" subtitle="Top spender terdaftar" />
                            <div className="flex items-center gap-4 mt-3">
                                <div className="bg-white/[0.03] rounded-lg px-3 py-1.5">
                                    <span className="text-lg font-bold text-white">{fmtNumber(customers.totalCustomers)}</span>
                                    <span className="text-[9px] text-white/30 uppercase tracking-widest ml-2">Total</span>
                                </div>
                                <div className="bg-emerald-500/10 rounded-lg px-3 py-1.5">
                                    <span className="text-lg font-bold text-emerald-400">+{customers.newThisMonth}</span>
                                    <span className="text-[9px] text-white/30 uppercase tracking-widest ml-2">Baru</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            {customers.topCustomers?.length > 0 ? (
                                <table className="w-full">
                                    <tbody>
                                        {customers.topCustomers.map((c, i) => (
                                            <tr key={i} className="group hover:bg-white/[0.02] transition-all">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-violet-500/15 text-violet-400 flex items-center justify-center text-[10px] font-bold uppercase">
                                                            {c.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm text-white font-medium truncate max-w-[120px]">{c.name}</div>
                                                            <div className="text-[10px] text-white/30">{c.orders} pesanan</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-sm text-white font-mono">{fmtCompact(c.spending)}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-white/10 uppercase tracking-widest text-[10px] font-bold">Belum ada pelanggan</div>
                            )}
                        </div>
                    </InsightCard>

                    {/* Recent Orders */}
                    <InsightCard className="overflow-hidden p-0 flex flex-col">
                        <div className="p-4 border-b border-white/5">
                            <SectionHeader title="Aktivitas Terbaru" subtitle="Live stream transaksi terakhir" />
                        </div>
                        <div className="flex-1">
                            {recentOrders.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="p-4 hover:bg-white/[0.02] transition-all">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="text-xs font-mono text-[#E84C30]">{order.order_number}</div>
                                                <div className="text-[10px] text-white/20">{order.time}</div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="text-sm text-white/80">{order.table}</div>
                                                    <div className="text-[10px] text-white/30 italic">{order.customer}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-white font-medium">{fmt(order.total)}</div>
                                                    <div className={`text-[9px] uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                                                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        order.status === 'pending' || order.status === 'Pending Payment' ? 'bg-amber-500/10 text-amber-400' :
                                                        'bg-white/5 text-white/40'
                                                    }`}>
                                                        {order.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-white/10 uppercase tracking-widest text-[10px] font-bold">Menunggu pesanan...</div>
                            )}
                        </div>
                    </InsightCard>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    BRANCH PERFORMANCE (Owner Only)
                ════════════════════════════════════════════════════════════ */}
                {isOwner && branchComparison && branchComparison.length > 0 && (
                    <InsightCard className="overflow-hidden p-0">
                        <div className="px-4 py-4 border-b border-white/5 flex justify-between items-center">
                            <SectionHeader title="Performa Cabang" subtitle="Perbandingan antar lokasi operasional hari ini" />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.01]">
                                        <th className="px-4 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest">Lokasi Cabang</th>
                                        <th className="px-4 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest text-center">Pesanan</th>
                                        <th className="px-4 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest text-right">Net Revenue</th>
                                        <th className="px-4 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest text-right">Avg / Order</th>
                                        <th className="px-4 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest text-center">Market Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {branchComparison.map((branch, i) => {
                                        const totalRev = branchComparison.reduce((acc, b) => acc + Number(b.sales), 0);
                                        const marketShare = totalRev > 0 ? (Number(branch.sales) / totalRev) * 100 : 0;

                                        return (
                                            <tr key={i} className="hover:bg-white/[0.02] transition">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                        <span className="font-bold text-white/80 text-sm">{branch.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center font-mono text-white/40 text-sm">{branch.orders}</td>
                                                <td className="px-4 py-4 text-right font-medium text-white text-sm">{fmt(branch.sales)}</td>
                                                <td className="px-4 py-4 text-right font-mono text-white/50 text-sm">{fmt(branch.avgOrder)}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${marketShare}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                        </div>
                                                        <span className="text-[10px] text-white/30 font-mono w-8">{marketShare.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-[#E84C30]/5">
                                    <tr>
                                        <td className="px-4 py-4 text-[#E84C30] font-bold text-sm">TOTAL JARINGAN</td>
                                        <td className="px-4 py-4 text-[#E84C30] font-mono text-sm text-center">{branchComparison.reduce((acc, b) => acc + b.orders, 0)}</td>
                                        <td className="px-4 py-4 text-right text-[#E84C30] font-bold text-sm">{fmt(branchComparison.reduce((acc, b) => acc + Number(b.sales), 0))}</td>
                                        <td className="px-4 py-4 text-right text-[#E84C30] font-mono text-sm">—</td>
                                        <td className="px-4 py-4 text-center text-[#E84C30] text-[10px] font-bold">100%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </InsightCard>
                )}
            </div>
        </AdminLayout>
    );
}

