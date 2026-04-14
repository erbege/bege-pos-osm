import React from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head } from '@inertiajs/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function WasteAnalytics({ stats = { total_loss_value: 0, waste_percentage: 0 }, topWasted = [], weeklyTrend = [], reasonDist = [] }) {
    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#8b5cf6'];

    return (
        <InventoryLayout title="Analitik Wastage">
            <Head title="Waste Analytics" />
            <div className="space-y-6 text-left">
                <div>
                    <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Intelijen Wastage</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Analisis efisiensi dapur dan dokumentasi kerugian stok</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Top Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-4 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Total Kerugian (Bulan Ini)</div>
                            <div className="text-3xl font-bold text-red-400 font-mono">{fmt(stats?.total_loss_value || 0)}</div>
                            <div className="mt-4 p-3 rounded bg-red-500/5 border border-red-500/10">
                                <p className="text-[10px] text-red-400/60 leading-relaxed italic">
                                    Kontribusi wastage sebesar {stats?.waste_percentage || 0}% dari total nilai pengadaan bulan ini.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Distribusi Alasan</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={reasonDist || []}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {(reasonDist || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}}
                                            itemStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {(reasonDist || []).map((r, i) => (
                                    <div key={i} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                            <span style={{color: 'var(--g-text-muted)'}}>{r.name}</span>
                                        </div>
                                        <span style={{color: 'var(--g-text-primary)'}}>{r.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Trend Chart */}
                    <div className="lg:col-span-2 p-4 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-8 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Tren Kerugian Mingguan</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tick={{fill: 'rgba(255,255,255,0.2)'}} />
                                    <YAxis stroke="#ffffff20" fontSize={10} tick={{fill: 'rgba(255,255,255,0.2)'}} tickFormatter={(v) => `${v/1000}k`} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                        contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}}
                                    />
                                    <Bar dataKey="loss" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} opacity={0.6} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top Wasted Items */}
                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="px-4 py-3 border-b bg-black/5">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Item Paling Sering Terbuang</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5 bg-black/5">
                                    <th className="px-4 py-4">Nama Material</th>
                                    <th className="px-4 py-4 text-center">Frekuensi Kejadian</th>
                                    <th className="px-4 py-4 text-right">Total Kuantitas</th>
                                    <th className="px-4 py-4 text-right">Estimasi Nilai Kerugian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(topWasted || []).map((item, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{item.name}</div>
                                            <div className="text-[9px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>{item.unit}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center font-mono text-white/40">{item.count}x</td>
                                        <td className="px-4 py-4 text-right font-mono font-bold text-red-400/60">{parseFloat(item.total_qty).toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right font-mono font-bold text-white/70">{fmt(item.total_value)}</td>
                                    </tr>
                                ))}
                                {(topWasted || []).length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada data wastage signifikan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </InventoryLayout>
    );
}

