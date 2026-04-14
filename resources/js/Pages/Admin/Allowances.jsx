import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';

export default function Allowances({ employees, allowances }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });

    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const { data, setData, post, put, processing, errors, reset } = useForm({
        employee_id: '',
        name: '',
        type: 'fixed',
        amount: 0,
        is_active: true,
        effective_date: '',
        end_date: '',
    });

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

    const typeLabels = {
        fixed: 'Fixed / Bulan',
        per_day: 'Per Hari Kerja',
        per_attendance: 'Per Kehadiran',
    };

    const typeBadgeStyles = {
        fixed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        per_day: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        per_attendance: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };

    const openModal = (allowance = null) => {
        if (allowance) {
            setEditing(allowance);
            setData({
                employee_id: allowance.employee_id,
                name: allowance.name,
                type: allowance.type,
                amount: allowance.amount,
                is_active: allowance.is_active,
                effective_date: allowance.effective_date || '',
                end_date: allowance.end_date || '',
            });
        } else {
            setEditing(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.employee-allowances.update', editing.id), {
                onSuccess: () => { setIsModalOpen(false); reset(); }
            });
        } else {
            post(route('admin.employee-allowances.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); }
            });
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true, title: 'Hapus Tunjangan', message: 'Yakin ingin menghapus tunjangan ini?', type: 'danger',
            onConfirm: () => { router.delete(route('admin.employee-allowances.destroy', id), { onSuccess: () => closeConfirm() }); }
        });
    };

    const toggleActive = (allowance) => {
        router.put(route('admin.employee-allowances.update', allowance.id), {
            ...allowance,
            is_active: !allowance.is_active,
        });
    };

    // Stats
    const totalActive = allowances.filter(a => a.is_active).length;
    const totalMonthly = allowances.filter(a => a.is_active && a.type === 'fixed').reduce((s, a) => s + Number(a.amount), 0);

    return (
        <AdminLayout title="Tunjangan Karyawan">
            <Head title="Tunjangan" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Manajemen Tunjangan</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Kelola tunjangan tetap, per hari kerja, dan per kehadiran</p>
                    </div>
                    <button onClick={() => openModal()} className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[#E84C30]/20 transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Tambah Tunjangan
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">Total Tunjangan</div>
                        <div className="text-2xl font-semibold text-white">{allowances.length}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/60 mb-1">Aktif</div>
                        <div className="text-2xl font-semibold text-emerald-400">{totalActive}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/60 mb-1">Total Fixed / Bulan</div>
                        <div className="text-lg font-semibold text-blue-400 font-mono">{fmt(totalMonthly)}</div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b" style={{ borderColor: 'var(--g-border)', backgroundColor: 'var(--g-bg-tertiary)' }}>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Karyawan</th>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Nama Tunjangan</th>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-center">Tipe</th>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Nominal</th>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-center">Periode</th>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-center">Status</th>
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {allowances.map((a) => (
                                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold" style={{ color: 'var(--g-text-primary)' }}>{a.employee?.name}</div>
                                        </td>
                                        <td className="p-4" style={{ color: 'var(--g-text-secondary)' }}>
                                            <div className="font-semibold">{a.name}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ${typeBadgeStyles[a.type]}`}>
                                                {typeLabels[a.type]}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-bold font-mono text-emerald-400">{fmt(a.amount)}</span>
                                        </td>
                                        <td className="p-4 text-center text-[10px] font-mono text-white/40">
                                            {a.effective_date ? new Date(a.effective_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                            {a.end_date ? ` → ${new Date(a.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}` : ''}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => toggleActive(a)} className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border cursor-pointer transition-all ${a.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}>
                                                {a.is_active ? 'Aktif' : 'Nonaktif'}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal(a)} className="p-2 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-all" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                                <button onClick={() => handleDelete(a.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all" title="Hapus">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {allowances.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--g-text-muted)' }}>Belum ada data tunjangan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>{editing ? 'Edit Tunjangan' : 'Tambah Tunjangan Baru'}</h3>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">Fixed, Per Hari, atau Per Kehadiran</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submit} className="p-4 space-y-5 text-left">
                        {/* Employee */}
                        {!editing && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Karyawan *</label>
                                <select value={data.employee_id} onChange={e => setData('employee_id', e.target.value)} className="w-full text-xs font-bold rounded-lg px-3 py-2 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required>
                                    <option value="">Pilih Karyawan...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                                {errors.employee_id && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.employee_id}</div>}
                            </div>
                        )}

                        {/* Allowance Name */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Nama Tunjangan *</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Tunjangan Makan, Transport, dll..." className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                            {errors.name && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.name}</div>}
                        </div>

                        {/* Type & Amount */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Tipe Perhitungan *</label>
                                <select value={data.type} onChange={e => setData('type', e.target.value)} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                    <option value="fixed">Fixed / Bulan</option>
                                    <option value="per_day">Per Hari Kerja</option>
                                    <option value="per_attendance">Per Kehadiran</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Nominal (Rp) *</label>
                                <input type="number" value={data.amount} onChange={e => setData('amount', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                                {errors.amount && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.amount}</div>}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Berlaku Mulai</label>
                                <input type="date" value={data.effective_date} onChange={e => setData('effective_date', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Berakhir</label>
                                <input type="date" value={data.end_date} onChange={e => setData('end_date', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setData('is_active', !data.is_active)} className={`relative w-10 h-5 rounded-full transition-colors ${data.is_active ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${data.is_active ? 'translate-x-5' : ''}`}></div>
                            </button>
                            <span className="text-xs font-bold" style={{ color: 'var(--g-text-secondary)' }}>{data.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-white/40 font-bold hover:bg-white/5 transition text-sm">Batal</button>
                            <button type="submit" disabled={processing} className="flex-[2] px-4 py-3 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-sm uppercase tracking-widest">
                                {processing ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Tunjangan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmationModal show={confirmModal.show} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} onConfirm={confirmModal.onConfirm} onCancel={closeConfirm} />
        </AdminLayout>
    );
}

