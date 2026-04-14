import React, { useState } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Show({ transfer, activeBranchId }) {
    const [processing, setProcessing] = useState(false);

    const handleAction = (action) => {
        setProcessing(true);
        router.patch(route('admin.stock-transfers.update', transfer.id), { action }, {
            onFinish: () => setProcessing(false)
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'shipped': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'received':
            case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    };

    const isSourceBranch = activeBranchId === transfer.from_branch_id;
    const isTargetBranch = activeBranchId === transfer.to_branch_id;

    return (
        <InventoryLayout title={`Detail Transfer #${String(transfer.id).padStart(5, '0')}`}>
            <Head title={`Transfer #${transfer.id}`} />

            <div className="max-w-4xl mx-auto space-y-6 text-left">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link 
                            href={route('admin.stock-transfers.index')}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Transfer #{String(transfer.id).padStart(5, '0')}</h1>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(transfer.status)}`}>
                                    {transfer.status}
                                </span>
                            </div>
                            <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Logistik perpindahan stok antar cabang</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Material Info Card */}
                        <div className="rounded-2xl border p-6 space-y-6" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{transfer.material?.name}</h2>
                                        <p className="text-xs text-white/30 font-mono uppercase tracking-widest">{transfer.material?.sku || 'NO SKU'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-[#E84C30] tracking-tighter">
                                        {Number(transfer.quantity).toLocaleString()}
                                        <span className="text-[10px] font-black text-white/20 uppercase ml-1.5">{transfer.material?.unit}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Jumlah Transfer</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1 px-1">
                                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">Cabang Pengirim</span>
                                    <div className="text-sm font-bold text-white/80">{transfer.from_branch?.name}</div>
                                </div>
                                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">Cabang Penerima</span>
                                    <div className="text-sm font-bold text-white/80">{transfer.to_branch?.name}</div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-[#E84C30]/5 border border-[#E84C30]/10">
                                <span className="text-[8px] font-black text-[#E84C30]/60 uppercase tracking-[0.2em] block mb-2">Catatan Permintaan</span>
                                <p className="text-xs text-white/60 leading-relaxed italic">
                                    "{transfer.notes || 'Tidak ada catatan ditambahkan'}"
                                </p>
                            </div>
                        </div>

                        {/* Timeline / Logs */}
                        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <div className="px-6 py-4 border-b bg-black/5 flex items-center justify-between" style={{ borderColor: 'var(--g-border)' }}>
                                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">Logistik Timeline</h3>
                            </div>
                            <div className="p-6 space-y-6 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-9 top-10 bottom-10 w-px bg-white/5"></div>

                                {/* Step: Requested */}
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="w-6 h-6 rounded-full bg-orange-500 border-4 border-[#1A1A1A] flex-shrink-0"></div>
                                    <div>
                                        <div className="text-xs font-bold text-white">Permintaan Dibuat</div>
                                        <div className="text-[10px] text-white/30 mt-0.5">Oleh {transfer.requester?.name} • {new Date(transfer.created_at).toLocaleString('id-ID')}</div>
                                    </div>
                                </div>

                                {/* Step: Approved/Rejected */}
                                {(transfer.approved_at || transfer.rejected_at) && (
                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className={`w-6 h-6 rounded-full ${transfer.rejected_at ? 'bg-red-500' : 'bg-emerald-500'} border-4 border-[#1A1A1A] flex-shrink-0`}></div>
                                        <div>
                                            <div className="text-xs font-bold text-white">{transfer.rejected_at ? 'Permintaan Ditolak' : 'Permintaan Disetujui'}</div>
                                            <div className="text-[10px] text-white/30 mt-0.5">Oleh {transfer.approver?.name || transfer.rejecter?.name} • {new Date(transfer.approved_at || transfer.rejected_at).toLocaleString('id-ID')}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Step: Shipped */}
                                {transfer.shipped_at && (
                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-[#1A1A1A] flex-shrink-0"></div>
                                        <div>
                                            <div className="text-xs font-bold text-white">Barang Dikirim</div>
                                            <div className="text-[10px] text-white/30 mt-0.5">Oleh {transfer.shipper?.name} • {new Date(transfer.shipped_at).toLocaleString('id-ID')}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Step: Received */}
                                {transfer.received_at && (
                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#1A1A1A] flex-shrink-0"></div>
                                        <div>
                                            <div className="text-xs font-bold text-white">Barang Diterima</div>
                                            <div className="text-[10px] text-white/30 mt-0.5">Oleh {transfer.receiver?.name} • {new Date(transfer.received_at).toLocaleString('id-ID')}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Actions */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border p-6 space-y-4 shadow-xl" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Panel Kendali</h3>
                            
                            <div className="space-y-3">
                                {/* Actions for Pending Transfer (at Source Branch or Admin) */}
                                {transfer.status === 'pending' && isSourceBranch && (
                                    <>
                                        <button
                                            onClick={() => handleAction('approve')}
                                            disabled={processing}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            Setujui & Reservasi
                                        </button>
                                        <button
                                            onClick={() => handleAction('reject')}
                                            disabled={processing}
                                            className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all border border-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            Tolak Permintaan
                                        </button>
                                    </>
                                )}

                                {/* Actions for Approved Transfer (at Source Branch) */}
                                {transfer.status === 'approved' && isSourceBranch && (
                                    <button
                                        onClick={() => handleAction('ship')}
                                        disabled={processing}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                                        Kirim Sekarang
                                    </button>
                                )}

                                {/* Actions for Shipped Transfer (at Target Branch) */}
                                {transfer.status === 'shipped' && isTargetBranch && (
                                    <button
                                        onClick={() => handleAction('receive')}
                                        disabled={processing}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        Konfirmasi Terima
                                    </button>
                                )}

                                {processing && (
                                    <div className="py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#E84C30] animate-pulse">
                                        Memproses data...
                                    </div>
                                )}

                                {transfer.status === 'received' && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                                        <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Selesai</p>
                                        <p className="text-[10px] text-emerald-400/60 mt-1">Stok telah berhasil dipindahkan</p>
                                    </div>
                                )}

                                {transfer.status === 'rejected' && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                                        <svg className="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Ditolak</p>
                                        <p className="text-[10px] text-red-400/60 mt-1">Permintaan ini tidak disetujui</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Help Box */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Informasi</h4>
                            <p className="text-[10px] text-white/30 leading-relaxed italic">
                                Alur Transfer: <br/>
                                1. Permintaan (Pending) <br/>
                                2. Persetujuan (Approved) <br/>
                                3. Pengiriman (Shipped) <br/>
                                4. Penerimaan (Received)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </InventoryLayout>
    );
}
