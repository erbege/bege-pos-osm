import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { KitchenPrintService } from '@/Services/KitchenPrintService';
import axios from 'axios';

const useTimer = () => {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);
    return now;
};

const formatElapsed = (createdAt, now) => {
    const diff = Math.floor((now - new Date(createdAt)) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function Index({ initialOrders, printerSettings, currentStation }) {
    const [orders, setOrders] = useState(initialOrders);
    const [lastPrintedId, setLastPrintedId] = useState(null);
    const [processingIds, setProcessingIds] = useState(new Set());
    const now = useTimer();

    const stations = [
        { id: 'kitchen', label: 'Kitchen', icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        )},
        { id: 'barista', label: 'Barista', icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        )},
        { id: 'ready', label: 'Ready-to-Serve', icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        )},
    ];

    const changeStation = (stationId) => {
        router.get(route('kitchen.index'), { station: stationId }, { preserveState: true });
    };

    const isAutoPrintEnabled = printerSettings?.auto_print === '1' || printerSettings?.auto_print === true;
    const deviceName = printerSettings?.device_name || 'Printer';

    useEffect(() => {
        if (window.Echo) {
            window.Echo.channel('kitchen')
                .listen('.order.paid', (e) => {
                    setOrders(prev => {
                        if (prev.find(o => o.id === e.order.id)) return prev;
                        if (isAutoPrintEnabled && lastPrintedId !== e.order.id) {
                            KitchenPrintService.printViaBluetooth(e.order, deviceName);
                            setLastPrintedId(e.order.id);
                        }
                        return [e.order, ...prev];
                    });
                })
                .listen('.order.updated', (e) => {
                    setOrders(prev => {
                        if (e.order.status === 'Served' || e.order.status === 'Completed') {
                            return prev.filter(o => o.id !== e.order.id);
                        }
                        return prev.map(o => o.id === e.order.id ? { ...o, status: e.order.status } : o);
                    });
                });
        }
        return () => { if (window.Echo) window.Echo.leaveChannel('kitchen'); };
    }, [isAutoPrintEnabled, deviceName, lastPrintedId]);

    const handleManualPrint = (order) => {
        KitchenPrintService.printViaBluetooth(order, deviceName);
    };

    const updateStatus = async (orderId, status) => {
        if (processingIds.has(orderId)) return;
        const originalOrders = [...orders];
        setOrders(prev => {
            if (status === 'Served') return prev.filter(o => o.id !== orderId);
            return prev.map(o => o.id === orderId ? { ...o, status } : o);
        });
        setProcessingIds(prev => new Set(prev).add(orderId));
        try {
            const response = await axios.put(route('kitchen.update_order_status', orderId), { status });
            if (!response.data.success) throw new Error(response.data.message);
        } catch (error) {
            setOrders(originalOrders);
            alert(error.response?.data?.message || "Gagal memperbarui status.");
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
        }
    };

    const waitingOrders = orders.filter(o => o.status === 'Paid');
    const cookingOrders = orders.filter(o => o.status === 'Preparing');
    const pickupOrders = orders.filter(o => o.status === 'Ready');

    const OrderCard = ({ order, nextStatus, actionLabel, accentColor, accentBg, btnColor }) => {
        const isProcessing = processingIds.has(order.id);
        const elapsed = formatElapsed(order.created_at, now);
        const [mins] = elapsed.split(':');
        const isLate = parseInt(mins) >= 15;

        return (
            <div className={`bg-[#2D2D2D] border border-white/5 transition-all mb-4 overflow-hidden group ${isProcessing ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-black/10">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-mono font-bold text-white leading-none">#{order.id}</span>
                        <div className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${order.table ? 'text-white border-white/10' : 'text-amber-400 border-amber-400/20'}`}>
                            {order.table ? order.table.name : 'Takeaway'}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-1.5 font-mono text-sm ${isLate ? 'text-red-400' : 'text-white/40'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {elapsed}
                        </div>
                        <button onClick={() => handleManualPrint(order)} className="opacity-20 hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                            <div className="flex items-start gap-4">
                                <span className="font-mono font-bold text-lg leading-none pt-0.5 text-[#E84C30]">{item.qty}×</span>
                                <div className="flex-1">
                                    <div className="text-[13px] font-bold text-white leading-tight uppercase tracking-tight">{item.menu?.name}</div>
                                    {item.notes && (
                                        <div className="text-[10px] mt-1 text-white/40 font-bold uppercase tracking-tighter flex items-center gap-1.5">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                                            {item.notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-4 pb-4">
                    <button
                        onClick={() => updateStatus(order.id, nextStatus)}
                        className={`w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border border-white/5 ${btnColor} hover:brightness-125`}
                    >
                        {isProcessing ? 'Memproses...' : actionLabel}
                    </button>
                </div>
            </div>
        );
    };

    const LaneHeader = ({ label, count, icon }) => (
        <div className="flex items-center justify-between px-2 mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
                <div className="text-white/20">{icon}</div>
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{label}</h2>
            </div>
            <span className="font-mono text-xs font-bold text-white/40">{count}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#1A1A1A] text-white selection:bg-[#E84C30] selection:text-white">
            <Head title="Kitchen Display System" />

            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#2D2D2D]">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-[#E84C30] flex items-center justify-center font-black italic tracking-tighter text-sm">G</div>
                        <span className="text-sm font-bold uppercase tracking-[0.2em]">KDS</span>
                    </Link>

                    <div className="flex bg-black/30 p-1 rounded border border-white/5">
                        {stations.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => changeStation(s.id)}
                                className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    currentStation === s.id
                                        ? 'bg-white text-black'
                                        : 'text-white/40 hover:text-white'
                                }`}
                            >
                                {s.icon}
                                <span>{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-lg font-mono font-bold tracking-tighter">{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-20">System Clock</span>
                    </div>

                    <div className="h-8 w-[1px] bg-white/5"></div>

                    <Link href={route('pos.index')} className="opacity-20 hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </Link>
                </div>
            </header>

            <main className="p-6 h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col h-full overflow-hidden">
                    <LaneHeader 
                        label="Waiting" 
                        count={waitingOrders.length} 
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} 
                    />
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {waitingOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                nextStatus="Preparing"
                                actionLabel="Mulai Masak"
                                btnColor="bg-white/5 hover:bg-white text-black"
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col h-full overflow-hidden">
                    <LaneHeader 
                        label="Cooking" 
                        count={cookingOrders.length} 
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path></svg>} 
                    />
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {cookingOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                nextStatus="Ready"
                                actionLabel="Tandai Siap"
                                btnColor="bg-[#E84C30] text-white"
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col h-full overflow-hidden">
                    <LaneHeader 
                        label="Ready" 
                        count={pickupOrders.length} 
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>} 
                    />
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {pickupOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                nextStatus="Served"
                                actionLabel="Selesaikan"
                                btnColor="bg-emerald-500 text-black"
                            />
                        ))}
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}} />
        </div>
    );
}
