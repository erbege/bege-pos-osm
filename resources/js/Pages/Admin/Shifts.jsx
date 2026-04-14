import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Shifts({ shifts, branches, stats }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ branch_id: '', name: '', start_time: '', end_time: '', is_active: true });
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const resetForm = () => { 
        setForm({ branch_id: '', name: '', start_time: '', end_time: '', is_active: true }); 
        setEditing(null); 
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            router.put(route('admin.shifts.update', editing.id), form, {
                onSuccess: () => { setShowForm(false); resetForm(); }
            });
        } else {
            router.post(route('admin.shifts.store'), form, {
                onSuccess: () => { setShowForm(false); resetForm(); }
            });
        }
    };

    const startEdit = (shift) => {
        setEditing(shift);
        setForm({
            branch_id: shift.branch_id || '',
            name: shift.name,
            start_time: shift.start_time?.substring(0, 5) || '',
            end_time: shift.end_time?.substring(0, 5) || '',
            is_active: shift.is_active,
        });
        setShowForm(true);
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return '0';
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        const diff = (eH * 60 + eM) - (sH * 60 + sM);
        const minutes = diff < 0 ? diff + (24 * 60) : diff;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}j ${m}m` : `${h}j`;
    };

    const deleteShift = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Master Shift',
            message: 'Apakah Anda yakin ingin menghapus template shift ini?',
            type: 'danger',
            onConfirm: () => {
                router.delete(route('admin.shifts.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    return (
        <AdminLayout title="Template Shift">
            <Head title="Master Shift" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Master Template Shift</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Definisikan jam kerja standar operasional cafe</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[#E84C30]/20 transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Tambah Template
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-lg border text-left" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30] mb-1">Total Template</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>{stats.total || 0}</div>
                    </div>
                    <div className="p-5 rounded-lg border text-left" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Shift Aktif</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>{stats.active || 0}</div>
                    </div>
                    <div className="p-5 rounded-lg border text-left" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-1">Nonaktif</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>{stats.inactive || 0}</div>
                    </div>
                </div>

                {/* Main Panel */}
                <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    {/* Header Panel */}
                    <div className="px-4 py-4 bg-black/10 border-b flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Daftar Jam Kerja</h3>
                    </div>

                    {/* Inline Form */}
                    {showForm && (
                        <div className="p-4 border-b animate-in slide-in-from-top-2 duration-300" style={{ borderColor: 'var(--g-border)', backgroundColor: 'var(--g-bg-tertiary)' }}>
                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40">Nama Shift</label>
                                    <input type="text" placeholder="Pagi, Sore, Full..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cabang</label>
                                    <select value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                        <option value="">Semua Cabang</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40">Jam Mulai</label>
                                    <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40">Jam Selesai</label>
                                    <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button type="submit" className="flex-1 py-2 bg-[#E84C30] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#D4432A] transition-all">
                                        {editing ? 'Update' : 'Simpan'}
                                    </button>
                                    <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="px-3 py-2 text-white/40 font-bold border border-white/10 rounded-lg hover:bg-white/5 transition-all text-xs">
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/20 text-xs uppercase" style={{ color: 'var(--g-text-muted)' }}>
                                <tr>
                                    <th className="px-4 py-3 font-bold tracking-wider">Informasi Shift</th>
                                    <th className="px-4 py-3 font-bold tracking-wider">Cabang</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-center">Waktu</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-center">Durasi</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-center">Status</th>
                                    <th className="px-4 py-3 font-bold tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs" style={{ divideColor: 'var(--g-border)' }}>
                                {shifts.map(shift => (
                                    <tr key={shift.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-4 font-bold" style={{ color: 'var(--g-text-primary)' }}>{shift.name}</td>
                                        <td className="px-4 py-4" style={{ color: 'var(--g-text-tertiary)' }}>{shift.branch?.name || 'Semua Cabang'}</td>
                                        <td className="px-4 py-4 text-center font-mono">
                                            <span style={{ color: 'var(--g-text-secondary)' }}>{shift.start_time?.substring(0, 5)}</span>
                                            <span className="mx-2 opacity-20">—</span>
                                            <span style={{ color: 'var(--g-text-secondary)' }}>{shift.end_time?.substring(0, 5)}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center font-bold" style={{ color: 'var(--g-text-tertiary)' }}>{calculateDuration(shift.start_time, shift.end_time)}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${shift.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/20 border-white/10'}`}>
                                                {shift.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => startEdit(shift)} className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                <button onClick={() => deleteShift(shift.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {shifts.length === 0 && (
                                    <tr><td colSpan="6" className="px-4 py-12 text-center" style={{ color: 'var(--g-text-muted)' }}>Belum ada data shift operasional</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />
        </AdminLayout>
    );
}

