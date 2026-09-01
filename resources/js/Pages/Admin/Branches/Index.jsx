import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ branches }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        address: '',
        phone: '',
        is_active: true,
    });

    const openModal = (branch = null) => {
        if (branch) {
            setEditingBranch(branch);
            setData({ name: branch.name, address: branch.address || '', phone: branch.phone || '', is_active: Boolean(branch.is_active) });
        } else {
            setEditingBranch(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingBranch(null); reset(); };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingBranch) {
            put(route('admin.branches.update', editingBranch.id), { onSuccess: () => closeModal() });
        } else {
            post(route('admin.branches.store'), { onSuccess: () => closeModal() });
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Delete Branch',
            message: 'Are you sure you want to delete this branch? This action cannot be undone and will affect all data associated with this location.',
            type: 'danger',
            confirmText: 'Delete Branch',
            onConfirm: () => {
                destroy(route('admin.branches.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    return (
        <AdminLayout title="Branch Management">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-normal text-white">Restaurant Branches</h2>
                    <p className="text-xs text-white/30">Manage locations and their availability.</p>
                </div>
                <button onClick={() => openModal()} className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-3 py-1 rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#E84C30]/20">
                    + Add Branch
                </button>
            </div>

            <div className="bg-[#2D2D2D] rounded-lg border border-white/5 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 py-2 text-[10px] font-normal text-white/25 uppercase tracking-widest">Branch</th>
                            <th className="px-4 py-2 text-[10px] font-normal text-white/25 uppercase tracking-widest">Address</th>
                            <th className="px-4 py-2 text-[10px] font-normal text-white/25 uppercase tracking-widest">Phone</th>
                            <th className="px-4 py-2 text-[10px] font-normal text-white/25 uppercase tracking-widest text-center">Status</th>
                            <th className="px-4 py-2 text-[10px] font-normal text-white/25 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {branches.map((branch) => (
                            <tr key={branch.id} className="hover:bg-white/[0.02] transition">
                                <td className="px-4 py-2">
                                    <div className="font-bold text-white text-sm">{branch.name}</div>
                                    <div className="text-[10px] text-white/20 font-mono">ID: {branch.id}</div>
                                </td>
                                <td className="px-4 py-2 text-sm text-white/40 max-w-xs truncate">{branch.address || '—'}</td>
                                <td className="px-4 py-2 text-sm text-white/40">{branch.phone || '—'}</td>
                                <td className="px-4 py-2 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-normal uppercase tracking-widest border ${branch.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {branch.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => openModal(branch)} className="p-2 text-white/20 hover:text-[#E84C30] transition" title="Edit">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                        </button>
                                        <button onClick={() => handleDelete(branch.id)} className="p-2 text-white/20 hover:text-red-400 transition" title="Delete">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {branches.length === 0 && (
                    <div className="p-16 text-center text-white/15 italic text-sm">No branches found. Click "Add Branch" to get started.</div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2">
                    <div className="bg-[#2D2D2D] rounded-lg shadow-2xl border border-white/10 w-full max-w-md overflow-hidden">
                        <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-base font-normal text-white">{editingBranch ? 'Edit Branch' : 'New Branch'}</h3>
                            <button onClick={closeModal} className="text-white/30 hover:text-white transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-2 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Branch Name</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                                    placeholder="e.g. Sudirman Central Branch" required />
                                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Address</label>
                                <textarea value={data.address} onChange={e => setData('address', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 min-h-[64px] transition-all"
                                    placeholder="Enter physical address..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Phone</label>
                                    <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                                        placeholder="0812XXX" />
                                </div>
                                <div className="flex flex-col justify-end pb-1 px-1">
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <div className="relative">
                                            <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#E84C30]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E84C30]"></div>
                                        </div>
                                        <span className="text-sm font-medium text-white/60">Active</span>
                                    </label>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/40 font-bold hover:bg-white/5 transition text-sm">Cancel</button>
                                <button type="submit" disabled={processing} className="flex-1 px-4 py-2 rounded-lg bg-[#E84C30] text-white font-bold hover:bg-[#D4432A] disabled:opacity-50 transition-all shadow-lg shadow-[#E84C30]/20 text-sm">
                                    {processing ? 'Saving...' : 'Save Branch'}
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

