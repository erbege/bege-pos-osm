import { useState, useEffect, useRef, useCallback } from 'react';
import { router, Link, Head } from '@inertiajs/react';
import { useCartStore } from '@/Stores/useCartStore';

export default function SelectTable({ rooms: initialRooms }) {
    const totalItems = useCartStore((s) => s.getTotalItems());
    const [localRooms, setLocalRooms] = useState(initialRooms || []);
    const [activeRoomId, setActiveRoomId] = useState(localRooms?.[0]?.id || null);
    const containerRef = useRef(null);
    const viewportRef = useRef(null);
    const panRef = useRef(null);

    // Sync initialRooms to localRooms
    useEffect(() => {
        setLocalRooms(initialRooms);
    }, [initialRooms]);

    // Listen for real-time table status updates
    useEffect(() => {
        if (typeof Echo === 'undefined') return;
        const channel = Echo.channel('tables');
        channel.listen('.table.updated', (e) => {
            setLocalRooms(prev => prev.map(room => ({
                ...room,
                tables: room.tables.map(table => 
                    table.id === e.table.id ? { ...table, status: e.table.status } : table
                )
            })));
        });
        return () => Echo.leaveChannel('tables');
    }, []);

    const setTable = useCartStore((s) => s.setTable);

    const activeRoom = localRooms?.find(r => r.id === activeRoomId);
    const tables = activeRoom?.tables || [];

    const selectTable = (table) => {
        if (table.status !== 'available') return;
        
        // Update store instantly (this also fires background sync)
        setTable(table.id, table.name);
        
        // Navigate back to menu (client-side)
        router.visit(route('customer.menu'), { preserveState: true });
    };

    // Logical canvas size
    const canvasW = Math.max(800, ...tables.map(t => (t.pos_x || 0) + (t.width || 80) + 40));
    const canvasH = Math.max(520, ...tables.map(t => (t.pos_y || 0) + (t.height || 50) + 40));

    // Responsive base scale
    const [baseScale, setBaseScale] = useState(1);
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setBaseScale(Math.min(1, entry.contentRect.width / canvasW));
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [canvasW]);

    // User zoom (multiplier on top of base scale)
    const [userZoom, setUserZoom] = useState(1);
    const effectiveScale = baseScale * userZoom;

    const zoomIn = () => setUserZoom(z => Math.min(3, +(z + 0.25).toFixed(2)));
    const zoomOut = () => setUserZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)));
    const resetZoom = () => setUserZoom(1);

    // Mouse wheel zoom
    const handleWheel = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) setUserZoom(z => Math.min(3, +(z + 0.1).toFixed(2)));
            else setUserZoom(z => Math.max(0.25, +(z - 0.1).toFixed(2)));
        }
    }, []);

    // Pan via mouse drag on viewport
    const handlePanStart = useCallback((e) => {
        // Prevent panning if starting on an interactive table
        if (e.target.closest('.interactive-table') && e.button !== 1) return;
        e.preventDefault();
        const viewport = viewportRef.current;
        if (!viewport) return;
        panRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: viewport.scrollLeft,
            scrollTop: viewport.scrollTop,
        };

        const handleMove = (ev) => {
            if (!panRef.current) return;
            const dx = ev.clientX - panRef.current.startX;
            const dy = ev.clientY - panRef.current.startY;
            viewport.scrollLeft = panRef.current.scrollLeft - dx;
            viewport.scrollTop = panRef.current.scrollTop - dy;
        };
        const handleUp = () => {
            panRef.current = null;
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    }, []);

    // Mouse and Touch listeners below this line have been streamlined
    // Native smooth scroll for mobile takes over without JS interference

    // Center the map on mount and room switch
    const centerMap = useCallback(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        // Try getting the exact positions from the DOM for perfect precision.
        const headerEl = document.getElementById('floating-header');
        const mapWrapper = document.getElementById('map-inner-wrapper');

        // Exact height of the floating Top Navigation/Tabs. Default to 130px if missing.
        const headerHeight = headerEl ? headerEl.offsetHeight : 130;

        let scrollY = 0;
        let scrollX = 0;

        if (mapWrapper) {
            // mapWrapper.offsetTop gives the precise Y-coordinate of where the map starts 
            // after the massive 40vh padding.
            // We want that edge to be perfectly visible directly underneath the header + 24px of breathing visual margin.
            scrollY = Math.max(0, mapWrapper.offsetTop - headerHeight - 24);

            // For horizontal center:
            scrollX = Math.max(0, mapWrapper.offsetLeft + (mapWrapper.offsetWidth / 2) - (viewport.clientWidth / 2));
        } else {
            // Fallback just in case DOM isn't ready
            const paddingTop = window.innerHeight * 0.4;
            scrollY = Math.max(0, paddingTop - headerHeight - 24);
            scrollX = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
        }

        viewport.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: 'auto' // 'auto' ensures it snaps immediately on load without mobile-scroll interruptions.
        });
    }, []);

    // Reset zoom and center when switching rooms
    useEffect(() => {
        setUserZoom(1);
        // Wait longer (300ms) to ensure the ResizeObserver scale updates, DOM paints the padding, and mobile UI settles
        setTimeout(centerMap, 300);
    }, [activeRoomId, centerMap, baseScale]); // Depend on baseScale so it re-centers when device is rotated/resized

    return (
        <div className="h-screen w-screen overflow-hidden bg-[#1A1A1A] flex flex-col relative font-sans">
            <Head title="Pilih Meja - Garasi 66" />

            {/* Floating Top Elements */}
            <div id="floating-header" className="absolute top-0 left-0 right-0 z-30 pointer-events-none flex flex-col items-center">
                {/* Branded Top Bar (Identical to CustomerLayout) */}
                <div className="w-full bg-[#2D2D2D]/80 backdrop-blur-xl border-b border-white/5 pointer-events-auto h-16 flex items-center shadow-2xl">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 flex justify-between items-center">
                        <Link href="/" className="flex items-center gap-3 group">
                            <img
                                src="/images/garasi66_logo.png"
                                alt="Garasi 66"
                                className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="hidden sm:block">
                                <span className="text-white font-black text-sm sm:text-base tracking-tight leading-none">
                                    GARASI <span className="text-[#E84C30]">66</span>
                                </span>
                                <span className="block text-[8px] text-white/40 uppercase tracking-[0.2em]">Cafe & Resto</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link
                                href={route('customer.menu')}
                                className="text-emerald-400 hover:text-emerald-300 transition-colors p-2 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-normal uppercase tracking-widest border border-emerald-400/50 rounded-lg hover:border-emerald-400 hover:bg-emerald-400/10 flex items-center gap-2"
                                title="Our Menu"
                            >
                                <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                                <span className="hidden sm:inline">Our Menu</span>
                            </Link>
                            
                            <Link
                                href={route('customer.cart')}
                                className="relative text-white/60 hover:text-[#E84C30] transition-colors p-2 bg-white/5 rounded-full"
                                title="View Cart"
                            >
                                <svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#E84C30] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg ring-2 ring-[#2D2D2D]">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Unified Header: Title & Room Selection */}
                <div className="w-full flex flex-col items-center">
                    {/* Title Area (Matches Menu Page) */}
                    <div className="w-full max-w-7xl px-4 sm:px-8 pt-8 pb-6 flex justify-start">
                        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
                            Pilih <span className="font-semibold text-[#E84C30]">Meja</span>
                        </h1>
                    </div>

                    {/* Room Tabs - Sticky Style (Matches Menu Categories) */}
                    {localRooms && localRooms.length > 1 && (
                        <div className="w-full pointer-events-auto sticky top-16 z-30 bg-[#1A1A1A]/80 backdrop-blur-xl border-y border-white/5 overflow-x-auto hide-scrollbar py-3 px-4 sm:px-8">
                            <div className="max-w-7xl mx-auto flex gap-2 justify-start">
                                {localRooms.map(room => (
                                    <button
                                        key={room.id}
                                        onClick={() => setActiveRoomId(room.id)}
                                        className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${activeRoomId === room.id
                                            ? 'bg-[#E84C30] text-white border-[#E84C30] shadow-lg shadow-[#E84C30]/20'
                                            : 'bg-white/5 text-white/40 border-white/5 hover:text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        {room.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mobile Info Tag */}
                    <div className="sm:hidden mt-4 pointer-events-none px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md">
                        <span className="text-[9px] text-white/30 font-medium uppercase tracking-widest">Sentuh Meja Untuk Memesan</span>
                    </div>
                </div>
            </div>

            {/* Map Container - Full Screen Area */}
            {/* Switched back to relative or absolute inset-0 to prevent layout collapse */}
            <div ref={containerRef} className="absolute inset-0 z-0 bg-[#1A1A1A]">
                {/* Scrollable viewport — both axes */}
                <div
                    ref={viewportRef}
                    className="w-full h-full overflow-auto hide-scrollbar pointer-events-auto relative"
                    style={{ cursor: userZoom > 1 ? 'grab' : 'default', overscrollBehavior: 'none' }}
                    onWheel={handleWheel}
                    onMouseDown={handlePanStart}
                >
                    {/* Centering wrapper using block padding to prevent CSS negative-flex/grid clipping */}
                    <div style={{ padding: '40vh 40vw' }} className="w-max h-max box-content">
                        <div id="map-inner-wrapper" style={{ width: `${canvasW * effectiveScale}px`, height: `${canvasH * effectiveScale}px`, flexShrink: 0, position: 'relative' }}>
                            <div
                                className="relative bg-[#222] border border-white/10 rounded-lg shadow-2xl transition-transform duration-75"
                                style={{ width: `${canvasW}px`, height: `${canvasH}px`, transform: `scale(${effectiveScale})`, transformOrigin: 'top left' }}
                            >
                                {/* Floor plan background */}
                                {activeRoom?.floor_plan_image && (
                                    <div className="absolute inset-0 opacity-30 rounded-lg overflow-hidden">
                                        <div className="w-full h-full" style={{ backgroundImage: `url(/storage/${activeRoom.floor_plan_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                    </div>
                                )}
                                {/* Inner Grid Pattern if no image */}
                                {!activeRoom?.floor_plan_image && (
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.05] rounded-lg overflow-hidden" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                                )}

                                {tables.map(table => {
                                    const shape = table.shape || 'rectangle';
                                    const tw = table.width || 80;
                                    const th = table.height || 50;
                                    const isAvailable = table.status === 'available';
                                    const rotation = table.orientation || 0;

                                    return (
                                        <div
                                            key={table.id}
                                            onClick={() => selectTable(table)}
                                            className={`interactive-table absolute flex items-center justify-center transition-all duration-300 select-none group focus:outline-none
                                            ${isAvailable
                                                    ? 'cursor-pointer hover:scale-110 hover:shadow-2xl hover:z-10'
                                                    : 'cursor-not-allowed opacity-50'
                                                }`}
                                            style={{
                                                left: `${table.pos_x || 0}px`,
                                                top: `${table.pos_y || 0}px`,
                                                width: `${tw}px`,
                                                height: `${th}px`,
                                                borderRadius: (shape === 'circle' || shape === 'ellipse') ? '50%' : '16px',
                                                border: `2px solid ${isAvailable ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.3)'}`,
                                                backgroundColor: isAvailable ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)',
                                                transform: `rotate(${rotation}deg)`,
                                                boxShadow: isAvailable ? '0 0 20px rgba(16,185,129,0.1)' : 'none',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (isAvailable) {
                                                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.8)';
                                                    e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.2)';
                                                    e.currentTarget.style.boxShadow = '0 0 30px rgba(16,185,129,0.3)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (isAvailable) {
                                                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)';
                                                    e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)';
                                                    e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.1)';
                                                }
                                            }}
                                        >
                                            {/* Inner content — counter-rotate so text stays horizontal */}
                                            <div className="flex flex-col items-center justify-center p-2" style={{ transform: `rotate(-${rotation}deg)` }}>
                                                <span className={`font-normal text-xs sm:text-sm tracking-tight leading-none ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`} style={!isAvailable ? { textShadow: '0 1px 2px rgba(0,0,0,0.8)' } : undefined}>
                                                    {table.name}
                                                </span>
                                                <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mt-1 ${isAvailable ? 'text-emerald-400/60' : 'text-red-400/50'}`}>
                                                    {table.capacity} <span className="hidden sm:inline">Seats</span><span className="sm:hidden">S</span>
                                                </span>
                                                {isAvailable && (
                                                    <div className="absolute -bottom-3 bg-emerald-500 text-white text-[8px] font-normal uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg shadow-emerald-500/40 opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition-all duration-300 whitespace-nowrap">
                                                        Pilih Meja
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {tables.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/5 flex flex-col items-center">
                                            <svg className="w-8 h-8 text-white/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                            <p className="text-white/40 text-sm font-bold">Belum ada meja yang diatur.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Bottom Bar (Mobile/General Bottom Info) */}
            <div className="absolute bottom-4 left-0 right-0 z-30 pointer-events-none px-3 sm:px-3 flex justify-between items-end flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                {/* Mobile Cancel Button */}
                <div className="w-full sm:hidden pointer-events-auto">
                    <Link
                        href="/"
                        className="w-full bg-[#2D2D2D]/90 backdrop-blur-xl border border-white/10 text-white/70 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xl active:bg-[#3D3D3D]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Batal & Kembali
                    </Link>
                </div>

                {/* Layout Group: Legend + Zoom Badge */}
                <div className="w-full sm:w-auto flex flex-row justify-between sm:justify-center items-center gap-2 sm:gap-4">
                    {/* Legend Overlay */}
                    <div className="pointer-events-auto bg-[#2D2D2D]/90 backdrop-blur-xl border border-white/10 px-3 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-2xl flex gap-3 sm:gap-6 items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] border border-white/20"></div>
                            <span className="text-[9px] sm:text-[10px] font-normal uppercase tracking-widest text-white/60">Tersedia</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80 border border-white/5"></div>
                            <span className="text-[9px] sm:text-[10px] font-normal uppercase tracking-widest text-white/40">Terisi</span>
                        </div>
                    </div>

                    {/* Horizontal Zoom Badge */}
                    <div className="pointer-events-auto bg-[#2D2D2D]/90 backdrop-blur-xl border border-white/10 p-1 rounded-lg shadow-2xl flex items-center gap-0.5 sm:gap-1">
                        <button onClick={zoomOut} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-[#4D4D4D] active:bg-[#5D5D5D] flex items-center justify-center text-white/60 hover:text-white transition-all" title="Zoom Out">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" /></svg>
                        </button>
                        <button onClick={resetZoom} className="px-2 min-w-[2.5rem] sm:min-w-[3rem] h-8 sm:h-10 rounded-lg hover:bg-[#4D4D4D] active:bg-[#5D5D5D] flex items-center justify-center text-white/60 hover:text-white transition-all text-[9px] sm:text-[10px] font-normal tracking-wider" title="Reset Zoom">
                            {Math.round(userZoom * 100)}%
                        </button>
                        <button onClick={zoomIn} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-[#4D4D4D] active:bg-[#5D5D5D] flex items-center justify-center text-white/60 hover:text-white transition-all" title="Zoom In">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" /></svg>
                        </button>
                    </div>
                </div>

                {/* Right Visual Spacer for desktop centering balance */}
                <div className="hidden sm:flex flex-col items-end w-[120px] pointer-events-none">
                    <div className="text-[10px] text-white/20 font-bold mb-1">
                        Ctrl+Scroll to zoom
                    </div>
                </div>
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    width: 0px;
                    height: 0px;
                    background: transparent;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
