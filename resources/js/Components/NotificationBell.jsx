import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function NotificationBell({ auth }) {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.private('admin-notifications');

        channel.listen('.low-stock.alert', (e) => {
            const newNotification = {
                id: Date.now(),
                title: 'Low Stock Alert',
                message: e.message,
                materialId: e.material.id,
                time: new Date().toLocaleTimeString(),
                read: false,
                type: 'warning'
            };

            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Optional: Browser Notification
            if (Notification.permission === "granted") {
                new Notification("Low Stock Alert", { body: e.message });
            }
        });

        return () => {
            channel.stopListening('.low-stock.alert');
        };
    }, []);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg relative hover:bg-white/5 transition-all text-white/40 hover:text-white"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1A1A1A]">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1F1F1F] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Notifications</h3>
                        {notifications.length > 0 && (
                            <button onClick={clearAll} className="text-[10px] text-white/30 hover:text-white transition-colors uppercase font-bold tracking-widest">Clear All</button>
                        )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-white/20 italic text-sm">
                                <svg className="w-8 h-8 mx-auto mb-2 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                No new alerts
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`p-4 border-b border-white/5 transition-colors cursor-pointer hover:bg-white/[0.03] ${!n.read ? 'bg-indigo-500/[0.03]' : ''}`}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-red-500"></div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-white mb-0.5">{n.title}</p>
                                            <p className="text-[11px] text-white/60 leading-relaxed mb-1">{n.message}</p>
                                            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{n.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
