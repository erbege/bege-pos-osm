import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import { formatRupiah } from '@/Lib/utils';

export default function Customers({ customers }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const { data, setData, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        birthday: '',
    });

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.phone && c.phone.includes(searchTerm))
        );
    }, [customers, searchTerm]);

    const openModal = (c) => {
        setEditing(c);
        setData({
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
            birthday: c.birthday || '',
        });
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.customers.update', editing.id), {
            onSuccess: () => setIsModalOpen(false)
        });
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Pelanggan',
            message: 'Apakah Anda yakin ingin menghapus data pelanggan ini? Riwayat pesanan akan tetap ada namun tidak lagi terhubung.',
            type: 'danger',
            confirmText: 'Hapus',
            onConfirm: () => {
                router.delete(route('admin.customers.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    return (
        <AdminLayout>
            <Head title="Registered Customers" />
            
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Registered Customers</h1>
                        <p className="text-white/50 text-sm">Kelola data pelanggan yang terdaftar melalui aplikasi.</p>
                    </div>
                </div>

                {/* Filter & Search */}
                <div className="bg-[#2D2D2D] p-4 rounded-lg border border-white/5 mb-6 flex gap-4">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input 
                            type="text" 
                            placeholder="Cari nama, email, atau telepon..." 
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
                                <th className="px-4 py-4">Pelanggan</th>
                                <th className="px-4 py-4">Kontak</th>
                                <th className="px-4 py-4">Total Pesanan</th>
                                <th className="px-4 py-4">Total Belanja</th>
                                <th className="px-4 py-4">Terdaftar Pada</th>
                                <th className="px-4 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#E84C30]/10 flex items-center justify-center text-[#E84C30] font-bold text-xs uppercase">
                                                {customer.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <Link href={route('admin.customers.show', customer.id)} className="text-white font-bold hover:text-[#E84C30] transition-colors">
                                                    {customer.name}
                                                </Link>
                                                <div className="text-white/30 text-[10px] uppercase tracking-wider">ID: {customer.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-white">{customer.email || '-'}</div>
                                        <div className="text-white/40 text-xs">{customer.phone || '-'}</div>
                                    </td>
                                    <td className="px-4 py-4 text-white">
                                        {customer.orders_count} Pesanan
                                    </td>
                                    <td className="px-4 py-4 text-[#E84C30] font-bold">
                                        {formatRupiah(customer.total_spent || 0)}
                                    </td>
                                    <td className="px-4 py-4 text-white/60">
                                        {new Date(customer.created_at).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link 
                                                href={route('admin.customers.show', customer.id)}
                                                className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all"
                                                title="Detail & Riwayat"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                            </Link>
                                            <button 
                                                onClick={() => openModal(customer)}
                                                className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all"
                                                title="Edit Profil"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(customer.id)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500/60 hover:text-red-500 rounded-lg transition-all"
                                                title="Hapus"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-12 text-center text-white/20">
                                        Tidak ada pelanggan ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md">
                <form onSubmit={submit} className="p-4">
                    <h2 className="text-xl font-bold text-white mb-6">Edit Profil Pelanggan</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Nama Lengkap</label>
                            <input 
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email</label>
                                <input 
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                />
                                {errors.email && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Nomor Telepon</label>
                                <input 
                                    type="tel"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                                />
                                {errors.phone && <p className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.phone}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Tanggal Lahir</label>
                            <input 
                                type="date"
                                value={data.birthday}
                                onChange={e => setData('birthday', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Alamat Utama</label>
                            <textarea 
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                                rows="3"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#E84C30]/50"
                            ></textarea>
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
                            Simpan Perubahan
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

