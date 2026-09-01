import { Head, Link, usePage, router } from '@inertiajs/react';
import { useCartStore } from '@/Stores/useCartStore';
import { useState, useEffect } from 'react';

export default function CustomerLayout({ children, title = 'Garasi 66 Cafe & Resto' }) {
    const { activeTableId, activeTableName } = usePage().props;
    const searchQuery = useCartStore(s => s.searchQuery);
    const setSearchQuery = useCartStore(s => s.setSearchQuery);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // If searching from outside menu page, redirect to menu
        if (value && window.location.pathname !== '/menu') {
            router.visit('/menu');
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    // Scroll detection for dynamic positioning
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile search when navigating or query is cleared (optional)
    useEffect(() => {
        if (!isSearchOpen) return;
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsSearchOpen(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isSearchOpen]);

    return (
        <div className="min-h-screen bg-[#1A1A1A] flex flex-col">
            <Head title={title} />

            {/* Branded Header */}
            <header className="bg-[#2D2D2D] border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-3 sm:px-3 lg:px-8">
                    <div className="flex justify-between h-16 items-center gap-4">
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                            <Link href="/" className="flex items-center gap-3 group shrink-0">
                                <img
                                    src="/images/garasi66_logo.png"
                                    alt="Garasi 66"
                                    className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="hidden lg:block">
                                    <span className="text-white font-black text-lg tracking-tight">
                                        GARASI <span className="text-[#E84C30]">66</span>
                                    </span>
                                    <span className="block text-[10px] text-white/40 uppercase tracking-[0.2em] -mt-1">Cafe & Resto</span>
                                </div>
                            </Link>

                            {/* Desktop Search Bar */}
                            <div className="hidden md:block flex-1 max-w-xs sm:max-w-sm relative group">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#E84C30] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl pl-11 pr-10 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 focus:border-[#E84C30]/20 transition-all shadow-xl"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                )}
                            </div>

                            {/* Mobile Search Icon */}
                            <button 
                                onClick={() => setIsSearchOpen(true)}
                                className="md:hidden p-2 text-white/50 hover:text-[#E84C30] transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {window.location.pathname !== '/menu' && (
                                <Link
                                    href="/menu"
                                    className="text-emerald-400 hover:text-emerald-300 transition-colors p-2 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-normal uppercase tracking-widest border border-emerald-400/50 rounded-lg hover:border-emerald-400 hover:bg-emerald-400/10 flex items-center gap-2"
                                    title="Our Menu"
                                >
                                    <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                                    <span className="hidden sm:inline">Our Menu</span>
                                </Link>
                            )}

                            {window.location.pathname !== '/reservations' && (
                                <Link
                                    href="/reservations"
                                    className="text-[#E84C30] hover:text-[#D4432A] transition-colors p-2 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-normal uppercase tracking-widest border border-[#E84C30]/50 rounded-lg hover:border-[#E84C30] hover:bg-[#E84C30]/10 flex items-center gap-2"
                                    title="Book a Table"
                                >
                                    <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <span className="hidden sm:inline">Book a Table</span>
                                </Link>
                            )}
                            <Link
                                href="/select-table"
                                className="text-white/50 hover:text-[#E84C30] transition-colors p-2"
                                title="Select Table"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            </Link>
                            <Link
                                href="/cart"
                                className="relative text-white/50 hover:text-[#E84C30] transition-colors p-2"
                                title="View Cart"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-3 lg:px-8 py-6 flex flex-col">
                {children}
            </main>

            {/* Floating Active Table Indicator */}
            {activeTableId && (
                <div className={`fixed ${isScrolled ? 'top-32 md:top-20' : 'top-20'} right-4 sm:right-8 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-10`}>
                    <div className="relative group">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-[#E84C30] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        
                        <Link 
                            href={route('customer.select_table')}
                            className="relative flex flex-col items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#E84C30] to-[#D4432A] rounded-full border-2 border-white/20 shadow-2xl shadow-[#E84C30]/30 hover:scale-110 active:scale-95 transition-all duration-300 group"
                        >
                            <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/70 -mb-0.5">Table</span>
                            <span className="text-base sm:text-xl font-black text-white leading-none">
                                {activeTableName || activeTableId}
                            </span>
                            
                            {/* Subtle pulse ring */}
                            <div className="absolute inset-0 rounded-full border border-white/30 animate-ping opacity-20 pointer-events-none"></div>
                        </Link>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-white/5 py-6">
                <div className="max-w-7xl mx-auto px-3 text-center">
                    <p className="text-white/20 text-xs tracking-widest uppercase">© 2026 Garasi 66 · All Rights Reserved</p>
                </div>
            </footer>

            {/* Mobile Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-[#1A1A1A]/95 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsSearchOpen(false)}
                    ></div>
                    
                    {/* Search Input Container */}
                    <div className="relative p-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-2xl pl-12 pr-12 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 transition-all shadow-2xl"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsSearchOpen(false)}
                                className="bg-white/5 text-white/50 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border border-white/10"
                            >
                                Done
                            </button>
                        </div>
                        
                        {/* Quick Hint */}
                        <div className="mt-6 text-center">
                            <p className="text-white/20 text-[10px] font-medium uppercase tracking-[0.2em]">Searching for your favorites...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
