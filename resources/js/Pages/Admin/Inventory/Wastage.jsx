import React, { useState } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function Wastage({ auth, materials, wastages }) {
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        material_id: '',
        quantity: 0,
        reason: '',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.wastage.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            }
        });
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <InventoryLayout title="Kontrol Wastage">
            <Head title="Inventory Wastage" />

            <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Kontrol Wastage</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Dokumentasi penyusutan, kerusakan, dan kedaluwarsa stok barang</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                        Catat Wastage
                    </button>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b bg-black/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold" style={{ borderColor: 'var(--g-border)' }}>
                                    <th className="px-4 py-4">Tanggal / Item</th>
                                    <th className="px-4 py-4">Jumlah</th>
                                    <th className="px-4 py-4">Alasan</th>
                                    <th className="px-4 py-4 text-right">Estimasi Kerugian</th>
                                    <th className="px-4 py-4">Pelapor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(wastages || []).map((w) => (
                                    <tr key={w.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{w.material?.name}</div>
                                            <div className="text-[10px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>
                                                {new Date(w.created_at).toLocaleDateString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-mono font-bold text-red-400/80">
                                            {parseFloat(w.quantity).toFixed(2)} {w.material?.unit}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-white/5 text-white/40 border border-white/10">
                                                {w.reason === 'expired' ? 'KEDALUWARSA' : 
                                                 w.reason === 'damaged' ? 'RUSAK' : 
                                                 w.reason === 'spillage' ? 'TUMPAH' : w.reason.toUpperCase()}
                                            </span>
                                            {w.notes && <p className="text-[10px] opacity-30 mt-1 truncate max-w-[150px]">{w.notes}</p>}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono font-bold text-xs text-white/60">
                                            {fmt(w.quantity * (w.material?.last_purchase_price || 0))}
                                        </td>
                                        <td className="px-4 py-4 text-white/40 text-xs">
                                            {w.creator?.name || 'Sistem'}
                                        </td>
                                    </tr>
                                ))}
                                {(wastages || []).length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada catatan wastage ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <div className="relative rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--g-bg-secondary)' }}>
                    <div className="px-4 py-4 border-b bg-black/5 flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Catat Kerusakan / Spoilage</h3>
                            <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Dokumentasi Kehilangan Stok</p>
                        </div>
                        <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <form onSubmit={submit} className="p-4 space-y-5 text-left">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Item Terpengaruh</label>
                            <select 
                                value={data.material_id} 
                                onChange={e => setData('material_id', e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all cursor-pointer" 
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                            >
                                <option value="">Pilih Item</option>
                                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                            </select>
                            {errors.material_id && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.material_id}</div>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Jumlah Hilang</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={data.quantity} 
                                    onChange={e => setData('quantity', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-bold" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                />
                                {errors.quantity && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.quantity}</div>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Alasan Utama</label>
                                <select 
                                    value={data.reason} 
                                    onChange={e => setData('reason', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all cursor-pointer font-bold" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                >
                                    <option value="">Pilih Alasan</option>
                                    <option value="expired">Kedaluwarsa</option>
                                    <option value="damaged">Rusak / Cacat</option>
                                    <option value="spillage">Tumpah / Jatuh</option>
                                    <option value="theft">Kehilangan / Pencurian</option>
                                    <option value="other">Lainnya</option>
                                </select>
                                {errors.reason && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.reason}</div>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Keterangan / Kronologi</label>
                            <textarea 
                                value={data.notes} 
                                onChange={e => setData('notes', e.target.value)}
                                placeholder="Detail kejadian jika diperlukan..."
                                className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all resize-none h-20" 
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                            ></textarea>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-white/40 font-bold border border-white/10 rounded-lg hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest">Batal</button>
                            <button type="submit" disabled={processing} className="flex-[2] py-3 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-[10px] uppercase tracking-widest">
                                {processing ? 'Memproses...' : 'Kirim Wastage'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </InventoryLayout>
    );
}

