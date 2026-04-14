import React, { useState } from 'react';
import StaffLayout from '@/Layouts/StaffLayout';
import { router, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { employee, todayAttendance, todaySchedule, monthlyStats, latestPayslip, pendingRequests } = usePage().props;

    if (!employee) {
        return (
            <StaffLayout title="Dashboard">
                <div className="p-6 text-center text-gray-500">
                    <p className="text-4xl mb-3">🔒</p>
                    <p>Akun Anda belum terhubung dengan data karyawan.</p>
                    <p className="text-sm">Hubungi admin untuk mengaktifkan akses.</p>
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
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    });
                },
                () => {
                    router.post(route('staff.attendance.clock-in'), {
                        shift_id: todaySchedule?.shift_id,
                    });
                }
            );
        } else {
            router.post(route('staff.attendance.clock-in'), {
                shift_id: todaySchedule?.shift_id,
            });
        }
    };

    const handleClockOut = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    router.post(route('staff.attendance.clock-out'), {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    });
                },
                () => {
                    router.post(route('staff.attendance.clock-out'), {});
                }
            );
        } else {
            router.post(route('staff.attendance.clock-out'), {});
        }
    };

    const isCheckedIn = todayAttendance && !todayAttendance.check_out;
    const isCheckedOut = todayAttendance && todayAttendance.check_out;

    // Real-time clock for UI
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

    return (
        <StaffLayout title="Dashboard">
            <div className="p-4 space-y-6">
                {/* Real-time Clock & Welcome */}
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="text-4xl font-black tracking-tighter text-white mb-1">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E84C30] mb-4">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="w-16 h-1 bg-[#E84C30] rounded-full opacity-20"></div>
                </div>

                {/* Main Action Card */}
                <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E84C30] blur-[80px] opacity-10 -mr-16 -mt-16 group-hover:opacity-20 transition-opacity"></div>
                    
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#E84C30] blur-md opacity-20 animate-pulse"></div>
                            <div className="w-14 h-14 rounded-2xl bg-[#E84C30] flex items-center justify-center text-xl font-black relative z-10">
                                {employee.photo_path
                                    ? <img src={`/storage/${employee.photo_path}`} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                                    : employee.name?.[0]
                                }
                            </div>
                        </div>
                        <div>
                            <h2 className="font-black text-lg tracking-tight text-white">{employee.name}</h2>
                            <p className="text-[#E84C30] text-[10px] font-bold uppercase tracking-widest">{employee.position?.name || 'Staff'}</p>
                        </div>
                    </div>

                    {/* Attendance Controls */}
                    {todaySchedule ? (
                        <div className="space-y-4 relative z-10">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Shift Hari Ini</span>
                                    <span className="text-[9px] font-black text-[#E84C30] uppercase tracking-widest bg-[#E84C30]/10 px-2 py-0.5 rounded-full border border-[#E84C30]/20">
                                        {todaySchedule.shift?.name}
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-white/80 tracking-tight">
                                    {todaySchedule.shift?.start_time?.substr(0, 5)} — {todaySchedule.shift?.end_time?.substr(0, 5)}
                                </div>
                            </div>

                            {!todayAttendance ? (
                                <button 
                                    onClick={handleClockIn}
                                    className="w-full py-4 bg-[#E84C30] text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#E84C30]/20 hover:bg-[#D4432A] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Clock In
                                </button>
                            ) : isCheckedIn ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Aktif sejak {todayAttendance.check_in?.substr(0, 5)}</div>
                                    </div>
                                    <button 
                                        onClick={handleClockOut}
                                        className="w-full py-4 bg-white/5 text-white/80 border border-white/10 font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                        Clock Out
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Selesai Kerja</div>
                                        <div className="text-sm font-bold text-white/80">Total: {todayAttendance.work_hours} Jam</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center">
                            <p className="text-white/30 text-xs font-bold uppercase tracking-widest italic">Tidak ada jadwal hari ini</p>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Hadir', value: monthlyStats?.present_days || 0, color: 'text-white' },
                        { label: 'Telat', value: monthlyStats?.late_days || 0, color: 'text-[#E84C30]' },
                        { label: 'Jam', value: monthlyStats?.total_hours || 0, color: 'text-emerald-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#1A1A1A] rounded-2xl p-3 border border-white/5 text-center shadow-xl">
                            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Latest Payslip Summary */}
                {latestPayslip && (
                    <Link 
                        href={route('staff.payslips')}
                        className="block bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-xl hover:bg-white/[0.03] transition-all group"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1 group-hover:text-[#E84C30] transition-colors">Gaji Terakhir</h3>
                                <p className="text-lg font-black text-white tracking-tight">{formatCurrency(latestPayslip.net_salary)}</p>
                                <p className="text-[9px] font-bold text-white/30 mt-0.5 uppercase tracking-tighter">
                                    Periode {String(latestPayslip.month).padStart(2, '0')}/{latestPayslip.year}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:bg-[#E84C30] transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Pending Alerts */}
                {(pendingRequests?.leave > 0 || pendingRequests?.correction > 0 || pendingRequests?.swap > 0) && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Permintaan Tertunda</h3>
                        </div>
                        <div className="space-y-1.5">
                            {pendingRequests.leave > 0 && <div className="text-xs font-bold text-white/60">• {pendingRequests.leave} Pengajuan Cuti</div>}
                            {pendingRequests.correction > 0 && <div className="text-xs font-bold text-white/60">• {pendingRequests.correction} Koreksi Absensi</div>}
                            {pendingRequests.swap > 0 && <div className="text-xs font-bold text-white/60">• {pendingRequests.swap} Tukar Shift</div>}
                        </div>
                    </div>
                )}
            </div>
        </StaffLayout>
    );
}
