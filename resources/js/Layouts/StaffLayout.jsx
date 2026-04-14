import React from 'react';
import { Link, usePage } from '@inertiajs/react';

const StaffLayout = ({ children, title }) => {
    const { auth } = usePage().props;

    const tabs = [
        { 
            name: 'Home', 
            href: route('staff.dashboard'), 
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>, 
            routePrefix: 'staff.dashboard' 
        },
        { 
            name: 'Absensi', 
            href: route('staff.attendance'), 
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>, 
            routePrefix: 'staff.attendance' 
        },
        { 
            name: 'Jadwal', 
            href: route('staff.schedule'), 
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>, 
            routePrefix: 'staff.schedule' 
        },
        { 
            name: 'Slip Gaji', 
            href: route('staff.payslips'), 
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>, 
            routePrefix: 'staff.payslips' 
        },
    ];

    const currentRoute = route().current();

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col selection:bg-[#E84C30]/30">
            {/* Top Header */}
            <header className="bg-[#1A1A1A]/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between sticky top-0 z-50 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#E84C30] blur-md opacity-20"></div>
                        <div className="w-10 h-10 bg-[#E84C30] rounded-xl flex items-center justify-center text-sm font-black relative z-10 shadow-lg shadow-[#E84C30]/20">
                            {auth?.user?.name?.[0] || 'S'}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-1">{title || 'Staff Portal'}</h1>
                        <p className="text-sm font-bold text-white leading-none">{auth?.user?.name || 'Staff'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={route('profile.edit')} className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pb-24 overflow-y-auto custom-scrollbar">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A]/90 backdrop-blur-2xl border-t border-white/5 shadow-2xl z-50 px-4">
                <div className="flex justify-around items-center h-20 max-w-lg mx-auto gap-1">
                    {tabs.map((tab) => {
                        const isActive = currentRoute?.startsWith(tab.routePrefix);
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`relative flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all group ${isActive
                                        ? 'text-[#E84C30]'
                                        : 'text-white/20 hover:text-white/40'
                                    }`}
                            >
                                <span className={`text-xl transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'group-hover:scale-110'}`}>
                                    {tab.icon}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${isActive ? 'opacity-100' : 'opacity-100'}`}>
                                    {tab.name}
                                </span>
                                {isActive && (
                                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-1 bg-[#E84C30] rounded-b-full shadow-[0_0_15px_rgba(232,76,48,0.5)]" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default StaffLayout;
