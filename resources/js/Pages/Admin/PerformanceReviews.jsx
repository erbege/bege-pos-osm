import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, router, Head } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import Drawer from '@/Components/Drawer';

export default function PerformanceReviews({ auth, employees, months }) {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDrawer, setShowDrawer] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        speed_score: 80,
        quality_score: 80,
        bonus_amount: 0,
        notes: ''
    });

    const filteredEmployees = useMemo(() => {
        return employees.filter(e => 
            e.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const openDrawer = (emp) => {
        setSelectedEmployee(emp);
        setData({
            employee_id: emp.id,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            speed_score: emp.latest_review?.speed_score || 80,
            quality_score: emp.latest_review?.quality_score || 80,
            bonus_amount: emp.latest_review?.bonus_amount || 0,
            notes: emp.latest_review?.notes || '',
        });
        setShowDrawer(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.performance-reviews.store'), {
            onSuccess: () => setShowDrawer(false),
        });
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    const RatingStars = ({ rating }) => {
        return (
            <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className={`w-3 h-3 ${star <= Math.round(rating) ? 'fill-current' : 'text-white/10'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                ))}
                <span className="text-[10px] font-semibold text-white/40 ml-1">{rating}</span>
            </div>
        );
    };

    return (
        <AdminLayout title="Performance Reviews">
            <Head title="Performance" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight text-white uppercase">Employees Performance</h1>
                        <p className="text-sm mt-1 text-white/40">Attendance-based rating and monthly performance evaluation</p>
                    </div>
                    <div className="w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-[#E84C30]/20 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-white/5 overflow-hidden bg-white/[0.02]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-black/20">
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30">Employee</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">Current Month</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">Last Month</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">Semester</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">Yearly</th>
                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 text-right">Latest Bonus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredEmployees.map((e) => (
                                    <tr key={e.id} className="hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => openDrawer(e)}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#E84C30]/10 border border-[#E84C30]/20 flex items-center justify-center text-sm font-semibold text-[#E84C30] overflow-hidden group-hover:scale-110 transition-transform">
                                                    {e.photo_path ? (
                                                        <img src={`/storage/${e.photo_path}`} className="w-full h-full object-cover" />
                                                    ) : e.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white group-hover:text-[#E84C30] transition-colors">{e.name}</div>
                                                    <div className="text-[10px] font-semibold text-white/30 uppercase">{e.position}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <RatingStars rating={e.stats.current_month.rating} />
                                                <span className="text-[9px] text-emerald-400 font-semibold mt-1">{e.stats.current_month.on_time_rate}% On-Time</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center opacity-60">
                                                <RatingStars rating={e.stats.last_month.rating} />
                                                <span className="text-[9px] text-white/40 font-semibold mt-1">{e.stats.last_month.on_time_rate}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <RatingStars rating={e.stats.last_6_months.rating} />
                                                <span className="text-[9px] text-white/20 font-semibold mt-1">6 Months Avg</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <RatingStars rating={e.stats.current_year.rating} />
                                                <span className="text-[9px] text-white/20 font-semibold mt-1">Yearly Overall</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-semibold text-emerald-400">{e.latest_review ? fmt(e.latest_review.bonus_amount) : '—'}</div>
                                            <div className="text-[9px] text-white/20 uppercase font-semibold">This Month</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Performance Review Drawer */}
            <Drawer
                show={showDrawer}
                onClose={() => setShowDrawer(false)}
                title="Performance Review"
            >
                {selectedEmployee && (
                    <form onSubmit={handleSubmit} className="space-y-8 text-left pb-10 -mx-6 -mt-6">
                        {/* Header Image bleed */}
                        <div className="relative w-full h-[240px] overflow-hidden group">
                            <div className="absolute inset-0 bg-[#E84C30]/5 flex items-center justify-center">
                                {selectedEmployee.photo_path ? (
                                    <img src={`/storage/${selectedEmployee.photo_path}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <span className="text-8xl font-black text-[#E84C30]/20 select-none">{selectedEmployee.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/20 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-4 space-y-1">
                                <div className="inline-block px-2 py-0.5 rounded bg-[#E84C30] text-[8px] font-black uppercase tracking-widest text-white mb-1 shadow-lg shadow-[#E84C30]/20">
                                    {selectedEmployee.position}
                                </div>
                                <h2 className="text-2xl font-semibold text-white leading-tight uppercase tracking-tight">
                                    {selectedEmployee.name}
                                </h2>
                            </div>
                        </div>

                        <div className="px-4 space-y-8">
                            {/* Attendance Insight Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                                    <p className="text-[9px] font-semibold uppercase text-white/30 tracking-widest">Month Score</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-semibold text-white">{selectedEmployee.stats.current_month.on_time_rate}%</span>
                                        <RatingStars rating={selectedEmployee.stats.current_month.rating} />
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                                    <p className="text-[9px] font-semibold uppercase text-white/30 tracking-widest">Attendance</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-semibold text-white">{selectedEmployee.stats.current_month.present}</span>
                                        <span className="text-[9px] font-semibold text-white/20 uppercase">Present days</span>
                                    </div>
                                </div>
                            </div>

                            {/* Evaluation Form */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-semibold uppercase text-[#E84C30] tracking-[0.2em]">Monthly Evaluation</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2 text-white/40">Speed Score (0-100)</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-semibold outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                                            value={data.speed_score}
                                            onChange={e => setData('speed_score', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2 text-white/40">Quality Score (0-100)</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-semibold outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                                            value={data.quality_score}
                                            onChange={e => setData('quality_score', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2 text-[#E84C30]">Performance Bonus (IDR)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-white/5 border border-[#E84C30]/20 rounded-lg px-4 py-3 text-lg font-semibold text-emerald-400 outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                                        placeholder="Enter amount..."
                                        value={data.bonus_amount}
                                        onChange={e => setData('bonus_amount', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2 text-white/40">Review Notes</label>
                                    <textarea 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/80 font-semibold outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all min-h-[120px] resize-none"
                                        placeholder="Write feedback..."
                                        value={data.notes}
                                        onChange={e => setData('notes', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowDrawer(false)} className="flex-1 py-3 border border-white/10 text-white/40 hover:bg-white/5 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all">Cancel</button>
                                <button type="submit" disabled={processing} className="flex-[2] py-3 bg-[#E84C30] text-white hover:bg-[#D4432A] rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all shadow-lg shadow-[#E84C30]/20">
                                    {processing ? 'Processing...' : 'Save Evaluation'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </Drawer>
        </AdminLayout>
    );
}

