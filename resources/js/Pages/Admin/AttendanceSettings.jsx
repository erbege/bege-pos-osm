import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function AttendanceSettings({ auth, settings, branches }) {
    const [form, setForm] = useState({
        branch_id: '',
        grace_time_minutes: '15',
        late_penalty_per_minute: '0',
        latitude: '',
        longitude: '',
        radius_meters: '100',
    });
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const submit = (e) => {
        e.preventDefault();
        router.post(route('admin.attendance-settings.store'), form, {
            onSuccess: () => setForm({ branch_id: '', grace_time_minutes: '15', late_penalty_per_minute: '0', latitude: '', longitude: '', radius_meters: '100' }),
        });
    };

    const deleteSetting = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Pengaturan',
            message: 'Hapus pengaturan absensi untuk cabang ini? Cabang akan kembali menggunakan aturan global jika tersedia.',
            type: 'danger',
            confirmText: 'Hapus Sekarang',
            onConfirm: () => {
                router.delete(route('admin.attendance-settings.destroy', id), {
                    onSuccess: () => closeConfirm()
                });
            }
        });
    };

    const editSetting = (s) => {
        setForm({
            branch_id: s.branch_id || '',
            grace_time_minutes: String(s.grace_time_minutes),
            late_penalty_per_minute: String(s.late_penalty_per_minute || 0),
            latitude: String(s.latitude || ''),
            longitude: String(s.longitude || ''),
            radius_meters: String(s.radius_meters),
        });
    };

    return (
        <AdminLayout title="Pengaturan Absensi">
            <Head title="Attendance Settings" />

            <div className="p-4 max-w-7xl mx-auto space-y-6 text-left">
                <div className="mb-6">
                    <h1 className="text-2xl font-normal tracking-tight" style={{ color: 'var(--g-text-primary)' }}>Parameter SDM & Absensi</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--g-text-muted)' }}>Konfigurasi toleransi waktu, denda, dan geofencing</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Settings Form */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <div className="p-4 bg-black/10 border-b border-white/5">
                                <h4 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Konfigurasi Aturan</h4>
                            </div>

                            <form onSubmit={submit} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 opacity-60">Cabang</label>
                                    <select value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })} className="w-full text-xs font-semibold rounded-lg px-3 py-2 outline-none border cursor-pointer" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                        <option value="">Global (Semua Cabang)</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 opacity-60">Grace Time (Menit)</label>
                                        <input type="number" value={form.grace_time_minutes} onChange={e => setForm({ ...form, grace_time_minutes: e.target.value })} min="0" required className="w-full text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 opacity-60">Denda / Menit (Rp)</label>
                                        <input type="number" value={form.late_penalty_per_minute} onChange={e => setForm({ ...form, late_penalty_per_minute: e.target.value })} min="0" required className="w-full text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E84C30]/20 transition-all font-mono" style={{ backgroundColor: 'var(--g-input-bg)', border: '1px solid var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg border space-y-3" style={{ backgroundColor: 'var(--g-bg-tertiary)', borderColor: 'var(--g-border)' }}>
                                    <h5 className="text-[10px] font-semibold uppercase tracking-widest text-[#E84C30] flex items-center gap-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        Geofencing
                                    </h5>
                                    <div>
                                        <label className="block text-[9px] font-semibold uppercase tracking-widest opacity-40 mb-1">Latitude</label>
                                        <input type="number" step="0.00000001" placeholder="-6.2088" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} className="w-full text-xs font-semibold rounded-lg px-3 py-1.5 outline-none border" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-semibold uppercase tracking-widest opacity-40 mb-1">Longitude</label>
                                        <input type="number" step="0.00000001" placeholder="106.8456" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} className="w-full text-xs font-semibold rounded-lg px-3 py-1.5 outline-none border" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-semibold uppercase tracking-widest opacity-40 mb-1">Radius (Meter)</label>
                                        <input type="number" value={form.radius_meters} onChange={e => setForm({ ...form, radius_meters: e.target.value })} min="10" max="5000" required className="w-full text-xs font-semibold rounded-lg px-3 py-1.5 outline-none border" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-3 bg-[#E84C30] text-white rounded-lg text-xs font-semibold uppercase tracking-widest shadow-lg shadow-[#E84C30]/20 hover:bg-[#D4432A] transition-all">
                                    Simpan Pengaturan
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Current Settings List */}
                    <div className="lg:col-span-2">
                        <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: 'var(--g-bg-secondary)', borderColor: 'var(--g-border)' }}>
                            <div className="p-4 bg-black/10 border-b border-white/5">
                                <h4 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--g-text-secondary)' }}>Aturan Aktif</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-black/20 text-[10px] uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Cabang</th>
                                            <th className="px-4 py-3 font-semibold text-center">Toleransi</th>
                                            <th className="px-4 py-3 font-semibold text-right">Denda / Mnt</th>
                                            <th className="px-4 py-3 font-semibold text-right">Radius</th>
                                            <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-gray-400" style={{ divideColor: 'var(--g-border)' }}>
                                        {settings.map(s => (
                                            <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-semibold" style={{ color: 'var(--g-text-primary)' }}>{s.branch?.name || 'Global'}</td>
                                                <td className="px-4 py-3 text-center font-mono text-xs">{s.grace_time_minutes} mnt</td>
                                                <td className="px-4 py-3 text-right font-mono text-red-400">Rp {Number(s.late_penalty_per_minute).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-mono text-xs text-white/40">{s.radius_meters}m</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <button onClick={() => editSetting(s)} className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                                        <button onClick={() => deleteSetting(s.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {settings.length === 0 && (
                                            <tr><td colSpan="5" className="px-4 py-12 text-center" style={{ color: 'var(--g-text-muted)' }}>Belum ada aturan yang dikonfigurasi</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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

