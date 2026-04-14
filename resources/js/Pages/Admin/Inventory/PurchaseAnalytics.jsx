import React from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Head } from '@inertiajs/react';

export default function PurchaseAnalytics({ spendingTrends, topMaterials, supplierStats }) {
    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    const maxTrend = Math.max(...spendingTrends.map(t => t.total), 1);

    return (
        <InventoryLayout title="Procurement Analytics">
            <Head title="Procurement Analytics" />
            <div className="space-y-6 text-left">
                <div>
                    <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Supply Chain Intelligence</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Insights into spending trends and supplier performance</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Spending Trends */}
                    <div className="rounded-lg border p-4 shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-2 h-2 rounded-full bg-[#E84C30]"></div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Spending Trends (Last 6 Months)</h3>
                        </div>
                        <div className="space-y-6">
                            {spendingTrends.map((t, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                                        <span>{t.month}</span>
                                        <span className="text-white font-mono">{fmt(t.total)}</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#E84C30] rounded-full transition-all duration-1000"
                                            style={{ width: `${(t.total / maxTrend) * 100}%`, opacity: 0.6 }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {spendingTrends.length === 0 && <p className="text-white/20 italic text-center py-6 text-xs uppercase tracking-widest">No data available</p>}
                        </div>
                    </div>

                    {/* Top Materials */}
                    <div className="rounded-lg border p-4 shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Top Materials by Spend</h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {topMaterials.map((item, i) => (
                                <div key={i} className="py-4 flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{item.material.name}</div>
                                        <div className="text-[9px] text-white/20 uppercase tracking-widest font-bold mt-0.5">Qty: {Number(item.total_qty).toFixed(2)} {item.material.unit}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold font-mono text-sm">{fmt(item.total_spend)}</div>
                                        <div className="text-[9px] text-white/20 uppercase tracking-widest font-bold mt-0.5">Total Invested</div>
                                    </div>
                                </div>
                            ))}
                            {topMaterials.length === 0 && <p className="text-white/20 italic text-center py-6 text-xs uppercase tracking-widest">No data available</p>}
                        </div>
                    </div>
                </div>

                {/* Supplier Stats */}
                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="px-4 py-4 border-b bg-black/5" style={{ borderColor: 'var(--g-border)' }}>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Supplier Performance Rankings</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5">
                                    <th className="px-4 py-4">Supplier Name</th>
                                    <th className="px-4 py-4 text-center">Orders Placed</th>
                                    <th className="px-4 py-4 text-right">Accumulated Spend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {supplierStats.map((s, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-4 font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{s.name}</td>
                                        <td className="px-4 py-4 text-center text-white/60 font-mono text-xs">{s.order_count}</td>
                                        <td className="px-4 py-4 text-right font-bold text-emerald-400 font-mono">{fmt(s.total_spend)}</td>
                                    </tr>
                                ))}
                                {supplierStats.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">No supplier performance data</td>
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

