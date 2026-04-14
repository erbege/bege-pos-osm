import { useState, useEffect } from 'react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { Link, usePage } from '@inertiajs/react';
import { useCartStore } from '@/Stores/useCartStore';

export default function Menu({ menus = [], categories = [], activeTableId, activeTableName, activeBranchId, taxPercentage = 11 }) {
    const addItem = useCartStore((s) => s.addItem);
    const setTable = useCartStore((s) => s.setTable);
    const setTaxPercentage = useCartStore((s) => s.setTaxPercentage);
    const tableId = useCartStore((s) => s.tableId);
    const tableName = useCartStore((s) => s.tableName);
    const totalItems = useCartStore((s) => s.getTotalItems());
    const grandTotal = useCartStore((s) => s.getGrandTotal());
    const searchQuery = useCartStore((s) => s.searchQuery);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Sync session/props table to Zustand
    useEffect(() => {
        if (activeTableId && activeTableId !== tableId) {
            setTable(activeTableId, activeTableName);
        }
        if (taxPercentage !== undefined) {
            setTaxPercentage(taxPercentage);
        }
    }, [activeTableId, activeTableName, taxPercentage]);

    const filteredMenus = menus.filter(menu => {
        const matchesCategory = selectedCategory ? menu.category_id === selectedCategory : true;
        const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddItem = (menu) => {
        addItem(menu);
    };

    return (
        <CustomerLayout title="Menu - Garasi 66">
            {/* Table/Order Info Bar */}
            <div className="sticky top-4 z-50 px-4 mb-6 pointer-events-none">
                <div className="pointer-events-auto bg-[#1A1A1A]/90 backdrop-blur-2xl border border-white/5 p-1 rounded-full shadow-2xl flex items-center justify-between gap-4 max-w-xl mx-auto ring-1 ring-white/10">
                    <div className="flex items-center gap-3 pl-3 sm:pl-4">
                        <div className={`w-1.5 h-1.5 rounded-full ${tableId ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                        <span className="text-white text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap">
                            {tableId ? `Meja: ${tableName}` : 'Pesanan Langsung / Mandiri'}
                        </span>
                    </div>
                    <Link
                        href={route('customer.select_table')}
                        className="bg-white/5 hover:bg-white/10 text-white/70 px-5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border border-white/5"
                    >
                        {tableId ? 'Ganti Meja' : 'Pilih Meja'}
                    </Link>
                </div>
            </div>

            {/* Unified Header: Title */}
            <div className="mb-8 flex flex-col md:items-start justify-between gap-6 px-1">
                {/* Left Side: Title */}
                <div>
                    <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
                        Our <span className="font-semibold text-[#E84C30]">Menu</span>
                    </h1>
                </div>
            </div>

            {/* Category Filter - Compact Sticky Style */}
            <div className="mb-10 sticky top-[72px] z-30 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-[#1A1A1A]/80 backdrop-blur-xl border-y border-white/5 overflow-x-auto hide-scrollbar">
                <div className="flex gap-2 min-w-max md:justify-start">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${selectedCategory === null
                            ? 'bg-[#E84C30] text-white border-[#E84C30] shadow-lg shadow-[#E84C30]/20'
                            : 'bg-white/5 text-white/40 border-white/5 hover:text-white/70 hover:bg-white/10'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${selectedCategory === cat.id
                                ? 'bg-[#E84C30] text-white border-[#E84C30] shadow-lg shadow-[#E84C30]/20'
                                : 'bg-white/5 text-white/40 border-white/5 hover:text-white/70 hover:bg-white/10'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pb-32">
                {filteredMenus.map(menu => (
                    <div
                        key={menu.id}
                        onClick={() => handleAddItem(menu)}
                        className="bg-[#2D2D2D] rounded-lg overflow-hidden border border-white/5 hover:border-[#E84C30]/30 transition-all duration-300 group hover:shadow-xl hover:shadow-[#E84C30]/5 cursor-pointer flex flex-col h-full"
                    >
                        {/* Image */}
                        <div className="aspect-square bg-[#222] overflow-hidden relative">
                            {menu.image ? (
                                <img
                                    src={menu.image.startsWith('http') ? menu.image : `/storage/${menu.image}`}
                                    alt={menu.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-lg bg-[#E84C30]/10 text-[#E84C30] flex items-center justify-center font-normal text-2xl uppercase">
                                        {menu.name.substring(0, 1)}
                                    </div>
                                </div>
                            )}
                            {!menu.is_available && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white/80 text-xs font-normal uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full">Sold Out</span>
                                </div>
                            )}

                            {/* Processing Category Badge */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {menu.processing_category === 'ready_to_serve' && (
                                    <span className="bg-emerald-500/90 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[9px] font-normal uppercase tracking-wider shadow-md flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        &lt; 5m
                                    </span>
                                )}
                                {menu.processing_category === 'made_to_order' && (
                                    <span className="bg-orange-500/90 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[9px] font-normal uppercase tracking-wider shadow-md flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        &gt; 15m
                                    </span>
                                )}
                            </div>
                            
                            {/* Add Icon Overlay */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-[#E84C30] text-white p-3 rounded-lg shadow-lg shadow-[#E84C30]/40">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-3 flex flex-col flex-1">
                            <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-[#E84C30] transition-colors">
                                {menu.name}
                            </h3>
                            {menu.description && (
                                <p className="text-white/30 text-[11px] line-clamp-1 mb-3">{menu.description}</p>
                            )}
                            <div className="mt-auto flex justify-between items-center pt-2">
                                <span className="text-[#E84C30] font-normal text-sm">
                                    <span className="text-[10px]">Rp</span> {Number(menu.price).toLocaleString('id-ID')}
                                </span>
                                <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#E84C30]/10 group-hover:text-[#E84C30] transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Cart Summary */}
            {totalItems > 0 && (
                <div className="fixed bottom-6 left-6 right-6 z-50 animate-bounce-in">
                    <Link
                        href={route('customer.cart')}
                        className="bg-[#E84C30] text-white p-3 rounded-lg shadow-2xl shadow-[#E84C30]/40 flex items-center justify-between group transform hover:scale-[1.02] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-normal uppercase tracking-widest text-white/60">Your Order</p>
                                <p className="font-bold text-sm">{totalItems} Items Selected</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right mr-4 border-r border-white/20 pr-4">
                                <p className="text-[10px] font-normal uppercase tracking-widest text-white/60">Total Cost</p>
                                <p className="font-normal text-lg leading-none"><span className="text-sm">Rp</span> {grandTotal.toLocaleString('id-ID')}</p>
                            </div>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                        </div>
                    </Link>
                </div>
            )}

            {filteredMenus.length === 0 && (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 rounded-lg bg-white/5 mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <p className="text-white/30 text-sm font-medium">No items found.</p>
                    <p className="text-white/15 text-xs mt-1">Try adjusting your filters or search query.</p>
                </div>
            )}
        </CustomerLayout>
    );
}
