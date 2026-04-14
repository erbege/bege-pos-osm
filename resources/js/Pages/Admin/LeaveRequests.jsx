import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function LeaveRequests({ leaveRequests, employees, stats }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ employee_id: '', type: 'Cuti', start_date: '', end_date: '', reason: '' });

    const submit = (e) => {
        e.preventDefault();
        router.post(route('admin.leave-requests.store'), form, {
            onSuccess: () => { setShowForm(false); setForm({ employee_id: '', type: 'Cuti', start_date: '', end_date: '', reason: '' }); }
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

    const typeBadge = (type) => {
        const map = {
            Cuti: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
            Izin: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
            Sakit: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        };
        return map[type] || 'bg-white/5 text-white/40 border border-white/10';
    };

    const daysBetween = (start, end) => {
        if (!start || !end) return '-';
        const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24) + 1;
        return `${diff} hari`;
    };

    return (
        <AdminLayout title="Cuti / Izin">
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
                            <p className="text-emerald-400 text-[10px] font-normal uppercase tracking-widest">Approved (Month)</p>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-normal" style={{ color: 'var(--g-text-primary)' }}>{stats.approvedThisMonth || 0}</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--g-text-muted)' }}>this month</p>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-red-400 text-[10px] font-normal uppercase tracking-widest">Rejected (Month)</p>
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-normal" style={{ color: 'var(--g-text-primary)' }}>{stats.rejectedThisMonth || 0}</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--g-text-muted)' }}>this month</p>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)' }}>
                    <div className="p-2 flex justify-between items-center" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div>
                            <h4 className="text-sm font-normal uppercase tracking-wider" style={{ color: 'var(--g-text-primary)' }}>Leave Requests</h4>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--g-text-muted)' }}>Manage cuti, izin, and sakit requests</p>
                        </div>
                        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1 bg-[#E84C30] text-white rounded-lg text-xs font-bold hover:bg-[#D4432A] transition-all">
                            + New Request
                        </button>
                    </div>

                    {/* Form */}
                    {showForm && (
                        <form onSubmit={submit} className="p-2" style={{ borderBottom: '1px solid var(--g-border)', backgroundColor: 'var(--g-bg-tertiary)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </select>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                    <option value="Cuti">Cuti</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Sakit">Sakit</option>
                                </select>
                                <input type="text" placeholder="Reason (optional)" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--g-text-muted)' }}>Start Date</label>
                                    <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--g-text-muted)' }}>End Date</label>
                                    <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div className="flex items-end">
                                    <button type="submit" className="w-full px-3 py-1.5 bg-[#E84C30] text-white rounded-lg text-xs font-bold hover:bg-[#D4432A] transition">Save</button>
                                </div>
                            </div>
                        </form>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--g-border)' }}>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Employee</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Type</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Period</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Duration</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Reason</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Status</th>
                                    <th className="px-4 py-2 text-[10px] font-normal uppercase tracking-widest text-right" style={{ color: 'var(--g-text-muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveRequests.map(lr => (
                                    <tr key={lr.id} className="hover:opacity-80 transition" style={{ borderBottom: '1px solid var(--g-border)' }}>
                                        <td className="px-4 py-2 font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{lr.employee?.name || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${typeBadge(lr.type)}`}>{lr.type}</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                                            {lr.start_date ? new Date(lr.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                            {' — '}
                                            {lr.end_date ? new Date(lr.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-sm font-bold" style={{ color: 'var(--g-text-secondary)' }}>{daysBetween(lr.start_date, lr.end_date)}</td>
                                        <td className="px-4 py-2 text-sm max-w-[200px] truncate" style={{ color: 'var(--g-text-tertiary)' }}>{lr.reason || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusBadge(lr.status)}`}>{lr.status}</span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                {lr.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => router.post(route('admin.leave-requests.approve', lr.id))} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition">Approve</button>
                                                        <button onClick={() => router.post(route('admin.leave-requests.reject', lr.id))} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold hover:bg-red-500/20 transition">Reject</button>
                                                    </>
                                                )}
                                                {lr.status !== 'pending' && (
                                                    <span className="text-[10px] font-bold" style={{ color: 'var(--g-text-muted)' }}>
                                                        by {lr.approver?.name || '-'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {leaveRequests.length === 0 && (
                                    <tr><td colSpan="7" className="px-3 py-6 text-center text-sm" style={{ color: 'var(--g-text-muted)' }}>No leave requests yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

