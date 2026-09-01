import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function ShiftManagement({ auth, schedules, employees, shifts, swaps, currentDate, startOfWeek, currentUserEmployeeId }) {
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(currentDate);
    
    // Get shift_id from URL if exists
    const urlParams = new URLSearchParams(window.location.search);
    const [selectedShift, setSelectedShift] = useState(urlParams.get('shift_id') || '');

    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });

    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const scheduleForm = useForm({
        employee_id: '',
        shift_id: '',
        date: currentDate,
        role_note: ''
    });

    const swapForm = useForm({
        requester_schedule_id: '',
        recipient_schedule_id: '',
        reason: ''
    });

    const weekDays = useMemo(() => {
        const days = [];
        let curr = new Date(startOfWeek);
        for (let i = 0; i < 7; i++) {
            days.push(new Date(curr).toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        return days;
    }, [startOfWeek]);

    const getSchedule = (empId, date) => {
        return schedules.find(s => s.employee_id === empId && s.date === date);
    };

    const handleAddSchedule = (empId, date) => {
        scheduleForm.clearErrors();
        scheduleForm.setData({
            employee_id: empId,
            shift_id: '',
            date: date,
            role_note: ''
        });
        setShowScheduleModal(true);
    };

    const submitSchedule = (e) => {
        e.preventDefault();
        scheduleForm.post(route('admin.shift-management.schedule.store'), {
            onSuccess: () => {
                setShowScheduleModal(false);
                scheduleForm.reset();
            },
            preserveScroll: true
        });
    };

    const handleEditSchedule = (sched) => {
        scheduleForm.clearErrors();
        scheduleForm.setData({
            employee_id: sched.employee_id,
            shift_id: sched.shift_id,
            date: sched.date,
            role_note: sched.role_note || ''
        });
        setShowScheduleModal(true);
    };

    const handleSwapRequest = (schedId) => {
        swapForm.setData('requester_schedule_id', schedId);
        setShowSwapModal(true);
    };

    const submitSwap = (e) => {
        e.preventDefault();
        swapForm.post(route('admin.shift-management.swap.request'), {
            onSuccess: () => {
                setShowSwapModal(false);
                swapForm.reset();
            }
        });
    };

    const handleApproveSwap = (id) => {
        setConfirmModal({
            show: true,
            title: 'Setujui Tukar Shift',
            message: 'Apakah Anda yakin ingin menyetujui dan mengeksekusi pertukaran shift ini?',
            type: 'primary',
            onConfirm: () => {
                router.post(route('admin.shift-management.swap.approve', id), {}, {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const handleAcceptSwap = (id) => {
        setConfirmModal({
            show: true,
            title: 'Terima Tawaran Tukar',
            message: 'Apakah Anda bersedia bertukar shift dengan rekan Anda? Jika setuju, permintaan ini akan diteruskan ke Manager untuk persetujuan akhir.',
            type: 'primary',
            onConfirm: () => {
                router.post(route('admin.shift-management.swap.accept', id), {}, {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const handleRejectByRecipient = (id) => {
        setConfirmModal({
            show: true,
            title: 'Tolak Tawaran Tukar',
            message: 'Apakah Anda ingin menolak tawaran tukar shift ini?',
            type: 'danger',
            onConfirm: () => {
                router.post(route('admin.shift-management.swap.reject-recipient', id), {}, {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const handleRejectSwap = (id) => {
        setConfirmModal({
            show: true,
            title: 'Tolak Tukar Shift',
            message: 'Apakah Anda yakin ingin menolak permohonan pertukaran shift ini?',
            type: 'danger',
            onConfirm: () => {
                router.post(route('admin.shift-management.swap.reject', id), {}, {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const handleGenerate = (type) => {
        const messages = {
            'copy_last_week': 'Salin semua jadwal dari pekan lalu ke pekan ini? Data yang sudah ada di pekan ini tidak akan terhapus kecuali ditimpa.',
            'generate_fresh': 'Generate jadwal baru secara otomatis? Sistem akan mendistribusikan pegawai aktif ke shift yang tersedia. Jadwal pekan ini yang sudah ada akan dihapus.',
            'clear_week': 'Apakah Anda yakin ingin menghapus SEMUA jadwal pada pekan ini?'
        };

        setConfirmModal({
            show: true,
            title: type === 'clear_week' ? 'Kosongkan Jadwal' : (type === 'generate_fresh' ? 'Generate Jadwal Baru' : 'Salin Jadwal'),
            message: messages[type],
            type: type === 'clear_week' ? 'danger' : 'primary',
            onConfirm: () => {
                router.post(route('admin.shift-management.schedule.generate'), {
                    target_date: selectedDate,
                    type: type
                }, {
                    preserveScroll: true,
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const handleDeleteSchedule = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Jadwal',
            message: 'Apakah Anda yakin ingin menghapus jadwal kerja ini?',
            type: 'danger',
            onConfirm: () => {
                router.delete(route('admin.shift-management.schedule.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    return (
        <AdminLayout title="Shift Management">
            <Head title="Shift Scheduling" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Penjadwalan Shift</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Atur jadwal mingguan dan kelola pertukaran shift pegawai</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                            <button 
                                onClick={() => handleGenerate('generate_fresh')}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 transition-all border-r border-white/5"
                                title="Buat jadwal otomatis untuk pekan ini"
                            >
                                Generate Baru
                            </button>
                            <button 
                                onClick={() => handleGenerate('copy_last_week')}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 transition-all border-r border-white/5"
                                title="Salin jadwal dari pekan sebelumnya"
                            >
                                Salin Pekan Lalu
                            </button>
                            <button 
                                onClick={() => handleGenerate('clear_week')}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all"
                                title="Hapus semua jadwal di pekan ini"
                            >
                                Kosongkan
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                className="rounded-lg px-3 py-1.5 text-xs font-bold outline-none border transition-all [color-scheme:dark]"
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-border)', color: 'var(--g-text-primary)' }}
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    router.get(route('admin.shift-management.index'), { date: e.target.value, shift_id: selectedShift }, { preserveState: true });
                                }}
                            />

                            <select
                                className="rounded-lg px-3 py-1.5 text-xs font-bold outline-none border transition-all cursor-pointer"
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-border)', color: 'var(--g-text-primary)' }}
                                value={selectedShift}
                                onChange={(e) => {
                                    setSelectedShift(e.target.value);
                                    router.get(route('admin.shift-management.index'), { date: selectedDate, shift_id: e.target.value }, { preserveState: true });
                                }}
                            >
                                <option value="">Semua Shift</option>
                                {shifts.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Swap Requests Banner */}
                {swaps.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Permohonan Tukar Shift</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {swaps.map(swap => {
                                const isRecipient = currentUserEmployeeId === swap.recipient_id;
                                const isRequester = currentUserEmployeeId === swap.requester_id;
                                const isAdmin = auth.user.roles.includes('owner') || auth.user.roles.includes('Admin');

                                return (
                                    <div key={swap.id} className="p-4 rounded-lg border flex flex-col gap-3" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'rgba(245,158,11,0.2)' }}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="text-left">
                                                    <div className="text-xs font-bold text-white">
                                                        {swap.requester.name} 
                                                        <span className="opacity-40 font-normal mx-2">↔</span> 
                                                        {swap.recipient.name}
                                                    </div>
                                                    <div className="text-[10px] text-white/40 mt-1 uppercase font-black tracking-tighter flex items-center gap-2">
                                                        <span>{swap.requester_schedule.shift.name} ({swap.requester_schedule.date})</span>
                                                        <span className="text-emerald-500">→</span>
                                                        <span>{swap.recipient_schedule.shift.name} ({swap.recipient_schedule.date})</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${swap.status === 'waiting_recipient' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {swap.status === 'waiting_recipient' ? 'Menunggu Rekan' : 'Menunggu Manager'}
                                            </div>
                                        </div>
                                        
                                        {swap.reason && <p className="text-[10px] italic opacity-60">" {swap.reason} "</p>}
                                        
                                        <div className="flex gap-2">
                                            {/* Recipient Actions */}
                                            {isRecipient && swap.status === 'waiting_recipient' && (
                                                <>
                                                    <button onClick={() => handleAcceptSwap(swap.id)} className="flex-1 py-1.5 bg-emerald-500 text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all">Terima</button>
                                                    <button onClick={() => handleRejectByRecipient(swap.id)} className="flex-1 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">Tolak</button>
                                                </>
                                            )}

                                            {/* Manager Actions */}
                                            {isAdmin && swap.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleApproveSwap(swap.id)} className="flex-1 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all">Approve</button>
                                                    <button onClick={() => handleRejectSwap(swap.id)} className="flex-1 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">Reject</button>
                                                </>
                                            )}

                                            {/* Status Messages */}
                                            {isRequester && swap.status === 'waiting_recipient' && (
                                                <div className="text-[10px] text-amber-500 italic">Menunggu persetujuan {swap.recipient.name}...</div>
                                            )}
                                            {isAdmin && swap.status === 'waiting_recipient' && (
                                                <div className="text-[10px] text-white/30 italic">Menunggu persetujuan dari {swap.recipient.name} sebelum dapat diproses.</div>
                                            )}
                                            {(isRequester || isRecipient) && swap.status === 'pending' && (
                                                <div className="text-[10px] text-blue-400 italic">Sudah disetujui rekan. Menunggu keputusan Manager.</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Weekly Grid */}
                <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-black/20 text-[10px] uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>
                                    <th className="px-4 py-3 font-bold border-r border-white/5 sticky left-0 z-10 bg-[#1A1A1A] w-48">Pegawai</th>
                                    {weekDays.map(date => {
                                        const d = new Date(date);
                                        const isToday = date === new Date().toISOString().split('T')[0];
                                        return (
                                            <th key={date} className={`px-4 py-3 font-bold text-center border-r border-white/5 ${isToday ? 'text-[#E84C30] bg-[#E84C30]/5' : ''}`}>
                                                <div>{d.toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                                                <div className="text-[10px] opacity-40">{d.getDate()} {d.toLocaleDateString('id-ID', { month: 'short' })}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: 'var(--g-border)' }}>
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-4 border-r border-white/5 sticky left-0 z-10 bg-[#1A1A1A] shadow-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full border-2 border-white/5 overflow-hidden bg-[#E84C30]/10 flex items-center justify-center text-xs font-black text-[#E84C30] shrink-0">
                                                    {emp.photo_path ? (
                                                        <img src={`/storage/${emp.photo_path}`} className="w-full h-full object-cover" alt="" />
                                                    ) : emp.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-white truncate text-xs">{emp.name}</div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'in_duty' ? 'bg-emerald-500' : 'bg-white/20'}`}></span>
                                                        <span className="text-[8px] uppercase font-black opacity-40 truncate" style={{ color: 'var(--g-text-muted)' }}>{emp.status.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {weekDays.map(date => {
                                            const sched = getSchedule(emp.id, date);
                                            return (
                                                <td key={date} className="px-2 py-2 border-r border-white/5 group relative min-w-[140px]">
                                                    {sched ? (
                                                        <div className="p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 relative cursor-pointer hover:bg-emerald-500/10 transition-all" onClick={() => handleEditSchedule(sched)}>
                                                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">{sched.shift.name}</div>
                                                            <div className="text-[9px] text-white/40 font-mono mt-0.5">
                                                                {sched.shift.start_time.substring(0, 5)} - {sched.shift.end_time.substring(0, 5)}
                                                            </div>
                                                            {sched.role_note && (
                                                                <div className="mt-1 text-[8px] font-bold text-white/30 uppercase px-1.5 py-0.5 rounded bg-white/5 inline-block">{sched.role_note}</div>
                                                            )}
                                                            
                                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-all" onClick={(e) => e.stopPropagation()}>
                                                                <button onClick={() => handleSwapRequest(sched.id)} title="Request Swap" className="p-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/40"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg></button>
                                                                <button onClick={() => handleDeleteSchedule(sched.id)} title="Remove" className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleAddSchedule(emp.id, date)}
                                                            className="w-full py-4 rounded-lg border border-dashed border-white/5 text-white/5 hover:border-[#E84C30]/20 hover:text-[#E84C30]/40 transition-all text-[10px] font-black uppercase tracking-widest"
                                                        >
                                                            + Set
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            <Modal show={showScheduleModal} onClose={() => setShowScheduleModal(false)} maxWidth="sm">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Atur Jadwal Kerja</h3>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">Assign shift to employee</p>
                        </div>
                        <button onClick={() => setShowScheduleModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submitSchedule} className="p-4 space-y-6 text-left">
                        <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                            <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Karyawan</div>
                            {(() => {
                                const emp = employees.find(e => e.id === scheduleForm.data.employee_id);
                                return (
                                    <>
                                        <div className="text-sm font-bold text-white">{emp?.name}</div>
                                        <div className="text-[10px] uppercase font-black text-emerald-500/60 mt-0.5">{emp?.position?.name || 'Staff'}</div>
                                    </>
                                );
                            })()}
                            <div className="text-[10px] font-mono text-[#E84C30] mt-2 pt-2 border-t border-white/5">{scheduleForm.data.date}</div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Pilih Shift</label>
                            <div className="grid grid-cols-1 gap-2">
                                {shifts.map(shift => (
                                    <button
                                        key={shift.id}
                                        type="button"
                                        onClick={() => scheduleForm.setData('shift_id', shift.id)}
                                        className={`p-3 rounded-lg border text-left transition-all ${scheduleForm.data.shift_id === shift.id ? 'bg-[#E84C30]/10 border-[#E84C30] text-white' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold">{shift.name}</span>
                                            <span className="text-[10px] font-mono opacity-60">{shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {scheduleForm.errors.shift_id && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-tighter">{scheduleForm.errors.shift_id}</div>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Penugasan Spesifik (Optional)</label>
                            <input 
                                type="text" 
                                className="w-full text-sm font-bold rounded-lg px-3 py-2 outline-none border transition-all" 
                                style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                value={scheduleForm.data.role_note}
                                onChange={e => scheduleForm.setData('role_note', e.target.value)}
                                placeholder="Contoh: Section Grill, Barista Utama, Kasir 1..."
                            />
                            <p className="text-[9px] mt-1 opacity-40 italic">Gunakan untuk membagi tugas spesifik atau area kerja pada shift ini.</p>
                            {scheduleForm.errors.role_note && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-tighter">{scheduleForm.errors.role_note}</div>}
                        </div>

                        <button type="submit" disabled={scheduleForm.processing || !scheduleForm.data.shift_id} className="w-full py-3 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-sm uppercase tracking-widest disabled:opacity-30">
                            Simpan Jadwal
                        </button>
                    </form>
                </div>
            </Modal>

            {/* Swap Modal */}
            <Modal show={showSwapModal} onClose={() => setShowSwapModal(false)} maxWidth="md">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Request Tukar Shift</h3>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">Swap request with another employee</p>
                        </div>
                        <button onClick={() => setShowSwapModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submitSwap} className="p-4 space-y-6 text-left">
                        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2">Shift Asli Anda</div>
                            {(() => {
                                const s = schedules.find(x => x.id === swapForm.data.requester_schedule_id);
                                return s ? (
                                    <div className="text-xs font-bold text-white">{s.employee.name} — {s.shift.name} ({s.date})</div>
                                ) : null;
                            })()}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Tukar Dengan Shift Siapa?</label>
                            <select 
                                value={swapForm.data.recipient_schedule_id} 
                                onChange={e => swapForm.setData('recipient_schedule_id', e.target.value)} 
                                className="w-full text-xs font-bold rounded-lg px-3 py-2 outline-none border cursor-pointer" 
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} 
                                required
                            >
                                <option value="">Pilih Jadwal Target...</option>
                                {(() => {
                                    const reqSched = schedules.find(s => s.id === swapForm.data.requester_schedule_id);
                                    if (!reqSched) return null;
                                    
                                    return schedules
                                        .filter(s => s.id !== swapForm.data.requester_schedule_id && s.employee?.position_id === reqSched.employee?.position_id)
                                        .map(s => (
                                            <option key={s.id} value={s.id}>{s.employee.name} — {s.shift.name} ({s.date})</option>
                                        ));
                                })()}
                            </select>
                            {swapForm.errors.recipient_schedule_id && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{swapForm.errors.recipient_schedule_id}</div>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Alasan Pertukaran</label>
                            <textarea 
                                value={swapForm.data.reason} 
                                onChange={e => swapForm.setData('reason', e.target.value)} 
                                className="w-full text-sm font-medium rounded-lg px-3 py-2 outline-none border min-h-[80px] transition-all resize-none" 
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} 
                                placeholder="Jelaskan alasan tukar shift..." 
                                required 
                            />
                        </div>

                        <button type="submit" disabled={swapForm.processing || !swapForm.data.recipient_schedule_id} className="w-full py-3 bg-amber-500 text-black font-black uppercase tracking-widest rounded-lg hover:bg-amber-600 transition-all text-sm">
                            Kirim Request Tukar
                        </button>
                    </form>
                </div>
            </Modal>

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

