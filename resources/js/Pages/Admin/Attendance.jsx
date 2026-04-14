import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, Link } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function Attendance({ auth, employees, shifts, attendances, insights, leaderboard, history, settings }) {
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showAbsentModal, setShowAbsentModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState('today'); // 'today', 'leaderboard', 'history', 'calendar'

    const { data, setData, post, processing, reset, errors } = useForm({
        employee_id: '',
        shift_id: '',
    });

    const absentForm = useForm({
        employee_id: '',
        type: 'alpha',
        notes: '',
    });

    const openCheckIn = (emp) => {
        setSelectedEmployee(emp);
        setData('employee_id', emp.id);
        setShowCheckInModal(true);
    };

    const openAbsentModal = (emp) => {
        setSelectedEmployee(emp);
        absentForm.setData({ employee_id: emp.id, type: 'alpha', notes: '' });
        setShowAbsentModal(true);
    };

    const submitCheckIn = (e) => {
        e.preventDefault();
        post(route('admin.attendance.checkin'), {
            onSuccess: () => { setShowCheckInModal(false); reset(); }
        });
    };

    const submitAbsent = (e) => {
        e.preventDefault();
        absentForm.post(route('admin.attendance.mark-absent'), {
            onSuccess: () => { setShowAbsentModal(false); absentForm.reset(); }
        });
    };

    const handleCheckOut = (empId) => {
        if (confirm('Konfirmasi Check Out?')) {
            router.post(route('admin.attendance.checkout'), { employee_id: empId });
        }
    };

    const getAttendance = (empId) => attendances.find(a => a.employee_id === empId);

    const statusStyles = {
        present: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        late: 'bg-red-500/10 text-red-400 border-red-500/20',
        absent: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        leave: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };

    const absenceTypeLabels = {
        alpha: 'Alpha', sick: 'Sakit', leave: 'Cuti', permit: 'Izin'
    };

    const absenceTypeBadges = {
        alpha: 'bg-red-500/10 text-red-400 border-red-500/20',
        sick: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        leave: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        permit: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };

    const fmtTime = (time) => time ? time.substring(0, 5) : '--:--';

    return (
        <AdminLayout title="Absensi Pegawai">
            <Head title="Absensi" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight text-white">Attendance Management</h1>
                        <p className="text-sm mt-1 text-white/40">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-semibold uppercase tracking-widest bg-white/5 text-white/60">
                            Grace Time: {settings?.grace_time_minutes || 0} Min
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-semibold uppercase tracking-widest bg-white/5 text-white/60">
                            Geofence: {settings?.geofence_radius_meters || 0}m
                        </div>
                    </div>
                </div>

                {/* Insights Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">Today Present</div>
                        <div className="flex items-end justify-between">
                            <div className="text-2xl font-semibold text-white">{insights?.present_today || 0}</div>
                            <div className="text-[10px] font-semibold text-white/20">of {insights?.total_employees || 0} staff</div>
                        </div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-red-400/60 mb-1">Late Today</div>
                        <div className="text-2xl font-semibold text-red-400">{insights?.late_today || 0}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/60 mb-1">Absent Today</div>
                        <div className="text-2xl font-semibold text-amber-400">{insights?.absent_today || 0}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/60 mb-1">On-Time Rate</div>
                        <div className="text-2xl font-semibold text-emerald-400">{insights?.on_time_rate || 0}%</div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/60 mb-1">Total Hours Today</div>
                        <div className="text-2xl font-semibold text-blue-400">{insights?.total_hours_today || 0}<span className="text-sm ml-1 opacity-40">hrs</span></div>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="flex border-b border-white/5 gap-4">
                    {['today', 'leaderboard', 'history'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-xs font-semibold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-[#E84C30]' : 'text-white/20 hover:text-white/40'}`}
                        >
                            {tab === 'today' ? 'Hari Ini' : tab === 'leaderboard' ? 'Leaderboard' : 'Riwayat'}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E84C30]"></div>}
                        </button>
                    ))}
                </div>

                {/* Content Section */}
                {activeTab === 'today' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {employees.map(emp => {
                            const att = getAttendance(emp.id);
                            return (
                                <div key={emp.id} className="rounded-lg border border-white/5 p-4 space-y-4 transition-all hover:border-[#E84C30]/30 bg-white/[0.02]">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#E84C30]/10 text-[#E84C30] flex items-center justify-center font-semibold text-sm uppercase overflow-hidden border border-[#E84C30]/20">
                                                {emp.photo_path ? (
                                                    <img src={`/storage/${emp.photo_path}`} className="w-full h-full object-cover" />
                                                ) : emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-white">{emp.name}</h3>
                                                <p className="text-[10px] uppercase font-black opacity-40 text-white/60">{emp.position?.name || 'Staff'}</p>
                                            </div>
                                        </div>
                                        {att && (
                                            att.is_absent ? (
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase border ${absenceTypeBadges[att.absence_type] || absenceTypeBadges.alpha}`}>
                                                    {absenceTypeLabels[att.absence_type] || att.absence_type}
                                                </span>
                                            ) : (
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase border ${statusStyles[att.status]}`}>
                                                    {att.status}
                                                </span>
                                            )
                                        )}
                                    </div>

                                    <div className="p-3 rounded-lg space-y-2 bg-black/20 border border-white/5">
                                        <div className="flex justify-between items-center text-[10px] font-semibold uppercase opacity-40">
                                            <span>Shift</span>
                                            <span>Time</span>
                                        </div>
                                        <div className="flex justify-between items-center font-mono">
                                            <span className="text-xs text-white/60">{att?.shift?.name || '—'}</span>
                                            <div className="flex gap-2 text-sm text-white/80">
                                                <span>{fmtTime(att?.check_in)}</span>
                                                <span className="opacity-20">→</span>
                                                <span>{fmtTime(att?.check_out)}</span>
                                            </div>
                                        </div>
                                        {/* Work Hours */}
                                        {att?.check_out && att.work_hours > 0 && (
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-white/30">Jam Kerja</span>
                                                <span className="font-mono text-blue-400 font-semibold">{att.work_hours} jam</span>
                                            </div>
                                        )}
                                        {att?.late_minutes > 0 && (
                                            <div className="text-[10px] text-red-400 font-semibold uppercase tracking-tighter text-right">
                                                Terlambat {att.late_minutes} Menit
                                            </div>
                                        )}
                                        {/* GPS Indicator */}
                                        {att?.check_in_latitude && (
                                            <div className="text-[9px] text-emerald-500/50 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                                GPS Verified
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {!att && (
                                            <>
                                                <button onClick={() => openCheckIn(emp)} className="flex-1 py-2 bg-[#E84C30] text-white font-semibold rounded-lg text-xs hover:bg-[#D4432A] transition-all shadow-lg shadow-[#E84C30]/10">
                                                    Check In
                                                </button>
                                                <button onClick={() => openAbsentModal(emp)} className="py-2 px-3 bg-white/5 text-white/40 border border-white/10 font-semibold rounded-lg text-xs hover:bg-white/10 hover:text-white transition-all" title="Tandai Absen">
                                                    ✗
                                                </button>
                                            </>
                                        )}
                                        {att && !att.is_absent && !att.check_out && (
                                            <button onClick={() => handleCheckOut(emp.id)} className="flex-1 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold rounded-lg text-xs hover:bg-amber-500/20 transition-all">
                                                Check Out
                                            </button>
                                        )}
                                        {att?.check_out && !att.is_absent && (
                                            <div className="flex-1 py-2 bg-emerald-500/5 text-emerald-500/40 text-xs font-semibold text-center border border-emerald-500/10 rounded-lg">
                                                ✓ {att.work_hours}h
                                            </div>
                                        )}
                                        {att?.is_absent && (
                                            <div className={`flex-1 py-2 text-xs font-semibold text-center rounded-lg border ${absenceTypeBadges[att.absence_type] || 'bg-red-500/5 text-red-500/40 border-red-500/10'}`}>
                                                {absenceTypeLabels[att.absence_type] || 'Absent'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="text-center space-y-1 mb-8">
                            <h2 className="text-xl font-semibold text-white uppercase tracking-widest">Punctuality Leaderboard</h2>
                            <p className="text-xs text-white/30 uppercase tracking-widest">Top Performers This Month</p>
                        </div>
                        {leaderboard.map((item, index) => (
                            <div key={item.employee_id} className="flex items-center gap-4 p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-[#E84C30]/20 transition-all">
                                <div className="text-2xl font-black text-white/10 w-8">#{index + 1}</div>
                                <div className="w-12 h-12 rounded-full bg-[#E84C30]/10 text-[#E84C30] flex items-center justify-center font-semibold overflow-hidden border border-[#E84C30]/20">
                                    {item.employee?.photo_path ? (
                                        <img src={`/storage/${item.employee.photo_path}`} className="w-full h-full object-cover" />
                                    ) : item.employee?.name?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white">{item.employee?.name}</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-semibold tracking-widest">{item.total_present} Hadir • {item.total_hours || 0} Jam</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-semibold text-emerald-400">{item.on_time_percentage}%</div>
                                    <div className="text-[9px] text-white/20 uppercase font-semibold">On-Time Rate</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="rounded-lg border border-white/5 overflow-hidden bg-white/[0.02]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-black/20">
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30">Date</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30">Employee</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">In</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">Out</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">Hours</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">Status</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">GPS</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-right">Lateness</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history?.data?.map(row => (
                                    <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 text-xs font-mono text-white/60">{new Date(row.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[#E84C30]/10 text-[#E84C30] flex items-center justify-center text-[10px] font-semibold">
                                                    {row.employee?.name?.charAt(0)}
                                                </div>
                                                <span className="text-xs font-semibold text-white/80">{row.employee?.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-xs font-mono text-white/40">{fmtTime(row.check_in)}</td>
                                        <td className="p-4 text-center text-xs font-mono text-white/40">{fmtTime(row.check_out)}</td>
                                        <td className="p-4 text-center text-xs font-mono text-blue-400">{row.work_hours > 0 ? `${row.work_hours}h` : '—'}</td>
                                        <td className="p-4 text-center">
                                            {row.is_absent ? (
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-semibold uppercase border ${absenceTypeBadges[row.absence_type] || absenceTypeBadges.alpha}`}>
                                                    {absenceTypeLabels[row.absence_type] || row.absence_type}
                                                </span>
                                            ) : (
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-semibold uppercase border ${statusStyles[row.status]}`}>
                                                    {row.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {row.check_in_latitude ? (
                                                <span className="text-[9px] text-emerald-500/60">📍</span>
                                            ) : (
                                                <span className="text-[9px] text-white/10">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-xs font-semibold text-red-400/60">
                                            {row.late_minutes > 0 ? `${row.late_minutes}m` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Links */}
                        {history?.links && (
                            <div className="p-4 flex justify-between items-center bg-black/10 border-t border-white/5">
                                <div className="text-[10px] font-semibold uppercase text-white/20">
                                    Showing {history.from} to {history.to} of {history.total} records
                                </div>
                                <div className="flex gap-1">
                                    {history.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url || '#'}
                                            className={`px-3 py-1 rounded text-[10px] font-semibold transition-all ${link.active ? 'bg-[#E84C30] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'} ${!link.url ? 'opacity-20 cursor-default' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Check In Modal */}
            <Modal show={showCheckInModal} onClose={() => setShowCheckInModal(false)} maxWidth="sm">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border border-white/10">
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5 border-b border-white/5">
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight text-white">Confirm Check In</h3>
                            <p className="text-[9px] text-white/30 font-semibold uppercase tracking-[0.1em]">{selectedEmployee?.name}</p>
                        </div>
                        <button onClick={() => setShowCheckInModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submitCheckIn} className="p-4 space-y-6 text-left">
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-3 opacity-60 text-white">Pilih Shift Kerja</label>
                            <div className="grid grid-cols-1 gap-2">
                                {shifts.map(shift => (
                                    <button
                                        key={shift.id}
                                        type="button"
                                        onClick={() => setData('shift_id', shift.id)}
                                        className={`p-3 rounded-lg border text-left transition-all group ${data.shift_id === shift.id ? 'bg-[#E84C30]/10 border-[#E84C30] text-white' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className={`text-xs font-semibold ${data.shift_id === shift.id ? 'text-[#E84C30]' : 'text-white/60'}`}>{shift.name}</span>
                                                {shift.break_duration_minutes > 0 && (
                                                    <span className="ml-2 text-[8px] text-white/20">({shift.break_duration_minutes}m break)</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-mono opacity-40">{shift.start_time?.substring(0, 5)} - {shift.end_time?.substring(0, 5)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {errors.shift_id && <div className="text-red-500 text-[10px] mt-2 font-semibold uppercase">{errors.shift_id}</div>}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button type="button" onClick={() => setShowCheckInModal(false)} className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-white/40 font-semibold hover:bg-white/5 transition text-sm">Cancel</button>
                            <button type="submit" disabled={processing || !data.shift_id} className="flex-[2] px-4 py-3 bg-[#E84C30] text-white font-semibold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-sm uppercase tracking-widest disabled:opacity-30">
                                {processing ? 'Processing...' : 'Confirm Check In'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Mark Absent Modal */}
            <Modal show={showAbsentModal} onClose={() => setShowAbsentModal(false)} maxWidth="sm">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border border-white/10">
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5 border-b border-white/5">
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight text-white">Tandai Absen</h3>
                            <p className="text-[9px] text-white/30 font-semibold uppercase tracking-[0.1em]">{selectedEmployee?.name}</p>
                        </div>
                        <button onClick={() => setShowAbsentModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submitAbsent} className="p-4 space-y-5 text-left">
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2 opacity-60 text-white">Jenis Ketidakhadiran</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(absenceTypeLabels).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => absentForm.setData('type', key)}
                                        className={`p-3 rounded-lg border text-center text-xs font-semibold transition-all ${absentForm.data.type === key ? `${absenceTypeBadges[key]} border-opacity-100` : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 opacity-60 text-white">Catatan (Opsional)</label>
                            <textarea
                                value={absentForm.data.notes}
                                onChange={e => absentForm.setData('notes', e.target.value)}
                                className="w-full text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all resize-none"
                                style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                rows={2}
                                placeholder="No. surat dokter, dll..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button type="button" onClick={() => setShowAbsentModal(false)} className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-white/40 font-semibold hover:bg-white/5 transition text-sm">Cancel</button>
                            <button type="submit" disabled={absentForm.processing} className="flex-[2] px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all text-sm uppercase tracking-widest disabled:opacity-30">
                                {absentForm.processing ? 'Menyimpan...' : 'Tandai Absen'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}

