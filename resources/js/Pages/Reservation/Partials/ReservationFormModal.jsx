import React, { useState, useMemo } from 'react';

export default function ReservationFormModal({ show, onClose, onConfirm, tables, menus, timeDetails }) {
    const [form, setForm] = useState({
        customer_name: '',
        customer_phone: '',
        notes: '',
        menus: [],
    });

    const [showBrowser, setShowBrowser] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [processing, setProcessing] = useState(false);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(menus.map(m => m.category?.name))).filter(Boolean);
        return cats;
    }, [menus]);

    const filteredMenus = useMemo(() => {
        return menus.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = !selectedCategory || m.category?.name === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menus, searchQuery, selectedCategory]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const addMenu = (menu) => {
        setForm(prev => {
            const existing = prev.menus.find(m => m.id === menu.id);
            if (existing) {
                return {
                    ...prev,
                    menus: prev.menus.map(m => m.id === menu.id ? { ...m, qty: m.qty + 1 } : m)
                };
            }
            return {
                ...prev,
                menus: [...prev.menus, {
                    id: menu.id,
                    qty: 1,
                    name: menu.name,
                    price: menu.price
                }]
            };
        });
    };

    const updateMenuQty = (id, delta) => {
        setForm(prev => ({
            ...prev,
            menus: prev.menus.map(m => {
                if (m.id === id) {
                    const newQty = m.qty + delta;
                    return newQty > 0 ? { ...m, qty: newQty } : m;
                }
                return m;
            })
        }));
    };

    const removeMenu = (id) => {
        setForm(prev => ({
            ...prev,
            menus: prev.menus.filter(m => m.id !== id)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        await onConfirm(form);
        setProcessing(false);
    };

    if (!show || !tables) return null;

    const tableNames = tables.map(t => t.name).join(' + ');
    const totalEstimasi = form.menus.reduce((acc, m) => acc + (m.qty * m.price), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-12 overflow-y-auto">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500" onClick={onClose}></div>

            <div className="relative w-full max-w-7xl bg-[#222222] border border-white/5 rounded-lg overflow-hidden shadow-2xl shadow-black animate-bounce-in my-auto max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                    <div className="p-6 pb-4 flex justify-between items-center text-white bg-black/5 border-b border-white/5">
                        <div>
                            <h2 className="text-xl font-normal tracking-tight mb-1">
                                Konfirmasi Booking
                            </h2>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Lengkapi Detail Reservasi</p>
                        </div>
                        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/20 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="px-6 pb-6 pt-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="bg-white/5 rounded-lg p-3 mb-8 border border-white/5 text-white">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <span className="block text-white/20 text-[9px] font-normal uppercase tracking-[0.2em] mb-1.5">Waktu</span>
                                    <span className="font-normal text-sm">{timeDetails?.reservation_date} · {timeDetails?.start_time} WIB</span>
                                </div>
                                <div>
                                    <span className="block text-white/20 text-[9px] font-normal uppercase tracking-[0.2em] mb-1.5">Kapasitas</span>
                                    <span className="font-normal text-sm">{timeDetails?.guest_count} Orang</span>
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t border-white/5">
                                <span className="block text-white/20 text-[9px] font-normal uppercase tracking-[0.2em] mb-1.5">Konfigurasi Meja</span>
                                <span className="font-normal text-[#E84C30] text-sm uppercase tracking-tight">{tableNames}</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/20 text-[10px] font-normal uppercase tracking-widest mb-2.5 px-1">Nama Lengkap</label>
                                    <input
                                        name="customer_name"
                                        value={form.customer_name}
                                        onChange={handleChange}
                                        className="block w-full h-[40px] bg-black/20 border border-white/5 rounded-lg px-3 text-white text-sm font-bold placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-[#E84C30]/20 focus:border-[#E84C30]/50 transition-all"
                                        placeholder="Nama Pemesan"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/20 text-[10px] font-normal uppercase tracking-widest mb-2.5 px-1">WhatsApp</label>
                                    <input
                                        name="customer_phone"
                                        type="tel"
                                        value={form.customer_phone}
                                        onChange={handleChange}
                                        className="block w-full h-[40px] bg-black/20 border border-white/5 rounded-lg px-3 text-white text-sm font-bold placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-[#E84C30]/20 focus:border-[#E84C30]/50 transition-all"
                                        placeholder="0812..."
                                        required
                                    />
                                </div>
                            </div>

                            {/* Pre-order Section */}
                            <div>
                                <div className="flex justify-between items-center mb-2.5 px-1">
                                    <label className="block text-white/20 text-[10px] font-normal uppercase tracking-widest">Pre-order Menu</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowBrowser(true)}
                                        className="text-[#E84C30] text-[9px] font-normal uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1.5"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                                        Pilih Menu
                                    </button>
                                </div>

                                {form.menus.length === 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowBrowser(true)}
                                        className="w-full h-[64px] border-2 border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 group hover:border-[#E84C30]/30 transition-all"
                                    >
                                        <span className="text-[10px] font-bold text-white/20 group-hover:text-[#E84C30]/50 tracking-widest uppercase">Belum ada menu dipilih</span>
                                        <span className="text-[9px] font-medium text-white/10 group-hover:text-white/20">Klik untuk menambah menu pre-order</span>
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        {form.menus.map((m) => (
                                            <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 text-white">
                                                <div className="flex-1">
                                                    <div className="text-[11px] font-normal">{m.name}</div>
                                                    <div className="text-[9px] text-white/40">{m.qty}x · Rp {Number(m.price).toLocaleString()}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[11px] font-normal text-white/60">Rp {(m.qty * m.price).toLocaleString()}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMenu(m.id)}
                                                        className="p-2 text-red-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between px-4 py-2 bg-[#E84C30]/10 rounded-lg border border-[#E84C30]/20 mt-4">
                                            <span className="text-[10px] font-normal text-[#E84C30] uppercase tracking-widest">Total Estimasi Menu</span>
                                            <span className="text-sm font-normal text-white">Rp {totalEstimasi.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-white/20 text-[10px] font-normal uppercase tracking-widest mb-2.5 px-1">Catatan Tambahan</label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    className="block w-full bg-black/20 border border-white/5 rounded-lg p-3 text-white text-sm font-medium placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-[#E84C30]/20 focus:border-[#E84C30]/50 transition-all resize-none"
                                    rows="3"
                                    placeholder="Request khusus..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6 pt-6 flex gap-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="flex-1 px-4 py-2 bg-white/5 border border-white/5 rounded-lg text-[10px] font-normal uppercase tracking-[0.2em] text-white/40 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-[2] px-4 py-2 bg-white text-black rounded-lg text-[10px] font-normal uppercase tracking-[0.2em] hover:bg-[#E84C30] hover:text-white transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {processing ? (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            <span>{processing ? 'Memproses...' : 'Confirm Booking'}</span>
                        </button>
                    </div>
                </form>

                {/* POS-style Menu Browser Overlay */}
                {showBrowser && (
                    <div className="absolute inset-0 z-[60] bg-[#1A1A1A] flex flex-col animate-slide-up text-white">
                        {/* Header */}
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5 bg-black/40">
                            <div className="flex items-center gap-4 flex-1">
                                <button onClick={() => setShowBrowser(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5">
                                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                </button>
                                <div className="relative flex-1 max-w-md">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari menu favorit..."
                                        className="w-full h-[40px] bg-white/5 border border-white/5 rounded-lg px-11 text-sm font-bold placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#E84C30]/50"
                                    />
                                    <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                            </div>
                            <button onClick={() => setShowBrowser(false)} className="px-5 py-2 bg-[#E84C30] text-white text-[10px] font-normal uppercase tracking-widest rounded-lg hover:bg-[#D4432A] transition-all shadow-lg shadow-[#E84C30]/20">
                                Selesai
                            </button>
                        </div>

                        {/* 2-Column Content */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left: Menu Grid */}
                            <div className="flex-[3] flex flex-col border-r border-white/5">
                                {/* Categories */}
                                <div className="p-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={`px-3 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest transition-all ${!selectedCategory ? 'bg-[#E84C30] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                    >Semua</button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[#E84C30] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                        >{cat}</button>
                                    ))}
                                </div>

                                {/* Grid */}
                                <div className="flex-1 p-2 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 custom-scrollbar content-start">
                                    {filteredMenus.map(menu => (
                                        <button
                                            key={menu.id}
                                            onClick={() => addMenu(menu)}
                                            className="group flex flex-col bg-white/5 border border-white/5 rounded-lg p-3 text-left hover:bg-[#E84C30]/5 hover:border-[#E84C30]/20 transition-all active:scale-95"
                                        >
                                            <div className="aspect-square rounded-lg bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[#E84C30]/10 transition-colors overflow-hidden border border-white/5">
                                                {menu.image_url ? (
                                                    <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <svg className="w-8 h-8 text-white/10 group-hover:text-[#E84C30]/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                                )}
                                            </div>
                                            <div className="text-[11px] font-normal group-hover:text-white leading-tight mb-1">{menu.name}</div>
                                            <div className="text-[10px] font-medium text-[#E84C30]">Rp {Number(menu.price).toLocaleString()}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Selected Summary */}
                            <div className="flex-1 bg-black/20 flex flex-col min-w-[300px]">
                                <div className="p-2 border-b border-white/5">
                                    <h3 className="text-[10px] font-normal uppercase tracking-[0.2em] text-white/30">Pesanan ({form.menus.length} Item)</h3>
                                </div>
                                <div className="flex-1 p-2 overflow-y-auto custom-scrollbar space-y-3">
                                    {form.menus.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 scale-75">
                                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 118 0m-4 5v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"></path></svg>
                                            <p className="text-[11px] font-normal uppercase tracking-widest text-center">Belum ada pesanan</p>
                                        </div>
                                    ) : (
                                        form.menus.map((m) => (
                                            <div key={m.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                <div className="text-[10px] font-normal mb-2">{m.name}</div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center bg-black/40 rounded-lg overflow-hidden border border-white/5">
                                                        <button
                                                            onClick={() => updateMenuQty(m.id, -1)}
                                                            className="px-2 py-1 hover:bg-[#E84C30]/20 transition-colors text-white/40 hover:text-white"
                                                        >-</button>
                                                        <span className="px-3 py-1 text-[9px] font-normal border-x border-white/5 min-w-[32px] text-center">
                                                            {m.qty}
                                                        </span>
                                                        <button
                                                            onClick={() => updateMenuQty(m.id, 1)}
                                                            className="px-2 py-1 hover:bg-[#E84C30]/20 transition-colors text-white/40 hover:text-white"
                                                        >+</button>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[10px] font-normal text-[#E84C30]">
                                                            Rp {(m.qty * m.price).toLocaleString()}
                                                        </span>
                                                        <span className="text-[8px] text-white/20">Rp {Number(m.price).toLocaleString()} / item</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-2 bg-black/40 border-t border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-normal uppercase tracking-widest text-white/20">Total Estimasi</span>
                                            <span className="text-xs text-[#E84C30]/60 font-medium">Sudah termasuk pajak</span>
                                        </div>
                                        <span className="text-xl font-normal text-white">Rp {totalEstimasi.toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={() => setShowBrowser(false)}
                                        className="w-full py-2 bg-white text-black text-[10px] font-normal uppercase tracking-[0.2em] rounded-lg hover:bg-[#E84C30] hover:text-white transition-all shadow-xl shadow-black/40 active:scale-[0.98]"
                                    >
                                        Konfirmasi Pesanan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
