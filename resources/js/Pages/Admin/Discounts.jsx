import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import { formatRupiah } from '@/Lib/utils';

export default function Discounts({ discounts }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const { data, setData, post, put, processing, errors, reset } = useForm({
        creation_mode: 'manual', // 'manual' or 'bulk'
        name: '',
        code: '',
        count: 1,
        type: 'fixed',
        value: 0,
        min_purchase_amount: 0,
        usage_limit: 0,
        valid_from: '',
        valid_until: '',
        is_active: true,
        is_automatic: false,
        payment_method: '',
        bank_name: '',
    });

    const filteredDiscounts = useMemo(() => {
        return discounts.filter(d => 
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [discounts, searchTerm]);

    const openModal = (d = null) => {
        if (d) {
            setEditing(d);
            setData({
                creation_mode: 'manual',
                name: d.name,
                code: d.code,
                count: 1,
                type: d.type,
                value: d.value,
                min_purchase_amount: d.min_purchase_amount,
                usage_limit: d.usage_limit || 0,
                valid_from: d.valid_from ? d.valid_from.split('T')[0] : '',
                valid_until: d.valid_until ? d.valid_until.split('T')[0] : '',
                is_active: Boolean(d.is_active),
                is_automatic: Boolean(d.is_automatic),
                payment_method: d.payment_method || '',
                bank_name: d.bank_name || '',
            });
        } else {
            setEditing(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.discounts.update', editing.id), {
                onSuccess: () => setIsModalOpen(false)
            });
        } else {
            post(route('admin.discounts.store'), {
                onSuccess: () => setIsModalOpen(false)
            });
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Voucher',
            message: 'Apakah Anda yakin ingin menghapus voucher ini?',
            type: 'danger',
            confirmText: 'Hapus',
            onConfirm: () => {
                router.delete(route('admin.discounts.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const toggleStatus = (id) => {
        router.patch(route('admin.discounts.toggle-status', id));
    };

    return (
        <AdminLayout>
            <Head title="Vouchers & Discounts" />
            
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Vouchers & Discounts</h1>
                        <p className="text-white/50 text-sm">Kelola kode promo dan diskon untuk pelanggan.</p>
                    </div>
                    <button 
                        onClick={() => openModal()}
                        className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Buat Voucher Baru
                    </button>
                </div>

                {/* Filter & Search */}
                <div className="bg-[#2D2D2D] p-4 rounded-lg border border-white/5 mb-6 flex gap-4">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input 
                            type="text" 
                            placeholder="Cari nama atau kode voucher..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E84C30]/50 transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[#2D2D2D] rounded-lg border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-white/40 uppercase text-[10px] font-bold tracking-widest">
                            <tr>
                                <th className="px-4 py-4">Nama & Kode</th>
                                <th className="px-4 py-4">Tipe & Nilai</th>
                                <th className="px-4 py-4">Target Pembayaran</th>
                                <th className="px-4 py-4">Kuota / Min.</th>
                                <th className="px-4 py-4">Masa Berlaku</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredDiscounts.map((discount) => (
                                <tr key={discount.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="text-white font-bold">{discount.name}</div>
                                            {discount.is_automatic && (
                                                <span className="bg-amber-500/10 text-amber-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-amber-500/20">Auto</span>
                                            )}
                                        </div>
                                        <div className="text-[#E84C30] font-mono text-xs">{discount.code || '-'}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-white">
                                            {discount.type === 'percentage' ? `${discount.value}%` : formatRupiah(discount.value)}
                                        </div>
                                        <div className="text-white/30 text-[10px] uppercase">{discount.type}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-white font-medium">
                                            {discount.payment_method || 'Semua Metode'}
                                        </div>
                                        <div className="text-white/20 text-[10px] uppercase tracking-wider">
                                            {discount.bank_name || 'Semua Bank'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-white font-medium">
                                            {discount.usage_limit > 0 ? `${discount.used_count}/${discount.usage_limit}` : '∞'} 
                                            <span className="text-white/30 font-normal mx-1">/</span>
                                            {formatRupiah(discount.min_purchase_amount)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-white/60">
                                        {discount.valid_from ? new Date(discount.valid_from).toLocaleDateString('id-ID') : '∞'} 
                                        {' - '} 
                                        {discount.valid_until ? new Date(discount.valid_until).toLocaleDateString('id-ID') : '∞'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <button 
                                            onClick={() => toggleStatus(discount.id)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                discount.is_active 
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            }`}
                                        >
                                            {discount.is_active ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => openModal(discount)}
                                                className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(discount.id)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500/60 hover:text-red-500 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredDiscounts.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-4 py-12 text-center text-white/20">
                                        Tidak ada voucher ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md">
                <form onSubmit={submit} className="p-4">
                    <h2 className="text-xl font-bold text-white mb-6">
                        {editing ? 'Edit Voucher' : 'Buat Voucher Baru'}
                    </h2>

                    <div className="space-y-4">
                        {!editing && (
                            <div className="flex bg-black/20 p-1 rounded-lg mb-6">
                                <button
                                    type="button"
                                    onClick={() => setData('creation_mode', 'manual')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${data.creation_mode === 'manual' ? 'bg-[#E84C30] text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                                >
                                    Kode Manual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('creation_mode', 'bulk')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${data.creation_mode === 'bulk' ? 'bg-[#E84C30] text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                                >
                                    Kode Otomatis
                                </button>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Nama Promo</label>
                            <input 
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Misal: Promo Opening"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.name}</p>}
                        </div>

                        {data.creation_mode === 'manual' ? (
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Kode Voucher</label>
                                <input 
                                    type="text"
                                    value={data.code}
                                    onChange={e => setData('code', e.target.value.toUpperCase())}
                                    placeholder="GARASI66"
                                    disabled={editing}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-mono focus:ring-1 focus:ring-[#E84C30]/50 disabled:opacity-50"
                                />
                                {errors.code && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.code}</p>}
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Jumlah Voucher (Kode Unik)</label>
                                <input 
                                    type="number"
                                    value={data.count}
                                    onChange={e => setData('count', e.target.value)}
                                    placeholder="Misal: 10"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                />
                                <p className="text-[9px] text-white/30 mt-1 uppercase">Sistem akan membuat {data.count} kode unik dengan kuota masing-masing 1.</p>
                                {errors.count && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.count}</p>}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Tipe</label>
                                <select 
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value)}
                                    className="w-full bg-[#2D2D2D] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                >
                                    <option value="fixed">Nominal Tetap (Rp)</option>
                                    <option value="percentage">Persentase (%)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Nilai</label>
                                <input 
                                    type="number"
                                    value={data.value}
                                    onChange={e => setData('value', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                />
                                {errors.value && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.value}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Minimal Belanja (Rp)</label>
                                <input 
                                    type="number"
                                    value={data.min_purchase_amount}
                                    onChange={e => setData('min_purchase_amount', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                />
                                {errors.min_purchase_amount && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.min_purchase_amount}</p>}
                            </div>
                            {data.creation_mode === 'manual' && (
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Kuota (0=Unlimited)</label>
                                    <input 
                                        type="number"
                                        value={data.usage_limit}
                                        onChange={e => setData('usage_limit', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                    />
                                    {errors.usage_limit && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.usage_limit}</p>}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox"
                                    id="is_automatic"
                                    checked={data.is_automatic}
                                    onChange={e => setData('is_automatic', e.target.checked)}
                                    className="rounded bg-black/20 border-white/10 text-[#E84C30] focus:ring-[#E84C30]"
                                />
                                <label htmlFor="is_automatic" className="text-xs font-bold text-white/60 uppercase tracking-widest">Berlaku Otomatis</label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Metode Pembayaran</label>
                                    <select 
                                        value={data.payment_method}
                                        onChange={e => setData('payment_method', e.target.value)}
                                        className="w-full bg-[#2D2D2D] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                    >
                                        <option value="">Semua Metode</option>
                                        <option value="Cash">Cash</option>
                                        <option value="QRIS">QRIS</option>
                                        <option value="Transfer">Bank Transfer</option>
                                        <option value="EDC">EDC Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Nama Bank (Opsional)</label>
                                    <input 
                                        type="text"
                                        value={data.bank_name}
                                        onChange={e => setData('bank_name', e.target.value)}
                                        placeholder="Misal: BCA, BNI"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                    />
                                </div>
                            </div>
                            <p className="text-[9px] text-white/30 uppercase">Diskon otomatis akan muncul di POS jika metode/bank terpilih dan minimal belanja terpenuhi.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Berlaku Dari</label>
                                <input 
                                    type="date"
                                    value={data.valid_from}
                                    onChange={e => setData('valid_from', e.target.value)}
                                    className="w-full bg-[#2D2D2D] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Berlaku Sampai</label>
                                <input 
                                    type="date"
                                    value={data.valid_until}
                                    onChange={e => setData('valid_until', e.target.value)}
                                    className="w-full bg-[#2D2D2D] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                                className="rounded bg-black/20 border-white/10 text-[#E84C30] focus:ring-[#E84C30]"
                            />
                            <label htmlFor="is_active" className="text-sm text-white/60">Aktifkan Voucher Ini</label>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-white/40 hover:text-white transition-all"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit"
                            disabled={processing}
                            className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                        >
                            {editing ? 'Simpan Perubahan' : 'Buat Voucher'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal 
                show={confirmModal.show}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />
        </AdminLayout>
    );
}

