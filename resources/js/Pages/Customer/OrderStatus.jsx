import { useEffect, useState } from 'react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, router } from '@inertiajs/react';

const StepIcon = ({ type, isActive }) => {
    const cls = `w-5 h-5 ${isActive ? 'text-white' : 'text-white/30'}`;
    switch (type) {
        case 'payment': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>;
        case 'confirmed': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
        case 'cooking': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path></svg>;
        case 'ready': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>;
        default: return null;
    }
};

export default function OrderStatus({ order: initialOrder }) {
    const [order, setOrder] = useState(initialOrder);
    const [showServedPopup, setShowServedPopup] = useState(false);
    const [servedMessage, setServedMessage] = useState('');

    useEffect(() => {
        if (order.status === 'Served' || order.status === 'Completed') {
            const messages = [
                "Selamat menikmati hidangan Anda! ✨",
                "Pesanan telah tiba di meja Anda! 🍽️",
                "Enjoy your meal! 😋",
                "Bon Appétit! 🎉",
                "Selamat makan, semoga harimu menyenangkan! ❤️",
                "Terima kasih atas pesanannya! 🥳"
            ];
            setServedMessage(messages[Math.floor(Math.random() * messages.length)]);
            setShowServedPopup(true);

            const timer = setTimeout(() => {
                setShowServedPopup(false);
                router.visit('/menu');
            }, 6000);

            return () => clearTimeout(timer);
        }
    }, [order.status]);

    useEffect(() => {
        const channel = Echo.channel(`orders.${order.id}`);
        channel.listen('.order.paid', (e) => setOrder(e.order));
        channel.listen('.order.updated', (e) => setOrder(e.order));
        return () => Echo.leaveChannel(`orders.${order.id}`);
    }, [order.id]);

    const steps = [
        { status: 'Pending Payment', iconType: 'payment', label: 'Payment' },
        { status: 'Paid', iconType: 'confirmed', label: 'Confirmed' },
        { status: 'Preparing', iconType: 'cooking', label: 'Cooking' },
        { status: 'Ready', iconType: 'ready', label: 'Ready' },
    ];

    const getStepIndex = (currentStatus) => {
        const index = steps.findIndex(s => s.status === currentStatus);
        if (currentStatus === 'Served' || currentStatus === 'Completed') return steps.length;
        return index !== -1 ? index : 0;
    };

    const currentIndex = getStepIndex(order.status);

    return (
        <CustomerLayout title={`Order #${order.order_number}`}>
            <div className="max-w-md mx-auto w-full mt-8">
                <div className="bg-[#2D2D2D] rounded-lg overflow-hidden border border-white/5">
                    {/* Header */}
                    <div className="bg-[#E84C30] p-8 text-center text-white">
                        <p className="text-white/60 text-[10px] font-normal uppercase tracking-[0.3em] mb-2">Order Status</p>
                        <h1 className="text-4xl font-normal tracking-tight mb-2">#{order.order_number}</h1>
                        <p className="text-lg font-bold text-white/90">{order.status}</p>
                    </div>

                    <div className="p-8">
                        {/* Tracker Timeline */}
                        <div className="relative mb-8">
                            {/* Background Line */}
                            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-white/5 rounded-full z-0"></div>
                            {/* Active Line Fill */}
                            <div
                                className="absolute left-6 top-6 w-0.5 bg-[#E84C30] rounded-full z-0 transition-all duration-1000 ease-in-out"
                                style={{ height: `${(currentIndex / Math.max(1, steps.length - 1)) * 100}%` }}
                            ></div>

                            <div className="space-y-8 relative z-10">
                                {steps.map((step, index) => {
                                    const isActive = index <= currentIndex;
                                    const isCurrent = index === currentIndex;

                                    return (
                                        <div key={step.status} className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                                                ${isActive ? 'bg-[#E84C30] shadow-lg shadow-[#E84C30]/30' : 'bg-white/5 border border-white/10'}
                                                ${isCurrent ? 'ring-4 ring-[#E84C30]/20 scale-110' : ''}
                                            `}>
                                                <StepIcon type={step.iconType} isActive={isActive} />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-base ${isActive ? 'text-white' : 'text-white/25'}`}>
                                                    {step.label}
                                                </h3>
                                                <p className="text-xs text-white/30">
                                                    {isCurrent ? 'Happening right now' : (isActive ? 'Completed' : 'Waiting...')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-10 border-t border-white/5 pt-6">
                            <div className="mb-6 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Customer</span>
                                    <span className="text-white font-medium text-sm">{order.customer_name || 'Customer'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Table</span>
                                    <span className="text-[#E84C30] font-bold text-sm">{order.table?.name || 'Takeaway'}</span>
                                </div>
                            </div>

                            <h3 className="font-bold text-white text-sm mb-4 flex justify-between items-center uppercase tracking-widest opacity-60">
                                <span>Order Summary</span>
                                <span className="text-[#E84C30] text-xs">{order.items.length} items</span>
                            </h3>
                            <div className="space-y-3">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3 text-white/60">
                                            <span className="font-bold bg-white/5 text-white/40 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] border border-white/5">
                                                {item.qty}x
                                            </span>
                                            {item.menu.name}
                                        </div>
                                        <span className="font-bold text-white text-sm">
                                            <span className="text-[10px]">Rp</span> {Number(item.subtotal).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-end">
                                <span className="text-white/30 font-medium text-xs uppercase tracking-widest">Total Paid</span>
                                <span className="text-2xl font-normal tracking-tight text-white">
                                    <span className="text-sm">Rp</span> {Number(order.total_amount).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Served Celebration Popup */}
            {showServedPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80 backdrop-blur-md transition-all duration-500">
                    <style>{`
                        @keyframes shrinkWidth {
                            from { width: 100%; }
                            to { width: 0%; }
                        }
                        .animate-shrink { animation: shrinkWidth 6s linear forwards; }
                    `}</style>
                    <div className="bg-[#2D2D2D] border border-white/10 p-8 rounded-lg max-w-sm w-full text-center shadow-2xl shadow-[#E84C30]/20 scale-100 transition-transform duration-500">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[#E84C30]/40 to-[#E84C30]/10 rounded-full flex items-center justify-center mb-6 text-5xl shadow-[0_0_30px_rgba(232,76,48,0.3)]">
                            ✨
                        </div>
                        <h2 className="text-2xl font-normal text-white mb-3 leading-tight">{servedMessage}</h2>
                        <p className="text-white/40 text-xs mb-8">Terima kasih telah memesan. Anda akan segera diarahkan kembali ke halaman utama...</p>

                        {/* Loading Bar */}
                        <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden shadow-inner flex justify-end">
                            <div className="bg-[#E84C30] h-full rounded-full animate-shrink"></div>
                        </div>
                    </div>
                </div>
            )}
        </CustomerLayout>
    );
}
