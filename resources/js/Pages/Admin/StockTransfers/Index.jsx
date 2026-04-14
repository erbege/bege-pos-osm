import React from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, Link } from '@inertiajs/react';

export default function StockTransfers({ auth, transfers }) {
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'shipped': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'received':
            case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'cancelled':
            case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'MENUNGGU';
            case 'shipped': return 'DIKIRIM';
            case 'received':
            case 'completed': return 'DITERIMA';
            case 'cancelled':
            case 'rejected': return 'DIBATALKAN';
            default: return status.toUpperCase();
        }
    };

    return (
        <InventoryLayout title="Transfer Antar Cabang">
            <Head title="Stock Transfers" />

            <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Transfer Antar Cabang</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Kelola logistik pengiriman dan penerimaan stok antar lokasi outlet</p>
                    </div>
                    <Link
                        href={route('admin.stock-transfers.create')}
                        className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                        Buat Permintaan Transfer
                    </Link>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b bg-black/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold" style={{ borderColor: 'var(--g-border)' }}>
                                    <th className="px-4 py-4">No. Transfer</th>
                                    <th className="px-4 py-4">Asal / Tujuan</th>
                                    <th className="px-4 py-4">Material / Item</th>
                                    <th className="px-4 py-4 text-center">Jumlah</th>
                                    <th className="px-4 py-4 text-center">Status</th>
                                    <th className="px-4 py-4">Tanggal Permintaan</th>
                                    <th className="px-4 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(transfers.data || []).map((t) => (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>#{String(t.id).padStart(5, '0')}</div>
                                            <div className="text-[9px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>Logistik Stok</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/60 text-xs font-bold">{t.from_branch?.name}</span>
                                                <svg className="w-3 h-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                                                <span className="text-white/60 text-xs font-bold">{t.to_branch?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-xs font-bold text-white/80">{t.material?.name}</div>
                                            <div className="text-[10px] text-white/20 font-mono tracking-tighter uppercase">{t.material?.sku || '-'}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center font-mono font-bold text-white/40">
                                            {Number(t.quantity).toLocaleString()} {t.material?.unit}
                                        </td>
                                        <td className="px-4 py-4 text-white/40 text-xs">
                                            {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <Link
                                                href={route('admin.stock-transfers.show', t.id)}
                                                className="text-[10px] font-bold text-[#E84C30] hover:underline uppercase tracking-widest"
                                            >
                                                Detail Transfer
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {(transfers.data || []).length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada riwayat transfer ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {transfers.links && transfers.links.length > 3 && (
                        <div className="p-4 border-t border-white/5 flex gap-1 justify-center bg-black/10">
                            {transfers.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${link.active ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white border border-white/5'} ${!link.url ? 'opacity-20 cursor-not-allowed' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </InventoryLayout>
    );
}

