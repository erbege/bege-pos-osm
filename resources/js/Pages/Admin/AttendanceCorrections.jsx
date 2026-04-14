import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function AttendanceCorrections({ auth, corrections, employees, attendances, stats }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        attendance_id: '',
        employee_id: '',
        requested_check_in: '',
        requested_check_out: '',
        reason: '',
    });

    const statusBadge = (status) => {
        const map = {
            pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
        return map[status] || '';
    };

    const filteredAttendances = data.employee_id
        ? attendances.filter(a => a.employee_id === parseInt(data.employee_id))
        : [];

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.attendance-corrections.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    return (
        <AdminLayout title="Koreksi Absensi">
            <Head title="Attendance Correction" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Koreksi Data Absensi</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Review dan setujui permohonan perubahan waktu absen</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-[#E84C30]/20 transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Buat Koreksi
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-lg border text-left" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-1">Pending Approval</div>
                        <div className="text-2xl font-semibold font-mono" style={{ color: 'var(--g-text-primary)' }}>{stats.pendingCount}</div>
                    </div>
                    <div className="p-5 rounded-lg border text-left" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-1">Approved This Month</div>
                        <div className="text-2xl font-semibold font-mono" style={{ color: 'var(--g-text-primary)' }}>{stats.approvedThisMonth}</div>
                    </div>
                    <div className="p-5 rounded-lg border text-left" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#E84C30] mb-1">Total Submission</div>
                        <div className="text-2xl font-semibold font-mono" style={{ color: 'var(--g-text-primary)' }}>{stats.totalThisMonth}</div>
                    </div>
                </div>

                <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/20 text-xs uppercase" style={{ color: 'var(--g-text-muted)' }}>
                                <tr>
                                    <th className="px-4 py-3 font-semibold tracking-wider">Pegawai</th>
                                    <th className="px-4 py-3 font-semibold tracking-wider">Tgl Original</th>
                                    <th className="px-4 py-3 font-semibold tracking-wider">Request In</th>
                                    <th className="px-4 py-3 font-semibold tracking-wider">Request Out</th>
                                    <th className="px-4 py-3 font-semibold tracking-wider">Alasan</th>
                                    <th className="px-4 py-3 font-semibold tracking-wider">Status</th>
                                    <th className="px-4 py-3 font-semibold tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: 'var(--g-border)' }}>
                                {corrections.map((c) => (
                                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold" style={{ color: 'var(--g-text-primary)' }}>{c.employee?.name}</div>
                                            <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--g-text-muted)' }}>{c.employee?.position || 'Staff'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>{c.attendance?.date ? new Date(c.attendance.date).toLocaleDateString() : '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-white/60">
                                            {c.requested_check_in ? new Date(c.requested_check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-white/60">
                                            {c.requested_check_out ? new Date(c.requested_check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs italic truncate max-w-[150px]" style={{ color: 'var(--g-text-muted)' }}>{c.reason || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${statusBadge(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {c.status === 'pending' ? (
                                                    <>
                                                        <button 
                                                            onClick={() => {
                                                                if (confirm(`Setujui koreksi absensi untuk ${c.employee?.name}?`)) {
                                                                    router.post(route('admin.attendance-corrections.approve', c.id));
                                                                }
                                                            }} 
                                                            className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-semibold uppercase tracking-wider border border-emerald-500/20"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                if (confirm(`Tolak koreksi absensi untuk ${c.employee?.name}?`)) {
                                                                    router.post(route('admin.attendance-corrections.reject', c.id));
                                                                }
                                                            }} 
                                                            className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-semibold uppercase tracking-wider border border-red-500/20"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-semibold opacity-40 uppercase tracking-tighter">Processed by</span>
                                                        <span className="text-[11px] font-semibold text-white/60">{c.approver?.name || 'System'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {corrections.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--g-text-muted)' }}>Belum ada data koreksi</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="lg">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Buat Permohonan Koreksi</h3>
                            <p className="text-[9px] text-white/30 font-semibold uppercase tracking-[0.1em]">Manual attendance adjustment</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submit} className="p-4 space-y-6 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 opacity-60">Pilih Pegawai</label>
                                <select value={data.employee_id} onChange={e => setData('employee_id', e.target.value)} className="w-full text-xs font-semibold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required>
                                    <option value="">Pilih...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 opacity-60">Record Absensi</label>
                                <select value={data.attendance_id} onChange={e => setData('attendance_id', e.target.value)} className="w-full text-xs font-semibold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required disabled={!data.employee_id}>
                                    <option value="">Pilih Log...</option>
                                    {filteredAttendances.map(a => (
                                        <option key={a.id} value={a.id}>{new Date(a.date).toLocaleDateString()} — {a.check_in || '--:--'} s/d {a.check_out || '--:--'}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 opacity-60">Waktu In Baru</label>
                                <input type="datetime-local" value={data.requested_check_in} onChange={e => setData('requested_check_in', e.target.value)} className="w-full text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 opacity-60">Waktu Out Baru</label>
                                <input type="datetime-local" value={data.requested_check_out} onChange={e => setData('requested_check_out', e.target.value)} className="w-full text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 opacity-60">Alasan Koreksi</label>
                            <textarea value={data.reason} onChange={e => setData('reason', e.target.value)} className="w-full text-sm font-semibold rounded-lg px-3 py-2 outline-none border min-h-[80px] transition-all resize-none" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} placeholder="Lupa absen, server error, dll." required />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-white/40 font-semibold hover:bg-white/5 transition text-sm">Cancel</button>
                            <button type="submit" disabled={processing} className="flex-[2] px-4 py-3 bg-[#E84C30] text-white font-semibold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-sm uppercase tracking-widest">
                                {processing ? 'Submitting...' : 'Ajukan Koreksi'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}

