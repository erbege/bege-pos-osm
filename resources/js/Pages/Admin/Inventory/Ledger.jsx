import React, { useState } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, useForm } from '@inertiajs/react';

export default function InventoryLedger({ auth, movements, materials, branches, summary }) {
    const { data, setData, get, processing } = useForm({
        material_id: '',
        branch_id: '',
        start_date: '',
        end_date: '',
    });

    const handleFilter = (e) => {
        e.preventDefault();
        get(route('admin.inventory.ledger'), { preserveState: true });
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <InventoryLayout title="Log Pergerakan Stok">
            <Head title="Inventory Ledger" />

            <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Log Pergerakan Stok</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Riwayat lengkap mutasi barang masuk, keluar, dan penyesuaian</p>
                    </div>
                    <a 
                        href={route('admin.inventory.ledger.export', data)} 
                        className="bg-white/5 hover:bg-white/10 text-white/60 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5"
                    >
                        Ekspor Excel
                    </a>
                </div>

                {/* Filter Panel */}
                <div className="p-4 rounded-lg border bg-black/5 space-y-4" style={{ borderColor: 'var(--g-border)' }}>
                    <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-40">Filter Item</label>
                            <select value={data.material_id} onChange={e => setData('material_id', e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-xs border border-white/10 bg-white/5 text-white outline-none focus:ring-1 focus:ring-[#E84C30]/40">
                                <option value="">Semua Material</option>
                                {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-40">Tanggal Mulai</label>
                            <input type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-xs border border-white/10 bg-white/5 text-white outline-none focus:ring-1 focus:ring-[#E84C30]/40" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-40">Tanggal Selesai</label>
                            <input type="date" value={data.end_date} onChange={e => setData('end_date', e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-xs border border-white/10 bg-white/5 text-white outline-none focus:ring-1 focus:ring-[#E84C30]/40" />
                        </div>
                        <button type="submit" disabled={processing} className="bg-[#E84C30] hover:bg-[#D4432A] text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95">
                            Terapkan Filter
                        </button>
                    </form>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5 bg-black/5">
                                    <th className="px-4 py-4">Waktu Kejadian</th>
                                    <th className="px-4 py-4">Item Material</th>
                                    <th className="px-4 py-4 text-center">Tipe</th>
                                    <th className="px-4 py-4 text-right">Kuantitas</th>
                                    <th className="px-4 py-4">Keterangan</th>
                                    <th className="px-4 py-4 text-right bg-black/10">Stok Akhir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {movements.data.map((m) => (
                                    <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4 whitespace-nowrap text-white/40 font-mono text-xs">{fmtDate(m.created_at)}</td>
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{m.material?.name}</div>
                                            <div className="text-[9px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>{m.material?.sku || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${
                                                m.type === 'in' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                m.type === 'out' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-white/5 text-white/40 border-white/10'
                                            }`}>
                                                {m.type === 'in' ? 'MASUK' : m.type === 'out' ? 'KELUAR' : 'ADJUST'}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-4 text-right font-mono font-bold text-sm ${m.qty > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {m.qty > 0 ? '+' : ''}{parseFloat(m.qty).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-white/40 text-xs italic">
                                            {m.notes || '—'}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono font-black text-xs bg-black/5" style={{ color: 'var(--g-text-secondary)' }}>
                                            {parseFloat(m.balance_after).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {movements.data.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada data pergerakan stok ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </InventoryLayout>
    );
}

