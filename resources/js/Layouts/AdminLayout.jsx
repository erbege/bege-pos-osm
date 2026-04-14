import { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import NotificationBell from '@/Components/NotificationBell';
import { useUIStore } from '@/Stores/useUIStore';

export default function AdminLayout({ children, title = 'Admin Dashboard' }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const collapsed = useUIStore((s) => s.isSidebarCollapsed);
    const toggleCollapsed = useUIStore((s) => s.toggleSidebar);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('theme') || 'dark';
        return 'dark';
    });
    const userMenuRef = useRef(null);
    const pageProps = usePage().props;

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // ─── Group open/close state ────────────────────────────────────
    const [openGroups, setOpenGroups] = useState(() => {
        if (typeof window === 'undefined') return {};
        const p = window.location.pathname;
        return {
            operations: p.includes('/branches') || p.includes('/menus') || p.includes('/tables') || p.includes('/reservations') || p.includes('/orders') || p.includes('/discounts'),
            inventory: p.includes('/inventory/ledger') || p.includes('/materials') || p.includes('/stock-transfers') || p.includes('/purchases') || p.includes('/stock-opname') || p.includes('/production') || p.includes('/wastage') || p.includes('/purchase-planning') || p.includes('/purchase-analytics') || p.includes('/waste-analytics'),
            hr: p.includes('/employees') || p.includes('/payroll') || p.includes('/cash-advances') || p.includes('/attendance') || p.includes('/shifts') || p.includes('/leave-requests') || p.includes('/overtime-requests') || p.includes('/performance-reviews') || p.includes('/employee-allowances') || p.includes('/attendance-corrections'),
            finance: (p.includes('/reports/ledger') || p.includes('/incomes') || p.includes('/expenses')) && !p.includes('/inventory/ledger'),
        };
    });
    const toggleGroup = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

    // ─── Navigation Data ───────────────────────────────────────────
    const topItems = [
        { label: 'Dashboard', href: route('admin.dashboard'), icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg> },
    ];

    const staffItems = auth?.user?.employee ? [
        { label: 'Jadwal & Tukar Shift', href: route('employee.shift-swap.index'), icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg> },
    ] : [];

    const groups = [
        {
            key: 'operations', label: 'Operasional', icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>,
            children: [
                { label: 'Daftar Pesanan', href: route('admin.orders.index') },
                { label: 'Reservasi Meja', href: route('admin.reservations.index') },
                { label: 'Voucher & Diskon', href: route('admin.discounts.index') },
                { label: 'Manajemen Cabang', href: route('admin.branches.index') },
                { label: 'Daftar Menu', href: route('admin.menus.index') },
                { label: 'Layout Meja', href: route('admin.tables') },
            ]
        },
        {
            key: 'inventory', label: 'Manajemen Inventori', icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>,
            children: [
                { label: 'Intelligence Dashboard', href: route('admin.inventory.dashboard') },
                { label: 'Inventory Catalog', href: route('admin.materials.index') },
                { label: 'Supply Chain Planning', href: route('admin.purchase-planning.index') },
                { label: 'Audit & Correction', href: route('admin.stock-opname.index') },
                { label: 'Production / Kitchen Prep', href: route('admin.production.index') },
                { label: 'Stock Movement Logs', href: route('admin.inventory.ledger') },
                { label: 'Branch Transfers', href: route('admin.stock-transfers.index') },
                { label: 'Supplier Registry', href: route('admin.suppliers.index') },
                { label: 'Wastage Control', href: route('admin.wastage.index') },
            ]
        },
        {
            key: 'hr', label: 'SDM & Absensi', icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>,
            children: [
                { label: 'Daftar Karyawan', href: route('admin.employees') },
                { label: 'Log Absensi', href: route('admin.attendance') },
                { label: 'Koreksi Absensi', href: route('admin.attendance-corrections') },
                { label: 'Penjadwalan Shift', href: route('admin.shift-management.index') },
                { label: 'Shift Templates', href: route('admin.shifts') },
                { label: 'Sistem Penggajian', href: route('admin.payroll') },
                { label: 'Tunjangan Karyawan', href: route('admin.employee-allowances.index') },
                { label: 'Cuti & Izin', href: route('admin.leave-requests') },
                { label: 'Lembur', href: route('admin.overtime-requests') },
                { label: 'Penilaian & Bonus', href: route('admin.performance-reviews.index') },
                { label: 'Kasbon', href: route('admin.cash-advances') },
            ]
        },
        {
            key: 'finance', label: 'Keuangan & Akuntansi', icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
            children: [
                { label: 'Dashboard Keuangan', href: route('admin.finance') },
                { label: 'Buku Besar (Ledger)', href: route('admin.reports.ledger') },
                { label: 'Pemasukan Manual', href: route('admin.incomes.index') },
                { label: 'Pengeluaran Manual', href: route('admin.expenses.index') },
                { label: 'Bagan Akun (COA)', href: route('admin.finance.coa') },
                { label: 'Tutup Buku / Periode', href: route('admin.finance.periods') },]
        },
        {
            key: 'reports', label: 'Laporan & Analitik', icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>,
            children: [
                { label: 'Analitik Pembelian', href: route('admin.purchase-planning.analytics') },
                { label: 'Analitik Wastage', href: route('admin.waste-analytics.index') },
                { label: 'Laporan Inventori', href: route('admin.inventory.ledger') },
            ]
        },
    ];

    const bottomItems = [
        ...(auth?.user?.roles?.includes('owner') ? [{
            label: 'Pengaturan', href: route('admin.settings'), icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        }] : []),
    ];

    // ─── Render helpers ────────────────────────────────────────────
    const renderLink = (item, isMobile = false) => {
        const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
        const showExpanded = isMobile || !collapsed;

        return (
            <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group/nav-link ${!isMobile && collapsed ? 'justify-center' : ''} ${
                    isActive 
                    ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20' 
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
                title={!isMobile && collapsed ? item.label : undefined}
            >
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/nav-link:scale-110'}`}>
                    {item.icon}
                </span>
                {showExpanded && <span>{item.label}</span>}
            </Link>
        );
    };

    const renderGroup = (group, isMobile = false) => {
        const isOpen = openGroups[group.key];
        const isGroupActive = group.children.some(c => currentPath === c.href || currentPath.startsWith(c.href + '/'));
        const showExpanded = isMobile || !collapsed;

        return (
            <div key={group.key} className="relative group/nav-item">
                <button
                    onClick={() => toggleGroup(group.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${!isMobile && collapsed ? 'justify-center' : ''} ${
                        isGroupActive 
                        ? 'bg-white/5 text-white' 
                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                    }`}
                    title={!isMobile && collapsed ? group.label : undefined}
                >
                    <span className={`transition-transform duration-300 ${isGroupActive ? 'scale-110 text-[#E84C30]' : 'group-hover/nav-item:scale-110'}`}>
                        {group.icon}
                    </span>
                    {showExpanded && <>
                        <span className="flex-1 text-left">{group.label}</span>
                        <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </>}
                </button>

                {/* Submenu: Inline for Expanded, Floating for Collapsed */}
                {showExpanded ? (
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-1 mb-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="ml-5 space-y-1 pl-3 border-l border-white/10">
                            {group.children.map(sub => {
                                const isActive = currentPath === sub.href || currentPath.startsWith(sub.href + '/');
                                return (
                                    <Link 
                                        key={sub.href + sub.label} 
                                        href={sub.href} 
                                        className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                            isActive 
                                            ? 'text-[#E84C30] bg-[#E84C30]/5' 
                                            : 'text-white/30 hover:text-white/70 hover:bg-white/5'
                                        }`}
                                    >
                                        {sub.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Floating Submenu for Collapsed Mode */
                    <div className="absolute left-full top-0 ml-3 w-56 invisible group-hover/nav-item:visible opacity-0 group-hover/nav-item:opacity-100 transition-all duration-300 z-[100] translate-x-2 group-hover/nav-item:translate-x-0">
                        <div className="bg-[#2D2D2D] rounded-xl border border-white/10 shadow-2xl overflow-hidden py-2 backdrop-blur-xl">
                            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E84C30]">{group.label}</span>
                            </div>
                            <div className="px-2 space-y-1">
                                {group.children.map(sub => {
                                    const isActive = currentPath === sub.href || currentPath.startsWith(sub.href + '/');
                                    return (
                                        <Link 
                                            key={sub.href} 
                                            href={sub.href} 
                                            className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                isActive 
                                                ? 'bg-[#E84C30] text-white' 
                                                : 'text-white/40 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {sub.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSectionLabel = (text) => (
        <div className="pt-4 pb-2 px-4"><div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/20">{text}</div></div>
    );

    return (
        <div className="min-h-screen flex bg-primary text-main selection:bg-[#E84C30]/30 theme-bg">
            <Head title={title} />

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col transition-all duration-200 ease-in-out shrink-0 sticky top-0 h-screen z-50 ${collapsed ? 'w-[60px]' : 'w-72'} theme-bg-card border-r theme-border`}>
                {/* Brand */}
                <div className="h-20 flex items-center px-2 shrink-0">
                    <Link href={route('admin.dashboard')} className="flex items-center gap-4 group w-full overflow-hidden" style={collapsed ? { justifyContent: 'center', padding: 0 } : {}}>
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-[#E84C30] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <img src="/images/garasi66_logo.png" alt="GG" className="w-10 h-10 object-contain relative z-10 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden whitespace-nowrap animate-slide-right">
                                <span className="font-black text-xl tracking-tighter leading-none block">GARASI <span className="text-[#E84C30]">66</span></span>
                                <span className="block text-[10px] tracking-[0.3em] uppercase font-bold text-white/30 mt-0.5">Admin Control</span>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 px-3 py-4 space-y-1 custom-scrollbar ${collapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
                    {topItems.map(item => renderLink(item))}
                    {staffItems.length > 0 && !collapsed && renderSectionLabel('Personal')}
                    {staffItems.map(item => renderLink(item))}
                    {!collapsed && renderSectionLabel('Operational')}
                    {groups.map(group => renderGroup(group))}
                    {!collapsed && renderSectionLabel('System')}
                    {bottomItems.map(item => renderLink(item))}
                </nav>

                {/* Quick Links Footer */}
                <div className="p-4 space-y-2 shrink-0 border-t theme-border bg-white/[0.01]">
                    <Link href={route('pos.index')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${collapsed ? 'justify-center bg-white/5' : 'bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-lg shadow-emerald-500/5'}`} title={collapsed ? 'Kasir' : undefined}>
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        {!collapsed && 'Buka Kasir'}
                    </Link>
                    
                    {/* Collapse Toggle */}
                    <button
                        onClick={() => toggleCollapsed()}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg hover:theme-bg-hover transition-all duration-300 group/collapse"
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        <div className={`p-1 rounded-md border theme-border transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`}>
                            <svg className="w-3 h-3 text-white/40 group-hover/collapse:text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                            </svg>
                        </div>
                        {!collapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-hover/collapse:text-main">Minimize</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar — slide-in drawer */}
            {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden transition-opacity duration-300" />}
            <aside className={`fixed inset-y-0 left-0 w-72 transform transition-transform duration-500 ease-in-out z-[70] flex flex-col md:hidden shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} theme-bg-card`}>
                <div className="h-20 flex items-center px-4 gap-4 shrink-0 border-b theme-border">
                    <img src="/images/garasi66_logo.png" alt="GG" className="w-10 h-10 object-contain" />
                    <div>
                        <span className="font-black text-lg tracking-tighter leading-none block">GARASI <span className="text-[#E84C30]">66</span></span>
                        <span className="block text-[9px] tracking-[0.2em] uppercase font-bold text-white/30">Mobile Admin</span>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {topItems.map(item => renderLink(item, true))}
                    {renderSectionLabel('Manajemen')}
                    {groups.map(group => renderGroup(group, true))}
                    {renderSectionLabel('System')}
                    {bottomItems.map(item => renderLink(item, true))}
                </nav>
                <div className="p-4 bg-white/[0.02] border-t theme-border space-y-4">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-12 h-12 rounded-xl bg-[#E84C30] flex items-center justify-center text-lg font-black shadow-lg shadow-[#E84C30]/20">
                            {auth?.user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{auth?.user?.name}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">{auth?.user?.roles?.[0] || 'staff'}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Link href={route('profile.edit')} className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 text-xs font-bold hover:theme-bg-hover transition-all border theme-border">
                            Profile
                        </Link>
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 text-xs font-bold hover:theme-bg-hover transition-all border theme-border">
                            {theme === 'dark' ? 'Light' : 'Dark'}
                        </button>
                    </div>
                    <Link href={route('logout')} method="post" as="button" className="w-full py-3 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all">
                        Logout
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-20 flex items-center justify-between px-4 sm:px-6 shrink-0 z-40 sticky top-0 backdrop-blur-2xl bg-primary/80 border-b theme-border theme-bg">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-3 rounded-xl bg-white/5 text-main transition-all hover:theme-bg-hover">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-main">{title}</h2>
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold hidden sm:block">Control Center & Insights</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Branch Switcher - Modern Style */}
                        {pageProps.branches?.length > 0 && (
                            <div className="hidden lg:flex items-center gap-3 bg-white/5 p-1 rounded-xl border theme-border">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20 pl-3">Store</span>
                                <select
                                    className="text-xs font-bold rounded-lg px-4 py-2 focus:outline-none theme-bg-elevated border theme-border text-main cursor-pointer hover:border-[#E84C30]/50 transition-all min-w-[140px]"
                                    value={pageProps.currentBranchId}
                                    onChange={(e) => router.post(route('admin.branches.switch'), { branch_id: e.target.value })}
                                >
                                    {pageProps.branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Theme Toggle Button */}
                        <button 
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2.5 rounded-lg bg-white/5 text-white/40 hover:text-main hover:theme-bg-hover transition-all border theme-border hidden sm:flex"
                            title="Switch Theme"
                        >
                            {theme === 'dark' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                            )}
                        </button>

                        <div className="h-8 w-px theme-border hidden sm:block mx-1"></div>

                        <NotificationBell auth={auth} />

                        {/* User Profile Trigger */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-3 p-1 rounded-xl hover:theme-bg-hover transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#E84C30] flex items-center justify-center text-sm font-black shadow-lg shadow-[#E84C30]/20 group-hover:scale-105 transition-transform">
                                    {auth?.user?.name?.charAt(0) || 'A'}
                                </div>
                                <div className="text-left hidden sm:block pr-2">
                                    <div className="text-sm font-bold leading-none">{auth?.user?.name}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1 font-bold">{auth?.user?.roles?.[0] || 'staff'}</div>
                                </div>
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 top-full mt-3 w-64 theme-bg-elevated rounded-xl border theme-border shadow-2xl overflow-hidden z-50 animate-bounce-in backdrop-blur-xl">
                                    <div className="p-5 border-b theme-border bg-white/[0.02]">
                                        <div className="text-sm font-bold text-main">{auth?.user?.name}</div>
                                        <div className="text-xs text-white/40 truncate mt-0.5">{auth?.user?.email}</div>
                                    </div>
                                    <div className="p-2">
                                        <Link href={route('profile.edit')} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:theme-bg-hover hover:text-main transition-all group">
                                            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-[#E84C30]/10 group-hover:text-[#E84C30] transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                            </div>
                                            My Profile
                                        </Link>
                                        <Link href={route('staff.dashboard')} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:theme-bg-hover hover:text-main transition-all group">
                                            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                            Staff Portal
                                        </Link>
                                    </div>
                                    <div className="p-2 border-t theme-border bg-black/10">
                                        <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/20">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                            Sign Out
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar theme-bg">
                    <div className="max-w-[1600px] mx-auto animate-slide-up">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

