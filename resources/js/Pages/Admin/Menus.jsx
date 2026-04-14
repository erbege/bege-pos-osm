import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, router, Head } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';

export default function Menus({ menus, categories, materials }) {
    const [activeTab, setActiveTab] = useState('menus');
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    // Recipe editor state
    const [recipeMenu, setRecipeMenu] = useState(null);
    const [recipeRows, setRecipeRows] = useState([]);

    const menuForm = useForm({ 
        category_id: '', 
        name: '', 
        description: '', 
        price: '', 
        image: null, 
        is_available: true, 
        delete_existing_image: false, 
        processing_category: 'quick_prep' 
    });
    
    const categoryForm = useForm({ 
        name: '', 
        description: '',
        preparation_station: 'kitchen'
    });

    const openMenuModal = (menu = null) => {
        if (menu) {
            setEditingItem(menu);
            menuForm.setData({ 
                category_id: menu.category_id, 
                name: menu.name, 
                description: menu.description || '', 
                price: menu.price, 
                is_available: Boolean(menu.is_available), 
                image: null, 
                delete_existing_image: false, 
                processing_category: menu.processing_category || 'quick_prep' 
            });
        } else { 
            setEditingItem(null); 
            menuForm.reset(); 
        }
        setIsMenuModalOpen(true);
    };

    const openCategoryModal = (category = null) => {
        if (category) {
            setEditingItem(category);
            categoryForm.setData({ 
                name: category.name, 
                description: category.description || '',
                preparation_station: category.preparation_station || 'kitchen'
            });
        } else { 
            setEditingItem(null); 
            categoryForm.reset(); 
        }
        setIsCategoryModalOpen(true);
    };

    const openRecipeEditor = (menu) => {
        setRecipeMenu(menu);
        setRecipeRows(
            menu.recipes && menu.recipes.length > 0
                ? menu.recipes.map(r => ({ material_id: String(r.material_id), qty: String(r.qty) }))
                : [{ material_id: '', qty: '' }]
        );
    };

    const addRecipeRow = () => {
        setRecipeRows([...recipeRows, { material_id: '', qty: '' }]);
    };

    const removeRecipeRow = (index) => {
        setRecipeRows(recipeRows.filter((_, i) => i !== index));
    };

    const updateRecipeRow = (index, field, value) => {
        const updated = [...recipeRows];
        updated[index][field] = value;
        setRecipeRows(updated);
    };

    const saveRecipes = () => {
        const validRecipes = recipeRows.filter(r => r.material_id && r.qty);
        router.post(route('admin.menus.recipes.sync', recipeMenu.id), {
            recipes: validRecipes.map(r => ({ material_id: parseInt(r.material_id), qty: parseFloat(r.qty) }))
        }, {
            onSuccess: () => setRecipeMenu(null)
        });
    };

    const handleMenuSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            menuForm.transform((data) => ({ ...data, _method: 'put' }));
            menuForm.post(route('admin.menus.update', editingItem.id), {
                forceFormData: true,
                onSuccess: () => {
                    setIsMenuModalOpen(false);
                    menuForm.reset();
                    menuForm.clearErrors();
                }
            });
        } else {
            menuForm.transform((data) => {
                const { _method, ...cleanedData } = data;
                return cleanedData;
            });
            menuForm.post(route('admin.menus.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setIsMenuModalOpen(false);
                    menuForm.reset();
                    menuForm.clearErrors();
                }
            });
        }
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            categoryForm.put(route('admin.categories.update', editingItem.id), { 
                onSuccess: () => { 
                    setIsCategoryModalOpen(false); 
                    categoryForm.reset(); 
                    categoryForm.clearErrors(); 
                } 
            });
        } else {
            categoryForm.post(route('admin.categories.store'), { 
                onSuccess: () => { 
                    setIsCategoryModalOpen(false); 
                    categoryForm.reset(); 
                    categoryForm.clearErrors(); 
                } 
            });
        }
    };

    const handleDelete = (type, id) => {
        setConfirmModal({
            show: true,
            title: `Delete ${type === 'menus' ? 'Menu Item' : 'Category'}`,
            message: `Are you sure you want to delete this ${type === 'menus' ? 'menu item' : 'category'}? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: () => {
                router.delete(route(`admin.${type}.destroy`, id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const getProcessingCategoryBadge = (category) => {
        switch (category) {
            case 'ready_to_serve':
                return <span className="text-[8px] uppercase tracking-[0.15em] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">READY &lt; 5m</span>;
            case 'made_to_order':
                return <span className="text-[8px] uppercase tracking-[0.15em] font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">MADE &gt; 15m</span>;
            case 'quick_prep':
            default:
                return <span className="text-[8px] uppercase tracking-[0.15em] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">QUICK 5-15m</span>;
        }
    };

    const getStationBadge = (station) => {
        const styles = {
            barista: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            kitchen: 'bg-red-500/10 text-red-400 border-red-500/20',
            ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
        const labels = {
            barista: '☕ BARISTA',
            kitchen: '🍳 KITCHEN',
            ready: '🍰 READY'
        };
        return <span className={`text-[8px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 rounded border ${styles[station] || styles.kitchen}`}>{labels[station] || station}</span>;
    };

    return (
        <AdminLayout title="Menu Master">
            <Head title="Menu Master" />
            
            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                {/* Header Section */}
                <div className="flex flex-col md:row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Katalog Produk</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Kelola menu, kategori, dan bill of materials (BOM)</p>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                            <button
                                onClick={() => setActiveTab('menus')}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md ${activeTab === 'menus' ? 'bg-[#E84C30] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                            >
                                Produk
                            </button>
                            <button
                                onClick={() => setActiveTab('categories')}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md ${activeTab === 'categories' ? 'bg-[#E84C30] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                            >
                                Kategori
                            </button>
                        </div>
                        <button 
                            onClick={() => activeTab === 'menus' ? openMenuModal() : openCategoryModal()}
                            className="bg-[#E84C30] hover:bg-[#D4432A] text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg transition shadow-lg shadow-[#E84C30]/20 active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Tambah {activeTab === 'menus' ? 'Produk' : 'Kategori'}
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border bg-white/[0.02] border-white/5 shadow-sm">
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Total Menu</div>
                        <div className="text-xl font-mono font-bold text-white">{menus.length}</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white/[0.02] border-white/5 shadow-sm">
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Tersedia</div>
                        <div className="text-xl font-mono font-bold text-emerald-400">{menus.filter(m => m.is_available).length}</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white/[0.02] border-white/5 shadow-sm">
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Kosong</div>
                        <div className="text-xl font-mono font-bold text-red-400">{menus.filter(m => !m.is_available).length}</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white/[0.02] border-white/5 shadow-sm">
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1" style={{ color: 'var(--g-text-tertiary)' }}>Kategori</div>
                        <div className="text-xl font-mono font-bold text-blue-400">{categories.length}</div>
                    </div>
                </div>

                {activeTab === 'menus' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {menus.map((menu) => (
                            <div key={menu.id} className="group bg-[#2D2D2D] rounded-xl border border-white/5 overflow-hidden hover:border-[#E84C30]/40 transition-all duration-300 shadow-xl flex flex-col">
                                <div className="aspect-[4/3] bg-[#1A1A1A] relative overflow-hidden">
                                    {menu.image ? (
                                        <img src={`/storage/${menu.image}`} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.02] to-transparent">
                                            <span className="text-white/5 font-black text-6xl italic select-none">GG</span>
                                        </div>
                                    )}
                                    
                                    {/* Action Overlays */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                        <button onClick={() => openMenuModal(menu)} className="p-2.5 bg-white/10 hover:bg-[#E84C30] text-white rounded-lg transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                        </button>
                                        <button onClick={() => openRecipeEditor(menu)} className="p-2.5 bg-white/10 hover:bg-emerald-500 text-white rounded-lg transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.288a2 2 0 01-1.645 0l-1.467-.672a2 2 0 00-1.645 0l-1.467.672a2 2 0 01-1.645 0l-.628-.288a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V18a2 2 0 002 2h14a2 2 0 002-2v-2.572zM12 11V3.5l3 3M12 3.5l-3 3"></path></svg>
                                        </button>
                                        <button onClick={() => handleDelete('menus', menu.id)} className="p-2.5 bg-white/10 hover:bg-red-500 text-white rounded-lg transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>

                                    {/* Availability Badge */}
                                    {!menu.is_available && (
                                        <div className="absolute top-0 left-0 right-0 bottom-0 bg-red-950/40 backdrop-blur-[1px] flex items-center justify-center">
                                            <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 shadow-2xl rotate-12 border-2 border-white/20">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-sm font-bold text-white tracking-tight leading-none truncate max-w-[150px]">{menu.name}</h3>
                                        <span className="text-sm font-mono font-bold text-[#E84C30]">Rp {Number(menu.price).toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-white/30 font-medium mb-4 line-clamp-2 h-6 leading-relaxed">
                                        {menu.description || 'Tidak ada deskripsi produk.'}
                                    </p>
                                    
                                    <div className="mt-auto flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                                        <span className="text-[8px] uppercase tracking-widest font-bold bg-white/5 text-white/40 px-2 py-0.5 rounded border border-white/5">
                                            {menu.category?.name || 'UMUM'}
                                        </span>
                                        {getProcessingCategoryBadge(menu.processing_category)}
                                        {menu.recipes && menu.recipes.length > 0 && (
                                            <span className="text-[8px] uppercase tracking-widest font-bold bg-white/5 text-emerald-400/60 px-2 py-0.5 rounded border border-emerald-500/10">BOM</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#2D2D2D] rounded-xl border border-white/5 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-black/20 text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold border-b border-white/5">
                                        <th className="px-6 py-4">Nama Kategori</th>
                                        <th className="px-6 py-4">Deskripsi</th>
                                        <th className="px-6 py-4">Station Persiapan</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {categories.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-sm">{cat.name}</div>
                                                <div className="text-[10px] text-white/20 font-mono mt-0.5">#{cat.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-white/40 max-w-xs truncate">{cat.description || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStationBadge(cat.preparation_station)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => openCategoryModal(cat)} className="p-2 text-white/20 hover:text-white transition rounded-lg hover:bg-white/5">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    </button>
                                                    <button onClick={() => handleDelete('categories', cat.id)} className="p-2 text-white/20 hover:text-red-400 transition rounded-lg hover:bg-red-500/10">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Menu Modal */}
            <Modal show={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} maxWidth="2xl">
                <div className="bg-[#2D2D2D] text-left">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/5">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">{editingItem ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                        <button onClick={() => setIsMenuModalOpen(false)} className="text-white/20 hover:text-white transition text-2xl">&times;</button>
                    </div>
                    
                    <form onSubmit={handleMenuSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Side: Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 ml-1">Nama Produk</label>
                                    <input type="text" value={menuForm.data.name} onChange={e => menuForm.setData('name', e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 transition-all outline-none" required />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 ml-1">Kategori</label>
                                        <select value={menuForm.data.category_id} onChange={e => menuForm.setData('category_id', e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 transition-all outline-none" required>
                                            <option value="" className="bg-[#2D2D2D]">Pilih...</option>
                                            {categories.map(c => <option key={c.id} value={c.id} className="bg-[#2D2D2D]">{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 ml-1">Harga (Rp)</label>
                                        <input type="number" value={menuForm.data.price} onChange={e => menuForm.setData('price', e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 transition-all outline-none font-mono" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 ml-1">Estimasi Persiapan</label>
                                    <select value={menuForm.data.processing_category} onChange={e => menuForm.setData('processing_category', e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 transition-all outline-none" required>
                                        <option value="ready_to_serve" className="bg-[#2D2D2D]">Sedia Saji (&lt; 5m)</option>
                                        <option value="quick_prep" className="bg-[#2D2D2D]">Cepat Saji (5-15m)</option>
                                        <option value="made_to_order" className="bg-[#2D2D2D]">Dimasak (15-30m)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 ml-1">Deskripsi</label>
                                    <textarea value={menuForm.data.description} onChange={e => menuForm.setData('description', e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 h-24 transition-all outline-none resize-none" />
                                </div>
                            </div>

                            {/* Right Side: Media & Availability */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">Foto Produk</label>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-full aspect-square max-w-[200px] rounded-2xl border-2 border-dashed border-white/10 bg-black/20 flex items-center justify-center overflow-hidden relative group">
                                            {menuForm.data.image instanceof File ? (
                                                <img src={URL.createObjectURL(menuForm.data.image)} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (editingItem?.image && !menuForm.data.delete_existing_image) ? (
                                                <img src={`/storage/${editingItem.image}`} alt="Current" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 opacity-20">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    <span className="text-[10px] font-bold">Upload Foto</span>
                                                </div>
                                            )}
                                            
                                            <input type="file" id="menu-image" onChange={e => e.target.files[0] && menuForm.setData('image', e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                        </div>
                                        
                                        {(menuForm.data.image || (editingItem?.image && !menuForm.data.delete_existing_image)) && (
                                            <button type="button" onClick={() => { menuForm.setData('image', null); if (editingItem?.image) menuForm.setData('delete_existing_image', true); }} className="text-[10px] font-bold uppercase text-red-400 hover:underline">Hapus Foto</button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white/60">Status Ketersediaan</span>
                                            <span className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Tampilkan di Menu Pelanggan</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={menuForm.data.is_available} onChange={e => menuForm.setData('is_available', e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setIsMenuModalOpen(false)} className="flex-1 py-3 text-white/40 font-bold uppercase tracking-widest text-[10px] border border-white/10 rounded-xl hover:bg-white/5 transition">Batal</button>
                            <button type="submit" disabled={menuForm.processing} className="flex-1 py-3 bg-[#E84C30] text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all disabled:opacity-50">
                                {menuForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Category Modal */}
            <Modal show={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} maxWidth="md">
                <div className="bg-[#2D2D2D] text-left">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/5">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">{editingItem ? 'Edit Kategori' : 'Kategori Baru'}</h3>
                        <button onClick={() => setIsCategoryModalOpen(false)} className="text-white/20 hover:text-white transition text-2xl">&times;</button>
                    </div>
                    
                    <form onSubmit={handleCategorySubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 ml-1">Nama Kategori</label>
                            <input type="text" value={categoryForm.data.name} onChange={e => categoryForm.setData('name', e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 transition-all outline-none" required />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 ml-1">Station Persiapan</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['barista', 'kitchen', 'ready'].map(st => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => categoryForm.setData('preparation_station', st)}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${categoryForm.data.preparation_station === st ? 'bg-white/10 border-white/40 text-white' : 'bg-black/20 border-white/5 text-white/20'}`}
                                    >
                                        {st === 'barista' ? '☕ Barista' : st === 'kitchen' ? '🍳 Kitchen' : '🍰 Ready'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 ml-1">Deskripsi</label>
                            <textarea value={categoryForm.data.description} onChange={e => categoryForm.setData('description', e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E84C30]/40 h-24 transition-all outline-none resize-none" />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-3 text-white/40 font-bold uppercase tracking-widest text-[10px] border border-white/10 rounded-xl hover:bg-white/5 transition">Batal</button>
                            <button type="submit" disabled={categoryForm.processing} className="flex-1 py-3 bg-[#E84C30] text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all">
                                {categoryForm.processing ? 'Menyimpan...' : 'Simpan Kategori'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Recipe Modal */}
            <Modal show={!!recipeMenu} onClose={() => setRecipeMenu(null)} maxWidth="xl">
                <div className="bg-[#2D2D2D] text-left">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/5">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Bill of Materials (BOM)</h3>
                            <p className="text-[10px] text-[#E84C30] font-bold mt-0.5">{recipeMenu?.name}</p>
                        </div>
                        <button onClick={() => setRecipeMenu(null)} className="text-white/20 hover:text-white transition text-2xl">&times;</button>
                    </div>

                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {recipeRows.map((row, index) => (
                            <div key={index} className="flex items-center gap-3 group animate-in slide-in-from-right duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex-1">
                                    <select
                                        value={row.material_id}
                                        onChange={e => updateRecipeRow(index, 'material_id', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none"
                                    >
                                        <option value="" className="bg-[#2D2D2D]">Pilih Bahan...</option>
                                        {materials?.map(m => (
                                            <option key={m.id} value={m.id} className="bg-[#2D2D2D]">{m.name} ({m.unit})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24 relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={row.qty}
                                        onChange={e => updateRecipeRow(index, 'qty', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#E84C30]/40 outline-none font-mono"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-white/20 uppercase font-bold">
                                        {materials?.find(m => m.id === parseInt(row.material_id))?.unit}
                                    </span>
                                </div>
                                <button onClick={() => removeRecipeRow(index)} className="p-2 text-white/10 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={addRecipeRow}
                            className="w-full py-3 border border-dashed border-white/10 rounded-xl text-white/20 hover:text-white/40 hover:border-white/20 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Tambah Baris Bahan
                        </button>
                    </div>

                    <div className="p-6 border-t border-white/5 flex gap-3 bg-black/5">
                        <button onClick={() => setRecipeMenu(null)} className="flex-1 py-3 text-white/40 font-bold uppercase tracking-widest text-[10px] border border-white/10 rounded-xl hover:bg-white/5 transition">Batal</button>
                        <button onClick={saveRecipes} className="flex-1 py-3 bg-emerald-500 text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all">
                            Simpan BOM ({recipeRows.filter(r => r.material_id && r.qty).length})
                        </button>
                    </div>
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

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}} />
        </AdminLayout>
    );
}
