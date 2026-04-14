import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router, Link, Head } from '@inertiajs/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';

export default function Finance({ totalIncome, totalExpense, expenseOperational, expensePayroll, netProfit, transactions, monthlySummary, dailyTrend, filters }) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);

    const handleFilter = () => {
        router.get(route('admin.finance'), { month, year }, { preserveState: true });
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    const fmtShort = (v) => {
        const sign = v < 0 ? '-' : '';
        const absV = Math.abs(v);
        let formatted = '';
        if (absV >= 1e12) formatted = (absV / 1e12).toFixed(2).replace('.', ',') + 'T';
        else if (absV >= 1e9) formatted = (absV / 1e9).toFixed(2).replace('.', ',') + 'M';
        else if (absV >= 1e6) formatted = (absV / 1e6).toFixed(2).replace('.', ',') + 'Jt';
        else if (absV >= 1e3) formatted = (absV / 1e3).toFixed(2).replace('.', ',') + 'Rb';
        else return fmt(v);
        return `Rp ${sign}${formatted}`;
    };

    const MetricValue = ({ value, className, prefix = '' }) => (
        <div className="relative group cursor-help inline-block">
            <span className="hidden sm:inline">{prefix}{fmt(value)}</span>
            <span className="inline sm:hidden">{prefix}{fmtShort(value)}</span>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-[#1A1A1A] text-white text-[10px] px-2 py-1 rounded border border-white/10 shadow-xl whitespace-nowrap font-mono">
                    {prefix}{fmt(value)}
                </div>
            </div>
        </div>
    );

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1A1A1A] border border-white/10 p-4 rounded-lg shadow-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{label}</p>
                    {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 justify-between min-w-[120px]">
                            <span className="text-xs font-bold" style={{ color: p.color }}>{p.name === 'Income' ? 'Pendapatan' : 'Pengeluaran'}:</span>
                            <span className="text-xs font-mono font-bold text-white">{fmt(p.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <AdminLayout title="Dashboard Keuangan">
            <Head title="Dashboard Keuangan" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                {/* Header & Filter */}
                <div className="flex flex-col md:row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Intelijen Keuangan</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Metrik akuntansi terintegrasi dan analisis laba rugi</p>
                    </div>

                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <div className="flex bg-[#2D2D2D] rounded-lg border overflow-hidden p-1 shadow-sm" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)' }}>
                            <select 
                                value={month} 
                                onChange={e => setMonth(e.target.value)}
                                className="bg-transparent border-none text-white px-3 py-1 text-xs focus:ring-0 font-bold appearance-none cursor-pointer"
                                style={{ color: 'var(--g-text-primary)' }}
                            >
                                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                    <option key={i+1} value={i+1} className="bg-[#1A1A1A]">{m}</option>
                                ))}
                            </select>
                            <div className="w-[1px] bg-white/5 my-1"></div>
                            <select 
                                value={year} 
                                onChange={e => setYear(e.target.value)}
                                className="bg-transparent border-none text-white px-3 py-1 text-xs focus:ring-0 font-bold appearance-none cursor-pointer"
                                style={{ color: 'var(--g-text-primary)' }}
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y} className="bg-[#1A1A1A]">{y}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={handleFilter}
                            className="bg-[#E84C30] hover:bg-[#D4432A] text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg transition shadow-lg shadow-[#E84C30]/20 active:scale-95"
                        >
                            Perbarui
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-lg border shadow-sm transition-all hover:brightness-110" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Total Pendapatan</div>
                        <div className="text-2xl font-bold text-emerald-400 font-mono">
                            <MetricValue value={totalIncome} />
                        </div>
                    </div>

                    <div className="p-5 rounded-lg border shadow-sm transition-all hover:brightness-110" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 opacity-60 mb-1">Total Pengeluaran</div>
                        <div className="text-2xl font-bold text-red-400 font-mono">
                            <MetricValue value={totalExpense} />
                        </div>
                    </div>

                    <div className="p-5 rounded-lg border shadow-sm transition-all hover:brightness-110" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400 opacity-60 mb-1">Biaya Payroll</div>
                        <div className="text-2xl font-bold text-orange-400 font-mono">
                            <MetricValue value={expensePayroll} />
                        </div>
                    </div>

                    <div className={`p-5 rounded-lg border shadow-sm transition-all hover:brightness-110 ${netProfit >= 0 ? 'bg-emerald-500/5' : 'bg-red-500/5'}`} style={{ borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Laba Bersih</div>
                        <div className={`text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            <MetricValue value={netProfit} prefix={netProfit >= 0 ? '+' : ''} />
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-[#E84C30]"></div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Tren Arus Kas Harian</h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyTrend}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tick={{fill: 'rgba(255,255,255,0.2)'}} />
                                    <YAxis stroke="#ffffff20" fontSize={10} tick={{fill: 'rgba(255,255,255,0.2)'}} tickFormatter={(v) => `${v/1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" name="Income" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" name="Expense" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Performa Bulanan</h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={Object.entries(monthlySummary).map(([period, data]) => ({ period, ...data }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="period" stroke="#ffffff20" fontSize={10} tick={{fill: 'rgba(255,255,255,0.2)'}} tickFormatter={(v) => v.split('-')[1]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]} barSize={12}>
                                        {Object.entries(monthlySummary).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#10b981" fillOpacity={0.6} />
                                        ))}
                                    </Bar>
                                    <Bar dataKey="expense" name="Expense" radius={[4, 4, 0, 0]} barSize={12}>
                                        {Object.entries(monthlySummary).map((entry, index) => (
                                            <Cell key={`cell-exp-${index}`} fill="#ef4444" fillOpacity={0.6} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom List: Recent Transactions */}
                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="px-4 py-3 border-b bg-black/5 flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Aktivitas Keuangan Terbaru</h3>
                        <Link href={route('admin.reports.ledger')} className="text-[10px] text-[#E84C30] hover:underline font-bold uppercase tracking-widest">
                            Buku Besar Lengkap
                        </Link>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5">
                                    <th className="px-4 py-4">Tanggal</th>
                                    <th className="px-4 py-4">Deskripsi Transaksi</th>
                                    <th className="px-4 py-4 text-right">Nominal</th>
                                    <th className="px-4 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4 whitespace-nowrap text-white/40 font-mono text-xs">{trx.date}</td>
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{trx.description}</div>
                                            <div className="text-[10px] opacity-40 uppercase font-bold tracking-tighter" style={{ color: 'var(--g-text-muted)' }}>Sumber: {trx.source === 'ledger' ? 'Buku Besar' : trx.source}</div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className={`font-mono font-bold ${trx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {trx.type === 'income' ? '+' : '-'}{fmt(trx.amount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                                <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-bold uppercase tracking-widest">DIPOSTING</div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada transaksi terbaru</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

