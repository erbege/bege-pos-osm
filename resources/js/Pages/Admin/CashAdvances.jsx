import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function CashAdvances({ auth, cashAdvances, employees, stats }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [repayModal, setRepayModal] = useState(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        employee_id: '',
        amount: '',
        reason: '',
        due_date: '',
    });

    const repayForm = useForm({
        repay_amount: '',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.cash-advances.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    const submitRepay = (e) => {
        e.preventDefault();
        repayForm.post(route('admin.cash-advances.repay', repayModal.id), {
            onSuccess: () => {
                setRepayModal(null);
                repayForm.reset();
            }
        });
    };

    const statusBadge = (status) => {
        const map = {
            pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
            repaid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
        return map[status] || '';
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <AdminLayout title="Manajemen Kasbon">
            <Head title="Kasbon" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Kasbon Pegawai</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Pantau pinjaman dan cicilan pembayaran kasbon</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[#E84C30]/20 transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Request Kasbon
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-lg border text-left" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30] mb-1">Outstanding</div>
                        <div className="text-2xl font-bold font-mono" style={{ color: 'var(--g-text-primary)' }}>{fmt(stats.totalOutstanding)}</div>
                    </div>
                    <div className="p-5 rounded-lg border text-left" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Pending Request</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>{stats.pendingCount}</div>
                    </div>
                    <div className="p-5 rounded-lg border text-left" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Repaid This Month</div>
                        <div className="text-2xl font-bold font-mono" style={{ color: 'var(--g-text-primary)' }}>{fmt(stats.paidThisMonth)}</div>
                    </div>
                </div>

                <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/20 text-xs uppercase" style={{ color: 'var(--g-text-muted)' }}>
                                <tr>
                                    <th className="px-4 py-3 font-bold tracking-wider">Pegawai</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-right">Jumlah</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-right">Sisa</th>
                                    <th className="px-4 py-3 font-bold tracking-wider">Jatuh Tempo</th>
                                    <th className="px-4 py-3 font-bold tracking-wider">Status</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: 'var(--g-border)' }}>
                                {cashAdvances.map((ca) => (
                                    <tr key={ca.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold" style={{ color: 'var(--g-text-primary)' }}>{ca.employee?.name}</div>
                                            <div className="text-[10px] opacity-60 uppercase" style={{ color: 'var(--g-text-muted)' }}>{ca.reason || 'Personal request'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-bold font-mono" style={{ color: 'var(--g-text-primary)' }}>{fmt(ca.amount)}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-bold font-mono text-[#E84C30]">{fmt(ca.remaining)}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>{ca.due_date ? new Date(ca.due_date).toLocaleDateString() : '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(ca.status)}`}>
                                                {ca.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                {ca.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => router.post(route('admin.cash-advances.approve', ca.id))} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></button>
                                                        <button onClick={() => router.post(route('admin.cash-advances.reject', ca.id))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                                    </>
                                                )}
                                                {ca.status === 'approved' && ca.remaining > 0 && (
                                                    <button onClick={() => setRepayModal(ca)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">
                                                        Cicilan
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {cashAdvances.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-12 text-center" style={{ color: 'var(--g-text-muted)' }}>Belum ada data kasbon</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Request Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Request Kasbon Baru</h3>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">Create cash advance request</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submit} className="p-4 space-y-6 text-left">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Pilih Pegawai</label>
                            <select value={data.employee_id} onChange={e => setData('employee_id', e.target.value)} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required>
                                <option value="">Pilih...</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Jumlah Pinjaman (Rp)</label>
                            <input type="number" step="1000" value={data.amount} onChange={e => setData('amount', e.target.value)} className="w-full text-xl font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Alasan Kasbon</label>
                            <textarea value={data.reason} onChange={e => setData('reason', e.target.value)} className="w-full text-sm font-medium rounded-lg px-3 py-2 outline-none border min-h-[80px] transition-all resize-none" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} placeholder="Keperluan mendesak, dll." required />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Estimasi Tanggal Pelunasan</label>
                            <input type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-white/40 font-bold hover:bg-white/5 transition text-sm">Cancel</button>
                            <button type="submit" disabled={processing} className="flex-[2] px-4 py-3 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-sm uppercase tracking-widest">
                                {processing ? 'Submitting...' : 'Kirim Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Repay Modal */}
            <Modal show={!!repayModal} onClose={() => setRepayModal(null)} maxWidth="sm">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Catat Cicilan Kasbon</h3>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">{repayModal?.employee?.name}</p>
                        </div>
                        <button onClick={() => setRepayModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submitRepay} className="p-4 space-y-6 text-left">
                        <div className="p-4 rounded-lg bg-black/20 border border-white/5 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Total Sisa Pinjaman</div>
                            <div className="text-2xl font-bold font-mono text-[#E84C30]">{fmt(repayModal?.remaining || 0)}</div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Jumlah Cicilan (Rp)</label>
                            <input type="number" step="1000" min="1000" max={repayModal?.remaining} value={repayForm.data.repay_amount} onChange={e => repayForm.setData('repay_amount', e.target.value)} className="w-full text-xl font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Catatan Pembayaran</label>
                            <input type="text" value={repayForm.data.notes} onChange={e => repayForm.setData('notes', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none border" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} placeholder="Pelunasan bulan ini, dll." />
                        </div>

                        <button type="submit" disabled={repayForm.processing} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all text-sm uppercase tracking-widest">
                            {repayForm.processing ? 'Recording...' : 'Simpan Pembayaran'}
                        </button>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}

