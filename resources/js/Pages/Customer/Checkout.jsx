import { useState, useEffect } from 'react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { useForm, router, Link, usePage } from '@inertiajs/react';
import { useCartStore } from '@/Stores/useCartStore';
import { formatRupiah } from '@/Lib/utils';

export default function Checkout({ taxPercentage = 11 }) {
    const { bankAccounts } = usePage().props;
    const items = useCartStore((s) => s.items);
    const appliedDiscount = useCartStore((s) => s.appliedDiscount);
    const grandTotal = useCartStore((s) => s.getGrandTotal());
    const clearCart = useCartStore((s) => s.clearCart);
    const customerName = useCartStore((s) => s.customerName);
    const setCustomerName = useCartStore((s) => s.setCustomerName);
    const customerPhone = useCartStore((s) => s.customerPhone);
    const setCustomerPhone = useCartStore((s) => s.setCustomerPhone);
    const orderType = useCartStore((s) => s.orderType);
    const setOrderType = useCartStore((s) => s.setOrderType);
    const tableId = useCartStore((s) => s.tableId);
    const tableName = useCartStore((s) => s.tableName);
    const setTaxPercentage = useCartStore((s) => s.setTaxPercentage);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [qrUrl, setQrUrl] = useState(null);
    const [vaData, setVaData] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        items: items.map(item => ({ id: item.id, qty: item.qty, notes: item.notes })),
        payment_method: 'QRIS',
        payment_channel: '',
        customer_name: customerName || '',
        customer_phone: customerPhone || '',
        discount_code: appliedDiscount?.code || null,
        order_type: orderType || 'dine-in',
        table_id: tableId || null,
    });

    // Sync form with store when it changes (especially tableId after selection)
    useEffect(() => {
        setData(d => ({
            ...d,
            order_type: orderType,
            table_id: tableId
        }));
        if (taxPercentage !== undefined) {
            setTaxPercentage(taxPercentage);
        }
    }, [orderType, tableId, taxPercentage]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.order_type === 'dine-in' && !data.table_id) {
            alert('Silakan pilih meja terlebih dahulu untuk layanan Dine-in.');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        router.post(route('customer.checkout.process'), data, {
            onSuccess: (page) => {
                clearCart();
            },
            onFinish: () => setIsSubmitting(false),
            onError: () => setIsSubmitting(false),
        });
    };

    // Handler for Online Payments (QRIS/VA)
    const handleOnlineSubmit = async (e) => {
        e.preventDefault();
        if (data.order_type === 'dine-in' && !data.table_id) {
            alert('Silakan pilih meja terlebih dahulu untuk layanan Dine-in.');
            return;
        }
        
        if (data.payment_method === 'VA' && !data.payment_channel) {
            alert('Silakan pilih bank untuk Virtual Account.');
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const response = await window.axios.post(route('customer.checkout.process'), data);
            if (response.data.success) {
                if (response.data.qr_url) {
                    setQrUrl(response.data.qr_url);
                    clearCart();
                } else if (response.data.virtual_account) {
                    setVaData(response.data);
                    clearCart();
                } else {
                    router.get(route('customer.order_status', response.data.order_id));
                }
            } else {
                setIsSubmitting(false);
                alert('Gagal memproses pesanan: ' + (response.data.message || 'Error Unknown'));
            }
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
            alert('Gagal memproses pesanan: ' + (err.response?.data?.message || 'Error Unknown'));
        }
    };

    if (items.length === 0 && !qrUrl && !vaData) {
        return (
            <CustomerLayout title="Checkout">
                <div className="py-20 text-center">
                    <h2 className="text-white text-2xl font-normal mb-10">Pesanan Tidak Ditemukan</h2>
                    <Link href={route('customer.menu')} className="bg-[#E84C30] text-white px-8 py-2 rounded-lg font-normal uppercase tracking-widest text-xs">Menu</Link>
                </div>
            </CustomerLayout>
        );
    }

    const isOnlinePayment = ['QRIS', 'VA'].includes(data.payment_method);

    return (
        <CustomerLayout title="Checkout">
            <div className="max-w-md mx-auto w-full">
                {!qrUrl && !vaData ? (
                    <form onSubmit={isOnlinePayment ? handleOnlineSubmit : handleSubmit} className="space-y-6 pb-20">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-normal text-white tracking-tight">Finalizing <span className="text-[#E84C30]">Order</span></h1>
                            <p className="text-white/30 text-xs mt-1 uppercase tracking-widest font-bold">Lengkapi detail pesanan Anda</p>
                        </div>

                        {/* Order Summary Card */}
                        <div className="bg-[#2D2D2D] rounded-lg border border-white/5 p-4 mb-6">
                            <h4 className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-4">Ringkasan Pesanan</h4>
                            <div className="space-y-3 mb-4 pb-4 border-b border-white/5">
                                {items.map(item => (
                                    <div key={item.cartId} className="flex justify-between text-xs">
                                        <span className="text-white/50">{item.qty}x {item.name}</span>
                                        <span className="text-white/20"><span className="text-[10px]">Rp</span> {(item.price * item.qty).toLocaleString('id-ID')}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="space-y-2">
                                {appliedDiscount && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-emerald-400 font-bold uppercase tracking-widest text-[9px]">Voucher: {appliedDiscount.code}</span>
                                        <span className="text-emerald-400">-<span className="text-[10px]">Rp</span> {appliedDiscount.amount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-white/30 text-[10px] font-normal uppercase tracking-widest">Total Bayar</span>
                                    <span className="text-xl font-normal text-white"><span className="text-sm">Rp</span> {grandTotal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Form Inputs */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-normal uppercase tracking-[0.2em] text-white/30 mb-4 ml-4">Metode Pemesanan</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'dine-in', label: 'Dine-In' },
                                        { id: 'take-away', label: 'Take Away' },
                                        { id: 'delivery', label: 'Delivery' }
                                    ].map(type => (
                                        <label
                                            key={type.id}
                                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-300 ${data.order_type === type.id
                                                ? 'bg-[#E84C30]/10 border-[#E84C30] text-white'
                                                : 'bg-[#2D2D2D] border-white/5 text-white/30 hover:border-white/20'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="order_type"
                                                value={type.id}
                                                checked={data.order_type === type.id}
                                                onChange={e => {
                                                    setData('order_type', e.target.value);
                                                    setOrderType(e.target.value);
                                                }}
                                                className="hidden"
                                            />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {data.order_type === 'dine-in' && (
                                <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-fade-in ${data.table_id ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${data.table_id ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                        <div>
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Lokasi Meja</p>
                                            <p className="text-sm text-white font-normal">{data.table_id ? `Meja: ${tableName}` : 'Belum memilih meja'}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('customer.select_table')}
                                        className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30] hover:text-[#D4432A] transition-colors"
                                    >
                                        {data.table_id ? 'Ganti' : 'Pilih Meja'}
                                    </Link>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-normal uppercase tracking-[0.2em] text-white/30 mb-2 ml-4">
                                    Nama Pesanan <span className="text-[#E84C30]">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Masukkan nama Anda..."
                                    value={data.customer_name}
                                    onChange={e => {
                                        setData('customer_name', e.target.value);
                                        setCustomerName(e.target.value);
                                    }}
                                    className={`w-full bg-[#2D2D2D] border ${errors.customer_name ? 'border-[#E84C30]' : 'border-white/5'} text-white rounded-lg px-4 py-2 text-sm focus:border-[#E84C30]/50 focus:ring-0 transition-all`}
                                />
                                {errors.customer_name && (
                                    <p className="text-[#E84C30] text-[10px] mt-2 ml-4 font-bold">{errors.customer_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-normal uppercase tracking-[0.2em] text-white/30 mb-2 ml-4">No. WhatsApp (Opsional)</label>
                                <input
                                    type="tel"
                                    placeholder="0812XXXXXXXX..."
                                    value={data.customer_phone}
                                    onChange={e => setData('customer_phone', e.target.value)}
                                    className="w-full bg-[#2D2D2D] border border-white/5 text-white rounded-lg px-4 py-2 text-sm focus:border-[#E84C30]/50 focus:ring-0 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-normal uppercase tracking-[0.2em] text-white/30 mb-4 ml-4">Metode Pembayaran</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'QRIS', label: 'QRIS', sub: 'Otomatis' },
                                        { id: 'VA', label: 'Virtual Account', sub: 'Otomatis' },
                                        { id: 'Transfer', label: 'Transfer', sub: 'Konfirmasi Manual' },
                                        { id: 'EDC', label: 'Kartu / EDC', sub: 'Di Kasir' },
                                        { id: 'Cash', label: 'Tunai / Cash', sub: 'Di Kasir' }
                                    ].map(method => (
                                        <label
                                            key={method.id}
                                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-300 ${data.payment_method === method.id
                                                ? 'bg-[#E84C30]/10 border-[#E84C30] text-white'
                                                : 'bg-[#2D2D2D] border-white/5 text-white/30 hover:border-white/20'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value={method.id}
                                                checked={data.payment_method === method.id}
                                                onChange={e => {
                                                    setData(d => ({ ...d, payment_method: e.target.value, payment_channel: '' }));
                                                }}
                                                className="hidden"
                                            />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{method.label}</span>
                                            <span className="text-[7px] mt-1 opacity-50 whitespace-nowrap">{method.sub}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Sub-options for VA */}
                            {data.payment_method === 'VA' && (
                                <div className="animate-fade-in space-y-3">
                                    <label className="block text-[10px] font-normal uppercase tracking-[0.2em] text-[#E84C30] mb-2 ml-4">Pilih Bank VA</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['BCA_VA', 'BNI_VA', 'BRI_VA', 'MANDIRI_VA', 'PERMATA_VA'].map(bank => (
                                            <label
                                                key={bank}
                                                className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${data.payment_channel === bank 
                                                    ? 'bg-white/10 border-white/30 text-white' 
                                                    : 'bg-[#2D2D2D] border-white/5 text-white/20'}`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    className="hidden" 
                                                    name="payment_channel" 
                                                    value={bank} 
                                                    onChange={e => setData('payment_channel', e.target.value)}
                                                />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">{bank.replace('_VA', '')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment Method Instructions */}
                            <div className="px-2">
                                {data.payment_method === 'Transfer' && (
                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 animate-fade-in">
                                        <div className="flex gap-3 mb-4">
                                            <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <p className="text-[10px] text-blue-200/60 leading-relaxed uppercase font-medium">
                                                Silakan transfer ke salah satu rekening di bawah ini dan tunjukkan bukti transfer ke kasir.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {bankAccounts && bankAccounts.length > 0 ? (
                                                bankAccounts.map((acc, idx) => (
                                                    <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                                        <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">{acc.name}</p>
                                                        <p className="text-sm text-white font-mono my-1 tracking-wider">{acc.number}</p>
                                                        <p className="text-[10px] text-white/40 uppercase">a.n {acc.holder}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-white/20 italic">Data rekening belum tersedia.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {data.payment_method === 'EDC' && (
                                    <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex gap-3 animate-fade-in">
                                        <svg className="w-5 h-5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                        <p className="text-[10px] text-purple-200/60 leading-relaxed uppercase font-medium">
                                            Silakan kunjungi <span className="text-purple-400 font-bold">meja kasir</span> untuk pembayaran kartu melalui mesin EDC.
                                        </p>
                                    </div>
                                )}
                                {data.payment_method === 'Cash' && (
                                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3 animate-fade-in">
                                        <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <p className="text-[10px] text-amber-200/60 leading-relaxed uppercase font-medium">
                                            Silakan <span className="text-amber-400 font-bold">datangi meja kasir</span> untuk melakukan pembayaran tunai.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#E84C30] text-white py-5 rounded-lg font-normal uppercase tracking-widest text-xs shadow-2xl shadow-[#E84C30]/30 hover:bg-[#D4432A] disabled:opacity-50 transform hover:scale-[1.01] transition-all"
                        >
                            {isSubmitting ? 'Processing...' : `Konfirmasi Pesanan`}
                        </button>
                    </form>
                ) : qrUrl ? (
                    /* QRIS Modal UI */
                    <div className="text-center py-10 animate-fade-in">
                        <div className="bg-[#2D2D2D] p-8 rounded-lg border border-white/10 shadow-2xl shadow-black mb-8">
                            <h2 className="text-2xl font-normal text-white mb-2">Scan QRIS</h2>
                            <p className="text-white/30 text-xs mb-8 uppercase tracking-widest font-bold">Silakan selesaikan pembayaran</p>

                            <div className="bg-white p-3 rounded-lg mx-auto w-fit mb-8 shadow-xl shadow-black/20">
                                <img src={qrUrl} alt="QRIS Code" className="w-56 h-56" />
                            </div>

                            <p className="text-[#E84C30] text-sm font-normal animate-pulse mb-8">MENUNGGU PEMBAYARAN...</p>

                            <div className="text-white/20 text-[10px] leading-relaxed mb-4">
                                Halaman ini akan otomatis dialihkan<br />setelah transaksi Anda terkonfirmasi.
                            </div>
                        </div>

                        <button
                            onClick={() => router.get(route('customer.menu'))}
                            className="text-white/20 hover:text-white text-xs font-bold transition-colors"
                        >
                            Batal & Kembali ke Menu
                        </button>
                    </div>
                ) : (
                    /* VA Modal UI */
                    <div className="text-center py-10 animate-fade-in">
                        <div className="bg-[#2D2D2D] p-8 rounded-lg border border-white/10 shadow-2xl shadow-black mb-8 text-left">
                            <h2 className="text-xl font-normal text-white mb-6 text-center">Virtual Account</h2>
                            
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-1 font-bold">Nomor VA {data.payment_channel?.replace('_VA', '')}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-2xl font-mono text-[#E84C30] tracking-wider">{vaData.virtual_account}</p>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(vaData.virtual_account);
                                            alert('Nomor VA berhasil disalin!');
                                        }}
                                        className="text-[10px] text-white/50 uppercase font-bold hover:text-white"
                                    >
                                        Salin
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/30 uppercase tracking-widest font-bold">Total Tagihan</span>
                                    <span className="text-white">{formatRupiah(grandTotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/30 uppercase tracking-widest font-bold">Batas Waktu</span>
                                    <span className="text-white">{vaData.expired_at}</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                <p className="text-[9px] text-amber-500/80 uppercase font-bold leading-relaxed">
                                    Pesanan Anda akan segera diproses otomatis setelah pembayaran Anda kami terima.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => router.get(route('customer.menu'))}
                            className="text-white/20 hover:text-white text-xs font-bold transition-colors"
                        >
                            Kembali ke Menu Utama
                        </button>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
