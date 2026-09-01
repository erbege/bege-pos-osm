import React, { useState } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Create({ branches, materials, activeBranchId }) {
    const { data, setData, post, processing, errors } = useForm({
        type: 'transfer', // transfer (PUSH) or request (PULL)
        target_branch_id: '',
        material_id: '',
        quantity: '',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.stock-transfers.store'));
    };

    return (
        <InventoryLayout title="Buat Permintaan Transfer">
            <Head title="Buat Transfer Stok" />

            <div className="max-w-2xl mx-auto space-y-6 text-left">
                <div className="flex items-center gap-4">
                    <Link 
                        href={route('admin.stock-transfers.index')}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/5"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Buat Permintaan Transfer</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Inisiasi pengiriman atau permintaan stok antar cabang</p>
                    </div>
                </div>

                <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <form onSubmit={submit} className="p-8 space-y-6">
                        {/* Type Switcher */}
                        <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
                            <button
                                type="button"
                                onClick={() => setData('type', 'transfer')}
                                className={`py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${data.type === 'transfer' ? 'bg-[#E84C30] text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                            >
                                Kirim Stok (Push)
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('type', 'request')}
                                className={`py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${data.type === 'request' ? 'bg-[#E84C30] text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                            >
                                Minta Stok (Pull)
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Branch Selection */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Cabang Tujuan / Asal</label>
                                <select
                                    value={data.target_branch_id}
                                    onChange={e => setData('target_branch_id', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all cursor-pointer"
                                >
                                    <option value="">Pilih Cabang</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id} className="bg-[#1A1A1A]">{b.name}</option>
                                    ))}
                                </select>
                                {errors.target_branch_id && <p className="text-red-400 text-[10px] font-bold uppercase mt-1">{errors.target_branch_id}</p>}
                            </div>

                            {/* Material Selection */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Item / Material</label>
                                <select
                                    value={data.material_id}
                                    onChange={e => setData('material_id', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all cursor-pointer"
                                >
                                    <option value="">Pilih Item</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id} className="bg-[#1A1A1A]">{m.name} ({m.unit}) — Stok: {parseFloat(m.stock).toFixed(1)}</option>
                                    ))}
                                </select>
                                {errors.material_id && <p className="text-red-400 text-[10px] font-bold uppercase mt-1">{errors.material_id}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Quantity */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Jumlah Transfer</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.quantity}
                                        onChange={e => setData('quantity', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all font-mono"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase">Units</div>
                                </div>
                                {errors.quantity && <p className="text-red-400 text-[10px] font-bold uppercase mt-1">{errors.quantity}</p>}
                            </div>

                            {/* Info Box */}
                            <div className="bg-[#E84C30]/5 border border-[#E84C30]/10 rounded-xl p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#E84C30]/10 flex items-center justify-center text-[#E84C30] shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <p className="text-[10px] text-white/40 leading-relaxed italic">
                                    {data.type === 'transfer' 
                                        ? "Pilihan 'Kirim' akan memotong stok di cabang aktif Anda dan mengirimkannya ke cabang tujuan setelah disetujui."
                                        : "Pilihan 'Minta' akan mengirimkan permintaan stok ke cabang lain untuk dikirimkan ke cabang aktif Anda."}
                                </p>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Keterangan / Alasan</label>
                            <textarea
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                                placeholder="Contoh: Stok menipis, restock mingguan, dll..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all resize-none h-24"
                            ></textarea>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex gap-4">
                            <Link
                                href={route('admin.stock-transfers.index')}
                                className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white/30 hover:bg-white/5 transition-all text-center"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                            >
                                {processing ? 'Memproses...' : 'Proses Permintaan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </InventoryLayout>
    );
}
