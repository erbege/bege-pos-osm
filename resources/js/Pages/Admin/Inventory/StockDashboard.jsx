import React from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

export default function StockDashboard({ auth, metrics, lowStockItems, recentOpnames, trends, stats }) {
    
    // Fallback for stats/metrics to avoid undefined errors
    const dashboardStats = metrics || stats || { total_items: 0, low_stock: 0, out_of_stock: 0, total_value: 0 };
    const lowStock = lowStockItems || [];
    const recentMovements = recentOpnames || [];

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1A1A1A] border border-white/10 p-3 rounded-lg shadow-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{label}</p>
                    {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 justify-between min-w-[100px]">
                            <span className="text-[10px] font-bold" style={{ color: p.color }}>{p.name === 'incoming' ? 'Masuk' : 'Keluar'}:</span>
                            <span className="text-[10px] font-mono font-bold text-white">{p.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <InventoryLayout title="Intelijen Inventori">
            <Head title="Dashboard Inventori" />

            <div className="space-y-6 text-left">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Intelijen Inventori</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Pemantauan stok real-time dan kesehatan rantai pasok</p>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-lg border shadow-sm transition-all hover:brightness-110" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>SKU Aktif</div>
                        <div className="text-2xl font-bold font-mono" style={{ color: 'var(--g-text-primary)' }}>{dashboardStats.total_items}</div>
                    </div>
                    <div className="p-5 rounded-lg border shadow-sm transition-all hover:brightness-110" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 opacity-60 mb-1">Stok Kritis</div>
                        <div className="text-2xl font-bold font-mono text-red-400">{dashboardStats.low_stock}</div>
                    </div>
                    <div className="p-5 rounded-lg border shadow-sm transition-all hover:brightness-110" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Stok Habis</div>
                        <div className="text-2xl font-bold font-mono text-blue-400">{dashboardStats.out_of_stock}</div>
                    </div>
                    <div className="p-5 rounded-lg border shadow-sm transition-all hover:brightness-110" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Total Nilai Inventori</div>
                        <div className="text-2xl font-bold font-mono text-emerald-400">{fmt(dashboardStats.total_value)}</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Stock Trends Area Chart */}
                    <div className="lg:col-span-2 p-4 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-2 h-2 rounded-full bg-[#E84C30]"></div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Kecepatan Pergerakan (7 Hari)</h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tick={{fill: 'rgba(255,255,255,0.2)'}} />
                                    <YAxis stroke="#ffffff20" fontSize={10} tick={{fill: 'rgba(255,255,255,0.2)'}} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" name="Stok Masuk" dataKey="incoming" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                                    <Area type="monotone" name="Stok Keluar" dataKey="outgoing" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Low Stock Sidebar */}
                    <div className="rounded-lg border overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="px-4 py-3 border-b bg-black/5 flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Peringatan Stok Rendah</h3>
                            <Link href={route('admin.materials.index')} className="text-[10px] text-[#E84C30] hover:underline uppercase font-bold tracking-widest">Katalog</Link>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y" style={{ divideColor: 'var(--g-border)' }}>
                            {lowStock.map(item => (
                                <div key={item.id} className="p-4 hover:bg-white/5 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{item.name}</div>
                                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest">RENDAH</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] opacity-40 uppercase font-bold tracking-tighter" style={{ color: 'var(--g-text-muted)' }}>Saat ini: {parseFloat(item.stock).toFixed(1)} {item.unit}</div>
                                        <div className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">Min: {item.min_stock}</div>
                                    </div>
                                    <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (item.stock / item.min_stock) * 100)}%` }}></div>
                                    </div>
                                </div>
                            ))}
                            {lowStock.length === 0 && (
                                <div className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Semua tingkat stok sehat</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Movements & Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-12">
                    {/* Recent Movements */}
                    <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="px-4 py-3 border-b bg-black/5" style={{ borderColor: 'var(--g-border)' }}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Aktivitas Audit Terbaru</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5">
                                        <th className="px-4 py-4">ID Sesi</th>
                                        <th className="px-4 py-4 text-center">Cabang</th>
                                        <th className="px-4 py-4 text-right">Nilai Selisih</th>
                                        <th className="px-4 py-4 text-right">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentMovements.map(m => (
                                        <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>#{String(m.id).padStart(5, '0')}</div>
                                                <div className="text-[9px] opacity-40 uppercase tracking-tighter" style={{ color: 'var(--g-text-muted)' }}>Audit Stok</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-white/60">
                                                    {m.branch}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold font-mono text-sm ${m.variance_value < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {m.variance_value > 0 ? '+' : ''}{fmt(m.variance_value)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[10px] text-white/20 font-mono">
                                                {m.date}
                                            </td>
                                        </tr>
                                    ))}
                                    {recentMovements.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-6 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada audit terbaru</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stock Value Distribution */}
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Analisis Nilai Inventori</h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={lowStock.slice(0, 8)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="name" stroke="#ffffff20" fontSize={8} tick={{fill: 'rgba(255,255,255,0.2)'}} />
                                    <YAxis stroke="#ffffff20" fontSize={10} tick={{fill: 'rgba(255,255,255,0.2)'}} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="stock" radius={[4, 4, 0, 0]} fill="#3b82f6" barSize={20}>
                                        {lowStock.slice(0, 8).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.stock < entry.min_stock ? '#ef4444' : '#3b82f6'} fillOpacity={0.6} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 p-4 rounded-lg bg-black/20 border border-white/5">
                            <p className="text-[10px] leading-relaxed text-white/40 font-bold uppercase tracking-tighter text-center">
                                Barang bervolume tinggi diprioritaskan secara otomatis untuk perencanaan pengadaan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </InventoryLayout>
    );
}

