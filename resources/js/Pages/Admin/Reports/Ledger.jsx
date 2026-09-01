import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Ledger({ ledger, summary, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [selectedJournal, setSelectedJournal] = useState(null);
    const [loadingJournal, setLoadingJournal] = useState(false);

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('admin.reports.ledger'), { start_date: startDate, end_date: endDate }, { preserveState: true });
    };

    const handleExport = () => {
        window.location.href = route('admin.reports.ledger.export') + `?start_date=${startDate}&end_date=${endDate}`;
    };

    const viewJournal = async (journalId) => {
        setLoadingJournal(true);
        try {
            const response = await fetch(route('admin.reports.journals.show', journalId));
            const data = await response.json();
            setSelectedJournal(data.journal);
        } catch (error) {
            console.error('Gagal mengambil data jurnal', error);
        } finally {
            setLoadingJournal(false);
        }
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <AdminLayout title="Buku Besar">
            <Head title="Buku Besar" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                {/* Header & Filter */}
                <div className="flex flex-col lg:row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('admin.finance')}
                            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all border border-white/5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Buku Besar</h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Detail audit seluruh jurnal yang telah diposting</p>
                        </div>
                    </div>

                    <form onSubmit={handleFilter} className="flex gap-2 items-center flex-wrap w-full lg:w-auto">
                        <div className="flex bg-[#2D2D2D] rounded-lg border overflow-hidden p-1 shadow-sm" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)' }}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-white px-3 py-1.5 text-xs focus:ring-0 font-mono transition-all"
                                style={{ color: 'var(--g-text-primary)' }}
                            />
                            <div className="flex items-center px-1 opacity-20"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></div>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-white px-3 py-1.5 text-xs focus:ring-0 font-mono transition-all"
                                style={{ color: 'var(--g-text-primary)' }}
                            />
                        </div>
                        <button type="submit" className="bg-[#E84C30] hover:bg-[#D4432A] text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2.5 rounded-lg transition shadow-xl shadow-orange-950/20 active:scale-95">
                            Saring
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2.5 rounded-lg transition border border-white/5"
                        >
                            Ekspor
                        </button>
                    </form>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-5 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Total Debit</div>
                        <div className="text-xl font-bold text-emerald-400 font-mono">{fmt(summary.total_debit)}</div>
                    </div>
                    <div className="p-5 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Total Kredit</div>
                        <div className="text-xl font-bold text-red-400 font-mono">{fmt(summary.total_credit)}</div>
                    </div>
                    <div className={`p-5 rounded-lg border hidden lg:block ${summary.net_flow >= 0 ? 'bg-emerald-500/5' : 'bg-red-500/5'}`} style={{ borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Saldo Bersih</div>
                        <div className={`text-xl font-bold font-mono ${summary.net_flow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {fmt(summary.net_flow)}
                        </div>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5 bg-black/5">
                                    <th className="px-4 py-4">Tanggal</th>
                                    <th className="px-4 py-4">Referensi</th>
                                    <th className="px-4 py-4">Akun</th>
                                    <th className="px-4 py-4 text-right">Debit</th>
                                    <th className="px-4 py-4 text-right">Kredit</th>
                                    <th className="px-4 py-4 text-right bg-black/10">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ledger.data && ledger.data.length > 0 ? (
                                    ledger.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-4 whitespace-nowrap text-white/40 font-mono text-xs">{item.date}</td>
                                            <td className="px-4 py-4">
                                                <button 
                                                    onClick={() => viewJournal(item.journal_id)}
                                                    className="font-mono text-xs text-[#E84C30] hover:underline font-bold transition-all"
                                                >
                                                    {item.journal_no}
                                                </button>
                                                <div className="text-[10px] opacity-40 truncate max-w-[150px] mt-0.5" style={{ color: 'var(--g-text-muted)' }}>{item.description}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-xs" style={{ color: 'var(--g-text-primary)' }}>{item.account_name}</div>
                                                <div className="text-[10px] opacity-40 font-mono tracking-widest" style={{ color: 'var(--g-text-muted)' }}>{item.account_code}</div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-xs">
                                                {item.debit > 0 ? <span className="text-emerald-400">+{fmt(item.debit)}</span> : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-xs">
                                                {item.credit > 0 ? <span className="text-red-400">-{fmt(item.credit)}</span> : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-xs bg-black/5" style={{ color: 'var(--g-text-secondary)' }}>
                                                {fmt(item.balance)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada catatan buku besar ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {ledger.links && ledger.links.length > 3 && (
                        <div className="px-4 py-4 border-t flex flex-col sm:row justify-between items-center gap-4 bg-black/5" style={{ borderColor: 'var(--g-border)' }}>
                            <span className="text-[10px] opacity-40 uppercase font-bold tracking-widest" style={{ color: 'var(--g-text-muted)' }}>
                                Menampilkan {ledger.from || 0} - {ledger.to || 0} dari {ledger.total || 0} rekaman
                            </span>
                            <div className="flex gap-1">
                                {ledger.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${link.active
                                            ? 'bg-[#E84C30] text-white shadow-lg shadow-orange-950/20'
                                            : 'bg-white/5 text-white/40 hover:text-white border border-white/5 disabled:opacity-20'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Journal Modal */}
            {selectedJournal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl rounded-lg border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="px-4 py-4 border-b bg-black/5 flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Entri Jurnal</h3>
                                <p className="text-[#E84C30] text-lg font-mono font-bold mt-0.5">{selectedJournal.journal_no}</p>
                            </div>
                            <button onClick={() => setSelectedJournal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">&times;</button>
                        </div>
                        
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-4 mb-8 text-[10px] uppercase font-bold tracking-widest">
                                <div>
                                    <p className="opacity-40 mb-1" style={{ color: 'var(--g-text-muted)' }}>Tanggal</p>
                                    <p style={{ color: 'var(--g-text-primary)' }}>{selectedJournal.journal_date}</p>
                                </div>
                                <div>
                                    <p className="opacity-40 mb-1" style={{ color: 'var(--g-text-muted)' }}>Status</p>
                                    <p className="text-emerald-400">DIPOSTING</p>
                                </div>
                                <div>
                                    <p className="opacity-40 mb-1" style={{ color: 'var(--g-text-muted)' }}>Referensi</p>
                                    <p style={{ color: 'var(--g-text-primary)' }}>{selectedJournal.reference_type?.split('\\').pop() || 'N/A'} #{selectedJournal.reference_id}</p>
                                </div>
                                <div>
                                    <p className="opacity-40 mb-1" style={{ color: 'var(--g-text-muted)' }}>Dibuat Oleh</p>
                                    <p style={{ color: 'var(--g-text-primary)' }}>{selectedJournal.creator?.name || 'Sistem'}</p>
                                </div>
                            </div>

                            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--g-border)' }}>
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="border-b bg-black/5 text-white/20 text-[9px] uppercase font-bold tracking-widest" style={{ borderColor: 'var(--g-border)' }}>
                                            <th className="px-4 py-3">Akun</th>
                                            <th className="px-4 py-3 text-right">Debit</th>
                                            <th className="px-4 py-3 text-right">Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {selectedJournal.entries.map((entry) => (
                                            <tr key={entry.id} className={entry.credit > 0 ? 'bg-white/[0.01]' : ''}>
                                                <td className="px-4 py-3">
                                                    <div className={`font-bold ${entry.credit > 0 ? 'ml-4' : ''}`} style={{ color: 'var(--g-text-primary)' }}>
                                                        {entry.account.name}
                                                    </div>
                                                    <div className={`text-[9px] opacity-40 font-mono tracking-widest mt-0.5 ${entry.credit > 0 ? 'ml-4' : ''}`} style={{ color: 'var(--g-text-muted)' }}>
                                                        {entry.account.code}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                                                    {entry.debit > 0 ? fmt(entry.debit) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-red-400">
                                                    {entry.credit > 0 ? fmt(entry.credit) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t bg-black/10" style={{ borderColor: 'var(--g-border)' }}>
                                            <td className="px-4 py-3 font-bold uppercase text-[9px] tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Total</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: 'var(--g-text-primary)' }}>{fmt(selectedJournal.entries.reduce((sum, e) => sum + parseFloat(e.debit), 0))}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: 'var(--g-text-primary)' }}>{fmt(selectedJournal.entries.reduce((sum, e) => sum + parseFloat(e.credit), 0))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

