import React, { useState } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, Link, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import axios from 'axios';

export default function PurchasePlanning({ materials, branches, suppliers, recentPOs }) {
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [loadingForecast, setLoadingAnalysis] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = () => {
        setGenerating(true);
        router.post(route('admin.purchase-planning.generate'), {}, {
            onFinish: () => setGenerating(false)
        });
    };

    const fetchForecast = async (material) => {
        setSelectedMaterial(material);
        setLoadingAnalysis(true);
        try {
            const response = await axios.get(route('admin.purchase-planning.forecast', material.id));
            setForecastData(response.data);
        } catch (error) {
            console.error('Gagal mengambil prediksi', error);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <InventoryLayout title="Perencanaan Pengadaan">
            <Head title="Purchase Planning" />

            <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Perencanaan Pengadaan</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Prediksi permintaan bertenaga AI dan asisten pengisian stok otomatis</p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        {generating ? 'Memproses...' : 'Buat Draft PO Otomatis'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main Planning Table */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <div className="px-4 py-3 border-b bg-black/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Penasihat Pengadaan</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5 bg-black/5">
                                            <th className="px-4 py-4">Item Perlu Perhatian</th>
                                            <th className="px-4 py-4 text-center">Stok Saat Ini</th>
                                            <th className="px-4 py-4 text-center">Konsumsi Harian</th>
                                            <th className="px-4 py-4 text-center text-[#E84C30]">Sisa Hari</th>
                                            <th className="px-4 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(materials || []).map((m) => (
                                            <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{m.name}</div>
                                                    <div className="text-[9px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>{m.sku || 'N/A'}</div>
                                                </td>
                                                <td className="px-4 py-4 text-center font-mono font-bold text-white/60">
                                                    {parseFloat(m.stock).toFixed(1)} <span className="text-[9px] font-normal opacity-30">{m.unit}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center font-mono text-white/40">
                                                    {parseFloat(m.avg_daily_consumption || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${m.days_remaining < 3 ? 'text-red-400' : 'text-orange-400'}`}>
                                                        {Math.floor(m.days_remaining)} Hari
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <button 
                                                        onClick={() => fetchForecast(m)}
                                                        className="text-[9px] font-bold text-[#E84C30] hover:underline uppercase tracking-widest"
                                                    >
                                                        Analisis Prediksi
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {materials.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Semua tingkat stok mencukupi</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Recent Activity */}
                    <div className="space-y-6">
                        <div className="rounded-lg border overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <div className="px-4 py-3 border-b bg-black/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Aktivitas Terbaru</h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {(recentPOs || []).map(po => (
                                    <Link key={po.id} href={route('admin.purchase-orders.show', po.id)} className="block p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-white/80 group-hover:text-[#E84C30] transition-colors">{po.po_number}</span>
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">{po.status}</span>
                                        </div>
                                        <div className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">{po.supplier?.name}</div>
                                        <div className="mt-2 flex justify-between items-end">
                                            <span className="text-[10px] text-white/20 font-mono">{new Date(po.created_at).toLocaleDateString('id-ID')}</span>
                                            <span className="text-xs font-bold text-white/60">{fmt(po.total_amount)}</span>
                                        </div>
                                    </Link>
                                ))}
                                {recentPOs.length === 0 && (
                                    <div className="py-6 text-center text-[10px] opacity-20 uppercase font-bold tracking-widest italic">Tidak ada draft aktif</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forecast Modal */}
            <Modal show={!!selectedMaterial} onClose={() => setSelectedMaterial(null)} maxWidth="lg">
                <div className="p-4 text-left">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Analisis Prediksi</h3>
                            <p className="text-lg font-bold" style={{ color: 'var(--g-text-primary)' }}>{selectedMaterial?.name}</p>
                        </div>
                        <button onClick={() => setSelectedMaterial(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    {loadingForecast ? (
                        <div className="py-12 text-center text-xs animate-pulse opacity-40 uppercase font-bold tracking-widest">Menghitung Proyeksi...</div>
                    ) : forecastData ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                    <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">Stok Habis Dalam</p>
                                    <p className="text-xl font-bold text-red-400 font-mono">{forecastData.days_to_depletion} Hari</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                    <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mb-1">Target Reorder</p>
                                    <p className="text-xl font-bold text-emerald-400 font-mono">{forecastData.suggested_reorder_qty} {selectedMaterial?.unit}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Stok Saat Ini</span>
                                    <span className="text-white font-mono">{forecastData.current_stock} {selectedMaterial?.unit}</span>
                                </div>
                                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Penggunaan Harian (ADC)</span>
                                    <span className="text-white font-mono">{forecastData.avg_daily_consumption} / hari</span>
                                </div>
                                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Target Safety Stock</span>
                                    <span className="text-white font-mono">{forecastData.safety_stock_target} {selectedMaterial?.unit}</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-black/20 border border-[#E84C30]/20">
                                <p className="text-[10px] text-white/60 leading-relaxed italic">
                                    "Berdasarkan tren penggunaan 30 hari terakhir, Anda disarankan untuk melakukan pengadaan sebelum tanggal <strong>{new Date(forecastData.estimated_depletion_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</strong>."
                                </p>
                            </div>

                            <button 
                                onClick={() => setSelectedMaterial(null)}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all text-[10px] uppercase tracking-widest"
                            >
                                Tutup Analisis
                            </button>
                        </div>
                    ) : null}
                </div>
            </Modal>
        </InventoryLayout>
    );
}

