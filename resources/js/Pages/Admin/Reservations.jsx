import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Reservations({ reservations, rooms, menus }) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const tables = rooms ? rooms.flatMap(room => room.tables || []) : [];
    const [form, setForm] = useState({
        table_id: '',
        table_ids: [],
        customer_name: '',
        customer_phone: '',
        pax: 2,
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '19:00',
        status: 'confirmed',
        is_dp_required: false,
        dp_percentage: 0,
        payment_mode: 'none',
        notes: '',
        menus: [] // {id, qty, name, price}
    });

    const [availableOptions, setAvailableOptions] = useState(null);
    const [searching, setSearching] = useState(false);

    // Menu Browser State
    const [showBrowser, setShowBrowser] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    const categories = React.useMemo(() => {
        if (!menus) return [];
        const cats = Array.from(new Set(menus.map(m => m.category?.name))).filter(Boolean);
        return cats;
    }, [menus]);

    const filteredMenus = React.useMemo(() => {
        if (!menus) return [];
        return menus.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = !selectedCategory || m.category?.name === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menus, searchQuery, selectedCategory]);

    const addMenu = (menu) => {
        const existing = form.menus.find(m => m.id === menu.id);
        if (existing) {
            setForm({
                ...form,
                menus: form.menus.map(m => m.id === menu.id ? { ...m, qty: m.qty + 1 } : m)
            });
        } else {
            setForm({
                ...form,
                menus: [...form.menus, {
                    id: menu.id,
                    qty: 1,
                    name: menu.name,
                    price: menu.price
                }]
            });
        }
    };

    const updateMenuQty = (id, delta) => {
        setForm({
            ...form,
            menus: form.menus.map(m => {
                if (m.id === id) {
                    const newQty = m.qty + delta;
                    return newQty > 0 ? { ...m, qty: newQty } : m;
                }
                return m;
            })
        });
    };

    const removeMenu = (id) => {
        setForm({
            ...form,
            menus: form.menus.filter(m => m.id !== id)
        });
    };

    const totalEstimasi = form.menus.reduce((acc, m) => acc + (m.qty * m.price), 0);

    const openAdd = () => {
        setEditing(null);
        setAvailableOptions(null);
        setForm({
            table_id: '',
            table_ids: [],
            customer_name: '',
            customer_phone: '',
            pax: 2,
            reservation_date: new Date().toISOString().split('T')[0],
            reservation_time: '19:00',
            status: 'confirmed',
            is_dp_required: false,
            dp_percentage: 0,
            payment_mode: 'none',
            notes: '',
            menus: []
        });
        setShowModal(true);
    };

    const openEdit = (res) => {
        setEditing(res);
        setAvailableOptions(null);
        setForm({
            table_id: res.tables && res.tables.length > 0 ? res.tables[0].id : '',
            table_ids: res.tables ? res.tables.map(t => t.id) : [],
            customer_name: res.customer_name,
            customer_phone: res.customer_phone || '',
            pax: res.pax,
            reservation_date: res.reservation_date,
            reservation_time: res.start_time.substring(0, 5),
            status: res.status,
            is_dp_required: res.is_dp_required || false,
            dp_percentage: res.dp_percentage || 0,
            payment_mode: res.payment_mode || 'none',
            notes: res.notes || '',
            menus: res.menus ? res.menus.map(m => ({
                id: m.menu_id,
                qty: m.quantity,
                name: m.menu?.name,
                price: m.price_snapshot
            })) : []
        });
        setShowModal(true);
    };

    const checkAvailability = async () => {
        setSearching(true);
        setAvailableOptions(null);
        try {
            const response = await axios.post('/api/v1/reservations/check-availability', {
                reservation_date: form.reservation_date,
                start_time: form.reservation_time,
                guest_count: form.pax
            });
            setAvailableOptions(response.data.available_options);
        } catch (err) {
            alert('Gagal mengecek ketersediaan meja.');
        } finally {
            setSearching(false);
        }
    };

    const handleSelectOption = (option) => {
        setForm({
            ...form,
            table_ids: option.tables.map(t => t.id),
            table_id: option.tables[0].id // fallback
        });
        setAvailableOptions(null);
    };

    const submit = (e) => {
        e.preventDefault();
        const payload = { ...form };
        if (editing) {
            router.put(`/admin/reservations/${editing.id}`, payload, { onSuccess: () => setShowModal(false) });
        } else {
            router.post('/admin/reservations', payload, { onSuccess: () => setShowModal(false) });
        }
    };

    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    const destroy = (id) => {
        setConfirmModal({
            show: true, title: 'Hapus Reservasi', message: 'Anda yakin ingin menghapus data reservasi ini?', type: 'danger',
            onConfirm: () => { router.delete(`/admin/reservations/${id}`); setConfirmModal({ show: false }); }
        });
    };

    const getStatusStyle = (status) => {
        const styles = {
            'draft': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            'pending_payment': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
            'confirmed': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
            'preparing': 'bg-purple-500/20 text-purple-500 border-purple-500/30',
            'ready': 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
            'checked_in': 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
            'completed': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            'cancelled': 'bg-red-500/20 text-red-500 border-red-500/30',
            'rejected': 'bg-red-900/20 text-red-700 border-red-900/30',
            'no_show': 'bg-orange-500/20 text-orange-500 border-orange-500/30',
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    return (
        <AdminLayout title="Table Reservations">
            <div className="p-4 md:p-4 max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Table Reservations</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Kelola pemesanan meja pelanggan</p>
                    </div>
                    <button onClick={openAdd} className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-[#E84C30]/20 transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Tambah Reservasi
                    </button>
                </div>

                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/20 text-xs uppercase" style={{ color: 'var(--g-text-muted)' }}>
                                <tr>
                                    <th className="px-4 py-2 font-bold tracking-wider">Tamu</th>
                                    <th className="px-4 py-2 font-bold tracking-wider">Meja / Pax</th>
                                    <th className="px-4 py-2 font-bold tracking-wider">Tanggal & Waktu</th>
                                    <th className="px-4 py-2 font-bold tracking-wider">Status</th>
                                    <th className="px-4 py-2 font-bold tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: 'var(--g-border)' }}>
                                {reservations.map((res) => (
                                    <tr key={res.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-2">
                                            <div className="font-bold" style={{ color: 'var(--g-text-primary)' }}>{res.customer_name}</div>
                                            <div className="text-xs" style={{ color: 'var(--g-text-muted)' }}>{res.customer_phone || '-'}</div>
                                            {res.notes && <div className="text-[10px] mt-1 italic text-yellow-500/70">{res.notes}</div>}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-bold flex items-center gap-2" style={{ color: 'var(--g-text-primary)' }}>
                                                {res.tables?.map(t => t.name).join(' + ') || 'No Table'}
                                            </div>
                                            <div className="text-xs mt-1" style={{ color: 'var(--g-text-muted)' }}>{res.pax} Orang</div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-bold" style={{ color: 'var(--g-text-primary)' }}>{new Date(res.reservation_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                            <div className="text-xs font-mono mt-1 text-emerald-400">{res.reservation_time.substring(0, 5)} WIB</div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2.5 py-1 text-[10px] font-normal uppercase tracking-widest rounded-lg border ${getStatusStyle(res.status)}`}>
                                                {res.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEdit(res)} className="p-3 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                <button onClick={() => destroy(res.id)} className="p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {reservations.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-3 py-12 text-center text-sm" style={{ color: 'var(--g-text-muted)' }}>Belum ada data reservasi</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 py-12 overflow-y-auto">
                    <div className="fixed inset-0 transition-opacity duration-500" style={{ backgroundColor: 'var(--g-backdrop)', backdropFilter: 'blur(8px)' }} onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-xl rounded-lg overflow-hidden shadow-2xl transition-all duration-500 my-auto" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border-strong)' }}>
                        <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                            <div>
                                <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>{editing ? 'Edit Reservasi' : 'Tambah Reservasi'}</h3>
                                <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">{editing ? 'Update booking detail' : 'Create new reservation'}</p>
                            </div>
                            <button type="button" onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>

                        <form onSubmit={submit} className="px-4 pb-6 pt-0">
                            <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 space-y-6">
                                {/* Row 1: Customer info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Nama Lengkap</label>
                                        <input type="text" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} placeholder="Nama Pelanggan" required />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>No. WhatsApp</label>
                                        <input type="text" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} placeholder="0812..." />
                                    </div>
                                </div>

                                {/* Row 2: Date & Time */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Tanggal</label>
                                        <input type="date" value={form.reservation_date} onChange={e => setForm({ ...form, reservation_date: e.target.value })} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Waktu</label>
                                        <input type="time" value={form.reservation_time} onChange={e => setForm({ ...form, reservation_time: e.target.value })} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Tamu (Pax)</label>
                                        <input type="number" min="1" value={form.pax} onChange={e => setForm({ ...form, pax: e.target.value })} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 text-center" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                                    </div>
                                </div>

                                {/* Smart Allocation Section */}
                                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-tertiary)', borderColor: 'var(--g-border)' }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#E84C30]"></div>
                                            <h4 className="text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Alokasi Meja</h4>
                                        </div>
                                        <button type="button" onClick={checkAvailability} disabled={searching} className="text-[9px] font-normal uppercase tracking-widest text-[#E84C30] hover:opacity-80 transition-all flex items-center gap-2">
                                            {searching ? 'Processing...' : 'Auto-Allocate'}
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-4 gap-2">
                                            {tables.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const ids = form.table_ids.includes(t.id)
                                                            ? form.table_ids.filter(id => id !== t.id)
                                                            : [...form.table_ids, t.id];
                                                        setForm({ ...form, table_ids: ids, table_id: ids[0] || '' });
                                                    }}
                                                    className={`p-2.5 rounded-lg border transition-all text-[10px] font-normal uppercase tracking-wider ${form.table_ids.includes(t.id)
                                                        ? 'bg-[#E84C30] border-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20'
                                                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                                                >
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>

                                        {availableOptions && availableOptions.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                                {availableOptions.map((opt, i) => (
                                                    <button key={i} type="button" onClick={() => handleSelectOption(opt)} className="text-left p-3 rounded-lg border transition-all hover:bg-white/5" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-normal text-white">{opt.label || opt.name}</span>
                                                            <span className="text-[8px] font-normal text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded-lg">Match</span>
                                                        </div>
                                                        <div className="text-[9px] text-white/30 font-bold">{opt.tables.map(t => t.name).join(' + ')}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pre-order Menu Section */}
                                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-tertiary)', borderColor: 'var(--g-border)' }}>
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#E84C30]"></div>
                                            <label className="text-[10px] font-normal uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Pre-order Menu</label>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowBrowser(true)}
                                            className="text-[#E84C30] text-[9px] font-normal uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1.5"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                                            Pilih Menu
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {form.menus.length === 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowBrowser(true)}
                                                className="w-full h-[64px] border-2 border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 group hover:border-[#E84C30]/30 transition-all"
                                            >
                                                <span className="text-[10px] font-bold text-white/20 group-hover:text-[#E84C30]/50 tracking-widest uppercase">Belum ada menu dipilih</span>
                                                <span className="text-[9px] font-medium text-white/10 group-hover:text-white/20">Klik untuk menambah menu pre-order</span>
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                {form.menus.map((m) => (
                                                    <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                                        <div className="flex-1">
                                                            <div className="text-[11px] font-normal" style={{ color: 'var(--g-text-primary)' }}>{m.name}</div>
                                                            <div className="text-[9px]" style={{ color: 'var(--g-text-muted)' }}>{m.qty}x · Rp {Number(m.price).toLocaleString()}</div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[11px] font-normal" style={{ color: 'var(--g-text-secondary)' }}>Rp {(m.qty * m.price).toLocaleString()}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeMenu(m.id)}
                                                                className="p-1.5 text-red-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-between px-4 py-2 bg-[#E84C30]/10 rounded-lg border border-[#E84C30]/20 mt-4">
                                                    <span className="text-[10px] font-normal text-[#E84C30] uppercase tracking-widest">Total Estimasi Menu</span>
                                                    <span className="text-sm font-normal" style={{ color: 'var(--g-text-primary)' }}>Rp {totalEstimasi.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Payment Mode</label>
                                        <select value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value, is_dp_required: e.target.value === 'dp' })} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required>
                                            <option value="none">No Payment</option>
                                            <option value="dp">Down Payment (DP)</option>
                                            <option value="full">Full Payment</option>
                                        </select>
                                    </div>
                                    {form.payment_mode === 'dp' && (
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>DP Percentage (%)</label>
                                            <input type="number" min="0" max="100" value={form.dp_percentage} onChange={e => setForm({ ...form, dp_percentage: e.target.value })} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {editing && (
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Status</label>
                                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required>
                                                <option value="draft">Draft</option>
                                                <option value="pending_payment">Pending Payment</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="ready">Ready</option>
                                                <option value="checked_in">Checked In</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="no_show">No Show</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5 px-1">
                                            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--g-text-tertiary)' }}>Catatan</label>
                                            <span className="text-[8px] font-normal uppercase text-gray-600">Optional</span>
                                        </div>
                                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full text-xs font-medium rounded-lg px-3 py-1.5 outline-none border min-h-[64px] transition-all resize-none" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} placeholder="Add notes..." />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white/40 font-bold hover:bg-white/5 transition text-sm">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-sm">
                                    {editing ? 'Update' : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Menu Browser Modal Overlay */}
            {
                showBrowser && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500" onClick={() => setShowBrowser(false)}></div>

                        <div className="relative w-full max-w-7xl bg-[#222222] border border-white/5 rounded-lg overflow-hidden shadow-2xl shadow-black animate-bounce-in max-h-[90vh] flex flex-col text-white">
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="p-4 pb-2 flex justify-between items-center text-white">
                                    <div>
                                        <h2 className="text-2xl font-normal tracking-tight leading-tight">Pilih Menu Pre-order</h2>
                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Select items for reservation</p>
                                    </div>
                                    <button onClick={() => setShowBrowser(false)} className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all group">
                                        <svg className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>

                                <div className="flex-1 flex overflow-hidden p-2 gap-4">
                                    {/* Left: Menu Grid */}
                                    <div className="flex-1 flex flex-col gap-4 overflow-hidden text-white">
                                        {/* Search & Categories */}
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="relative flex-1 group">
                                                <input
                                                    type="text"
                                                    placeholder="Cari menu favorit..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-12 pr-4 text-sm font-bold placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#E84C30]/50 transition-all text-white"
                                                />
                                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#E84C30] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCategory(null)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-normal uppercase tracking-widest whitespace-nowrap transition-all border ${!selectedCategory ? 'bg-[#E84C30] border-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                                                >
                                                    Semua
                                                </button>
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={`px-4 py-2 rounded-lg text-[10px] font-normal uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-[#E84C30] border-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Scrollable Grid */}
                                        <div className="flex-1 overflow-y-auto no-scrollbar pb-10 custom-scrollbar">
                                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {filteredMenus.map(menu => (
                                                    <button
                                                        key={menu.id}
                                                        type="button"
                                                        onClick={() => addMenu(menu)}
                                                        className="group relative flex flex-col bg-white/5 border border-white/5 rounded-lg overflow-hidden hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 text-left"
                                                    >
                                                        <div className="aspect-[4/3] w-full overflow-hidden bg-white/5 relative">
                                                            {menu.image_url ? (
                                                                <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-white/10">
                                                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                                <span className="text-white text-[10px] font-normal uppercase tracking-widest">Tambah ke Pesanan</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-2 flex-1 flex flex-col gap-1">
                                                            <div className="text-[9px] font-normal text-[#E84C30] uppercase tracking-widest">{menu.category?.name}</div>
                                                            <div className="text-sm font-normal text-white leading-tight mb-2">{menu.name}</div>
                                                            <div className="mt-auto text-sm font-normal text-emerald-400">Rp {Number(menu.price).toLocaleString()}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Order Summary */}
                                    <div className="w-[320px] flex flex-col bg-black/40 border border-white/10 rounded-lg overflow-hidden animate-slide-up text-white">
                                        <div className="p-2 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                            <h3 className="text-[11px] font-normal uppercase tracking-widest text-white/60">Ringkasan Pesanan</h3>
                                            <span className="bg-[#E84C30] text-white text-[10px] font-normal px-2 py-0.5 rounded-full">{form.menus.length}</span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
                                            {form.menus.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                                    <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                                    <p className="text-[10px] font-normal uppercase tracking-widest">Keranjang Kosong</p>
                                                </div>
                                            ) : (
                                                form.menus.map(m => (
                                                    <div key={m.id} className="group relative flex flex-col gap-2 p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-white/10 transition-all">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1 pr-2 text-left">
                                                                <div className="text-[11px] font-normal text-white leading-tight">{m.name}</div>
                                                                <div className="text-[9px] font-bold text-white/30 mt-0.5">@ Rp {Number(m.price).toLocaleString()}</div>
                                                            </div>
                                                            <button type="button" onClick={() => removeMenu(m.id)} className="p-1 text-white/10 hover:text-red-500 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <div className="flex items-center bg-black/40 rounded-lg overflow-hidden border border-white/10">
                                                                <button type="button" onClick={() => updateMenuQty(m.id, -1)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-all font-normal">-</button>
                                                                <div className="w-8 text-center text-[10px] font-normal text-white">{m.qty}</div>
                                                                <button type="button" onClick={() => updateMenuQty(m.id, 1)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-all font-normal">+</button>
                                                            </div>
                                                            <div className="text-[11px] font-normal text-emerald-400">Rp {(m.qty * m.price).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="p-2 border-t border-white/10 bg-white/5 flex flex-col gap-4">
                                            <div className="flex justify-between items-end">
                                                <div className="text-[10px] font-normal uppercase tracking-widest text-[#E84C30]">Total Estimasi</div>
                                                <div className="text-2xl font-normal text-white leading-none">
                                                    <span className="text-xs mr-1 opacity-40">Rp</span>
                                                    {totalEstimasi.toLocaleString()}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowBrowser(false)}
                                                className="w-full bg-[#E84C30] hover:bg-[#D4432A] text-white py-2 rounded-lg text-[10px] font-normal uppercase tracking-widest shadow-xl shadow-[#E84C30]/20 transition-all active:scale-95"
                                            >
                                                Simpan Pilihan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
            />
        </AdminLayout >
    );
}

