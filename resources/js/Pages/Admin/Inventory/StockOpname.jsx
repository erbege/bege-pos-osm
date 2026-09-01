import React, { useState } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function StockOpname({ auth, sessions }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        notes: '',
        branch_id: auth.user.branch_id,
    });

    const handleCreate = (e) => {
        e.preventDefault();
        post(route('admin.stock-opname.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            }
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'counting': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'review': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'counting': return 'PENGHITUNGAN';
            case 'review': return 'PENINJAUAN';
            case 'approved': return 'DISETUJUI';
            case 'cancelled': return 'DIBATALKAN';
            default: return status.toUpperCase();
        }
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <InventoryLayout title="Audit & Koreksi Stok">
            <Head title="Stock Opname" />

            <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Audit & Koreksi Stok</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Verifikasi fisik stok dan analisis selisih sistem</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Mulai Audit
                    </button>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b bg-black/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold" style={{ borderColor: 'var(--g-border)' }}>
                                    <th className="px-4 py-4">ID Referensi</th>
                                    <th className="px-4 py-4">Dimulai Pada</th>
                                    <th className="px-4 py-4">Auditor</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-4 py-4 text-right">Nilai Selisih</th>
                                    <th className="px-4 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(sessions || []).map((session) => (
                                    <tr key={session.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>#{String(session.id).padStart(5, '0')}</div>
                                            <div className="text-[9px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>Audit Stok</div>
                                        </td>
                                        <td className="px-4 py-4 text-white/60 text-xs">
                                            {new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-4 text-white/60 text-xs">
                                            {session.creator?.name || 'Sistem'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${getStatusBadge(session.status)}`}>
                                                {getStatusLabel(session.status)}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-4 text-right font-mono font-bold text-xs ${session.total_variance_value < 0 ? 'text-red-400' : session.total_variance_value > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                                            {session.total_variance_value ? fmt(session.total_variance_value) : '—'}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <Link
                                                href={route('admin.stock-opname.show', session.id)}
                                                className="text-[10px] font-bold text-[#E84C30] hover:underline uppercase tracking-widest"
                                            >
                                                Lihat Lembar Audit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {(sessions || []).length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada riwayat audit ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="md">
                <div className="relative rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--g-bg-secondary)' }}>
                    <div className="px-4 py-4 border-b bg-black/5 flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Inisiasi Audit Baru</h3>
                        <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <form onSubmit={handleCreate} className="p-4 space-y-5 text-left">
                        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 mb-4 text-center">
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Peringatan Audit</p>
                            <p className="text-xs text-white/60 leading-relaxed">Sistem akan mengambil snapshot stok saat ini untuk dibandingkan dengan hasil penghitungan fisik Anda.</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Catatan / Alasan Audit</label>
                            <textarea
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                                placeholder="Contoh: Audit Rutin Bulanan, Koreksi Selisih Harian..."
                                className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all h-24 resize-none"
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                            ></textarea>
                            {errors.notes && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.notes}</div>}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 text-white/40 font-bold border border-white/10 rounded-lg hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest">Batal</button>
                            <button type="submit" disabled={processing} className="flex-1 py-2.5 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-[10px] uppercase tracking-widest">
                                {processing ? 'Memproses...' : 'Konfirmasi & Mulai'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </InventoryLayout>
    );
}

