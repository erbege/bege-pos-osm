import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1A1A] p-2 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E84C30] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[440px] z-10">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/">
                        <div className="w-20 h-20 bg-[#2D2D2D] rounded-lg flex items-center justify-center shadow-2xl border border-white/5 hover:scale-105 transition-transform duration-500 group">
                            <img
                                src="/images/garasi66_logo.png"
                                alt="Garasi66"
                                className="w-14 h-14 object-contain group-hover:rotate-12 transition-transform duration-500"
                            />
                        </div>
                    </Link>
                    <div className="mt-4 text-center">
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                            GARASI <span className="text-[#E84C30]">66</span>
                        </h1>
                        <p className="text-[10px] tracking-[0.3em] font-normal text-white/30 uppercase mt-1">Point of Sale System</p>
                    </div>
                </div>

                {/* Card Container with Glassmorphism */}
                <div className="bg-[#2D2D2D]/80 backdrop-blur-xl border border-white/10 rounded-lg p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                    {children}
                </div>

                {/* Footer Info */}
                <p className="text-center mt-8 text-[10px] text-white/20 font-normal uppercase tracking-widest">
                    &copy; 2026 Garasi66. All Rights Reserved.
                </p>
            </div>
        </div>
    );
}
