import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout'; // Reusing AdminLayout for consistent look
import { Head, useForm, router, Link } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function ShiftSwap({ mySchedules, othersSchedules, mySwaps, currentDate, startOfWeek }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMySched, setSelectedMySched] = useState(null);
    const [selectedTargetSched, setSelectedTargetSched] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, processing, reset, errors } = useForm({
        my_schedule_id: '',
        target_schedule_id: '',
        reason: ''
    });

    const openSwapModal = (mySched) => {
        setSelectedMySched(mySched);
        setData('my_schedule_id', mySched.id);
        setIsModalOpen(true);
    };

    const submitSwap = (e) => {
        e.preventDefault();
        post(route('employee.shift-swap.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
                setSelectedTargetSched(null);
            }
        });
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
        }
    };

    return (
        <AdminLayout title="Tukar Shift">
            <Head title="Pertukaran Shift" />

            <div className="p-4 max-w-5xl mx-auto space-y-8 text-left">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Jadwal & Tukar Shift</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Lihat jadwal Anda dan ajukan pertukaran dengan rekan kerja</p>
                    </div>
                </div>

                {/* My Schedule Grid */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">Jadwal Minggu Ini</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {mySchedules.map(sched => (
                            <div key={sched.id} className="p-4 rounded-xl border flex flex-col gap-3 group transition-all hover:border-[#E84C30]/30" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                                <div className="flex justify-between items-start">
                                    <div className="text-[10px] font-black uppercase text-white/20">{new Date(sched.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{sched.shift.name}</div>
                                    <div className="text-xs font-mono text-white/40">{sched.shift.start_time.substring(0, 5)} - {sched.shift.end_time.substring(0, 5)}</div>
                                </div>
                                <button 
                                    onClick={() => openSwapModal(sched)}
                                    className="w-full py-2 bg-white/5 text-white/40 hover:bg-[#E84C30] hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Tukar Shift
                                </button>
                            </div>
                        ))}
                        {mySchedules.length === 0 && (
                            <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-white/10 text-white/20">Belum ada jadwal untuk Anda minggu ini.</div>
                        )}
                    </div>
                </div>

                {/* Swap History */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Riwayat Pertukaran</h3>
                    <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-black/20 text-[10px] uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>
                                    <tr>
                                        <th className="px-4 py-3 font-bold">Jenis</th>
                                        <th className="px-4 py-3 font-bold text-center">Detail Pertukaran</th>
                                        <th className="px-4 py-3 font-bold">Alasan</th>
                                        <th className="px-4 py-3 font-bold text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ divideColor: 'var(--g-border)' }}>
                                    {mySwaps.map(swap => {
                                        const isRequester = swap.requester_id === auth.user.employee.id;
                                        return (
                                            <tr key={swap.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isRequester ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                        {isRequester ? 'Sent' : 'Received'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-white/60">
                                                        <div className="text-center">
                                                            <div className="text-white">{swap.requester_schedule.shift.name}</div>
                                                            <div className="opacity-40">{swap.requester_schedule.date}</div>
                                                        </div>
                                                        <svg className="w-4 h-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                        <div className="text-center">
                                                            <div className="text-white">{swap.recipient_schedule.shift.name}</div>
                                                            <div className="opacity-40">{swap.recipient_schedule.date}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs italic text-white/40 max-w-[200px] truncate">"{swap.reason}"</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusStyles(swap.status)}`}>
                                                        {swap.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {mySwaps.length === 0 && (
                                        <tr><td colSpan="4" className="px-4 py-8 text-center text-xs opacity-20">Belum ada riwayat pertukaran shift.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Swap Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="lg">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                    <div className="p-6 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Ajukan Tukar Shift</h3>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">Select a colleague's shift to swap with</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submitSwap} className="p-6 space-y-6 text-left max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Shift Anda</div>
                            <div className="text-xs font-bold text-white">{selectedMySched?.shift.name} — {selectedMySched?.date}</div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Pilih Shift Rekan Kerja</label>
                            <div className="grid grid-cols-1 gap-2">
                                {othersSchedules.map(target => (
                                    <button
                                        key={target.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTargetSched(target);
                                            setData('target_schedule_id', target.id);
                                        }}
                                        className={`p-3 rounded-lg border text-left transition-all ${data.target_schedule_id === target.id ? 'bg-[#E84C30]/10 border-[#E84C30] text-white' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-xs font-bold">{target.employee.name}</div>
                                                <div className="text-[9px] opacity-40 uppercase">{target.shift.name} • {target.date}</div>
                                            </div>
                                            <div className="text-[10px] font-mono opacity-20">{target.shift.start_time.substring(0, 5)} - {target.shift.end_time.substring(0, 5)}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {othersSchedules.length === 0 && <p className="text-xs text-white/20 italic">Tidak ada shift rekan kerja tersedia minggu ini.</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Alasan Pertukaran</label>
                            <textarea 
                                value={data.reason} 
                                onChange={e => setData('reason', e.target.value)} 
                                className="w-full text-sm font-medium rounded-lg px-3 py-2 outline-none border min-h-[80px] transition-all resize-none" 
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} 
                                placeholder="Kenapa Anda ingin menukar shift ini?" 
                                required 
                            />
                        </div>

                        <button type="submit" disabled={processing || !data.target_schedule_id} className="w-full py-3 bg-[#E84C30] text-white font-black uppercase tracking-widest rounded-lg hover:bg-[#D4432A] transition-all text-sm disabled:opacity-30">
                            Kirim Request Tukar
                        </button>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
