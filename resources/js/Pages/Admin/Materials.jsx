import React, { useState, useMemo } from 'react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { useForm, router, Head } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';

export default function Materials({ materials, categories, suppliers }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        sku: '',
        name: '',
        type: 'raw_material',
        category_id: '',
        unit: '',
        purchase_unit: '',
        conversion_factor: 1,
        min_stock: 0,
        track_inventory: true,
        last_purchase_price: 0,
    });

    const filteredMaterials = useMemo(() => {
        return materials.filter(m => 
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (m.sku && m.sku.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [materials, searchQuery]);

    const openModal = (material = null) => {
        clearErrors();
        if (material) {
            setEditingMaterial(material);
            setData({
                sku: material.sku || '',
                name: material.name,
                type: material.type || 'raw_material',
                category_id: material.category_id || '',
                unit: material.unit,
                purchase_unit: material.purchase_unit || '',
                conversion_factor: material.conversion_factor || 1,
                min_stock: material.min_stock,
                track_inventory: !!material.track_inventory,
                last_purchase_price: material.last_purchase_price,
            });
        } else {
            setEditingMaterial(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMaterial(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingMaterial) {
            put(route('admin.materials.update', editingMaterial.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.materials.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Item Katalog',
            message: 'Apakah Anda yakin ingin menghapus item ini dari katalog?',
            type: 'danger',
            confirmText: 'Hapus',
            onConfirm: () => {
                router.delete(route('admin.materials.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    return (
        <InventoryLayout title="Katalog Inventori">
            <Head title="Katalog Inventori" />
            
            <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Katalog Inventori</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Kelola bahan baku, produk, dan pengaturan stok sistem</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <input
                                type="text"
                                placeholder="Cari SKU atau nama..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all"
                                style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                            />
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                            Tambah Item
                        </button>
                    </div>
                </div>

                <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-black/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold" style={{ borderColor: 'var(--g-border)' }}>
                                    <th className="px-4 py-4">Kode SKU / Nama</th>
                                    <th className="px-4 py-4">Kategori</th>
                                    <th className="px-4 py-4">Jenis Item</th>
                                    <th className="px-4 py-4 text-right">Stok Saat Ini</th>
                                    <th className="px-4 py-4 text-right">Stok Minimum</th>
                                    <th className="px-4 py-4 text-right">Harga Terakhir</th>
                                    <th className="px-4 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredMaterials.map((material) => (
                                    <tr key={material.id} className="hover:bg-white/5 transition-colors group text-xs">
                                        <td className="px-4 py-4">
                                            <div className="font-bold" style={{ color: 'var(--g-text-primary)' }}>{material.name}</div>
                                            <div className="text-[10px] opacity-40 font-mono tracking-widest mt-0.5" style={{ color: 'var(--g-text-muted)' }}>{material.sku || 'TANPA-SKU'}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[9px] font-bold uppercase rounded border border-white/5">
                                                {material.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                                                material.type === 'raw_material' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                material.type === 'semi_finished' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-green-500/10 text-green-400 border-green-500/20'
                                            }`}>
                                                {material.type === 'raw_material' ? 'Bahan Baku' :
                                                 material.type === 'semi_finished' ? 'Setengah Jadi' : 'Produk Jadi'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className={`font-bold font-mono ${material.stock <= material.min_stock ? 'text-red-400' : 'text-white/70'}`}>
                                                {parseFloat(material.stock).toFixed(2)} <span className="text-[9px] font-normal opacity-40">{material.unit}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right text-white/40 font-mono">
                                            {material.min_stock} {material.unit}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-white/60">
                                            {fmt(material.last_purchase_price || 0)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openModal(material)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-blue-400 transition-all">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                                <button onClick={() => handleDelete(material.id)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-red-400 transition-all">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMaterials.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-12 text-center text-xs opacity-20 uppercase font-bold tracking-widest">Tidak ada item ditemukan</td>
                                    </tr>
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
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>{editingMaterial ? 'Edit Item' : 'Tambah Item Baru'}</h3>
                        <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 space-y-5 text-left">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Nama Item *</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-bold" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Jenis Item</label>
                                <select value={data.type} onChange={e => setData('type', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all cursor-pointer font-bold" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                    <option value="raw_material">Bahan Baku (Raw)</option>
                                    <option value="semi_finished">Setengah Jadi (Semi)</option>
                                    <option value="finished">Produk Jadi (Produced)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Kode SKU</label>
                                <input type="text" value={data.sku} onChange={e => setData('sku', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-mono" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Kategori</label>
                                <select value={data.category_id} onChange={e => setData('category_id', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all cursor-pointer" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                    <option value="">Pilih Kategori</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Satuan Unit</label>
                                <input type="text" placeholder="kg, gr, pcs, liter..." value={data.unit} onChange={e => setData('unit', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Stok Minimum</label>
                                <input type="number" value={data.min_stock} onChange={e => setData('min_stock', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-mono" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Harga Beli Terakhir</label>
                                <input type="number" value={data.last_purchase_price} onChange={e => setData('last_purchase_price', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-mono" 
                                    style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border bg-black/10 space-y-4" style={{ borderColor: 'var(--g-border)' }}>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-2">Konversi Satuan Beli</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Satuan Beli (Bulk)</label>
                                    <input type="text" placeholder="Botol, Karung, Pack..." value={data.purchase_unit} onChange={e => setData('purchase_unit', e.target.value)}
                                        className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" 
                                        style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    <p className="text-[9px] mt-1 opacity-40 italic">Satuan saat belanja di supplier</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Faktor Konversi</label>
                                    <input type="number" step="0.01" value={data.conversion_factor} onChange={e => setData('conversion_factor', e.target.value)}
                                        className="w-full rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all font-mono" 
                                        style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    <p className="text-[9px] mt-1 opacity-40 italic">1 {data.purchase_unit || 'Unit'} = {data.conversion_factor} {data.unit || 'Base'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-white/40 font-bold border border-white/10 rounded-lg hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest">Batal</button>
                            <button type="submit" disabled={processing} className="flex-1 py-2.5 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-[10px] uppercase tracking-widest">
                                {processing ? 'Menyimpan...' : 'Simpan Item'}
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

