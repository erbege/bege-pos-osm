import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { formatRupiah } from '@/Lib/utils';

export default function CustomerDetail({ customer }) {
    return (
        <AdminLayout>
            <Head title={`Detail Pelanggan: ${customer.name}`} />
            
            <div className="p-4">
                <div className="mb-6">
                    <Link href={route('admin.customers.index')} className="text-[#E84C30] hover:text-[#D4432A] text-sm font-bold flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Kembali ke Daftar
                    </Link>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-[#E84C30]/10 flex items-center justify-center text-[#E84C30] font-bold text-2xl uppercase">
                                {customer.name.substring(0, 2)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
                                <p className="text-white/50 text-sm">Pelanggan Terdaftar sejak {new Date(customer.created_at).toLocaleDateString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column: Info & Addresses */}
                    <div className="space-y-6">
                        {/* Personal Info */}
                        <div className="bg-[#2D2D2D] rounded-lg border border-white/5 p-4">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Informasi Pribadi</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] text-white/20 uppercase tracking-wider font-bold mb-1">Email</div>
                                    <div className="text-white text-sm">{customer.email || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-white/20 uppercase tracking-wider font-bold mb-1">Telepon</div>
                                    <div className="text-white text-sm">{customer.phone || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-white/20 uppercase tracking-wider font-bold mb-1">Tanggal Lahir</div>
                                    <div className="text-white text-sm">{customer.birthday ? new Date(customer.birthday).toLocaleDateString('id-ID') : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-white/20 uppercase tracking-wider font-bold mb-1">Alamat Utama</div>
                                    <div className="text-white text-sm">{customer.address || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Stored Addresses */}
                        <div className="bg-[#2D2D2D] rounded-lg border border-white/5 p-4">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Daftar Alamat Pengiriman</h3>
                            <div className="space-y-3">
                                {customer.addresses.length === 0 ? (
                                    <p className="text-white/20 text-xs italic">Belum ada alamat tersimpan.</p>
                                ) : (
                                    customer.addresses.map(addr => (
                                        <div key={addr.id} className={`p-3 rounded-lg border ${addr.is_default ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/20 border-white/5'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{addr.label}</span>
                                                {addr.is_default && (
                                                    <span className="text-[8px] bg-emerald-500 text-white font-bold px-1 rounded">DEFAULT</span>
                                                )}
                                            </div>
                                            <div className="text-white text-xs font-bold mb-1">{addr.recipient_name}</div>
                                            <div className="text-white/40 text-[10px] mb-2">{addr.recipient_phone}</div>
                                            <div className="text-white/60 text-[11px] leading-relaxed">{addr.address}</div>
                                            {addr.latitude && (
                                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[9px] text-[#E84C30]">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                    {addr.latitude}, {addr.longitude}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order History */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#2D2D2D] rounded-lg border border-white/5 p-4">
                                <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Total Pesanan</div>
                                <div className="text-2xl font-normal text-white">{customer.orders.length}</div>
                            </div>
                            <div className="bg-[#2D2D2D] rounded-lg border border-white/5 p-4">
                                <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Total Pengeluaran</div>
                                <div className="text-2xl font-normal text-[#E84C30]">{formatRupiah(customer.orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0))}</div>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-[#2D2D2D] rounded-lg border border-white/5 overflow-hidden">
                            <div className="p-4 border-b border-white/5">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Riwayat Pesanan</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-white/40 uppercase text-[10px] font-bold tracking-widest">
                                        <tr>
                                            <th className="px-4 py-4">Order ID</th>
                                            <th className="px-4 py-4">Tanggal</th>
                                            <th className="px-4 py-4">Metode</th>
                                            <th className="px-4 py-4">Status</th>
                                            <th className="px-4 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {customer.orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="text-white font-mono">#{order.id}</div>
                                                </td>
                                                <td className="px-4 py-4 text-white/60">
                                                    {new Date(order.created_at).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        order.order_type === 'delivery' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                                                    }`}>
                                                        {order.order_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-white/60'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right text-white font-bold">
                                                    {formatRupiah(order.total_amount)}
                                                </td>
                                            </tr>
                                        ))}
                                        {customer.orders.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-6 text-center text-white/20 italic">
                                                    Belum ada riwayat pesanan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Reservations */}
                        <div className="bg-[#2D2D2D] rounded-lg border border-white/5 overflow-hidden">
                            <div className="p-4 border-b border-white/5">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Riwayat Reservasi</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-white/40 uppercase text-[10px] font-bold tracking-widest">
                                        <tr>
                                            <th className="px-4 py-4">Waktu</th>
                                            <th className="px-4 py-4">Tamv</th>
                                            <th className="px-4 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {customer.reservations.map((res) => (
                                            <tr key={res.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="text-white">{res.reservation_date}</div>
                                                    <div className="text-white/30 text-[10px]">{res.start_time} - {res.end_time}</div>
                                                </td>
                                                <td className="px-4 py-4 text-white">
                                                    {res.pax} Pax
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        res.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-white/60'
                                                    }`}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {customer.reservations.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-6 text-center text-white/20 italic">
                                                    Belum ada riwayat reservasi.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

