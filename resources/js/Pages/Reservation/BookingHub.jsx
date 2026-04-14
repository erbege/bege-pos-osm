import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import AvailableTableCard from './Partials/AvailableTableCard';
import ReservationFormModal from './Partials/ReservationFormModal';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { formatRupiah } from '@/Lib/utils';

export default function BookingHub() {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);

    const [searchParams, setSearchParams] = useState({
        reservation_date: defaultDate.toISOString().split('T')[0],
        start_time: '18:00',
        guest_count: 2,
    });

    const [availableTables, setAvailableTables] = useState(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');

    const [selectedTableCombo, setSelectedTableCombo] = useState(null);
    const [menus, setMenus] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(null);

    React.useEffect(() => {
        axios.get('/api/v1/menus').then(res => {
            setMenus(res.data.data);
        }).catch(err => console.error('Failed to fetch menus', err));
    }, []);

    const handleSearchChange = (e) => {
        setSearchParams(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const searchAvailability = async (e) => {
        e.preventDefault();
        setSearching(true);
        setError('');
        setAvailableTables(null);

        try {
            const response = await axios.post('/api/v1/reservations/check-availability', searchParams);
            setAvailableTables(response.data.available_options);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengecek ketersediaan.');
        } finally {
            setSearching(false);
        }
    };

    const handleSelectTable = (tables) => {
        setSelectedTableCombo(tables);
        setShowModal(true);
    };

    const handleConfirmBooking = async (customerData) => {
        try {
            const payload = {
                branch_id: 1, // Defaulting to Main Branch
                ...searchParams,
                ...customerData,
                table_ids: selectedTableCombo.map(t => t.id)
            };

            const response = await axios.post('/api/v1/reservations', payload);
            setBookingSuccess(response.data.data);
            setShowModal(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memproses reservasi. Silakan coba lagi.');
        }
    };

    if (bookingSuccess) {
        return (
            <CustomerLayout title="Booking Confirmed">
                <div className="py-20 text-center max-w-md w-full mx-auto">
                    <div className="w-24 h-24 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mx-auto mb-6 flex items-center justify-center animate-bounce-in">
                        <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-white text-3xl font-normal tracking-tight mb-2">Reservasi Berhasil!</h2>
                    <p className="text-white/40 text-sm mb-8 font-medium">
                        Nomor Reservasi: <span className="text-[#E84C30] font-normal block mt-2 text-xl">{bookingSuccess.reservation_number}</span>
                    </p>
                    <div className="bg-[#2D2D2D] border border-white/5 rounded-lg p-3 text-sm text-left mb-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
                            <span className="text-white/30 uppercase font-normal text-[10px] tracking-widest">Nama</span>
                            <span className="font-bold text-white">{bookingSuccess.customer_name}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
                            <span className="text-white/30 uppercase font-normal text-[10px] tracking-widest">Tanggal</span>
                            <span className="font-bold text-emerald-400">{bookingSuccess.reservation_date}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white/30 uppercase font-normal text-[10px] tracking-widest">Waktu</span>
                            <span className="font-bold text-white">{bookingSuccess.start_time.substring(0, 5)} WIB</span>
                        </div>
                    </div>
                    <Link href="/menu" className="inline-flex w-full items-center justify-center gap-3 bg-white/5 text-white/40 px-8 py-2 rounded-lg font-normal uppercase tracking-widest text-[10px] border border-white/5 hover:bg-white/10 hover:text-white transition-all">
                        Kembali ke Menu Utama
                    </Link>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout title="Book a Table">
            <div className="max-w-2xl mx-auto w-full mb-32">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-normal text-white tracking-tight mb-3">Reserve a <span className="text-[#E84C30]">Table</span></h1>
                    <p className="text-white/30 text-sm max-w-sm mx-auto">Pilih tanggal, waktu, dan jumlah tamu untuk melihat ketersediaan meja kami.</p>
                </div>

                {/* Search Form */}
                <div className="bg-[#2D2D2D] rounded-lg shadow-2xl p-3 sm:p-7 mb-10 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E84C30]/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                    <form onSubmit={searchAvailability} className="flex flex-col gap-6 relative z-10">
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="reservation_date" className="block text-white/30 text-[10px] font-normal uppercase tracking-widest mb-2 px-1">Tanggal</label>
                                <input
                                    id="reservation_date"
                                    name="reservation_date"
                                    type="date"
                                    value={searchParams.reservation_date}
                                    onChange={handleSearchChange}
                                    className="block w-full h-[40px] bg-black/20 border border-white/10 rounded-lg px-3 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#E84C30] focus:border-[#E84C30] transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="start_time" className="block text-white/30 text-[10px] font-normal uppercase tracking-widest mb-2 px-1">Waktu</label>
                                <input
                                    id="start_time"
                                    name="start_time"
                                    type="time"
                                    value={searchParams.start_time}
                                    onChange={handleSearchChange}
                                    className="block w-full h-[40px] bg-black/20 border border-white/10 rounded-lg px-3 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#E84C30] focus:border-[#E84C30] transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="guest_count" className="block text-white/30 text-[10px] font-normal uppercase tracking-widest mb-2 px-1">Jumlah Pax/Tamu</label>
                            <input
                                id="guest_count"
                                name="guest_count"
                                type="number"
                                min="1"
                                value={searchParams.guest_count}
                                onChange={handleSearchChange}
                                className="block w-full h-[40px] bg-black/20 border border-white/10 rounded-lg px-3 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#E84C30] focus:border-[#E84C30] transition-colors"
                                required
                            />
                        </div>
                        <button
                            disabled={searching}
                            className="w-full h-[58px] mt-2 rounded-lg bg-[#E84C30] hover:bg-[#D4432A] text-white text-[11px] font-normal uppercase tracking-[0.2em] shadow-lg shadow-[#E84C30]/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {searching ? (
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            <span>{searching ? 'Memproses...' : 'Cari Meja'}</span>
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                {error && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-center border border-red-500/20 text-sm font-bold">
                        {error}
                    </div>
                )}

                {availableTables && availableTables.length === 0 && (
                    <div className="text-center py-16 bg-[#2D2D2D] rounded-lg border border-white/5 px-3 animate-bounce-in">
                        <div className="w-20 h-20 rounded-lg bg-white/5 mx-auto mb-6 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-normal text-white mb-2">Tidak Ada Opsi Tersedia</h3>
                        <p className="text-white/40 text-sm max-w-sm mx-auto">
                            Maaf, tidak ada konfigurasi meja yang dapat menampung kapasitas {searchParams.guest_count} tamu pada waktu tersebut.
                        </p>
                    </div>
                )}

                {availableTables && availableTables.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className="text-lg font-normal text-white tracking-tight">Opsi Meja Tersedia</h2>
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg font-normal">
                                {availableTables.length} Ditemukan
                            </span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {availableTables.map((option, idx) => (
                                <AvailableTableCard
                                    key={idx}
                                    tables={option.tables}
                                    totalCapacity={option.total_capacity}
                                    type={option.type}
                                    name={option.name}
                                    index={idx}
                                    onSelect={handleSelectTable}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            <ReservationFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleConfirmBooking}
                tables={selectedTableCombo}
                menus={menus}
                timeDetails={searchParams}
            />
        </CustomerLayout>
    );
}
