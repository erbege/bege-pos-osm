import React, { useState } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function StockOpnameDetail({ session, items }) {
    const [editingItems, setEditingItems] = useState({});
    
    const { data, setData, patch, post, processing } = useForm({
        items: items.map(item => ({
            id: item.id,
            counted_qty: item.counted_qty || 0
        }))
    });

    const handleQtyChange = (itemId, val) => {
        const newItems = data.items.map(i => i.id === itemId ? { ...i, counted_qty: parseFloat(val) || 0 } : i);
        setData('items', newItems);
    };

    const submitCounts = (e) => {
        e.preventDefault();
        patch(route('admin.stock-opname.items.update', session.id), {
            preserveScroll: true,
        });
    };

    const approveSession = () => {
        if (confirm('Yakin ingin menyetujui hasil audit ini? Stok sistem akan disesuaikan secara permanen dan jurnal akuntansi akan dicatat.')) {
            router.post(route('admin.stock-opname.approve', session.id));
        }
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <InventoryLayout title={`Lembar Audit #${String(session.id).padStart(5, '0')}`}>
            <Head title="Audit Detail" />

            <div className="space-y-6 text-left pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.stock-opname.index')} className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors border border-white/5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Detail Audit Stok</h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Sesi #{String(session.id).padStart(5, '0')} — Cabang {session.branch?.name}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        {session.status === 'review' && (
                            <button 
                                onClick={approveSession}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                            >
                                Setujui & Sesuaikan Stok
                            </button>
                        )}
                        {session.status === 'counting' && (
                            <button 
                                onClick={() => router.post(route('admin.stock-opname.submit', session.id))}
                                className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg"
                            >
                                Selesaikan Penghitungan
                            </button>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="px-4 py-3 border-b bg-black/5 flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Lembar Penghitungan Fisik</h3>
                        <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Status: {session.status.toUpperCase()}</span>
                    </div>
                    <form onSubmit={submitCounts}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5 bg-black/5">
                                        <th className="px-4 py-4">Item Material</th>
                                        <th className="px-4 py-4 text-center">Stok Sistem</th>
                                        <th className="px-4 py-4 text-center">Hitung Fisik</th>
                                        <th className="px-4 py-4 text-center">Selisih Unit</th>
                                        <th className="px-4 py-4 text-right">Nilai Selisih</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((item, idx) => {
                                        const counted = session.status === 'counting' 
                                            ? data.items.find(i => i.id === item.id)?.counted_qty 
                                            : item.counted_qty;
                                        const variance = (counted || 0) - item.system_qty;
                                        const varianceValue = variance * (item.material?.last_purchase_price || 0);

                                        return (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{item.material?.name}</div>
                                                    <div className="text-[10px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>{item.material?.sku || 'N/A'}</div>
                                                </td>
                                                <td className="px-4 py-4 text-center font-mono text-white/40">
                                                    {parseFloat(item.system_qty).toFixed(2)} <span className="text-[9px] font-normal opacity-30">{item.material?.unit}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {session.status === 'counting' ? (
                                                        <input 
                                                            type="number" 
                                                            step="0.01"
                                                            value={counted}
                                                            onChange={e => handleQtyChange(item.id, e.target.value)}
                                                            className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-center font-mono font-bold text-white focus:ring-1 focus:ring-[#E84C30]/40 outline-none"
                                                        />
                                                    ) : (
                                                        <span className="font-mono font-bold text-white/70">{parseFloat(item.counted_qty).toFixed(2)}</span>
                                                    )}
                                                </td>
                                                <td className={`px-4 py-4 text-center font-mono font-bold text-xs ${variance < 0 ? 'text-red-400' : variance > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                                                    {variance > 0 ? '+' : ''}{parseFloat(variance).toFixed(2)}
                                                </td>
                                                <td className={`px-4 py-4 text-right font-mono font-bold text-xs ${varianceValue < 0 ? 'text-red-400' : varianceValue > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                                                    {varianceValue !== 0 ? fmt(varianceValue) : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {session.status === 'counting' && (
                            <div className="p-4 border-t bg-black/5 flex justify-end" style={{ borderColor: 'var(--g-border)' }}>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-white/5 hover:bg-white/10 text-white font-bold px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all border border-white/10"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Draft Penghitungan'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </InventoryLayout>
    );
}

