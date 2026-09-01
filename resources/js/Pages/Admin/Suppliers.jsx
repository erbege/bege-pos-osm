import React, { useState } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { useForm, router, Head } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';

export default function Suppliers({ suppliers }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '', contact: '', email: '', phone: '', payment_terms: '', address: '',
    });

    const openModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setData({
                name: supplier.name,
                contact: supplier.contact || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                payment_terms: supplier.payment_terms || '',
                address: supplier.address || '',
            });
        } else { setEditingSupplier(null); reset(); }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingSupplier(null); reset(); };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingSupplier) {
            put(route('admin.suppliers.update', editingSupplier.id), { onSuccess: () => closeModal() });
        } else {
            post(route('admin.suppliers.store'), { onSuccess: () => closeModal() });
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Supplier',
            message: 'Yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan jika supplier memiliki riwayat pesanan.',
            type: 'danger',
            confirmText: 'Hapus',
            onConfirm: () => {
                router.delete(route('admin.suppliers.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <InventoryLayout title="Daftar Supplier">
            <Head title="Supplier" />
            
            <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Daftar Supplier</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Kelola mitra pengadaan dan detail kontak korespondensi</p>
                    </div>
                    <button onClick={() => openModal()} className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#E84C30]/20 active:scale-95 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                        Tambah Supplier
                    </button>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-black/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold" style={{ borderColor: 'var(--g-border)' }}>
                                    <th className="px-4 py-4">Nama Supplier</th>
                                    <th className="px-4 py-4">Kontak Person</th>
                                    <th className="px-4 py-4">Telepon / Email</th>
                                    <th className="px-4 py-4">Ketentuan Bayar</th>
                                    <th className="px-4 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {suppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada supplier ditemukan</td>
                                    </tr>
                                ) : (
                                    suppliers.map(s => (
                                        <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>{s.name}</div>
                                                <div className="text-[10px] opacity-40 truncate max-w-[200px] mt-0.5" style={{ color: 'var(--g-text-muted)' }}>{s.address}</div>
                                            </td>
                                            <td className="px-4 py-4 text-white/60 text-xs">
                                                {s.contact || '—'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-white/70 text-xs font-mono">{s.phone || '—'}</div>
                                                <div className="text-[10px] text-[#E84C30] opacity-60">{s.email || '—'}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[9px] font-bold uppercase rounded border border-white/5">
                                                    {s.payment_terms || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openModal(s)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-blue-400 transition-all">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                    </button>
                                                    <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-red-400 transition-all">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="lg">
                <div className="relative rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--g-bg-secondary)' }}>
                    <div className="px-4 py-4 border-b bg-black/5 flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</h3>
                        <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 space-y-5 text-left">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Nama Supplier *</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-bold" 
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Kontak Person</label>
                                <input type="text" value={data.contact} onChange={e => setData('contact', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Email</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>No. Telepon</label>
                                <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-mono" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Ketentuan Bayar</label>
                                <input type="text" placeholder="Net 30, COD, dll." value={data.payment_terms} onChange={e => setData('payment_terms', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Alamat Bisnis</label>
                            <textarea rows="3" value={data.address} onChange={e => setData('address', e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all resize-none" 
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}></textarea>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-white/40 font-bold border border-white/10 rounded-lg hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest">Batal</button>
                            <button type="submit" disabled={processing} className="flex-1 py-2.5 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-[10px] uppercase tracking-widest">
                                {processing ? 'Menyimpan...' : 'Simpan Supplier'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />
        </InventoryLayout>
    );
}

