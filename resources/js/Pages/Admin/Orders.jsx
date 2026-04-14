import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router, Link } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';

export default function Orders({ orders, filters, statuses, channels, types }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'All');
    const [channel, setChannel] = useState(filters.order_channel || 'All');
    const [orderType, setOrderType] = useState(filters.order_type || 'All');

    // Modal state
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        type: 'primary',
        onConfirm: () => { },
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const closeModal = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const handleFilter = () => {
        router.get(route('admin.orders.index'), { 
            search, 
            status, 
            order_channel: channel, 
            order_type: orderType 
        }, { preserveState: true });
    };

    const handlePageChange = (url) => {
        if (!url) return;
        router.get(url, { 
            search, 
            status, 
            order_channel: channel, 
            order_type: orderType 
        }, { preserveState: true });
    };

    const toggleSelectOrder = (id) => {
        setSelectedOrders(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOrders.length === orders.data.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.data.map(o => o.id));
        }
    };

    const handleBulkUpdate = (newStatus) => {
        if (selectedOrders.length === 0) return;

        setConfirmModal({
            show: true,
            title: 'Bulk Update Status',
            message: `Ubah status ${selectedOrders.length} pesanan terpilih menjadi ${newStatus}?`,
            type: 'primary',
            onConfirm: () => {
                setIsProcessing(true);
                // Pre-emptively clear selection for instant feel
                const idsToProcess = [...selectedOrders];
                
                router.patch(route('admin.orders.bulk_update'), { 
                    ids: idsToProcess,
                    status: newStatus 
                }, {
                    onSuccess: () => {
                        setSelectedOrders([]);
                        closeModal();
                    },
                    onError: (err) => {
                        console.error('Bulk Update Error:', err);
                        alert('Gagal memperbarui status: ' + Object.values(err).join(', '));
                    },
                    onFinish: () => setIsProcessing(false),
                    preserveScroll: true
                });
            }
        });
    };

    const handleBulkDelete = () => {
        if (selectedOrders.length === 0) return;

        setConfirmModal({
            show: true,
            title: 'Bulk Delete Orders',
            message: `Hapus ${selectedOrders.length} pesanan terpilih? Tindakan ini permanen.`,
            type: 'danger',
            onConfirm: () => {
                setIsProcessing(true);
                const idsToProcess = [...selectedOrders];

                router.delete(route('admin.orders.bulk_destroy'), { 
                    data: { ids: idsToProcess },
                    onSuccess: () => {
                        setSelectedOrders([]);
                        closeModal();
                    },
                    onError: (err) => {
                        console.error('Bulk Delete Error:', err);
                        alert('Gagal menghapus pesanan: ' + Object.values(err).join(', '));
                    },
                    onFinish: () => setIsProcessing(false),
                    preserveScroll: true
                });
            }
        });
    };

    const updateStatus = (id, newStatus) => {
        setConfirmModal({
            show: true,
            title: 'Update Status Pesanan',
            message: `Ubah status Order #${id} menjadi ${newStatus}?`,
            type: 'primary',
            onConfirm: () => {
                setIsProcessing(true);
                router.patch(route('admin.orders.update_status', id), { status: newStatus }, {
                    onSuccess: () => closeModal(),
                    onError: () => { },
                    onFinish: () => setIsProcessing(false)
                });
            }
        });
    };

    const confirmPayment = (id) => {
        setConfirmModal({
            show: true,
            title: 'Konfirmasi Pembayaran',
            message: `Apakah Anda yakin ingin mengkonfirmasi pembayaran tunai untuk Order #${id}? Tindakan ini akan mencatat transaksi di buku besar dan meneruskan pesanan ke dapur.`,
            type: 'success',
            onConfirm: () => {
                setIsProcessing(true);
                router.patch(route('admin.orders.confirm_payment', id), {}, {
                    onSuccess: () => closeModal(),
                    onFinish: () => setIsProcessing(false)
                });
            }
        });
    };

    const deleteOrder = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Pesanan',
            message: `Hapus Order #${id}? Tindakan ini permanen dan tidak dapat dibatalkan.`,
            type: 'danger',
            onConfirm: () => {
                setIsProcessing(true);
                router.delete(route('admin.orders.destroy', id), {
                    onSuccess: () => closeModal(),
                    onFinish: () => setIsProcessing(false)
                });
            }
        });
    };

    const getStatusColor = (s) => {
        switch (s) {
            case 'Paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Preparing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'Ready': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'Served': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'Completed': return 'bg-emerald-500 text-white';
            case 'Cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    };

    const getChannelColor = (c) => {
        switch (c) {
            case 'POS': return 'text-blue-400';
            case 'ONLINE': return 'text-emerald-400';
            case 'DELIVERY': return 'text-purple-400';
            case 'MARKETPLACE': return 'text-amber-400';
            case 'TABLE': return 'text-pink-400';
            default: return 'text-white/60';
        }
    };

    return (
        <AdminLayout title="Order Management">
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-normal text-white">Orders</h2>
                    <p className="text-xs text-white/30">Track and manage all customer orders.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center bg-[#2D2D2D] p-3 rounded-lg border border-white/5">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search Order ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                    >
                        {statuses.map(s => (
                            <option key={s} value={s} className="bg-[#2D2D2D]">{s === 'All' ? 'All Statuses' : s}</option>
                        ))}
                    </select>
                    
                    <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                    >
                        {channels && channels.map(c => (
                            <option key={c} value={c} className="bg-[#2D2D2D]">{c === 'All' ? 'All Channels' : c}</option>
                        ))}
                    </select>

                    <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                    >
                        {types && types.map(t => (
                            <option key={t} value={t} className="bg-[#2D2D2D]">{t === 'All' ? 'All Types' : t.replace('_', ' ')}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleFilter}
                        className="px-3 py-1.5 bg-[#E84C30] text-white rounded-lg text-sm font-bold hover:bg-[#D4432A] transition-all"
                    >
                        Apply Filters
                    </button>
                </div>

                {/* Bulk Actions Floating Bar */}
                {selectedOrders.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
                        <div className="bg-[#1A1A1A] border border-[#E84C30]/30 rounded-xl p-2 shadow-2xl flex items-center gap-4 backdrop-blur-xl ring-4 ring-[#E84C30]/5">
                            <div className="px-4 py-2 bg-[#E84C30] rounded-lg text-white">
                                <span className="text-xs font-black uppercase tracking-widest">{selectedOrders.length} Terpilih</span>
                            </div>
                            
                            <div className="flex items-center gap-1 pr-2">
                                {['Preparing', 'Ready', 'Served', 'Completed'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleBulkUpdate(s)}
                                        className="px-3 py-2 hover:bg-white/5 text-white/60 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Set {s}
                                    </button>
                                ))}
                                <div className="w-px h-4 bg-white/10 mx-2"></div>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                >
                                    Hapus
                                </button>
                                <button
                                    onClick={() => setSelectedOrders([])}
                                    className="px-3 py-2 text-white/30 hover:text-white text-[10px] font-bold uppercase tracking-widest"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders Table */}
                <div className="bg-[#2D2D2D] rounded-lg border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-4 py-3 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded bg-white/5 border-white/10 text-[#E84C30] focus:ring-[#E84C30]/20"
                                            checked={selectedOrders.length === orders.data.length && orders.data.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Order ID</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Channel / Type</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Customer / Waiter</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Total</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Time</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-white/25 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.data.map((order) => (
                                    <tr 
                                        key={order.id} 
                                        className={`hover:bg-white/[0.03] transition-colors group ${selectedOrders.includes(order.id) ? 'bg-[#E84C30]/5' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <input 
                                                type="checkbox" 
                                                className="rounded bg-white/5 border-white/10 text-[#E84C30] focus:ring-[#E84C30]/20"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={() => toggleSelectOrder(order.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-bold text-white/90">#{order.id}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${getChannelColor(order.order_channel)}`}>
                                                    {order.order_channel}
                                                </div>
                                                <div className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">
                                                    {order.order_type.replace('_', ' ')}
                                                </div>
                                                {order.table && (
                                                    <span className="text-[9px] font-black text-[#E84C30] bg-[#E84C30]/10 px-1.5 py-0.5 rounded w-fit mt-1 border border-[#E84C30]/20 uppercase">
                                                        {order.table.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-white/15 uppercase tracking-tighter w-10 shrink-0">Cust:</span>
                                                    <span className="text-xs font-bold text-white/70 truncate max-w-[120px]">
                                                        {order.customer_name || 'Guest'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-white/15 uppercase tracking-tighter w-10 shrink-0">Staff:</span>
                                                    <span className="text-[10px] text-emerald-400/40 font-bold truncate uppercase tracking-widest">
                                                        {order.user?.name || 'Self-Order'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-bold text-white/90">Rp {Number(order.total_amount).toLocaleString()}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-bold text-white/20 uppercase whitespace-nowrap">
                                                {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                <span className="block opacity-50 text-[8px] mt-0.5">
                                                    {new Date(order.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 text-white/20 hover:text-[#E84C30] hover:bg-[#E84C30]/5 rounded-lg transition-all"
                                                    title="Lihat Detail"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                </button>
                                                {order.status === 'Pending Payment' && (
                                                    <button
                                                        onClick={() => confirmPayment(order.id)}
                                                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
                                                    >
                                                        Confirm
                                                    </button>
                                                )}
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                                    className="bg-white/5 border border-white/10 text-white/60 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-[#E84C30]/50"
                                                >
                                                    {statuses.map(s => <option key={s} value={s} className="bg-[#2D2D2D]">{s}</option>)}
                                                </select>
                                                <button
                                                    onClick={() => deleteOrder(order.id)}
                                                    className="p-2 text-white/10 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {orders.links.length > 3 && (
                        <div className="p-4 border-t border-white/5 flex gap-1 justify-center bg-black/10">
                            {orders.links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(link.url)}
                                    disabled={!link.url || link.active}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${link.active ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white border border-white/5'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeModal}
                isProcessing={isProcessing}
                confirmText="Ya, Lanjutkan"
                cancelText="Batal"
            />

            {/* Order Detail Modal */}
            <Modal show={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="2xl">
                {selectedOrder && (
                    <div className="bg-[#1A1A1A] overflow-hidden flex flex-col max-h-[90vh] text-white">
                        {/* Compact Modern Header */}
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[#E84C30]/10 text-[#E84C30] border border-[#E84C30]/20">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold tracking-tight">Order #{selectedOrder.id}</h3>
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusColor(selectedOrder.status)}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-white/30 uppercase tracking-tighter mt-0.5">
                                        {new Date(selectedOrder.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)} 
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Body - Multi-column Layout */}
                        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar bg-[#1A1A1A]">
                            {/* Summary Ribbon */}
                            <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/5 bg-white/[0.01]">
                                <div className="p-4">
                                    <span className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-black block mb-1">Customer</span>
                                    <div className="text-xs font-bold truncate">{selectedOrder.customer_name || 'Guest'}</div>
                                    <div className="text-[9px] text-white/20 mt-0.5 font-mono">{selectedOrder.customer_phone || '-'}</div>
                                </div>
                                <div className="p-4">
                                    <span className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-black block mb-1">Location</span>
                                    <div className="text-xs font-bold text-[#E84C30]">{selectedOrder.table?.name || 'TAKEAWAY'}</div>
                                    <div className="text-[9px] text-white/20 mt-0.5 uppercase tracking-tighter">{selectedOrder.order_type.replace('_', ' ')}</div>
                                </div>
                                <div className="p-4">
                                    <span className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-black block mb-1">Channel</span>
                                    <div className={`text-xs font-bold ${getChannelColor(selectedOrder.order_channel)}`}>{selectedOrder.order_channel}</div>
                                    <div className="text-[9px] text-white/20 mt-0.5 font-mono">B: {selectedOrder.branch_id || '1'}</div>
                                </div>
                                <div className="p-4">
                                    <span className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-black block mb-1">Payment</span>
                                    <div className="text-xs font-bold text-emerald-400">{selectedOrder.payment_method || 'Cash'}</div>
                                    <div className="text-[9px] text-white/20 mt-0.5 uppercase">UNPAID</div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Cancellation (Compact) */}
                                {selectedOrder.status === 'Cancelled' && (
                                    <div className="bg-red-500/5 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3">
                                        <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white/70 italic font-medium truncate">
                                                "{selectedOrder.cancellation_reason || 'No reason provided'}"
                                            </p>
                                        </div>
                                        <span className="text-[8px] text-white/20 font-mono uppercase shrink-0">
                                            {selectedOrder.cancelled_at ? new Date(selectedOrder.cancelled_at).toLocaleTimeString('id-ID') : ''}
                                        </span>
                                    </div>
                                )}

                                {/* Items & Billing Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                    {/* Items List (Left Side) */}
                                    <div className="md:col-span-3 space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Items</span>
                                            <span className="text-[9px] font-bold text-white/10 uppercase">{selectedOrder.items?.length || 0} Total</span>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={item.id} className={`p-3 flex justify-between gap-4 ${idx !== 0 ? 'border-t border-white/5' : ''}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-bold text-white/90 truncate">{item.menu?.name}</div>
                                                        <div className="text-[9px] text-white/20 mt-0.5 font-mono">
                                                            Rp {Number(item.price).toLocaleString('id-ID')} × {item.qty}
                                                        </div>
                                                        {item.notes && (
                                                            <div className="mt-1.5 text-[9px] text-amber-400/50 italic flex gap-1.5 items-start">
                                                                <span className="text-amber-500/20">•</span>
                                                                {item.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-xs font-bold text-white tracking-tight">
                                                            {Number(item.price * item.qty).toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Billing Summary (Right Side) */}
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="px-1">
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Billing</span>
                                        </div>
                                        <div className="bg-black/40 p-5 rounded-xl border border-white/5 space-y-3 relative overflow-hidden group">
                                            <div className="space-y-2 pb-3 border-b border-white/5">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-white/30">Subtotal</span>
                                                    <span className="font-mono text-white/70">{Number(selectedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
                                                </div>
                                                
                                                {Number(selectedOrder.discount_amount) > 0 && (
                                                    <div className="flex justify-between text-[11px] text-emerald-400">
                                                        <span>Discount {selectedOrder.discount?.code ? `(${selectedOrder.discount.code})` : ''}</span>
                                                        <span className="font-mono">-{Number(selectedOrder.discount_amount).toLocaleString('id-ID')}</span>
                                                    </div>
                                                )}

                                                {Number(selectedOrder.tax_amount) > 0 && (
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-white/30">Pajak (PPN)</span>
                                                        <span className="font-mono text-white/70">+{Number(selectedOrder.tax_amount).toLocaleString('id-ID')}</span>
                                                    </div>
                                                )}

                                                {Number(selectedOrder.dp_amount_deducted) > 0 && (
                                                    <div className="flex justify-between text-[11px] text-blue-400">
                                                        <span>DP Reservasi</span>
                                                        <span className="font-mono">-{Number(selectedOrder.dp_amount_deducted).toLocaleString('id-ID')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-1">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <span className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-black block mb-0.5">Total Payable</span>
                                                        <div className="text-2xl font-black text-white tracking-tighter">
                                                            <span className="text-xs font-bold text-white/30 mr-1">Rp</span>
                                                            {Number(selectedOrder.total_amount).toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="absolute -bottom-4 -right-4 opacity-[0.02] pointer-events-none rotate-12 group-hover:opacity-[0.05] transition-opacity">
                                                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 14l5 0m-5 4l5 0m-5-8l5 0m1 4l3 0m-3 4l3 0m-3-8l3 0M3 21h18a2 2 0 002-2V5a2 2 0 00-2-2H3a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                            </div>
                                        </div>

                                        {/* Action Hint */}
                                        <div className="bg-[#E84C30]/5 border border-[#E84C30]/10 p-3 rounded-xl">
                                            <div className="flex items-center gap-2 text-[9px] text-[#E84C30]/70 font-bold uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#E84C30] animate-pulse"></div>
                                                Status: {selectedOrder.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Footer Actions */}
                        <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-5 py-2 hover:bg-white/5 text-white/40 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                Close Detail
                            </button>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.open(route('admin.pos.print_thermal', selectedOrder.id), '_blank')}
                                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2 active:scale-95"
                                >
                                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                    Cetak Struk
                                </button>
                                
                                {selectedOrder.status === 'Pending Payment' && (
                                    <button
                                        onClick={() => {
                                            confirmPayment(selectedOrder.id);
                                            setSelectedOrder(null);
                                        }}
                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        Confirm Payment
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}

