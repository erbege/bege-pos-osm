import { useState } from 'react';
import { router } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';

/**
 * IncomingOrders — Slide-out panel for self-order notifications on the POS page.
 * Shows all Pending Payment orders. Cashier can confirm payment with one click.
 */
export default function IncomingOrders({ orders, onOrderConfirmed, onLoadOrder }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false });
    const [cancelModal, setCancelModal] = useState({ show: false, order: null, reason: '' });

    const closeModal = () => setConfirmModal({ show: false });
    const closeCancelModal = () => setCancelModal({ show: false, order: null, reason: '' });

    const handleConfirm = (order) => {
        setConfirmModal({
            show: true,
            title: 'Konfirmasi Pembayaran',
            message: `Konfirmasi pembayaran tunai untuk Order #${order.id} (${order.table?.name || 'Takeaway'})?\nTotal: Rp ${Number(order.total_amount).toLocaleString('id-ID')}`,
            type: 'success',
            onConfirm: () => {
                setIsProcessing(true);
                router.patch(route('admin.pos.confirm_payment', order.id), {}, {
                    onSuccess: () => {
                        closeModal();
                        if (onOrderConfirmed) onOrderConfirmed(order.id);
                    },
                    onFinish: () => setIsProcessing(false),
                });
            },
        });
    };

    const handleCancel = () => {
        if (!cancelModal.reason.trim()) return;
        
        setIsProcessing(true);
        router.post(route('admin.pos.orders.cancel', cancelModal.order.id), {
            reason: cancelModal.reason
        }, {
            onSuccess: () => {
                closeCancelModal();
                if (onOrderConfirmed) onOrderConfirmed(cancelModal.order.id);
            },
            onFinish: () => setIsProcessing(false),
        });
    };

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-lg bg-white/[0.03] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No Pending Orders</p>
                <p className="text-white/10 text-[10px] mt-1">Self-orders will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {orders.map((order) => (
                <div
                    key={order.id}
                    className="bg-white/[0.03] rounded-lg border border-white/5 p-3 hover:border-[#E84C30]/20 transition-all group"
                >
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-normal text-[#E84C30] bg-[#E84C30]/10 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                #{order.order_number || order.id}
                            </span>
                            <span className="text-[10px] font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-lg">
                                {order.table?.name || 'Takeaway'}
                            </span>
                        </div>
                        <span className="text-[9px] text-white/15 font-mono">
                            {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    {/* Customer Info */}
                    <div className="text-[11px] text-white mb-2 flex items-center gap-1.5 font-bold">
                        <svg className="w-3 h-3 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span className="truncate">
                            {order.customer_name || 'Customer'}
                            {order.customer_phone ? ` - ${order.customer_phone}` : ''}
                        </span>
                    </div>

                    {/* Items Summary */}
                    <div className="text-[11px] text-white/40 mb-3 line-clamp-2 leading-relaxed">
                        {order.items?.map(i => `${i.qty}x ${i.menu?.name}`).join(', ')}
                    </div>

                    {/* Footer: Total + Buttons */}
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-normal text-white text-sm whitespace-nowrap">
                            Rp {Number(order.total_amount).toLocaleString('id-ID')}
                        </span>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setCancelModal({ show: true, order, reason: '' })}
                                className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Batalkan Pesanan"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <button
                                onClick={() => onLoadOrder && onLoadOrder(order)}
                                className="px-3 py-1 bg-[#E84C30] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4432A] transition-all active:scale-95 shadow-lg shadow-[#E84C30]/20"
                            >
                                Process / Pay
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                isProcessing={isProcessing}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeModal}
            />

            {/* Cancel Reason Modal */}
            {cancelModal.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#2D2D2D] rounded-2xl border border-white/10 w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 text-center border-b border-white/5">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </div>
                            <h3 className="text-lg font-bold text-white">Batalkan Pesanan</h3>
                            <p className="text-white/40 text-xs mt-1">Berikan alasan pembatalan untuk order #{cancelModal.order?.id}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Alasan Pembatalan</label>
                                <textarea
                                    value={cancelModal.reason}
                                    onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Contoh: Salah input, Pelanggan membatalkan, Stok habis..."
                                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all resize-none h-24"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={closeCancelModal}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white/40 hover:bg-white/5 transition-all text-xs uppercase tracking-widest"
                                >Tutup</button>
                                <button
                                    onClick={handleCancel}
                                    disabled={!cancelModal.reason.trim() || isProcessing}
                                    className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all text-xs uppercase tracking-widest disabled:opacity-30"
                                >
                                    {isProcessing ? 'Memproses...' : 'Ya, Batalkan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
