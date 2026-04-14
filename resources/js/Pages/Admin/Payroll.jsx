import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';

export default function Payroll({ auth, employees, payrolls, settings }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [detailPayroll, setDetailPayroll] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });

    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const { data, setData, post, processing, reset, errors } = useForm({
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        overtime: 0,
        bonus: 0,
        deduction: 0,
        cash_advance_deduction: '',
        notes: '',
    });

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

    const payTypeLabels = {
        salary_and_hourly: 'Gaji Pokok + Per Jam',
        salary_only: 'Gaji Pokok',
        hourly_only: 'Per Jam',
    };

    const payTypeBadgeStyles = {
        salary_and_hourly: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        salary_only: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        hourly_only: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };

    const statusBadgeStyles = {
        draft: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };

    const statusLabels = { draft: 'Draft', approved: 'Disetujui', paid: 'Lunas' };

    // Preview payroll calculation
    const handlePreview = () => {
        if (!data.employee_id || !data.month || !data.year) return;
        setPreviewLoading(true);
        fetch(route('admin.payroll.preview'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
            body: JSON.stringify(data),
        })
            .then(r => r.json())
            .then(d => { setPreviewData(d); setPreviewLoading(false); })
            .catch(() => setPreviewLoading(false));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.payroll.generate'), {
            onSuccess: () => { setIsModalOpen(false); setPreviewData(null); reset(); }
        });
    };

    const handleApprove = (id) => {
        setConfirmModal({
            show: true, title: 'Setujui Payroll', message: 'Setujui payroll ini? Status akan berubah ke "Disetujui" dan siap untuk dibayarkan.', type: 'primary', confirmText: 'Setujui',
            onConfirm: () => { router.post(route('admin.payroll.approve', id), {}, { onSuccess: () => closeConfirm() }); }
        });
    };

    const handlePay = (id) => {
        setConfirmModal({
            show: true, title: 'Konfirmasi Pembayaran', message: 'Tandai gaji ini sebagai sudah dibayar? Jurnal keuangan otomatis tercipta.', type: 'primary', confirmText: 'Proses Pembayaran',
            onConfirm: () => { router.post(route('admin.payroll.pay', id), {}, { onSuccess: () => closeConfirm() }); }
        });
    };

    const handleBulkGenerate = () => {
        setConfirmModal({
            show: true, title: 'Bulk Generate', message: `Generate payroll untuk semua karyawan aktif bulan ${months[data.month - 1]} ${data.year}?`, type: 'primary', confirmText: 'Generate Semua',
            onConfirm: () => { router.post(route('admin.payroll.bulk-generate'), { month: data.month, year: data.year }, { onSuccess: () => closeConfirm() }); }
        });
    };

    const selectedEmployee = employees.find(e => e.id == data.employee_id);

    // Summary stats
    const totalDraft = payrolls.filter(p => p.status === 'draft').length;
    const totalApproved = payrolls.filter(p => p.status === 'approved').length;
    const totalPaid = payrolls.filter(p => p.status === 'paid').length;
    const totalNetPaid = payrolls.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.net_salary), 0);

    return (
        <AdminLayout title="Sistem Penggajian">
            <Head title="Payroll" />
            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Penggajian (Payroll)</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>3 mode kalkulasi: Gaji Pokok + Per Jam, Gaji Pokok, Per Jam</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleBulkGenerate} className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 border border-white/10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Bulk Generate
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[#E84C30]/20 transition-all flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Generate Payroll
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/60 mb-1">Draft</div>
                        <div className="text-2xl font-semibold text-amber-400">{totalDraft}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/60 mb-1">Disetujui</div>
                        <div className="text-2xl font-semibold text-blue-400">{totalApproved}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/60 mb-1">Lunas</div>
                        <div className="text-2xl font-semibold text-emerald-400">{totalPaid}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">Total Dibayar</div>
                        <div className="text-lg font-semibold text-white font-mono">{fmt(totalNetPaid)}</div>
                    </div>
                </div>

                {/* Payroll Table */}
                <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/20 text-xs uppercase" style={{ color: 'var(--g-text-muted)' }}>
                                <tr>
                                    <th className="px-4 py-3 font-bold tracking-wider">Pegawai</th>
                                    <th className="px-4 py-3 font-bold tracking-wider">Periode</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-center">Model Gaji</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-right">Pendapatan</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-right">Potongan</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-right">Gaji Bersih</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-center">Status</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: 'var(--g-border)' }}>
                                {payrolls.map((p) => {
                                    const earnings = Number(p.base_salary) + Number(p.overtime) + Number(p.allowance_total) + Number(p.bonus_total) + Number(p.bonus_performance);
                                    const deductions = Number(p.deduction) + Number(p.late_penalty_total) + Number(p.cash_advance_deduction);
                                    return (
                                        <tr key={p.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setDetailPayroll(p)}>
                                            <td className="px-4 py-3">
                                                <div className="font-bold" style={{ color: 'var(--g-text-primary)' }}>{p.employee?.name}</div>
                                                <div className="text-[10px] font-mono opacity-60" style={{ color: 'var(--g-text-muted)' }}>{p.employee?.position?.name || 'Staff'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold" style={{ color: 'var(--g-text-secondary)' }}>{months[p.month - 1]} {p.year}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ${payTypeBadgeStyles[p.pay_type] || payTypeBadgeStyles.salary_and_hourly}`}>
                                                    {payTypeLabels[p.pay_type] || p.pay_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="font-bold font-mono text-emerald-400">+{fmt(earnings)}</div>
                                                {p.total_hours > 0 && <div className="text-[10px] opacity-40">{p.total_hours} jam</div>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="font-bold font-mono text-red-400">-{fmt(deductions)}</div>
                                                {Number(p.cash_advance_deduction) > 0 && <div className="text-[10px] opacity-40">Kasbon: {fmt(p.cash_advance_deduction)}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="font-bold font-mono text-lg" style={{ color: 'var(--g-text-primary)' }}>{fmt(p.net_salary)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadgeStyles[p.status]}`}>
                                                    {statusLabels[p.status] || p.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1.5">
                                                    {p.status === 'draft' && (
                                                        <button onClick={() => handleApprove(p.id)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-blue-500/20">
                                                            Setujui
                                                        </button>
                                                    )}
                                                    {p.status === 'approved' && (
                                                        <button onClick={() => handlePay(p.id)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-500/20">
                                                            Bayar
                                                        </button>
                                                    )}
                                                    <a href={route('admin.payroll.slip', p.id)} className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5" onClick={e => e.stopPropagation()}>
                                                        PDF
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {payrolls.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--g-text-muted)' }}>Belum ada data penggajian</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Generate Modal */}
            <Modal show={isModalOpen} onClose={() => { setIsModalOpen(false); setPreviewData(null); }} maxWidth="2xl">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Generate Payroll</h3>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">Kalkulasi gaji otomatis — 3 mode perhitungan</p>
                        </div>
                        <button onClick={() => { setIsModalOpen(false); setPreviewData(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submit} className="p-4 space-y-5 text-left max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Employee Select */}
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Pilih Pegawai</label>
                                <select value={data.employee_id} onChange={e => { setData('employee_id', e.target.value); setPreviewData(null); }} className="w-full text-xs font-bold rounded-lg px-3 py-2 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required>
                                    <option value="">Pilih...</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>
                                            {e.name} • {payTypeLabels[e.pay_type] || 'N/A'} {e.outstanding_kasbon > 0 ? `• Kasbon: ${fmt(e.outstanding_kasbon)}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Employee Info Badge */}
                            {selectedEmployee && (
                                <div className="col-span-2 p-3 rounded-lg border border-white/5 bg-white/[0.02] flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#E84C30]/10 flex items-center justify-center text-[#E84C30] text-sm font-bold overflow-hidden border border-[#E84C30]/20">
                                        {selectedEmployee.photo_path ? <img src={`/storage/${selectedEmployee.photo_path}`} className="w-full h-full object-cover" alt="" /> : selectedEmployee.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-sm">{selectedEmployee.name}</div>
                                        <div className="text-[10px] text-white/40">{selectedEmployee.position} • <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${payTypeBadgeStyles[selectedEmployee.pay_type]}`}>{payTypeLabels[selectedEmployee.pay_type]}</span></div>
                                    </div>
                                    <div className="text-right text-[10px] space-y-0.5">
                                        {selectedEmployee.pay_type !== 'hourly_only' && <div className="text-white/40">Gaji Pokok: <span className="font-mono text-white">{fmt(selectedEmployee.base_salary)}</span></div>}
                                        {selectedEmployee.pay_type !== 'salary_only' && <div className="text-white/40">Rate/Jam: <span className="font-mono text-emerald-400">{fmt(selectedEmployee.hourly_rate)}</span></div>}
                                        {selectedEmployee.outstanding_kasbon > 0 && <div className="text-red-400">Sisa Kasbon: <span className="font-mono">{fmt(selectedEmployee.outstanding_kasbon)}</span></div>}
                                    </div>
                                </div>
                            )}

                            {/* Period */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Bulan</label>
                                <select value={data.month} onChange={e => { setData('month', e.target.value); setPreviewData(null); }} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Tahun</label>
                                <input type="number" value={data.year} onChange={e => { setData('year', e.target.value); setPreviewData(null); }} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                        </div>

                        {/* Manual Adjustments */}
                        <div className="p-4 rounded-lg border space-y-4" style={{ backgroundColor: 'var(--g-bg-tertiary)', borderColor: 'var(--g-border)' }}>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">Penyesuaian Manual (Optional)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Lembur / Insentif (Rp)</label>
                                    <input type="number" value={data.overtime} onChange={e => setData('overtime', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Bonus Manual (Rp)</label>
                                    <input type="number" value={data.bonus} onChange={e => setData('bonus', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Potongan Lainnya (Rp)</label>
                                    <input type="number" value={data.deduction} onChange={e => setData('deduction', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Cicilan Kasbon (Rp) <span className="text-white/20">auto</span></label>
                                    <input type="number" value={data.cash_advance_deduction} onChange={e => setData('cash_advance_deduction', e.target.value)} placeholder="Auto" className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Catatan</label>
                                <input type="text" value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Opsional..." className="w-full text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                        </div>

                        {/* Preview Button */}
                        <button type="button" onClick={handlePreview} disabled={!data.employee_id || previewLoading} className="w-full py-2.5 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30">
                            {previewLoading ? '⏳ Menghitung...' : '🔍 Preview Kalkulasi'}
                        </button>

                        {/* Preview Result */}
                        {previewData && (
                            <div className="p-4 rounded-lg border border-[#E84C30]/20 bg-[#E84C30]/5 space-y-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">📊 Preview Kalkulasi</h4>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="flex justify-between"><span className="text-white/40">Gaji Dasar</span><span className="text-white font-mono">{fmt(previewData.base_pay)}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Lembur</span><span className="text-emerald-400 font-mono">+{fmt(previewData.overtime)}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Tunjangan</span><span className="text-emerald-400 font-mono">+{fmt(previewData.allowance_total)}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Bonus</span><span className="text-emerald-400 font-mono">+{fmt(previewData.bonus_total)}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Denda Telat</span><span className="text-red-400 font-mono">-{fmt(previewData.late_penalty_total)}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Cicilan Kasbon</span><span className="text-red-400 font-mono">-{fmt(previewData.cash_advance_deduction)}</span></div>
                                </div>
                                <div className="border-t border-[#E84C30]/20 pt-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-white">GAJI BERSIH</span>
                                    <span className="text-lg font-bold text-[#E84C30] font-mono">{fmt(previewData.net_salary)}</span>
                                </div>
                                {previewData.attendance_summary && (
                                    <div className="text-[10px] text-white/30 space-x-3">
                                        <span>📅 Hadir: {previewData.attendance_summary.present_days} hari</span>
                                        <span>⏰ Telat: {previewData.attendance_summary.late_days}×</span>
                                        <span>🕐 {previewData.attendance_summary.total_work_hours} jam</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button type="button" onClick={() => { setIsModalOpen(false); setPreviewData(null); }} className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-white/40 font-bold hover:bg-white/5 transition text-sm">Cancel</button>
                            <button type="submit" disabled={processing} className="flex-[2] px-4 py-3 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-sm uppercase tracking-widest">
                                {processing ? 'Generating...' : 'Hitung & Simpan Draft'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Detail Payroll Modal */}
            <Modal show={!!detailPayroll} onClose={() => setDetailPayroll(null)} maxWidth="md">
                {detailPayroll && (
                    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                        <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                            <div className="text-left">
                                <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Detail Payroll</h3>
                                <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">{detailPayroll.employee?.name} — {months[detailPayroll.month - 1]} {detailPayroll.year}</p>
                            </div>
                            <button onClick={() => setDetailPayroll(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ${payTypeBadgeStyles[detailPayroll.pay_type]}`}>{payTypeLabels[detailPayroll.pay_type]}</span>
                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusBadgeStyles[detailPayroll.status]}`}>{statusLabels[detailPayroll.status]}</span>
                            </div>

                            {/* Components */}
                            {detailPayroll.components?.length > 0 && (
                                <>
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">💰 Pendapatan</h4>
                                        {detailPayroll.components.filter(c => c.component_type === 'earning').map(c => (
                                            <div key={c.id} className="flex justify-between py-1.5 text-xs border-b border-white/5">
                                                <span className="text-white/60">{c.name}</span>
                                                <span className="text-white font-mono">{fmt(c.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {detailPayroll.components.filter(c => c.component_type === 'deduction').length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">📉 Potongan</h4>
                                            {detailPayroll.components.filter(c => c.component_type === 'deduction').map(c => (
                                                <div key={c.id} className="flex justify-between py-1.5 text-xs border-b border-white/5">
                                                    <span className="text-white/60">{c.name}</span>
                                                    <span className="text-red-400 font-mono">-{fmt(c.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="p-4 rounded-lg bg-[#E84C30]/5 border border-[#E84C30]/20 flex justify-between items-center">
                                <span className="text-sm font-bold text-white">GAJI BERSIH</span>
                                <span className="text-xl font-bold text-[#E84C30] font-mono">{fmt(detailPayroll.net_salary)}</span>
                            </div>

                            {detailPayroll.approver && (
                                <div className="text-[10px] text-white/30">
                                    Disetujui oleh: {detailPayroll.approver.name} • {detailPayroll.approved_at ? new Date(detailPayroll.approved_at).toLocaleString('id-ID') : '-'}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                {detailPayroll.status === 'draft' && (
                                    <button onClick={() => { setDetailPayroll(null); handleApprove(detailPayroll.id); }} className="flex-1 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-blue-500/20 transition-all">Setujui</button>
                                )}
                                {detailPayroll.status === 'approved' && (
                                    <button onClick={() => { setDetailPayroll(null); handlePay(detailPayroll.id); }} className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all">Bayar</button>
                                )}
                                <a href={route('admin.payroll.slip', detailPayroll.id)} className="flex-1 py-2.5 bg-white/5 text-white/40 border border-white/10 font-bold rounded-lg text-xs uppercase tracking-widest text-center hover:bg-white/10 transition-all">📄 Download Slip</a>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmationModal show={confirmModal.show} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} onConfirm={confirmModal.onConfirm} onCancel={closeConfirm} />
        </AdminLayout>
    );
}

