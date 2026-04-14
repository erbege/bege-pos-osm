import { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useUIStore } from '@/Stores/useUIStore';
import Drawer from '@/Components/Drawer';

export default function PosLayout({ children }) {
    const { auth, users } = usePage().props;

    const collapsed = useUIStore((s) => s.isSidebarCollapsed);
    const toggleCollapsed = useUIStore((s) => s.toggleSidebar);

    const printerSettings = useUIStore((s) => s.printerSettings);
    const printerStatus = useUIStore((s) => s.printerStatus);
    const setPrinterStatus = useUIStore((s) => s.setPrinterStatus);
    const isPrinterDrawerOpen = useUIStore((s) => s.isPrinterDrawerOpen);
    const togglePrinterDrawer = useUIStore((s) => s.togglePrinterDrawer);
    const updatePrinterSettings = useUIStore((s) => s.updatePrinterSettings);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('theme') || 'dark';
        return 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    // Shift Change State
    const [shiftModalOpen, setShiftModalOpen] = useState(false);
    const [selectedShiftUser, setSelectedShiftUser] = useState(null);
    const [shiftPassword, setShiftPassword] = useState('');
    const [showShiftPassword, setShowShiftPassword] = useState(false);
    const [shiftError, setShiftError] = useState('');
    const [processingShift, setProcessingShift] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleShiftChange = (e) => {
        e.preventDefault();
        if (!selectedShiftUser || !shiftPassword) {
            setShiftError('Password wajib diisi');
            return;
        }

        setProcessingShift(true);
        setShiftError('');

        router.post(route('pos.switch_shift'), {
            user_id: selectedShiftUser.id,
            password: shiftPassword
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShiftModalOpen(false);
                setSelectedShiftUser(null);
                setShiftPassword('');
            },
            onError: (errors) => {
                setProcessingShift(false);
                setShiftError(errors.password || 'Terjadi kesalahan');
            }
        });
    };

    return (
        <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: 'var(--g-bg-primary)' }}>
            {/* Sidebar */}
            <aside className={`flex-col justify-between hidden md:flex transition-all duration-300 shrink-0 ${collapsed ? 'w-[68px]' : 'w-64'}`} style={{ backgroundColor: 'var(--g-bg-secondary)', borderRight: '1px solid var(--g-border)' }}>
                <div>
                    {/* Brand */}
                    <div className="h-16 flex items-center px-3" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <Link href="/" className="flex items-center gap-3 group w-full justify-center" style={collapsed ? { justifyContent: 'center' } : { justifyContent: 'start', paddingLeft: '8px' }}>
                            <img
                                src="/images/garasi66_logo.png"
                                alt="GG"
                                className="w-9 h-9 object-contain group-hover:scale-110 transition-transform duration-300 shrink-0"
                            />
                            {!collapsed && (
                                <div className="overflow-hidden whitespace-nowrap">
                                    <span className="font-black text-base tracking-tight leading-none" style={{ color: 'var(--g-text-primary)' }}>
                                        GARASI <span className="text-[#E84C30]">66</span>
                                    </span>
                                    <span className="block text-[9px] tracking-[0.2em] uppercase" style={{ color: 'var(--g-text-muted)' }}>Point of Sale</span>
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="p-2 space-y-1">
                        {[
                            { href: route('pos.index'), label: 'Cashier', icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>, active: true },
                            { href: route('kitchen.index'), label: 'Kitchen', icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path></svg> },
                            { href: route('admin.dashboard'), label: 'Dashboard', icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg> },
                        ].map(item => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${collapsed ? 'justify-center' : ''}`}
                                style={item.active ? { backgroundColor: 'var(--g-accent-soft)', color: 'var(--g-accent)', fontWeight: 600 } : { color: 'var(--g-text-tertiary)' }}
                                title={collapsed ? item.label : undefined}
                            >
                                {item.icon}
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid var(--g-border)' }}>
                    {/* Collapse Toggle */}
                    <button
                        onClick={() => toggleCollapsed()}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2 transition-all"
                        style={{ color: 'var(--g-text-muted)' }}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                        </svg>
                        {!collapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Collapse</span>}
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 text-xs transition-all ${collapsed ? 'justify-center' : 'pl-5'}`}
                        style={{ color: 'var(--g-text-tertiary)', borderTop: '1px solid var(--g-border)' }}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        ) : (
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        )}
                        {!collapsed && (theme === 'dark' ? 'Light' : 'Dark')}
                    </button>

                    {/* User Dropdown */}
                    <div className={`p-2 relative ${collapsed ? 'flex justify-center' : ''}`} ref={userMenuRef} style={{ borderTop: '1px solid var(--g-border)' }}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className={`w-full flex items-center gap-3 px-3 py-1 rounded-lg hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}
                        >
                            <div className="w-7 h-7 rounded-full bg-[#E84C30]/20 text-[#E84C30] flex items-center justify-center text-xs font-normal uppercase shrink-0">
                                {auth?.user?.name?.charAt(0) || 'G'}
                            </div>
                            {!collapsed && (
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="text-sm font-medium truncate" style={{ color: 'var(--g-text-primary)' }}>{auth?.user?.name || 'Cashier'}</div>
                                    <div className="text-[10px] truncate" style={{ color: 'var(--g-text-muted)' }}>{auth?.user?.roles?.[0] || 'cashier'}</div>
                                </div>
                            )}
                        </button>

                        {userMenuOpen && (
                            <div className={`absolute ${collapsed ? 'left-[72px]' : 'left-2 right-2'} bottom-full mb-2 rounded-lg overflow-hidden z-50`} style={{ backgroundColor: 'var(--g-bg-tertiary)', border: '1px solid var(--g-border-strong)', boxShadow: '0 25px 50px var(--g-shadow)' }}>
                                <div className="p-2" style={{ borderBottom: '1px solid var(--g-border)' }}>
                                    <div className="text-xs font-bold truncate" style={{ color: 'var(--g-text-primary)' }}>{auth?.user?.name}</div>
                                    <div className="text-[10px] truncate" style={{ color: 'var(--g-text-muted)' }}>{auth?.user?.email}</div>
                                </div>
                                <div className="p-1.5">
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setShiftModalOpen(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-1 rounded-lg text-sm transition-all hover:bg-white/5"
                                        style={{ color: 'var(--g-text-tertiary)' }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                        Ganti Shift
                                    </button>
                                </div>
                                <div className="p-1.5" style={{ borderTop: '1px solid var(--g-border)' }}>
                                    <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-3 px-3 py-1 rounded-lg text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                        Logout
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 backdrop-blur-sm z-20 md:hidden" style={{ backgroundColor: 'var(--g-backdrop)' }} />}

            {/* Mobile Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 flex flex-col z-30 transform transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: 'var(--g-bg-secondary)', borderRight: '1px solid var(--g-border)' }}>
                <div className="h-16 flex items-center px-3" style={{ borderBottom: '1px solid var(--g-border)' }}>
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/garasi66_logo.png" alt="GG" className="w-9 h-9 object-contain" />
                        <div>
                            <span className="font-black text-base tracking-tight leading-none" style={{ color: 'var(--g-text-primary)' }}>GARASI <span className="text-[#E84C30]">66</span></span>
                            <span className="block text-[9px] tracking-[0.2em] uppercase" style={{ color: 'var(--g-text-muted)' }}>Point of Sale</span>
                        </div>
                    </Link>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                    <Link href={route('pos.index')} className="flex items-center gap-3 px-4 py-2 rounded-lg font-semibold text-sm" style={{ backgroundColor: 'var(--g-accent-soft)', color: 'var(--g-accent)' }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Cashier
                    </Link>
                    <Link href={route('kitchen.index')} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--g-text-tertiary)' }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path></svg>
                        Kitchen
                    </Link>
                    <Link href={route('admin.dashboard')} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--g-text-tertiary)' }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        Dashboard
                    </Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Bar */}
                <header className="h-14 flex items-center justify-between px-3 lg:px-3 z-10 shrink-0" style={{ backgroundColor: 'var(--g-bg-secondary)', borderBottom: '1px solid var(--g-border)' }}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1" style={{ color: 'var(--g-text-tertiary)' }}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--g-text-secondary)' }}>Point of Sale</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Printer Status */}
                        <button
                            onClick={() => togglePrinterDrawer(true)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${printerStatus === 'ready'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                : printerStatus === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/10 text-white/30'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${printerStatus === 'ready' ? 'bg-emerald-500' : printerStatus === 'error' ? 'bg-red-500' : 'bg-white/20'}`}></span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            <span className="hidden sm:inline">Printer: {printerSettings.type === 'system' ? 'System' : printerSettings.deviceName || 'Not Set'}</span>
                        </button>

                        <div className="text-xs font-mono hidden sm:block" style={{ color: 'var(--g-text-muted)' }}>
                            {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-x-hidden overflow-y-auto p-2 lg:p-2" style={{ backgroundColor: 'var(--g-bg-primary)' }}>
                    {children}
                </div>

                {/* Printer Selection Drawer */}
                <Drawer
                    show={isPrinterDrawerOpen}
                    onClose={() => togglePrinterDrawer(false)}
                    title="Printer Settings"
                >
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-normal text-white/30 uppercase tracking-[0.2em]">Connection Type</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'system', label: 'System Print', desc: 'Standard browser dialog' },
                                    { id: 'bluetooth', label: 'Bluetooth', desc: 'Direct ESC/POS (Beta)' }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => updatePrinterSettings({ type: type.id })}
                                        className={`p-3 rounded-lg border transition-all text-left ${printerSettings.type === type.id
                                            ? 'bg-[#E84C30] border-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20'
                                            : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                                            }`}
                                    >
                                        <div className="font-bold text-xs">{type.label}</div>
                                        <div className="text-[9px] opacity-60 mt-1">{type.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[11px] font-normal text-white/30 uppercase tracking-[0.2em]">Paper Size</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {['58mm', '80mm'].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => updatePrinterSettings({ paperSize: size })}
                                        className={`p-2 rounded-lg border transition-all text-center text-xs font-bold ${printerSettings.paperSize === size
                                            ? 'bg-white/10 border-white/30 text-white'
                                            : 'bg-white/5 border-white/10 text-white/40'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {printerSettings.type === 'bluetooth' && (
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <button
                                    onClick={() => {
                                        // Mocking Bluetooth pairing request
                                        setPrinterStatus('printing');
                                        setTimeout(() => {
                                            updatePrinterSettings({ deviceName: 'Thermal Printer P25' });
                                            setPrinterStatus('ready');
                                        }, 1500);
                                    }}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                                    Scan & Pair Device
                                </button>
                                {printerSettings.deviceName && (
                                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                                        <span className="text-emerald-400 text-xs font-bold italic">{printerSettings.deviceName}</span>
                                        <span className="text-[10px] text-emerald-500/60 font-bold uppercase">Connected</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/5">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={printerSettings.autoPrint}
                                    onChange={(e) => updatePrinterSettings({ autoPrint: e.target.checked })}
                                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-[#E84C30] focus:ring-[#E84C30]/40"
                                />
                                <span className="text-xs text-white/60 group-hover:text-white transition-colors">Auto-print receipt after payment</span>
                            </label>
                        </div>
                    </div>
                </Drawer>
            </main>

            {/* Shift Change Modal */}
            {shiftModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShiftModalOpen(false)}></div>
                    <div className="relative w-full max-w-md rounded-lg overflow-hidden shadow-2xl transition-all" style={{ backgroundColor: 'var(--g-bg-tertiary)', border: '1px solid var(--g-border)' }}>
                        <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--g-border)' }}>
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Ganti Shift Kasir</h3>
                            <p className="text-xs mt-1" style={{ color: 'var(--g-text-muted)' }}>Pilih kasir pengganti dan masukkan password</p>
                        </div>

                        <div className="p-2">
                            {!selectedShiftUser ? (
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {users?.length > 0 ? users.map((u) => (
                                        <button
                                            key={u.id}
                                            onClick={() => setSelectedShiftUser(u)}
                                            className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-all text-left"
                                            style={{ border: '1px solid var(--g-border)' }}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#E84C30]/20 text-[#E84C30] flex items-center justify-center text-sm font-normal uppercase shrink-0">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{u.name}</div>
                                                <div className="text-xs" style={{ color: 'var(--g-text-muted)' }}>{u.email}</div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="text-center py-8 text-sm text-gray-400">
                                            Tidak ada user kasir/admin lain yang tersedia.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleShiftChange} className="space-y-5">
                                    <div className="flex items-center gap-4 p-2 rounded-lg mb-6" style={{ backgroundColor: 'var(--g-bg-secondary)' }}>
                                        <div className="w-12 h-12 rounded-full bg-[#E84C30]/20 text-[#E84C30] flex items-center justify-center text-lg font-normal uppercase shrink-0">
                                            {selectedShiftUser.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--g-text-muted)' }}>Kasir Pengganti</div>
                                            <div className="font-bold text-base leading-tight" style={{ color: 'var(--g-text-primary)' }}>{selectedShiftUser.name}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-normal uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--g-text-muted)' }}>Password</label>
                                        <div className="relative group">
                                            <input
                                                type={showShiftPassword ? 'text' : 'password'}
                                                value={shiftPassword}
                                                onChange={(e) => setShiftPassword(e.target.value)}
                                                className="w-full bg-black/20 border text-sm rounded-lg px-4 py-2 pr-12 transition-all focus:ring-1 focus:ring-[#E84C30] outline-none"
                                                style={{ borderColor: shiftError ? '#ef4444' : 'var(--g-border)', color: 'var(--g-text-primary)' }}
                                                placeholder="••••••••"
                                                required
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowShiftPassword(!showShiftPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:text-[#E84C30] transition-colors"
                                                style={{ color: 'var(--g-text-tertiary)' }}
                                            >
                                                {showShiftPassword ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                                )}
                                            </button>
                                        </div>
                                        {shiftError && <div className="mt-2 text-red-500 text-[10px] font-bold px-1">{shiftError}</div>}
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedShiftUser(null);
                                                setShiftPassword('');
                                                setShiftError('');
                                            }}
                                            className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-white/5 flex-1"
                                            style={{ color: 'var(--g-text-secondary)', border: '1px solid var(--g-border)' }}
                                            disabled={processingShift}
                                        >
                                            Kembali
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded-lg text-sm font-normal uppercase tracking-widest text-white transition-all hover:bg-[#D4432A] flex-1 bg-[#E84C30] disabled:opacity-50 shadow-lg shadow-[#E84C30]/20"
                                            disabled={processingShift || !shiftPassword}
                                        >
                                            {processingShift ? 'Proses...' : 'Konfirmasi'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
