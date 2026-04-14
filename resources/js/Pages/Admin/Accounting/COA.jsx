import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function COA({ accounts }) {
    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    const getTypeColor = (type) => {
        switch (type) {
            case 'asset': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'liability': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'equity': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'revenue': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'expense': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-white/40 bg-white/5 border-white/10';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'asset': return 'Aset';
            case 'liability': return 'Liabilitas';
            case 'equity': return 'Ekuitas';
            case 'revenue': return 'Pendapatan';
            case 'expense': return 'Beban';
            default: return type;
        }
    };

    return (
        <AdminLayout title="Bagan Akun (COA)">
            <Head title="Bagan Akun (COA)" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div>
                    <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Bagan Akun (COA)</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Struktur akuntansi dan saldo akun saat ini</p>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b bg-black/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold" style={{ borderColor: 'var(--g-border)' }}>
                                    <th className="px-4 py-4">Kode</th>
                                    <th className="px-4 py-4">Nama Akun</th>
                                    <th className="px-4 py-4">Tipe</th>
                                    <th className="px-4 py-4 text-right">Saldo Saat Ini</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {accounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4 font-mono text-white/60 group-hover:text-white transition-colors text-xs tracking-widest">{account.code}</td>
                                        <td className="px-4 py-4">
                                            <div className="text-white font-bold" style={{ color: 'var(--g-text-primary)' }}>{account.name}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getTypeColor(account.type)}`}>
                                                {getTypeLabel(account.type)}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-4 text-right font-mono font-bold ${account.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {fmt(account.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

