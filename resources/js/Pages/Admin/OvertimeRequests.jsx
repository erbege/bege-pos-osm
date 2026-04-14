import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function OvertimeRequests({ overtimeRequests, employees, stats }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ employee_id: '', date: '', hours: '', minutes: '0', reason: '' });

    const submit = (e) => {
        e.preventDefault();
        const duration_minutes = (parseInt(form.hours || 0) * 60) + parseInt(form.minutes || 0);
        router.post(route('admin.overtime-requests.store'), {
            employee_id: form.employee_id,
            date: form.date,
            duration_minutes,
            reason: form.reason,
        }, {
            onSuccess: () => { setShowForm(false); setForm({ employee_id: '', date: '', hours: '', minutes: '0', reason: '' }); }
        });
    };

    const statusBadge = (status) => {
        const map = {
            pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
            approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
        };
        return map[status] || '';
    };

    const formatDuration = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    return (
        <AdminLayout title="Lembur">
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-amber-400 text-[10px] font-normal uppercase tracking-widest">Pending</p>
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-normal" style={{ color: 'var(--g-text-primary)' }}>{stats.pendingCount || 0}</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--g-text-muted)' }}>requests waiting</p>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-emerald-400 text-[10px] font-normal uppercase tracking-widest">Approved Hours</p>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-normal" style={{ color: 'var(--g-text-primary)' }}>{stats.approvedHoursThisMonth || 0}h</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--g-text-muted)' }}>this month</p>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[#E84C30] text-[10px] font-normal uppercase tracking-widest">Total Requests</p>
                            <div className="w-8 h-8 rounded-lg bg-[#E84C30]/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#E84C30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-normal" style={{ color: 'var(--g-text-primary)' }}>{stats.totalThisMonth || 0}</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--g-text-muted)' }}>this month</p>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)' }}>
                    <div className="p-2 flex justify-between items-center" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div>
                            <h4 className="text-sm font-normal uppercase tracking-wider" style={{ color: 'var(--g-text-primary)' }}>Overtime Requests</h4>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--g-text-muted)' }}>Manage lembur requests</p>
                        </div>
                        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1 bg-[#E84C30] text-white rounded-lg text-xs font-bold hover:bg-[#D4432A] transition-all">
                            + New Request
                        </button>
                    </div>

                    {/* Form */}
                    {showForm && (
                        <form onSubmit={submit} className="p-2" style={{ borderBottom: '1px solid var(--g-border)', backgroundColor: 'var(--g-bg-tertiary)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </select>
                                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <input type="number" placeholder="Hours" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} min="0" max="12" required className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div className="flex-1">
                                        <select value={form.minutes} onChange={e => setForm({ ...form, minutes: e.target.value })} className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                            <option value="0">0 min</option>
                                            <option value="15">15 min</option>
                                            <option value="30">30 min</option>
                                            <option value="45">45 min</option>
                                        </select>
                                    </div>
                                </div>
                                <input type="text" placeholder="Reason (optional)" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                <button type="submit" className="px-3 py-1.5 bg-[#E84C30] text-white rounded-lg text-xs font-bold hover:bg-[#D4432A] transition shrink-0">Save</button>
                            </div>
                        </form>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--g-border)' }}>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Employee</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Date</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Duration</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Reason</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Status</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest text-right" style={{ color: 'var(--g-text-muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overtimeRequests.map(ot => (
                                    <tr key={ot.id} className="hover:opacity-80 transition" style={{ borderBottom: '1px solid var(--g-border)' }}>
                                        <td className="px-4 py-2 font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{ot.employee?.name || '-'}</td>
                                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--g-text-secondary)' }}>{ot.date ? new Date(ot.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                                        <td className="px-4 py-2 font-mono text-sm font-bold" style={{ color: 'var(--g-text-secondary)' }}>{formatDuration(ot.duration_minutes)}</td>
                                        <td className="px-4 py-2 text-sm max-w-[200px] truncate" style={{ color: 'var(--g-text-tertiary)' }}>{ot.reason || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusBadge(ot.status)}`}>{ot.status}</span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                {ot.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => router.post(route('admin.overtime-requests.approve', ot.id))} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition">Approve</button>
                                                        <button onClick={() => router.post(route('admin.overtime-requests.reject', ot.id))} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold hover:bg-red-500/20 transition">Reject</button>
                                                    </>
                                                )}
                                                {ot.status !== 'pending' && (
                                                    <span className="text-[10px] font-bold" style={{ color: 'var(--g-text-muted)' }}>
                                                        by {ot.approver?.name || '-'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {overtimeRequests.length === 0 && (
                                    <tr><td colSpan="6" className="px-3 py-6 text-center text-sm" style={{ color: 'var(--g-text-muted)' }}>No overtime requests yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

