import React, { useState, useEffect } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import axios from 'axios';

export default function Production({ auth, materials, productions }) {
    const [showModal, setShowModal] = useState(false);
    const [recipeAnalysis, setRecipeAnalysis] = useState(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        material_id: '',
        quantity: 1,
        notes: '',
    });

    useEffect(() => {
        if (data.material_id && data.quantity > 0) {
            analyzeRecipe();
        } else {
            setRecipeAnalysis(null);
        }
    }, [data.material_id, data.quantity]);

    const analyzeRecipe = async () => {
        setLoadingAnalysis(true);
        try {
            const response = await axios.get(route('admin.production.get-recipe', data.material_id), {
                params: { qty: data.quantity }
            });
            setRecipeAnalysis(response.data);
        } catch (error) {
            console.error('Failed to analyze recipe', error);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.production.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            }
        });
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <InventoryLayout title="Produksi & Prep Dapur">
            <Head title="Kitchen Production" />

            <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Produksi & Prep Dapur</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Catat pengolahan bahan baku menjadi produk setengah jadi atau produk jadi</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                        Catat Produksi
                    </button>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b bg-black/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold" style={{ borderColor: 'var(--g-border)' }}>
                                    <th className="px-4 py-4">Produk Dihasilkan</th>
                                    <th className="px-4 py-4 text-center">Jumlah</th>
                                    <th className="px-4 py-4 text-center">Status</th>
                                    <th className="px-4 py-4">Waktu Selesai</th>
                                    <th className="px-4 py-4">Oleh</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(productions || []).map((p) => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{p.material?.name}</div>
                                            <div className="text-[10px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>Hasil Produksi</div>
                                        </td>
                                        <td className="px-4 py-4 text-center font-mono font-bold text-white/70">
                                            {parseFloat(p.qty).toFixed(2)} {p.material?.unit}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                SELESAI
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-white/40 text-xs">
                                            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-4 text-white/60 text-xs">
                                            {p.creator?.name || 'Sistem'}
                                        </td>
                                    </tr>
                                ))}
                                {(productions || []).length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Belum ada riwayat produksi hari ini</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <div className="relative rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--g-bg-secondary)' }}>
                    <div className="px-4 py-4 border-b bg-black/5 flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Catat Produksi Baru</h3>
                            <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Pengolahan Bahan Baku</p>
                        </div>
                        <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <form onSubmit={submit} className="p-4 space-y-6 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Produk Hasil Jadi</label>
                                <select 
                                    value={data.material_id} 
                                    onChange={e => setData('material_id', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all cursor-pointer" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                >
                                    <option value="">Pilih Hasil Produksi</option>
                                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                                </select>
                                {errors.material_id && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.material_id}</div>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Hasil Batch</label>
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
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Catatan Proses</label>
                            <textarea 
                                value={data.notes} 
                                onChange={e => setData('notes', e.target.value)}
                                placeholder="Detail batch, suhu, atau keterangan lainnya..."
                                className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all resize-none h-20" 
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                            ></textarea>
                        </div>

                        {/* Recipe Analysis Panel */}
                        <div className="p-5 rounded-lg border bg-black/20" style={{ borderColor: 'var(--g-border)' }}>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Analisis Resep & Stok</h4>
                            
                            {loadingAnalysis ? (
                                <div className="py-6 text-center text-xs animate-pulse opacity-40 uppercase font-bold tracking-widest">Menganalisis Kebutuhan...</div>
                            ) : recipeAnalysis ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
                                        <div>
                                            <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">Estimasi Biaya Produksi</p>
                                            <p className="text-lg font-bold font-mono text-emerald-400">{fmt(recipeAnalysis.total_estimated_cost)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">Status Ketersediaan</p>
                                            {recipeAnalysis.can_produce ? (
                                                <p className="text-xs font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-widest">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                    Stok Mencukupi
                                                </p>
                                            ) : (
                                                <p className="text-xs font-bold text-red-400 flex items-center gap-1 uppercase tracking-widest">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                    Stok Tidak Cukup
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Komposisi Bahan Baku:</p>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                                            {recipeAnalysis.ingredients.map(ing => (
                                                <div key={ing.id} className="flex justify-between items-center text-xs p-2 rounded bg-white/5 border border-white/5">
                                                    <div>
                                                        <p className="font-bold text-white/80">{ing.name}</p>
                                                        <p className="text-[9px] opacity-40 uppercase font-bold tracking-tighter">Butuh: {parseFloat(ing.required).toFixed(2)} {ing.unit}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`font-mono font-bold ${ing.stock < ing.required ? 'text-red-400' : 'text-white/40'}`}>
                                                            Stok: {parseFloat(ing.stock).toFixed(2)}
                                                        </p>
                                                        <p className="text-[9px] opacity-40 uppercase font-bold tracking-tighter">Cost: {fmt(ing.cost * ing.required)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="py-6 text-center text-[10px] opacity-20 uppercase font-bold tracking-widest italic">Pilih produk dan tentukan jumlah untuk melihat resep</p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setShowModal(false)} 
                                className="flex-1 py-3 text-white/40 font-bold border border-white/10 rounded-lg hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                disabled={processing || (recipeAnalysis && !recipeAnalysis.can_produce)} 
                                className="flex-[2] py-3 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-[10px] uppercase tracking-widest disabled:opacity-20"
                            >
                                {processing ? 'Memproses...' : 'Selesaikan Batch'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </InventoryLayout>
    );
}

