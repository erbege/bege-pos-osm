import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, router, Head } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Incomes({ incomes, accounts }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        category: '',
        account_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const openModal = (income = null) => {
        clearErrors();
        if (income) {
            setEditingIncome(income);
            setData({
                category: income.category,
                account_id: income.account_id || '',
                amount: income.amount,
                description: income.description || '',
                date: income.date,
            });
        } else {
            setEditingIncome(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingIncome(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingIncome) {
            put(route('admin.incomes.update', editingIncome.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.incomes.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Catatan Pemasukan',
            message: 'Apakah Anda yakin ingin menghapus catatan pemasukan ini? Jurnal terkait akan dibatalkan.',
            type: 'danger',
            confirmText: 'Hapus',
            onConfirm: () => {
                destroy(route('admin.incomes.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <AdminLayout title="Pemasukan Manual">
            <Head title="Pemasukan Manual" />
            
            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Pemasukan Manual</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Kelola pendapatan non-POS untuk pencatatan akuntansi</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-orange-950/20 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                        Tambah Pemasukan
                    </button>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b bg-black/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold" style={{ borderColor: 'var(--g-border)' }}>
                                    <th className="px-4 py-4">Tanggal</th>
                                    <th className="px-4 py-4">Kategori / Akun</th>
                                    <th className="px-4 py-4">Keterangan</th>
                                    <th className="px-4 py-4 text-right">Nominal</th>
                                    <th className="px-4 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {incomes.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada catatan pemasukan ditemukan</td>
                                    </tr>
                                )}
                                {incomes.data.map((income) => (
                                    <tr key={income.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4 whitespace-nowrap text-white/40 font-mono text-xs">{new Date(income.date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{income.category}</div>
                                            <div className="text-[9px] opacity-40 uppercase font-bold tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>Pendapatan Lainnya</div>
                                        </td>
                                        <td className="px-4 py-4 text-white/50 max-w-xs truncate">{income.description || '-'}</td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-emerald-400 font-mono font-bold">+{fmt(income.amount)}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openModal(income)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-blue-400 transition-all">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                                <button onClick={() => handleDelete(income.id)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-red-400 transition-all">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {incomes.links && incomes.links.length > 3 && (
                        <div className="px-4 py-4 border-t flex justify-center gap-1 bg-black/5" style={{ borderColor: 'var(--g-border)' }}>
                            {incomes.links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all border ${link.active
                                        ? 'bg-[#E84C30] text-white border-[#E84C30] shadow-lg shadow-orange-950/20'
                                        : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white'
                                        } ${!link.url && 'opacity-20 cursor-not-allowed'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-lg border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="px-4 py-4 border-b bg-black/5 flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>{editingIncome ? 'Edit Pemasukan' : 'Pemasukan Baru'}</h3>
                                <p className="text-[10px] opacity-40 uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--g-text-muted)' }}>Entri Jurnal Manual</p>
                            </div>
                            <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-4 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1.5 tracking-widest">Tanggal</label>
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={e => setData('date', e.target.value)}
                                        className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-mono"
                                        style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                    />
                                    {errors.date && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.date}</div>}
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1.5 tracking-widest">Nominal (Rp)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={data.amount}
                                        onChange={e => setData('amount', e.target.value)}
                                        className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-mono font-bold"
                                        style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                    />
                                    {errors.amount && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.amount}</div>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1.5 tracking-widest">Nama Transaksi</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Penjualan Aset, Pendapatan Sewa"
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-bold"
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                />
                                {errors.category && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.category}</div>}
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1.5 tracking-widest">Akun Target (Kredit)</label>
                                <select
                                    value={data.account_id}
                                    onChange={e => setData('account_id', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all appearance-none cursor-pointer"
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                >
                                    <option value="" className="bg-[#1A1A1A]">Pilih Akun Pendapatan</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="bg-[#1A1A1A]">{acc.code} - {acc.name}</option>
                                    ))}
                                </select>
                                {errors.account_id && <div className="text-red-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.account_id}</div>}
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1.5 tracking-widest">Keterangan</label>
                                <textarea
                                    placeholder="Detail tambahan..."
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all h-20 resize-none"
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                ></textarea>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all font-bold text-[10px] text-white/40 hover:text-white uppercase tracking-widest">Batal</button>
                                <button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="flex-[2] px-4 py-2.5 rounded-lg bg-[#E84C30] hover:bg-[#D4432A] transition-all font-bold text-white shadow-lg shadow-orange-950/20 active:scale-95 disabled:opacity-50 uppercase text-[10px] tracking-widest"
                                >
                                    {processing ? 'Memproses...' : 'Simpan Transaksi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />
        </AdminLayout>
    );
}

