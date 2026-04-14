import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, Head } from '@inertiajs/react';

export default function Purchases({ suppliers, materials, purchases }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        material_id: '',
        supplier_id: '',
        quantity: '',
        cost: '',
        notes: ''
    });

    const submitPurchase = (e) => {
        e.preventDefault();
        post(route('admin.purchase-orders.quick'), {
            onSuccess: () => reset()
        });
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <AdminLayout>
            <Head title="Quick Purchase" />
            <div className="p-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Quick Purchase</h1>
                    <p className="text-white/50 text-sm">Directly record a purchase and update stock in one step</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <form onSubmit={submitPurchase} className="bg-[#1F1F1F] rounded-lg border border-white/5 p-4 space-y-5 shadow-xl">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 mb-2">New Entry</h3>

                            <div>
                                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Material *</label>
                                <select value={data.material_id} onChange={e => setData('material_id', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 focus:outline-none transition-all" required>
                                    <option value="">Select Material...</option>
                                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.purchase_unit || m.unit})</option>)}
                                </select>
                                {errors.material_id && <p className="text-red-400 text-xs mt-1">{errors.material_id}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Supplier</label>
                                <select value={data.supplier_id} onChange={e => setData('supplier_id', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 focus:outline-none transition-all">
                                    <option value="">General Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                {errors.supplier_id && <p className="text-red-400 text-xs mt-1">{errors.supplier_id}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Quantity</label>
                                    <input type="number" step="0.01" value={data.quantity} onChange={e => setData('quantity', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 focus:outline-none transition-all" required />
                                    {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Total Cost (Rp)</label>
                                    <input type="number" value={data.cost} onChange={e => setData('cost', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 focus:outline-none transition-all" required />
                                    {errors.cost && <p className="text-red-400 text-xs mt-1">{errors.cost}</p>}
                                </div>
                            </div>

                            {(() => {
                                const m = materials.find(m => m.id == data.material_id);
                                if (m && m.purchase_unit && m.conversion_factor > 1 && data.quantity) {
                                    const baseQty = data.quantity * m.conversion_factor;
                                    return (
                                        <div className="text-[10px] text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20">
                                            📀 Logic: {data.quantity} {m.purchase_unit} × {Number(m.conversion_factor).toFixed(0)} = <span className="font-bold">{baseQty.toFixed(2)} {m.unit}</span> stock.
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div>
                                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Notes</label>
                                <input type="text" value={data.notes} onChange={e => setData('notes', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 focus:outline-none transition-all" placeholder="e.g. Urgent stock up" />
                            </div>

                            <button type="submit" disabled={processing} className="w-full py-3 bg-[#E84C30] text-white font-bold rounded-lg text-xs hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all uppercase tracking-widest">
                                {processing ? 'Recording...' : 'Record Purchase'}
                            </button>
                        </form>
                    </div>

                    {/* History Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#1F1F1F] rounded-lg border border-white/5 overflow-hidden shadow-xl">
                            <div className="px-4 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recent Movements (IN)</h3>
                                <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold font-mono">50 Most Recent</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5 text-white/30 text-[10px] uppercase tracking-widest">
                                            <th className="px-4 py-4 text-left">Material</th>
                                            <th className="px-4 py-4 text-right">Qty</th>
                                            <th className="px-4 py-4 text-left">Reference</th>
                                            <th className="px-4 py-4 text-left">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {purchases.map(p => (
                                            <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="text-white font-medium">{p.material?.name}</div>
                                                    <div className="text-[10px] text-white/20">{p.notes || '-'}</div>
                                                </td>
                                                <td className="px-4 py-4 text-white/70 text-right font-mono font-bold">
                                                    +{Number(p.qty).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-[10px] text-indigo-400/80 font-mono bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-400/10 whitespace-nowrap">
                                                        {p.reference_type ? p.reference_type.split('\\').pop() + ' #' + p.reference_id : 'Manual Entry'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-white/30 text-[10px] uppercase tracking-widest font-bold">
                                                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                        {purchases.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-white/10 italic">No movement data yet</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

