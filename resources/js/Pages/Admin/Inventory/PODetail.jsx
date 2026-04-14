import React, { useState } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function PODetail({ po }) {
    const [showStatusModal, setShowStatusModal] = useState(false);
    const { data, setData, patch, processing } = useForm({
        status: po.status,
    });

    const updateStatus = (e) => {
        e.preventDefault();
        patch(route('admin.purchase-orders.status', po.id), {
            onSuccess: () => setShowStatusModal(false)
        });
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <InventoryLayout title={`Detail PO #${po.po_number}`}>
            <Head title={`Purchase Order ${po.po_number}`} />

            <div className="space-y-6 text-left pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.purchase-planning.index')} className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors border border-white/5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Purchase Order</h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>{po.po_number} — {po.supplier?.name}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowStatusModal(true)}
                            className="bg-white/5 hover:bg-white/10 text-white/60 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5"
                        >
                            Ubah Status: {po.status.toUpperCase()}
                        </button>
                        <a 
                            href={route('admin.purchase-orders.download', po.id)} 
                            target="_blank"
                            className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg"
                        >
                            Unduh PDF
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items Table */}
                        <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <div className="px-4 py-3 border-b bg-black/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Daftar Barang Pesanan</h3>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5 bg-black/5">
                                        <th className="px-4 py-4">Item Material</th>
                                        <th className="px-4 py-4 text-center">Kuantitas</th>
                                        <th className="px-4 py-4 text-right">Harga Satuan</th>
                                        <th className="px-4 py-4 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {po.items?.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{item.material?.name}</div>
                                                <div className="text-[9px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>{item.material?.sku || 'N/A'}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-mono font-bold text-white/60">
                                                {parseFloat(item.quantity).toFixed(2)} <span className="text-[9px] font-normal opacity-30">{item.material?.unit}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-white/40">
                                                {fmt(item.unit_cost)}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-white/70">
                                                {fmt(item.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-black/10 border-t border-white/5">
                                        <td colSpan="3" className="px-4 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-white/40">Total Pesanan</td>
                                        <td className="px-4 py-4 text-right font-mono font-black text-lg text-emerald-400">
                                            {fmt(po.total_amount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Info Cards */}
                        <div className="p-4 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Informasi Supplier</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">Nama Perusahaan</p>
                                    <p className="text-sm font-bold text-white/80">{po.supplier?.name}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">Kontak Person</p>
                                    <p className="text-xs text-white/60">{po.supplier?.contact || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">Telepon / WhatsApp</p>
                                    <p className="text-xs text-white/60 font-mono">{po.supplier?.phone || '—'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Logistik & Pengiriman</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">Lokasi Tujuan</p>
                                    <p className="text-sm font-bold text-white/80">{po.branch?.name}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">Metode Pembayaran</p>
                                    <p className="text-xs text-white/60 uppercase font-bold">{po.supplier?.payment_terms || 'Cash on Delivery'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Update Modal */}
            <Modal show={showStatusModal} onClose={() => setShowStatusModal(false)} maxWidth="sm">
                <div className="p-4 text-left">
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-6" style={{ color: 'var(--g-text-tertiary)' }}>Perbarui Status Pesanan</h3>
                    <form onSubmit={updateStatus} className="space-y-5">
                        <select 
                            value={data.status} 
                            onChange={e => setData('status', e.target.value)}
                            className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all cursor-pointer font-bold" 
                            style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                        >
                            <option value="draft">Draft (Konsep)</option>
                            <option value="sent">Sent (Terkirim)</option>
                            <option value="received">Received (Diterima)</option>
                            <option value="cancelled">Cancelled (Dibatalkan)</option>
                        </select>

                        <div className="p-4 rounded bg-orange-500/5 border border-orange-500/10">
                            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1">Informasi</p>
                            <p className="text-[10px] text-white/40 leading-relaxed italic">
                                Mengubah status menjadi <strong>'Received'</strong> akan secara otomatis menambah stok inventori dan mencatat jurnal pembelian.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowStatusModal(false)} className="flex-1 py-2.5 text-white/40 font-bold border border-white/10 rounded-lg hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest">Batal</button>
                            <button type="submit" disabled={processing} className="flex-1 py-2.5 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] transition-all text-[10px] uppercase tracking-widest">
                                {processing ? 'Memproses...' : 'Simpan Status'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </InventoryLayout>
    );
}

