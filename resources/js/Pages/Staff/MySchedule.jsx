import React, { useState } from 'react';
import StaffLayout from '@/Layouts/StaffLayout';
import { usePage, useForm } from '@inertiajs/react';

export default function MySchedule() {
    const { employee, schedules, swapRequests, leaveRequests, colleagues } = usePage().props;
    const [showSwapForm, setShowSwapForm] = useState(false);
    const [showLeaveForm, setShowLeaveForm] = useState(false);

    const swapForm = useForm({ recipient_id: '', requester_schedule_id: '', recipient_schedule_id: '', reason: '' });
    const leaveForm = useForm({ type: 'annual', start_date: '', end_date: '', reason: '' });

    if (!employee) {
        return <StaffLayout title="Jadwal Saya"><div className="p-6 text-center text-gray-500">Akun belum terhubung.</div></StaffLayout>;
    }

    const submitSwap = (e) => {
        e.preventDefault();
        swapForm.post(route('staff.schedule.swap'), { onSuccess: () => { setShowSwapForm(false); swapForm.reset(); } });
    };

    const submitLeave = (e) => {
        e.preventDefault();
        leaveForm.post(route('staff.schedule.leave'), { onSuccess: () => { setShowLeaveForm(false); leaveForm.reset(); } });
    };

    const groupedSchedules = {};
    (schedules || []).forEach(s => {
        const weekKey = new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (!groupedSchedules[weekKey]) groupedSchedules[weekKey] = [];
        groupedSchedules[weekKey].push(s);
    });

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return (
        <StaffLayout title="Jadwal Saya">
            <div className="p-4 space-y-4">
                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button onClick={() => setShowSwapForm(true)}
                        className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all">
                        🔄 Tukar Shift
                    </button>
                    <button onClick={() => setShowLeaveForm(true)}
                        className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all">
                        📅 Ajukan Cuti
                    </button>
                </div>

                {/* Schedule List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-700">📋 Jadwal 3 Minggu Ke Depan</h3>
                    {schedules?.length > 0 ? (
                        <div className="divide-y">
                            {schedules.map(s => (
                                <div key={s.id} className="px-4 py-3 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px]"
                                            style={{ backgroundColor: s.shift?.color || '#e2e8f0' }}>
                                            <span className="font-bold text-xs">{new Date(s.date).getDate()}</span>
                                            <span>{dayNames[new Date(s.date).getDay()]}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{s.shift?.name || 'Shift'}</p>
                                            <p className="text-xs text-gray-400">
                                                {s.shift?.start_time?.substr(0, 5)} - {s.shift?.end_time?.substr(0, 5)}
                                                {s.role_note && <span className="ml-1 text-blue-500">• {s.role_note}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => { swapForm.setData('requester_schedule_id', s.id); setShowSwapForm(true); }}
                                        className="text-xs text-blue-500 hover:underline">Tukar</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="px-4 pb-4 text-sm text-gray-400">Belum ada jadwal.</p>
                    )}
                </div>

                {/* Swap Requests */}
                {swapRequests?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">🔄 Riwayat Tukar Shift</h3>
                        <div className="space-y-2">
                            {swapRequests.map(sr => (
                                <div key={sr.id} className="text-xs border-b pb-2 flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-700">
                                            {sr.requester?.name} ↔ {sr.recipient?.name}
                                        </p>
                                        <p className="text-gray-400">{sr.reason?.substr(0, 40)}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${sr.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            sr.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>{sr.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Leave Requests */}
                {leaveRequests?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 Riwayat Cuti</h3>
                        <div className="space-y-2">
                            {leaveRequests.map(lr => (
                                <div key={lr.id} className="text-xs border-b pb-2 flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-700">{lr.type} — {lr.start_date} s/d {lr.end_date}</p>
                                        <p className="text-gray-400">{lr.reason?.substr(0, 40)}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${lr.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            lr.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>{lr.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Swap Form Modal */}
                {showSwapForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">Tukar Shift</h3>
                                <button onClick={() => setShowSwapForm(false)} className="text-gray-400">✕</button>
                            </div>
                            <form onSubmit={submitSwap} className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500">Tukar dengan</label>
                                    <select value={swapForm.data.recipient_id} onChange={e => swapForm.setData('recipient_id', e.target.value)}
                                        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm">
                                        <option value="">Pilih Rekan</option>
                                        {colleagues?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Jadwal saya yang ditukar</label>
                                    <select value={swapForm.data.requester_schedule_id} onChange={e => swapForm.setData('requester_schedule_id', e.target.value)}
                                        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm">
                                        <option value="">Pilih Jadwal</option>
                                        {schedules?.map(s => <option key={s.id} value={s.id}>{s.date} - {s.shift?.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Alasan</label>
                                    <textarea value={swapForm.data.reason} onChange={e => swapForm.setData('reason', e.target.value)}
                                        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" rows={2}
                                        placeholder="Mengapa ingin tukar shift..." />
                                </div>
                                <button type="submit" disabled={swapForm.processing}
                                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50">
                                    {swapForm.processing ? 'Mengirim...' : 'Ajukan Tukar'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Leave Form Modal */}
                {showLeaveForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">Ajukan Cuti/Izin</h3>
                                <button onClick={() => setShowLeaveForm(false)} className="text-gray-400">✕</button>
                            </div>
                            <form onSubmit={submitLeave} className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500">Jenis</label>
                                    <select value={leaveForm.data.type} onChange={e => leaveForm.setData('type', e.target.value)}
                                        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm">
                                        <option value="annual">Cuti Tahunan</option>
                                        <option value="sick">Sakit</option>
                                        <option value="personal">Izin Pribadi</option>
                                        <option value="unpaid">Cuti Tanpa Gaji</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-500">Mulai</label>
                                        <input type="date" value={leaveForm.data.start_date}
                                            onChange={e => leaveForm.setData('start_date', e.target.value)}
                                            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Selesai</label>
                                        <input type="date" value={leaveForm.data.end_date}
                                            onChange={e => leaveForm.setData('end_date', e.target.value)}
                                            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Alasan</label>
                                    <textarea value={leaveForm.data.reason} onChange={e => leaveForm.setData('reason', e.target.value)}
                                        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" rows={2} />
                                </div>
                                <button type="submit" disabled={leaveForm.processing}
                                    className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50">
                                    {leaveForm.processing ? 'Mengirim...' : 'Ajukan Cuti'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </StaffLayout>
    );
}
