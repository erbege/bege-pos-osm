import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Periods({ periods }) {
    const [showCreate, setShowCreate] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        start_date: '',
        end_date: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.finance.periods.store'), {
            onSuccess: () => {
                setShowCreate(false);
                reset();
            }
        });
    };

    const handleClose = (id) => {
        if (confirm('Yakin ingin menutup periode keuangan ini? Setelah ditutup, jurnal tidak dapat ditambahkan ke periode ini.')) {
            post(route('admin.finance.periods.close', id));
        }
    };

    return (
        <AdminLayout title="Periode Keuangan">
            <Head title="Periode Keuangan" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Periode Keuangan</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Kelola siklus akuntansi dan penutupan periode</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="bg-[#E84C30] hover:bg-[#D4432A] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition"
                    >
                        {showCreate ? 'Batal' : '+ Periode Baru'}
                    </button>
                </div>

                {showCreate && (
                    <div className="p-4 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-[#E84C30]"></div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Buat Periode Baru</h3>
                        </div>
                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1.5 tracking-wider">Tanggal Mulai</label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={e => setData('start_date', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border"
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                />
                                {errors.start_date && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.start_date}</div>}
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1.5 tracking-wider">Tanggal Selesai</label>
                                <input
                                    type="date"
                                    value={data.end_date}
                                    onChange={e => setData('end_date', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border"
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                />
                                {errors.end_date && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.end_date}</div>}
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition disabled:opacity-50"
                                >
                                    Simpan Periode
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b bg-black/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold" style={{ borderColor: 'var(--g-border)' }}>
                                    <th className="px-4 py-4">Nama Periode</th>
                                    <th className="px-4 py-4">Rentang Tanggal</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-4 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {periods.map((period) => (
                                    <tr key={period.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4 font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>
                                            {new Date(period.start_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-4 text-white/60 font-mono text-xs">
                                            {new Date(period.start_date).toLocaleDateString('id-ID')} - {new Date(period.end_date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${period.status === 'open' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-white/25 bg-white/5 border-white/10'}`}>
                                                {period.status === 'open' ? 'TERBUKA' : 'TERTUTUP'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {period.status === 'open' && (
                                                <button
                                                    onClick={() => handleClose(period.id)}
                                                    className="text-[10px] font-bold text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest"
                                                >
                                                    Tutup Periode
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {periods.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada periode keuangan ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

