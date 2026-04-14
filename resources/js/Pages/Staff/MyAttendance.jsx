import React, { useState } from 'react';
import StaffLayout from '@/Layouts/StaffLayout';
import { router, usePage, useForm } from '@inertiajs/react';

const statusColors = {
    present: 'bg-emerald-100 text-emerald-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
    sick: 'bg-blue-100 text-blue-700',
    leave: 'bg-purple-100 text-purple-700',
    permit: 'bg-indigo-100 text-indigo-700',
    alpha: 'bg-red-200 text-red-800',
};

const statusLabels = {
    present: 'Hadir', late: 'Terlambat', absent: 'Absent',
    sick: 'Sakit', leave: 'Cuti', permit: 'Izin', alpha: 'Alpha'
};

export default function MyAttendance() {
    const { employee, todayAttendance, todaySchedule, monthlyReport, corrections, month, year } = usePage().props;
    const [showCorrectionForm, setShowCorrectionForm] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);

    const form = useForm({
        attendance_id: '',
        requested_check_in: '',
        requested_check_out: '',
        reason: '',
    });

    if (!employee) {
        return (
            <StaffLayout title="Absensi Saya">
                <div className="p-6 text-center text-gray-500">
                    <p>Akun belum terhubung dengan data karyawan.</p>
                </div>
            </StaffLayout>
        );
    }

    const handleClockIn = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    router.post(route('staff.attendance.clock-in'), {
                        shift_id: todaySchedule?.shift_id,
                        latitude: pos.coords.latitude, longitude: pos.coords.longitude,
                    });
                },
                () => router.post(route('staff.attendance.clock-in'), { shift_id: todaySchedule?.shift_id })
            );
        } else {
            router.post(route('staff.attendance.clock-in'), { shift_id: todaySchedule?.shift_id });
        }
    };

    const handleClockOut = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => router.post(route('staff.attendance.clock-out'), { latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => router.post(route('staff.attendance.clock-out'), {})
            );
        } else {
            router.post(route('staff.attendance.clock-out'), {});
        }
    };

    const openCorrectionForm = (att) => {
        setSelectedAttendance(att);
        form.setData({
            attendance_id: att.id,
            requested_check_in: att.check_in?.substr(0, 5) || '',
            requested_check_out: att.check_out?.substr(0, 5) || '',
            reason: '',
        });
        setShowCorrectionForm(true);
    };

    const submitCorrection = (e) => {
        e.preventDefault();
        form.post(route('staff.attendance.correction'), {
            onSuccess: () => { setShowCorrectionForm(false); form.reset(); }
        });
    };

    const isCheckedIn = todayAttendance && !todayAttendance.check_out;

    const navigateMonth = (dir) => {
        let newMonth = month + dir;
        let newYear = year;
        if (newMonth < 1) { newMonth = 12; newYear--; }
        if (newMonth > 12) { newMonth = 1; newYear++; }
        router.get(route('staff.attendance'), { month: newMonth, year: newYear }, { preserveState: true });
    };

    const daysInMonth = new Date(year, month, 0).getDate();
    const attendanceMap = {};
    (monthlyReport?.attendances || []).forEach(a => {
        const day = new Date(a.date).getDate();
        attendanceMap[day] = a;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    return (
        <StaffLayout title="Absensi Saya">
            <div className="p-4 space-y-4">
                {/* Big Clock Button */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white text-center shadow-lg">
                    <div className="text-3xl font-bold mb-1" id="live-clock">
                        {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {todaySchedule && (
                        <p className="text-blue-200 text-xs mb-4">
                            Shift: {todaySchedule.shift?.name} ({todaySchedule.shift?.start_time?.substr(0, 5)} - {todaySchedule.shift?.end_time?.substr(0, 5)})
                        </p>
                    )}
                    {!todayAttendance ? (
                        <button onClick={handleClockIn} disabled={!todaySchedule}
                            className="w-full py-4 bg-white text-blue-600 font-bold rounded-xl text-lg shadow hover:bg-blue-50 transition-all active:scale-[0.97] disabled:opacity-50">
                            ⏰ CLOCK IN
                        </button>
                    ) : isCheckedIn ? (
                        <div>
                            <p className="text-green-200 text-sm mb-3">✅ Check-in: {todayAttendance.check_in?.substr(0, 5)}
                                {todayAttendance.status === 'late' && <span className="ml-1 text-yellow-300">({todayAttendance.late_minutes} min late)</span>}
                            </p>
                            <button onClick={handleClockOut}
                                className="w-full py-4 bg-white/20 text-white font-bold rounded-xl text-lg border border-white/30 hover:bg-white/30 transition-all active:scale-[0.97]">
                                🏁 CLOCK OUT
                            </button>
                        </div>
                    ) : (
                        <p className="text-green-200">
                            ✅ {todayAttendance.check_in?.substr(0, 5)} - {todayAttendance.check_out?.substr(0, 5)}
                            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">{todayAttendance.work_hours} jam</span>
                        </p>
                    )}
                </div>

                {/* Monthly Calendar */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => navigateMonth(-1)} className="text-gray-400 hover:text-gray-700 p-1">←</button>
                        <h3 className="text-sm font-semibold text-gray-700">{monthNames[month - 1]} {year}</h3>
                        <button onClick={() => navigateMonth(1)} className="text-gray-400 hover:text-gray-700 p-1">→</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                            <div key={d} className="text-gray-400 font-medium py-1">{d}</div>
                        ))}
                        {/* Offset for first day */}
                        {(() => {
                            const firstDay = new Date(year, month - 1, 1).getDay();
                            const offset = firstDay === 0 ? 6 : firstDay - 1;
                            return Array(offset).fill(null).map((_, i) => <div key={`e-${i}`} />);
                        })()}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const att = attendanceMap[day];
                            let bgColor = 'bg-gray-50';
                            if (att) {
                                if (att.is_absent) {
                                    bgColor = statusColors[att.absence_type] || 'bg-red-100';
                                } else {
                                    bgColor = att.status === 'late' ? 'bg-amber-100' : 'bg-emerald-100';
                                }
                            }
                            return (
                                <div key={day} className={`py-1.5 rounded-md ${bgColor} text-gray-700 font-medium cursor-pointer hover:ring-1 hover:ring-blue-300`}
                                    onClick={() => att && openCorrectionForm(att)}>
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-3 text-[9px]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-100" /> Hadir</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-100" /> Terlambat</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-100" /> Alpha</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-100" /> Sakit</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-100" /> Cuti</span>
                    </div>
                    {/* Summary */}
                    {monthlyReport?.summary && (
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                            <div className="bg-emerald-50 rounded p-1.5">
                                <span className="font-bold text-emerald-700">{monthlyReport.summary.present_days}</span> Hadir
                            </div>
                            <div className="bg-amber-50 rounded p-1.5">
                                <span className="font-bold text-amber-700">{monthlyReport.summary.late_days}</span> Telat
                            </div>
                            <div className="bg-gray-50 rounded p-1.5">
                                <span className="font-bold text-gray-700">{monthlyReport.summary.total_work_hours}</span> Jam
                            </div>
                        </div>
                    )}
                </div>

                {/* Correction History */}
                {corrections?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">📝 Riwayat Koreksi</h3>
                        <div className="space-y-2">
                            {corrections.map(c => (
                                <div key={c.id} className="flex justify-between items-center text-xs border-b pb-2">
                                    <div>
                                        <p className="text-gray-700">{c.reason?.substr(0, 50)}</p>
                                        <p className="text-gray-400 text-[10px]">
                                            {c.requested_check_in} → {c.requested_check_out}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>{c.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Correction Form Modal */}
                {showCorrectionForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800">Koreksi Absensi</h3>
                                <button onClick={() => setShowCorrectionForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <form onSubmit={submitCorrection} className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500">Check-in</label>
                                    <input type="time" value={form.data.requested_check_in}
                                        onChange={e => form.setData('requested_check_in', e.target.value)}
                                        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Check-out</label>
                                    <input type="time" value={form.data.requested_check_out}
                                        onChange={e => form.setData('requested_check_out', e.target.value)}
                                        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Alasan (min. 10 karakter)</label>
                                    <textarea value={form.data.reason}
                                        onChange={e => form.setData('reason', e.target.value)}
                                        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" rows={3}
                                        placeholder="Jelaskan alasan koreksi..." />
                                    {form.errors.reason && <p className="text-red-500 text-xs mt-1">{form.errors.reason}</p>}
                                </div>
                                <button type="submit" disabled={form.processing}
                                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50">
                                    {form.processing ? 'Mengirim...' : 'Ajukan Koreksi'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </StaffLayout>
    );
}
