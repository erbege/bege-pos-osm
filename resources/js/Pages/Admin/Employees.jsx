import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import Drawer from '@/Components/Drawer';

export default function Employees({ employees, roles, positions }) {
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [insightEmployee, setInsightEmployee] = useState(null);
    const [showInsight, setShowInsight] = useState(false);
    const [editing, setEditing] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });

    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nip: '',
        name: '',
        phone: '',
        address: '',
        position_id: '',
        employment_status: 'contract',
        status: 'off_duty',
        join_date: '',
        base_salary: 0,
        hourly_rate: 0,
        pay_type: 'salary_and_hourly',
        bank_name: '',
        bank_account_name: '',
        bank_account_number: '',
        gender: '',
        birth_date: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        bpjs_number: '',
        tax_id: '',
        contract_end_date: '',
        notes: '',
        email: '',
        role: '',
        photo: null,
    });

    const payTypeLabels = {
        salary_and_hourly: 'Gaji Pokok + Per Jam',
        salary_only: 'Gaji Pokok',
        hourly_only: 'Per Jam',
    };

    const payTypeBadgeStyles = {
        salary_and_hourly: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        salary_only: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        hourly_only: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.nip && e.nip.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [employees, searchTerm]);

    const openModal = (e = null) => {
        if (e) {
            setEditing(e);
            setData({
                nip: e.nip || '',
                name: e.name,
                phone: e.phone || '',
                address: e.address || '',
                position_id: e.position_id || '',
                employment_status: e.employment_status || 'contract',
                status: e.status || 'off_duty',
                join_date: e.join_date || '',
                base_salary: e.base_salary,
                hourly_rate: e.hourly_rate || 0,
                pay_type: e.pay_type || 'salary_and_hourly',
                bank_name: e.bank_name || '',
                bank_account_name: e.bank_account_name || '',
                bank_account_number: e.bank_account_number || '',
                gender: e.gender || '',
                birth_date: e.birth_date || '',
                emergency_contact_name: e.emergency_contact_name || '',
                emergency_contact_phone: e.emergency_contact_phone || '',
                bpjs_number: e.bpjs_number || '',
                tax_id: e.tax_id || '',
                contract_end_date: e.contract_end_date || '',
                notes: e.notes || '',
                email: e.user?.email || '',
                role: e.user?.roles?.[0]?.name || '',
                photo: null,
            });
        } else {
            setEditing(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const openInsight = (e) => {
        setInsightEmployee(e);
        setShowInsight(true);
    };

    const submit = (e) => {
        e.preventDefault();
        // Since we have a file (photo), we must use post with _method spoofing if updating
        if (editing) {
            router.post(route('admin.employees.update', editing.id), {
                ...data,
                _method: 'PUT'
            }, {
                onSuccess: () => setIsModalOpen(false)
            });
        } else {
            post(route('admin.employees.store'), {
                onSuccess: () => setIsModalOpen(false)
            });
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Pegawai',
            message: 'Apakah Anda yakin ingin menghapus data pegawai ini? Akun login terkait juga akan dihapus.',
            type: 'danger',
            onConfirm: () => {
                router.delete(route('admin.employees.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const handleDeletePhoto = () => {
        if (!editing) return;
        setConfirmModal({
            show: true,
            title: 'Hapus Foto',
            message: 'Apakah Anda yakin ingin menghapus foto profil ini?',
            type: 'danger',
            onConfirm: () => {
                router.delete(route('admin.employees.photo.delete', editing.id), {
                    onSuccess: () => {
                        closeConfirm();
                        setEditing({ ...editing, photo_path: null });
                    }
                });
            }
        });
    };

    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'in_duty': return 'bg-emerald-500 text-white';
            case 'off_duty': return 'bg-gray-500 text-white';
            case 'on_leave': return 'bg-blue-500 text-white';
            case 'inactive': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <AdminLayout title="Data Pegawai">
            <Head title="Pegawai" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Manajemen Pegawai</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Kelola data personal, jabatan, dan rate penggajian</p>
                    </div>
                    <button onClick={() => openModal()} className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[#E84C30]/20 transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Tambah Pegawai
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">In Duty</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>{employees.filter(e => e.status === 'in_duty').length}</div>
                    </div>
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Off Duty</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>{employees.filter(e => e.status === 'off_duty').length}</div>
                    </div>
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">On Leave</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>{employees.filter(e => e.status === 'on_leave').length}</div>
                    </div>
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Inactive</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>{employees.filter(e => e.status === 'inactive').length}</div>
                    </div>
                </div>

                {/* Search Bar & View Toggle */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 p-4 rounded-lg border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari nama atau NIP..."
                                className="w-full text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all"
                                style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="p-1 rounded-lg border flex gap-1 h-fit" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20' : 'text-white/40 hover:text-white'}`}
                            title="Table View"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20' : 'text-white/40 hover:text-white'}`}
                            title="Card View"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012-2v-2z"></path></svg>
                        </button>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b" style={{ borderColor: 'var(--g-border)', backgroundColor: 'var(--g-bg-tertiary)' }}>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Pegawai</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">NIP</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Jabatan</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-center">Status</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-center">Model Gaji</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Gaji Pokok</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Rate / Jam</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredEmployees.map((e) => (
                                        <tr key={e.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3 cursor-pointer group/name" onClick={() => openInsight(e)}>
                                                    <div className="w-8 h-8 rounded-full border border-white/5 overflow-hidden bg-[#E84C30]/10 flex items-center justify-center text-xs font-black text-[#E84C30] shrink-0 group-hover/name:scale-110 transition-transform">
                                                        {e.photo_path ? (
                                                            <img src={`/storage/${e.photo_path}`} className="w-full h-full object-cover" alt="" />
                                                        ) : e.name.charAt(0)}
                                                    </div>
                                                    <div className="font-bold text-white text-sm group-hover/name:text-[#E84C30] transition-colors">{e.name}</div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-mono text-white/60">{e.nip || '-'}</td>
                                            <td className="p-4">
                                                <div className="text-[10px] uppercase font-black text-[#E84C30]/80">{e.position?.name || 'Staff'}</div>
                                                <div className="text-[8px] uppercase font-bold opacity-30 tracking-widest">{e.employment_status}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${getStatusStyles(e.status)}`}>
                                                    {e.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${payTypeBadgeStyles[e.pay_type] || payTypeBadgeStyles.salary_and_hourly}`}>
                                                    {payTypeLabels[e.pay_type] || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs font-mono text-white/60">{fmt(e.base_salary)}</td>
                                            <td className="p-4 text-xs font-mono text-emerald-400/80 font-bold">{fmt(e.hourly_rate)}</td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openModal(e)} className="p-2 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-all" title="Edit">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00-2 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                    </button>
                                                    <button onClick={() => handleDelete(e.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all" title="Delete">
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
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredEmployees.map((e) => (
                            <div
                                key={e.id}
                                className="group relative rounded-xl border border-white/5 p-5 transition-all duration-500 hover:border-[#E84C30]/30 hover:shadow-2xl hover:shadow-[#E84C30]/5 hover:-translate-y-1 overflow-hidden"
                                style={{ backgroundColor: 'var(--g-bg-secondary)' }}
                            >
                                {/* Background Aesthetic Glow */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#E84C30]/5 blur-[80px] rounded-full group-hover:bg-[#E84C30]/10 transition-colors duration-500"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Header: Avatar & Status */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div
                                            className="relative cursor-pointer group/avatar"
                                            onClick={() => openInsight(e)}
                                        >
                                            <div className="w-20 h-20 rounded-xl border border-white/10 overflow-hidden bg-[#E84C30]/5 flex items-center justify-center transition-all duration-500 group-hover/avatar:rounded-[2rem] group-hover/avatar:border-[#E84C30]/40 group-hover/avatar:scale-105 shadow-xl">
                                                {e.photo_path ? (
                                                    <img src={`/storage/${e.photo_path}`} className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" alt="" />
                                                ) : (
                                                    <span className="text-3xl font-light text-[#E84C30]/40">{e.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            {/* Status Dot Overlay */}
                                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#1A1A1A] ${getStatusStyles(e.status).split(' ')[0]}`}></div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`text-[8px] px-2.5 py-1 rounded-full font-bold uppercase tracking-[0.15em] border border-white/5 shadow-sm ${getStatusStyles(e.status)}`}>
                                                {e.status.replace('_', ' ')}
                                            </span>
                                            <div className="text-[10px] font-mono text-white/20 tracking-tighter">#{e.nip || 'NO-NIP'}</div>
                                        </div>
                                    </div>

                                    {/* Body: Identity */}
                                    <div className="mb-6">
                                        <h3
                                            className="text-white font-medium text-lg leading-tight mb-1 cursor-pointer hover:text-[#E84C30] transition-colors line-clamp-1"
                                            onClick={() => openInsight(e)}
                                        >
                                            {e.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">{e.position?.name || 'Staff'}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">{e.employment_status}</span>
                                        </div>
                                    </div>

                                    {/* Pay Type Badge */}
                                    <div className="mb-3">
                                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ${payTypeBadgeStyles[e.pay_type] || payTypeBadgeStyles.salary_and_hourly}`}>
                                            {payTypeLabels[e.pay_type] || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Stats: Rates */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 transition-colors group-hover:bg-white/[0.04]">
                                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">Hourly Rate</p>
                                            <p className="text-xs font-bold text-emerald-400 font-mono tracking-tighter">{fmt(e.hourly_rate)}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 transition-colors group-hover:bg-white/[0.04]">
                                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">Base Salary</p>
                                            <p className="text-xs font-bold text-white font-mono tracking-tighter">{fmt(e.base_salary)}</p>
                                        </div>
                                    </div>

                                    {/* Footer: Actions */}
                                    <div className="mt-auto flex items-center gap-2 pt-2">
                                        <button
                                            onClick={() => openModal(e)}
                                            className="flex-1 py-3 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all border border-white/5 hover:border-white/10"
                                        >
                                            Edit Profil
                                        </button>
                                        <button
                                            onClick={() => openInsight(e)}
                                            className="p-3 bg-[#E84C30]/10 text-[#E84C30] hover:bg-[#E84C30] hover:text-white rounded-xl transition-all border border-[#E84C30]/10"
                                            title="View Insight"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(e.id)}
                                            className="p-3 bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/5"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Employee Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="2xl">
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border-strong)' }}>
                    <div className="p-4 pb-4 flex justify-between items-center bg-black/5" style={{ borderBottom: '1px solid var(--g-border)' }}>
                        <div className="text-left">
                            <h3 className="text-lg font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>{editing ? 'Edit Profil Pegawai' : 'Tambah Pegawai Baru'}</h3>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">Data personal & Rate penggajian</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <form onSubmit={submit} className="p-4 space-y-6 text-left max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">Data Personal</h4>

                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group transition-all bg-black/20">
                                        {data.photo ? (
                                            <div className="relative w-full h-full group">
                                                <img src={URL.createObjectURL(data.photo)} className="w-full h-full object-cover" alt="" />
                                                <button type="button" onClick={() => setData('photo', null)} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] text-white font-black uppercase">Batal</button>
                                            </div>
                                        ) : editing?.photo_path ? (
                                            <div className="relative w-full h-full group">
                                                <img src={`/storage/${editing.photo_path}`} className="w-full h-full object-cover" alt="" />
                                                <button type="button" onClick={handleDeletePhoto} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] text-white font-black uppercase">Hapus Foto</button>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setData('photo', e.target.files[0])} accept="image/*" />
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Status Keaktifan</label>
                                        <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                            <option value="in_duty">In Duty (Active)</option>
                                            <option value="off_duty">Off Duty</option>
                                            <option value="on_leave">On Leave</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">NIP (Nomor Induk Pegawai)</label>
                                    <input type="text" value={data.nip} onChange={e => setData('nip', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Nama Lengkap *</label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">No. Telepon</label>
                                    <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                            </div>

                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">Jabatan & Kontrak</h4>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Jabatan / Posisi</label>
                                    <select
                                        value={data.position_id}
                                        onChange={e => setData('position_id', e.target.value)}
                                        className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer"
                                        style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}
                                    >
                                        <option value="">Pilih Jabatan...</option>
                                        {positions.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {errors.position_id && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.position_id}</div>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Status Kepegawaian</label>
                                    <select value={data.employment_status} onChange={e => setData('employment_status', e.target.value)} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                        <option value="permanent">Permanent</option>
                                        <option value="contract">Contract</option>
                                        <option value="intern">Intern</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Tanggal Bergabung</label>
                                    <input type="date" value={data.join_date} onChange={e => setData('join_date', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Alamat</label>
                                    <input type="text" value={data.address} onChange={e => setData('address', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                </div>
                            </div>

                            <div className="col-span-2 space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">Data Personal Tambahan</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Jenis Kelamin</label>
                                        <select value={data.gender} onChange={e => setData('gender', e.target.value)} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                            <option value="">-</option>
                                            <option value="male">Laki-laki</option>
                                            <option value="female">Perempuan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Tanggal Lahir</label>
                                        <input type="date" value={data.birth_date} onChange={e => setData('birth_date', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Kontrak Berakhir</label>
                                        <input type="date" value={data.contract_end_date} onChange={e => setData('contract_end_date', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all [color-scheme:dark]" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Kontak Darurat (Nama)</label>
                                        <input type="text" value={data.emergency_contact_name} onChange={e => setData('emergency_contact_name', e.target.value)} placeholder="Nama keluarga/wali" className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Kontak Darurat (No HP)</label>
                                        <input type="text" value={data.emergency_contact_phone} onChange={e => setData('emergency_contact_phone', e.target.value)} placeholder="08xxx" className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">No. BPJS</label>
                                        <input type="text" value={data.bpjs_number} onChange={e => setData('bpjs_number', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">NPWP</label>
                                        <input type="text" value={data.tax_id} onChange={e => setData('tax_id', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">Sistem Penggajian</h4>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Model Perhitungan Gaji *</label>
                                    <select value={data.pay_type} onChange={e => setData('pay_type', e.target.value)} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required>
                                        <option value="salary_and_hourly">Gaji Pokok + Upah Per Jam</option>
                                        <option value="salary_only">Gaji Pokok Saja</option>
                                        <option value="hourly_only">Upah Per Jam Saja</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {data.pay_type !== 'hourly_only' && (
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Gaji Pokok (Monthly) *</label>
                                            <input type="number" value={data.base_salary} onChange={e => setData('base_salary', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                                        </div>
                                    )}
                                    {data.pay_type !== 'salary_only' && (
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Rate Per Jam *</label>
                                            <input type="number" value={data.hourly_rate} onChange={e => setData('hourly_rate', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Catatan Internal</label>
                                    <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} className="w-full text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all resize-none" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} rows={2} placeholder="Catatan khusus tentang karyawan ini..." />
                                </div>
                            </div>

                            <div className="col-span-2 space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">Rekening Bank (Untuk Payroll)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Bank</label>
                                        <input type="text" placeholder="BCA, Mandiri..." value={data.bank_name} onChange={e => setData('bank_name', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">No. Rekening</label>
                                        <input type="text" value={data.bank_account_number} onChange={e => setData('bank_account_number', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Atas Nama Rekening</label>
                                        <input type="text" value={data.bank_account_name} onChange={e => setData('bank_account_name', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                </div>
                            </div>

                            {!editing && (
                                <div className="col-span-2 space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#E84C30]">Akses Login</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Email Address</label>
                                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Role / Hak Akses</label>
                                            <select value={data.role} onChange={e => setData('role', e.target.value)} className="w-full text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                                <option value="">— No access —</option>
                                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-white/40 font-bold hover:bg-white/5 transition text-sm">Batal</button>
                            <button type="submit" disabled={processing} className="flex-[2] px-4 py-3 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition-all text-sm uppercase tracking-widest">
                                {processing ? 'Menyimpan...' : 'Simpan Data Pegawai'}
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
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />

            {/* Employee Insight Drawer */}
            <Drawer
                show={showInsight}
                onClose={() => setShowInsight(false)}
                title={null}
            >
                {insightEmployee && (
                    <div className="space-y-8 text-left pb-10">
                        {/* Profile Header - Full Width Photo with Overlay */}
                        <div className="relative w-full h-[320px] overflow-hidden group">
                            <div className="absolute inset-0 bg-[#E84C30]/5 flex items-center justify-center">
                                {insightEmployee.photo_path ? (
                                    <img
                                        src={`/storage/${insightEmployee.photo_path}`}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt=""
                                    />
                                ) : (
                                    <span className="text-8xl font-black text-[#E84C30]/20 select-none">{insightEmployee.name.charAt(0)}</span>
                                )}
                            </div>

                            {/* Aesthetic Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/20 to-transparent"></div>

                            {/* Info at Bottom Left */}
                            <div className="absolute bottom-0 left-0 p-4 space-y-1 text-left">
                                <div className="inline-block px-2 py-0.5 rounded bg-[#E84C30] text-[8px] font-black uppercase tracking-widest text-white mb-1 shadow-lg shadow-[#E84C30]/20">
                                    {insightEmployee.position?.name || 'Staff'}
                                </div>
                                <h2 className="text-2xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tight">
                                    {insightEmployee.name}
                                </h2>
                                <p className="text-[10px] font-mono text-white/60 flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-[#E84C30]"></span>
                                    NIP: {insightEmployee.nip || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="px-4 space-y-8">
                            {/* Performance & Status */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                                    <p className="text-[9px] font-bold uppercase text-white/30 tracking-widest">Performance</p>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <svg key={star} className={`w-3.5 h-3.5 ${star <= (insightEmployee.performance_reviews?.[0]?.rating || 4) ? 'fill-current' : 'text-white/10'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                        ))}
                                        <span className="text-[10px] font-black text-white ml-1">{insightEmployee.performance_reviews?.[0]?.rating || '4.0'}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                                    <p className="text-[9px] font-bold uppercase text-white/30 tracking-widest">Duty Status</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${getStatusStyles(insightEmployee.status).split(' ')[0]}`}></span>
                                        <span className="text-[10px] font-black text-white uppercase">{insightEmployee.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Active Shift / Schedule */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold uppercase text-white/20 tracking-[0.2em] px-1">Upcoming Schedule</h4>
                                <div className="space-y-2">
                                    {insightEmployee.schedules?.length > 0 ? (
                                        insightEmployee.schedules.slice(0, 7).map(sch => (
                                            <div key={sch.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                                                <div>
                                                    <p className="text-xs font-bold text-white">{new Date(sch.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                                    <p className="text-[9px] text-white/40 uppercase">{sch.shift?.name} ({sch.shift?.start_time} - {sch.shift?.end_time})</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[8px] font-black uppercase text-[#E84C30] bg-[#E84C30]/10 px-2 py-0.5 rounded">{sch.role_note || insightEmployee.position?.name || 'Staff'}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center rounded-lg border border-dashed border-white/10 opacity-40">
                                            <p className="text-[10px] font-bold uppercase">No upcoming shift</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Account & Access */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold uppercase text-white/20 tracking-[0.2em] px-1">Account & Access</h4>
                                <div className="rounded-lg bg-white/[0.03] border border-white/5 divide-y divide-white/5">
                                    <div className="p-4 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">Role / Hak Akses</span>
                                        <span className="text-[10px] font-black text-white bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">{insightEmployee.user?.roles?.[0]?.name || 'No System Access'}</span>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">Email</span>
                                        <span className="text-[10px] font-bold text-white">{insightEmployee.user?.email || '-'}</span>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">Tanggal Gabung</span>
                                        <span className="text-[10px] font-bold text-white">{insightEmployee.join_date ? new Date(insightEmployee.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Info */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold uppercase text-white/20 tracking-[0.2em] px-1">Profesional & Penggajian</h4>
                                <div className="rounded-lg bg-white/[0.03] border border-white/5 divide-y divide-white/5">
                                    <div className="p-4 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">Employment Status</span>
                                        <span className="text-[10px] font-black text-white uppercase">{insightEmployee.employment_status}</span>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">Model Gaji</span>
                                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ${payTypeBadgeStyles[insightEmployee.pay_type] || payTypeBadgeStyles.salary_and_hourly}`}>
                                            {payTypeLabels[insightEmployee.pay_type] || 'N/A'}
                                        </span>
                                    </div>
                                    {insightEmployee.pay_type !== 'hourly_only' && (
                                        <div className="p-4 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-white/40 uppercase">Gaji Pokok</span>
                                            <span className="text-[10px] font-black text-white font-mono">{fmt(insightEmployee.base_salary)}</span>
                                        </div>
                                    )}
                                    {insightEmployee.pay_type !== 'salary_only' && (
                                        <div className="p-4 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-white/40 uppercase">Hourly Rate</span>
                                            <span className="text-[10px] font-black text-emerald-400 font-mono">{fmt(insightEmployee.hourly_rate)}</span>
                                        </div>
                                    )}
                                    {insightEmployee.contract_end_date && (
                                        <div className="p-4 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-white/40 uppercase">Kontrak Berakhir</span>
                                            <span className="text-[10px] font-black text-amber-400">{new Date(insightEmployee.contract_end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Personal Data */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold uppercase text-white/20 tracking-[0.2em] px-1">Data Personal</h4>
                                <div className="rounded-lg bg-white/[0.03] border border-white/5 divide-y divide-white/5">
                                    {insightEmployee.gender && (
                                        <div className="p-4 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-white/40 uppercase">Jenis Kelamin</span>
                                            <span className="text-[10px] font-black text-white">{insightEmployee.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
                                        </div>
                                    )}
                                    {insightEmployee.birth_date && (
                                        <div className="p-4 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-white/40 uppercase">Tanggal Lahir</span>
                                            <span className="text-[10px] font-black text-white">{new Date(insightEmployee.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                    {insightEmployee.bpjs_number && (
                                        <div className="p-4 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-white/40 uppercase">BPJS</span>
                                            <span className="text-[10px] font-black text-white font-mono">{insightEmployee.bpjs_number}</span>
                                        </div>
                                    )}
                                    {insightEmployee.tax_id && (
                                        <div className="p-4 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-white/40 uppercase">NPWP</span>
                                            <span className="text-[10px] font-black text-white font-mono">{insightEmployee.tax_id}</span>
                                        </div>
                                    )}
                                    {insightEmployee.emergency_contact_name && (
                                        <div className="p-4 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-white/40 uppercase">Kontak Darurat</span>
                                            <span className="text-[10px] font-black text-white">{insightEmployee.emergency_contact_name} • {insightEmployee.emergency_contact_phone || '-'}</span>
                                        </div>
                                    )}
                                    {insightEmployee.notes && (
                                        <div className="p-4">
                                            <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Catatan</span>
                                            <p className="text-[10px] text-white/70">{insightEmployee.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="p-4 rounded-lg bg-[#E84C30]/5 border border-[#E84C30]/10 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#E84C30]/10 flex items-center justify-center text-[#E84C30]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold uppercase text-[#E84C30]/60 tracking-widest">Phone Number</p>
                                    <p className="text-sm font-bold text-white truncate">{insightEmployee.phone || '-'}</p>
                                </div>
                                <button onClick={() => window.open(`https://wa.me/${insightEmployee.phone?.replace(/[^0-9]/g, '')}`, '_blank')} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.328-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.13.57-.072 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => { setShowInsight(false); openModal(insightEmployee); }} className="flex-1 py-3 bg-white/5 text-white hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-white/10">Edit Profile</button>
                                <button onClick={() => setShowInsight(false)} className="flex-1 py-3 bg-[#E84C30] text-white hover:bg-[#D4432A] rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#E84C30]/20">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
        </AdminLayout>
    );
}

