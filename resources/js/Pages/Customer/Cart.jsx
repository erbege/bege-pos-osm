import { useEffect } from 'react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { Link } from '@inertiajs/react';
import { useCartStore } from '@/Stores/useCartStore';
import { formatRupiah } from '@/Lib/utils';

export default function Cart({ taxPercentage = 11 }) {
    const items = useCartStore((s) => s.items);
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const updateNotes = useCartStore((s) => s.updateNotes);
    const removeItem = useCartStore((s) => s.removeItem);
    const clearCart = useCartStore((s) => s.clearCart);
    const totalItems = useCartStore((s) => s.getTotalItems());
    const subtotal = useCartStore((s) => s.getSubtotal());
    const grandTotal = useCartStore((s) => s.getGrandTotal());
    const discountCode = useCartStore((s) => s.discountCode);
    const setDiscountCode = useCartStore((s) => s.setDiscountCode);
    const appliedDiscount = useCartStore((s) => s.appliedDiscount);
    const applyDiscount = useCartStore((s) => s.applyDiscount);
    const clearDiscount = useCartStore((s) => s.clearDiscount);
    const isApplyingDiscount = useCartStore((s) => s.isApplyingDiscount);
    const taxAmount = useCartStore((s) => s.getTaxAmount());
    const storeTaxPercentage = useCartStore((s) => s.taxPercentage);
    const setTaxPercentage = useCartStore((s) => s.setTaxPercentage);

    useEffect(() => {
        if (taxPercentage !== undefined) {
            setTaxPercentage(taxPercentage);
        }
    }, [taxPercentage]);

    if (totalItems === 0) {
        return (
            <CustomerLayout title="Your Cart">
                <div className="py-20 text-center">
                    <div className="w-24 h-24 rounded-lg bg-white/5 mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                    <h2 className="text-white text-2xl font-normal mb-2">Keranjang Kosong</h2>
                    <p className="text-white/30 text-sm mb-10">Sepertinya Anda belum memilih menu apapun.</p>
                    <Link
                        href={route('customer.menu')}
                        className="inline-flex items-center gap-3 bg-[#E84C30] text-white px-8 py-2 rounded-lg font-normal uppercase tracking-widest text-xs shadow-lg shadow-[#E84C30]/30 hover:bg-[#D4432A] transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Lihat Menu
                    </Link>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout title="Your Cart">
            <div className="max-w-2xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-normal text-white tracking-tight">Your <span className="text-[#E84C30]">Cart</span></h1>
                        <p className="text-white/30 text-sm">{totalItems} items matching your taste</p>
                    </div>
                    <button
                        onClick={clearCart}
                        className="text-white/20 hover:text-red-400 text-[10px] font-normal uppercase tracking-widest py-1 px-3 rounded-lg border border-white/5 hover:border-red-400/20 transition-all"
                    >
                        Clear All
                    </button>
                </div>

                {/* Items List */}
                <div className="space-y-4 mb-8">
                    {items.map((item) => (
                        <div key={item.cart_id} className="bg-[#2D2D2D] rounded-lg border border-white/5 p-3 flex gap-4 hover:border-white/10 transition-colors">
                            {/* ... item content ... */}
                            <div className="w-20 h-20 bg-[#222] rounded-lg overflow-hidden shrink-0">
                                {item.image ? (
                                    <img src={item.image.startsWith('http') ? item.image : `/storage/${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-normal text-white/10 text-xl uppercase">
                                        {item.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-white text-sm truncate pr-2">{item.name}</h3>
                                    <span className="font-normal text-[#E84C30] text-sm whitespace-nowrap">
                                        <span className="text-[10px]">Rp</span> {(item.price * item.qty).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Tambah catatan (misal: pedas, tanpa es)..."
                                        value={item.notes || ''}
                                        onChange={(e) => updateNotes(item.cart_id, e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-[11px] text-white/40 placeholder-white/10 focus:ring-0 italic"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                                        <button
                                            onClick={() => updateQuantity(item.cart_id, item.qty - 1)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:bg-white/5 hover:text-white transition-all"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"></path></svg>
                                        </button>
                                        <span className="w-8 text-center text-white font-bold text-sm">{item.qty}</span>
                                        <button
                                            onClick={() => updateQuantity(item.cart_id, item.qty + 1)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:bg-white/5 hover:text-white transition-all"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.cart_id)}
                                        className="w-8 h-8 flex items-center justify-center text-white/10 hover:text-red-400 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Voucher Section */}
                <div className="mb-10 bg-white/5 rounded-2xl p-4 border border-white/5">
                    <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E84C30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                        Voucher Code
                    </h4>
                    
                    {appliedDiscount ? (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/20 p-2 rounded-lg">
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">{appliedDiscount.code}</p>
                                    <p className="text-white/40 text-[10px]">Voucher applied successfully</p>
                                </div>
                            </div>
                            <button 
                                onClick={clearDiscount}
                                className="text-white/20 hover:text-white text-[10px] font-bold uppercase tracking-widest"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter voucher code..."
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 transition-all"
                            />
                            <button
                                onClick={applyDiscount}
                                disabled={!discountCode || isApplyingDiscount}
                                className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all disabled:opacity-50"
                            >
                                {isApplyingDiscount ? '...' : 'Apply'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Detailed Summary */}
                <div className="bg-[#2D2D2D] rounded-2xl border border-white/5 p-6 mb-40 shadow-2xl">
                    <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-6 pb-4 border-b border-white/5">Order Summary</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/40">Subtotal</span>
                            <span className="text-white font-medium"><span className="text-[10px]">Rp</span> {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        
                        {appliedDiscount && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-emerald-400 font-medium">Discount ({appliedDiscount.code})</span>
                                <span className="text-emerald-400 font-medium">-<span className="text-[10px]">Rp</span> {appliedDiscount.amount.toLocaleString('id-ID')}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/40">Tax ({taxPercentage}%)</span>
                            <span className="text-white font-medium"><span className="text-[10px]">Rp</span> {taxAmount.toLocaleString('id-ID')}</span>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                            <div>
                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Total Payable</p>
                                <p className="text-3xl font-light text-white tracking-tighter leading-none"><span className="text-sm">Rp</span> {grandTotal.toLocaleString('id-ID')}</p>
                            </div>
                            <Link
                                href={route('customer.checkout')}
                                className="bg-[#E84C30] text-white px-6 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[#E84C30]/20 hover:bg-[#D4432A] hover:scale-105 active:scale-95 transition-all"
                            >
                                Checkout
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Floating Navigation (Back button only now) */}
                <div className="fixed bottom-6 left-6 right-6 z-50 pointer-events-none max-w-2xl mx-auto">
                    <Link
                        href={route('customer.menu')}
                        className="pointer-events-auto inline-flex items-center gap-2 bg-black/40 backdrop-blur-xl text-white/60 hover:text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/5 shadow-2xl transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Back to Menu
                    </Link>
                </div>
            </div>
        </CustomerLayout>
    );
}
