import { useState, useRef, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { QRCodeCanvas } from 'qrcode.react';
import ConfirmationModal from '@/Components/ConfirmationModal';

// --- Constants ---
const SHAPES = ['rectangle', 'square', 'circle', 'ellipse'];
const ORIENTATIONS = [0, 45, 90, 135];

/* ─── Table UI Component ─── */
function TableShape({ table, isSelected, onSelect, onDragStart }) {
    // Styling states based on status and selection
    const isOccupied = table.status === 'occupied';

    // Reservations Logic Check
    const hasReservations = table.reservations && table.reservations.length > 0;

    // Core Colors
    const borderColor = isOccupied ? '#F59E0B' : (hasReservations ? '#3B82F6' : '#E84C30');
    const bgColor = isOccupied ? 'rgba(245, 158, 11, 0.2)' : (hasReservations ? 'rgba(59, 130, 246, 0.2)' : 'rgba(232, 76, 48, 0.15)');
    const textColor = isOccupied ? '#FCD34D' : (hasReservations ? '#93C5FD' : '#FFFFFF');

    // Dimensions — use DB values with fallbacks
    let width = table.width || 80, height = table.height || 50;
    let borderRadius = '8px';
    if (table.shape === 'circle' || table.shape === 'ellipse') borderRadius = '50%';

    return (
        <div
            onMouseDown={(e) => onDragStart(e, table)}
            onTouchStart={(e) => onDragStart(e, table)}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`absolute flex items-center justify-center cursor-pointer select-none transition-shadow ${isSelected ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-[#111]' : ''}`}
            style={{
                left: table.pos_x,
                top: table.pos_y,
                width,
                height,
                borderRadius,
                border: `2px solid ${borderColor}`,
                backgroundColor: bgColor,
                transform: `rotate(${table.orientation || 0}deg)`,
                zIndex: isSelected ? 20 : 10,
                boxShadow: isSelected ? '0 10px 25px rgba(0,0,0,0.5)' : '0 4px 6px rgba(0,0,0,0.3)',
            }}
        >
            <div style={{ transform: `rotate(${(table.orientation || 0) * -1}deg)` }} className="text-center">
                <div className="font-bold text-[11px]" style={{ color: textColor }}>{table.name}</div>
                <div className="text-[9px] opacity-70" style={{ color: textColor }}>{table.capacity}p</div>
            </div>

            {/* Reserved Indicator Badge */}
            {hasReservations && !isOccupied && (
                <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-[#1E1E1E]">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            )}
        </div>
    );
}

/* ─── Main page ─── */
export default function Tables({ rooms: initialRooms }) {
    const [rooms, setRooms] = useState(initialRooms || []);
    const [activeRoomId, setActiveRoomId] = useState(initialRooms?.[0]?.id || null);

    const [showModal, setShowModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);

    const [editing, setEditing] = useState(null);
    const [editingRoom, setEditingRoom] = useState(null);

    const [selectedId, setSelectedId] = useState(null);
    const [viewMode, setViewMode] = useState('layout'); // layout | grid
    const [isDirty, setIsDirty] = useState(false);

    const [form, setForm] = useState({ room_id: '', name: '', capacity: 2, status: 'available', shape: 'rectangle', orientation: 0, width: 80, height: 50 });
    const [roomForm, setRoomForm] = useState({ name: '', description: '' });
    const [roomImageFile, setRoomImageFile] = useState(null);
    const [roomImagePreview, setRoomImagePreview] = useState(null);
    const [removeFloorPlan, setRemoveFloorPlan] = useState(false);
    const resizeRef = useRef(null);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const dragRef = useRef(null);
    const [canvasScale, setCanvasScale] = useState(1);

    // Sync from Inertia when props change
    useEffect(() => {
        setRooms(initialRooms);
        if (initialRooms && initialRooms.length > 0 && !initialRooms.find(r => r.id === activeRoomId)) {
            setActiveRoomId(initialRooms[0].id);
        }
        setIsDirty(false);
    }, [initialRooms]);

    const activeRoom = rooms.find(r => r.id === activeRoomId);
    const tables = activeRoom ? activeRoom.tables : [];

    const canvasW = Math.max(800, ...tables.map(t => (t.pos_x || 0) + (t.width || 80) + 40));
    const canvasH = Math.max(520, ...tables.map(t => (t.pos_y || 0) + (t.height || 50) + 40));

    // ─── Responsive scale via ResizeObserver ────
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setCanvasScale(Math.min(1, entry.contentRect.width / canvasW));
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [canvasW]);

    // ─── Table Form handlers ─────────────────
    const openAdd = () => { setEditing(null); setForm({ room_id: activeRoomId || '', name: '', capacity: 2, status: 'available', shape: 'rectangle', orientation: 0, width: 80, height: 50 }); setShowModal(true); };
    const openEdit = (t) => { setEditing(t); setForm({ room_id: activeRoomId, name: t.name, capacity: t.capacity, status: t.status, shape: t.shape || 'rectangle', orientation: t.orientation || 0, width: t.width || 80, height: t.height || 50 }); setShowModal(true); };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            router.put(`/admin/tables/${editing.id}`, form, { onSuccess: () => setShowModal(false) });
        } else {
            router.post('/admin/tables', form, { onSuccess: () => setShowModal(false) });
        }
    };

    // ─── Room Form Handlers ─────────────────
    const openAddRoom = () => { setEditingRoom(null); setRoomForm({ name: '', description: '' }); setRoomImageFile(null); setRoomImagePreview(null); setRemoveFloorPlan(false); setShowRoomModal(true); };
    const openEditRoom = (r) => { setEditingRoom(r); setRoomForm({ name: r.name, description: r.description || '' }); setRoomImageFile(null); setRoomImagePreview(r.floor_plan_image ? `/storage/${r.floor_plan_image}` : null); setRemoveFloorPlan(false); setShowRoomModal(true); };
    const handleRoomImageChange = (e) => {
        const file = e.target.files[0];
        if (file) { setRoomImageFile(file); setRoomImagePreview(URL.createObjectURL(file)); setRemoveFloorPlan(false); }
    };
    const submitRoom = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', roomForm.name);
        formData.append('description', roomForm.description || '');
        if (roomImageFile) formData.append('floor_plan_image', roomImageFile);
        if (removeFloorPlan) formData.append('remove_floor_plan', '1');
        if (editingRoom) {
            formData.append('_method', 'PUT');
            router.post(`/admin/rooms/${editingRoom.id}`, formData, { forceFormData: true, onSuccess: () => setShowRoomModal(false) });
        } else {
            router.post('/admin/rooms', formData, { forceFormData: true, onSuccess: () => { setShowRoomModal(false); if (initialRooms && initialRooms.length === 0) window.location.reload(); } });
        }
    };

    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'primary', onConfirm: () => { } });
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const destroy = (id) => {
        setConfirmModal({ show: true, title: 'Delete Table', message: 'Are you sure you want to permanently delete this table?', type: 'danger', onConfirm: () => { router.delete(`/admin/tables/${id}`, { preserveScroll: true }); closeConfirm(); } });
    };

    const destroyRoom = (id) => {
        setConfirmModal({ show: true, title: 'Delete Room', message: 'Warning! Deleting this room will delete ALL tables inside it. Are you sure?', type: 'danger', onConfirm: () => { router.delete(`/admin/rooms/${id}`, { preserveScroll: true }); closeConfirm(); } });
    };

    const releaseTable = (table) => {
        setConfirmModal({ show: true, title: 'Release Table', message: `Release "${table.name}" and set status back to available?`, type: 'primary', confirmText: 'Release', onConfirm: () => { router.post(`/admin/tables/${table.id}/release`, {}, { preserveScroll: true }); closeConfirm(); } });
    };

    // ─── QR Print ─────────────────────
    const [qrPrintTable, setQrPrintTable] = useState(null);
    const qrPrintRef = useRef(null);

    const handlePrintQr = () => {
        const printContent = qrPrintRef.current;
        if (!printContent) return;

        // Convert canvas to image so it survives innerHTML copy
        const canvas = printContent.querySelector('canvas');
        let htmlContent = printContent.innerHTML;
        if (canvas) {
            const imgDataUrl = canvas.toDataURL('image/png');
            const imgTag = `<img src="${imgDataUrl}" width="${canvas.width}" height="${canvas.height}" style="display:block;margin:0 auto 24px;" />`;
            // Replace the canvas element with the image
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const canvasEl = tempDiv.querySelector('canvas');
            if (canvasEl) canvasEl.outerHTML = imgTag;
            htmlContent = tempDiv.innerHTML;
        }

        const win = window.open('', '_blank', 'width=400,height=600');
        win.document.write(`
            <html><head><title>QR - ${qrPrintTable.name}</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#fff; }
                .card { text-align:center; padding:40px 32px; border:3px solid #222; border-radius:24px; max-width:320px; }
                .card h1 { font-size:32px; font-weight:900; margin-bottom:4px; letter-spacing:-1px; }
                .card .sub { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:3px; margin-bottom:24px; }
                .card img { display:block; margin:0 auto 24px; }
                .card .inst { font-size:13px; color:#555; line-height:1.5; }
                .card .inst strong { color:#E84C30; }
                .card .url { font-size:9px; color:#bbb; word-break:break-all; margin-top:16px; }
                @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
            </style></head><body>
            ${htmlContent}
            </body></html>
        `);
        win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    // ─── Drag and drop (scale-aware) ─────────────────
    const handleDragStart = useCallback((e, table) => {
        if (viewMode !== 'layout') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scale = canvasScale || 1;
        dragRef.current = {
            id: table.id,
            offsetX: ((e.clientX || e.pageX) - rect.left) / scale - table.pos_x,
            offsetY: ((e.clientY || e.pageY) - rect.top) / scale - table.pos_y,
        };

        const handleMove = (ev) => {
            const clientX = ev.clientX ?? ev.touches?.[0]?.clientX;
            const clientY = ev.clientY ?? ev.touches?.[0]?.clientY;
            if (!dragRef.current || clientX == null) return;
            const r = canvas.getBoundingClientRect();
            let newX = (clientX - r.left) / scale - dragRef.current.offsetX;
            let newY = (clientY - r.top) / scale - dragRef.current.offsetY;
            // Clamp to logical canvas
            newX = Math.max(0, Math.min(newX, canvasW - 40));
            newY = Math.max(0, Math.min(newY, canvasH - 40));

            setRooms(prevRooms => prevRooms.map(room => {
                if (room.id === activeRoomId) {
                    return {
                        ...room,
                        tables: room.tables.map(t => t.id === dragRef.current.id ? { ...t, pos_x: Math.round(newX), pos_y: Math.round(newY) } : t)
                    };
                }
                return room;
            }));

            setIsDirty(true);
        };
        const handleUp = () => {
            dragRef.current = null;
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);
    }, [viewMode, activeRoomId, canvasScale, canvasW, canvasH]);

    // ─── Resize handle ─────────────────
    const handleResizeStart = useCallback((e, table) => {
        e.stopPropagation();
        e.preventDefault();
        const startX = e.clientX || e.touches?.[0]?.clientX;
        const startY = e.clientY || e.touches?.[0]?.clientY;
        const startW = table.width || 80;
        const startH = table.height || 50;
        const scale = canvasScale || 1;
        resizeRef.current = { id: table.id, startX, startY, startW, startH };

        const handleMove = (ev) => {
            const clientX = ev.clientX ?? ev.touches?.[0]?.clientX;
            const clientY = ev.clientY ?? ev.touches?.[0]?.clientY;
            if (!resizeRef.current || clientX == null) return;
            const dx = (clientX - resizeRef.current.startX) / scale;
            const dy = (clientY - resizeRef.current.startY) / scale;
            const newW = Math.max(30, Math.min(300, resizeRef.current.startW + dx));
            const newH = Math.max(30, Math.min(300, resizeRef.current.startH + dy));
            setRooms(prev => prev.map(room => {
                if (room.id !== activeRoomId) return room;
                return { ...room, tables: room.tables.map(t => t.id === resizeRef.current.id ? { ...t, width: Math.round(newW), height: Math.round(newH) } : t) };
            }));
            setIsDirty(true);
        };
        const handleUp = () => {
            resizeRef.current = null;
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);
    }, [activeRoomId, canvasScale]);

    const savePositions = () => {
        const positions = tables.map(t => ({ id: t.id, pos_x: t.pos_x, pos_y: t.pos_y, width: t.width || 80, height: t.height || 50 }));
        router.post('/admin/tables/positions', { positions }, { onSuccess: () => setIsDirty(false) });
    };

    // ─── Helpers ────────────────────────
    const generateQrData = (t) => `${window.location.origin}/menu?table_id=${t.id}`;
    const statusStyle = { available: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', occupied: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    const shapeLabels = { square: 'Square', circle: 'Circle', ellipse: 'Ellipse', rectangle: 'Rectangle' };

    return (
        <AdminLayout title="Tables">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-normal" style={{ color: 'var(--g-text-primary)' }}>Table Layout</h2>
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--g-border)' }}>
                        <button onClick={() => setViewMode('layout')} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'layout' ? 'bg-[#E84C30] text-white' : ''}`} style={viewMode !== 'layout' ? { color: 'var(--g-text-muted)', backgroundColor: 'var(--g-bg-secondary)' } : {}}>
                            <svg className="w-3.5 h-3.5 inline -mt-0.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>
                            Layout
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'grid' ? 'bg-[#E84C30] text-white' : ''}`} style={viewMode !== 'grid' ? { color: 'var(--g-text-muted)', backgroundColor: 'var(--g-bg-secondary)' } : {}}>
                            <svg className="w-3.5 h-3.5 inline -mt-0.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            Grid
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isDirty && viewMode === 'layout' && (
                        <button onClick={savePositions} className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-500 transition-all animate-pulse flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            Save Layout
                        </button>
                    )}
                    {rooms.length > 0 && <button onClick={openAdd} className="px-3 py-1 bg-[#E84C30] text-white font-bold rounded-lg text-xs hover:bg-[#D4432A] transition-all">+ Add Table</button>}
                </div>
            </div>

            {/* Rooms navigation */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                {rooms.map(room => (
                    <div key={room.id} className="flex group">
                        <button
                            onClick={() => setActiveRoomId(room.id)}
                            className={`px-3 py-1 text-xs font-bold whitespace-nowrap transition-all rounded-l-lg border flex-1 ${activeRoomId === room.id ? 'bg-[#E84C30] text-white border-[#E84C30]' : 'bg-transparent border-white/10 hover:bg-white/5'}`}
                            style={activeRoomId !== room.id ? { color: 'var(--g-text-secondary)', borderColor: 'var(--g-border)' } : {}}
                        >
                            {room.name}
                        </button>
                        {/* Room actions attached to active tab */}
                        {activeRoomId === room.id && (
                            <div className="flex bg-[#E84C30] border-[#E84C30] border-y border-r rounded-r-lg overflow-hidden">
                                <button onClick={() => openEditRoom(room)} className="px-2 text-white/70 hover:text-white hover:bg-black/20 transition-all" title="Edit Room">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => destroyRoom(room.id)} className="px-2 pr-3 text-white/70 hover:text-white hover:bg-black/20 transition-all" title="Delete Room">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        )}
                        {activeRoomId !== room.id && (
                            <div className="w-0 overflow-hidden" />
                        )}
                    </div>
                ))}

                <button
                    onClick={openAddRoom}
                    className="px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap border border-dashed border-white/20 hover:border-[#E84C30]/50 hover:bg-[#E84C30]/10 hover:text-[#E84C30]"
                    style={{ color: 'var(--g-text-muted)', borderColor: 'var(--g-border)' }}
                >
                    + Add Room
                </button>
            </div>

            {/* Drag-and-drop canvas layout */}
            {viewMode === 'layout' && activeRoom && (
                <div ref={containerRef} className="rounded-lg overflow-hidden relative" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)', height: `${canvasH * canvasScale}px` }}>
                    {/* Scaled inner canvas — all shapes & background live here */}
                    <div
                        ref={canvasRef}
                        className="relative"
                        style={{ width: `${canvasW}px`, height: `${canvasH}px`, transform: `scale(${canvasScale})`, transformOrigin: 'top left' }}
                        onClick={() => setSelectedId(null)}
                    >
                        {/* Floor plan background */}
                        {activeRoom.floor_plan_image && (
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(/storage/${activeRoom.floor_plan_image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
                        )}
                        {/* Grid pattern */}
                        {!activeRoom.floor_plan_image && <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />}

                        {tables.map(t => (
                            <TableShape
                                key={t.id} table={t}
                                isSelected={selectedId === t.id}
                                onSelect={() => setSelectedId(t.id)}
                                onDragStart={handleDragStart}
                            />
                        ))}
                        {/* Resize handle on selected table */}
                        {selectedId && (() => {
                            const sel = tables.find(t => t.id === selectedId);
                            if (!sel) return null;
                            return (
                                <div
                                    onMouseDown={(e) => handleResizeStart(e, sel)}
                                    onTouchStart={(e) => handleResizeStart(e, sel)}
                                    className="absolute cursor-se-resize z-30"
                                    style={{ left: (sel.pos_x || 0) + (sel.width || 80) - 6, top: (sel.pos_y || 0) + (sel.height || 50) - 6, width: 12, height: 12, backgroundColor: '#E84C30', borderRadius: '3px', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}
                                    title="Drag to resize"
                                />
                            );
                        })()}
                        {tables.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-white/10 text-5xl mb-3">🪑</div>
                                    <p className="text-sm" style={{ color: 'var(--g-text-muted)' }}>No tables in {activeRoom.name}. Add one to get started.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected table sidebar info */}
                    {selectedId && (() => {
                        const sel = tables.find(t => t.id === selectedId);
                        if (!sel) return null;
                        return (
                            <div className="absolute top-3 right-3 w-52 rounded-lg p-2 space-y-3 z-30 flex flex-col" style={{ backgroundColor: 'var(--g-bg-tertiary)', border: '1px solid var(--g-border-strong)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-normal" style={{ color: 'var(--g-text-primary)' }}>{sel.name}</h4>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${statusStyle[sel.status]}`}>{sel.status}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="rounded-lg px-2 py-1.5" style={{ backgroundColor: 'var(--g-bg-secondary)' }}>
                                        <div className="uppercase tracking-widest font-bold" style={{ color: 'var(--g-text-muted)' }}>Shape</div>
                                        <div className="font-bold mt-0.5" style={{ color: 'var(--g-text-primary)' }}>{shapeLabels[sel.shape] || sel.shape}</div>
                                    </div>
                                    <div className="rounded-lg px-2 py-1.5" style={{ backgroundColor: 'var(--g-bg-secondary)' }}>
                                        <div className="uppercase tracking-widest font-bold" style={{ color: 'var(--g-text-muted)' }}>Cap.</div>
                                        <div className="font-bold mt-0.5" style={{ color: 'var(--g-text-primary)' }}>{sel.capacity}</div>
                                    </div>
                                    <div className="rounded-lg px-2 py-1.5" style={{ backgroundColor: 'var(--g-bg-secondary)' }}>
                                        <div className="uppercase tracking-widest font-bold" style={{ color: 'var(--g-text-muted)' }}>Size</div>
                                        <div className="font-bold mt-0.5 font-mono" style={{ color: 'var(--g-text-primary)' }}>{sel.width || 80}×{sel.height || 50}</div>
                                    </div>
                                    <div className="rounded-lg px-2 py-1.5" style={{ backgroundColor: 'var(--g-bg-secondary)' }}>
                                        <div className="uppercase tracking-widest font-bold" style={{ color: 'var(--g-text-muted)' }}>Rot.</div>
                                        <div className="font-bold mt-0.5" style={{ color: 'var(--g-text-primary)' }}>{sel.orientation || 0}°</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); openEdit(sel); }} className="flex-1 text-[10px] bg-white/5 hover:bg-white/10 py-1 rounded-lg transition-all font-bold" style={{ color: 'var(--g-text-secondary)' }}>Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); setQrPrintTable(sel); }} className="text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1 rounded-lg transition-all font-bold" title="Print QR">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                    </button>
                                    {sel.status === 'occupied' && (
                                        <button onClick={(e) => { e.stopPropagation(); releaseTable(sel); }} className="text-[10px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-1 rounded-lg transition-all font-bold">Free</button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); destroy(sel.id); }} className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-lg transition-all font-bold">Del</button>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Legend */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[9px]" style={{ color: 'var(--g-text-muted)' }}>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Available</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Occupied</span>
                        <span className="opacity-50">• Drag tables to arrange</span>
                    </div>
                </div>
            )}

            {/* Grid view */}
            {viewMode === 'grid' && activeRoom && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tables.map(t => (
                        <div key={t.id} className="rounded-lg p-2 hover:scale-[1.01] transition-all" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold" style={{ color: 'var(--g-text-primary)' }}>{t.name}</h3>
                                <div className="flex items-center gap-2">
                                    {(t.reservations && t.reservations.length > 0) && (
                                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/20 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Rsv
                                        </span>
                                    )}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusStyle[t.status]}`}>{t.status}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: 'var(--g-text-muted)' }}>
                                <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {t.capacity}p
                                </span>
                                <span className="flex items-center gap-1 capitalize">
                                    {shapeLabels[t.shape] || t.shape || 'rectangle'}
                                </span>
                                {(t.orientation > 0) && <span>{t.orientation}°</span>}
                            </div>

                            {/* QR Link */}
                            <div className="rounded-lg px-3 py-1 mb-4 flex items-center justify-between" style={{ backgroundColor: 'var(--g-bg-tertiary)' }}>
                                <div className="truncate pr-2">
                                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--g-text-muted)' }}>QR Menu Link</p>
                                    <p className="text-[10px] font-mono truncate" style={{ color: 'var(--g-text-secondary)' }}>{generateQrData(t)}</p>
                                </div>
                                <button onClick={() => setQrPrintTable(t)} className="shrink-0 text-[#E84C30] hover:text-white hover:bg-[#E84C30] p-1.5 rounded-lg border border-[#E84C30]/20 transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => openEdit(t)} className="flex-1 text-[10px] py-1 rounded-lg transition-all font-bold" style={{ backgroundColor: 'var(--g-bg-tertiary)', color: 'var(--g-text-secondary)' }}>Edit</button>
                                {t.status === 'occupied' && (
                                    <button onClick={() => releaseTable(t)} className="text-[10px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-1 rounded-lg transition-all font-bold">Free</button>
                                )}
                                <button onClick={() => destroy(t.id)} className="text-[10px] bg-red-500/10 text-red-400 hover:text-red-300 px-3 py-1 rounded-lg transition-all font-bold">Delete</button>
                            </div>
                        </div>
                    ))}
                    {tables.length === 0 && <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 text-center py-12" style={{ color: 'var(--g-text-muted)' }}>No tables in {activeRoom.name}.</div>}
                </div>
            )}

            {/* No Rooms Fallback */}
            {rooms.length === 0 && (
                <div className="text-center py-20 rounded-lg" style={{ backgroundColor: 'var(--g-bg-secondary)', border: '1px solid var(--g-border)' }}>
                    <div className="text-6xl mb-4 opacity-50">🧭</div>
                    <h3 className="text-xl font-bold mb-2">No Rooms Have Been Created</h3>
                    <p className="opacity-50 mb-6 max-w-sm mx-auto">Create a room (e.g., "Main Dining", "Terrace", "VIP Room") before adding tables.</p>
                    <button onClick={openAddRoom} className="px-4 py-2 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] transition-all">
                        Create First Room
                    </button>
                </div>
            )}

            {/* Room Add/Edit Modal */}
            {showRoomModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2D2D2D] rounded-lg w-full max-w-sm overflow-hidden border border-white/10 shadow-2xl">
                        <div className="p-4 pb-4 border-b border-white/5 flex justify-between items-center bg-black/5">
                            <h3 className="text-base font-normal text-white">{editingRoom ? 'Edit Room' : 'New Room'}</h3>
                            <button onClick={() => { setShowRoomModal(false); setEditingRoom(null); }} className="text-white/30 hover:text-white transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={submitRoom} className="px-4 pb-6 pt-0 space-y-5">
                            <div className="pt-6">
                                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: 'var(--g-text-muted)' }}>Room Name</label>
                                <input type="text" value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} className="w-full rounded-lg px-3 py-1.5 text-sm outline-none border transition-all" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required placeholder="e.g. VIP Lounge" />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: 'var(--g-text-muted)' }}>Description (Optional)</label>
                                <textarea value={roomForm.description} onChange={e => setRoomForm({ ...roomForm, description: e.target.value })} className="w-full rounded-lg px-3 py-1.5 text-sm outline-none border transition-all" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} rows="2" placeholder="Additional details..." />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold block mb-2" style={{ color: 'var(--g-text-muted)' }}>Floor Plan / Background Image</label>
                                {roomImagePreview && !removeFloorPlan && (
                                    <div className="relative mb-2 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--g-border)' }}>
                                        <img src={roomImagePreview} alt="Floor plan" className="w-full h-32 object-cover opacity-60" />
                                        <button type="button" onClick={() => { setRoomImageFile(null); setRoomImagePreview(null); setRemoveFloorPlan(true); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg text-[10px] hover:bg-red-600">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleRoomImageChange} className="w-full text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white/60 hover:file:bg-white/20" style={{ color: 'var(--g-text-muted)' }} />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mx-[-24px] px-4">
                                <button type="button" onClick={() => setShowRoomModal(false)} className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white/40 font-bold hover:bg-white/5 transition text-sm">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] transition-all text-sm">Save Room</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Table Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2D2D2D] rounded-lg w-full max-w-md overflow-hidden border border-white/10 shadow-2xl max-h-[95vh] flex flex-col">
                        <div className="p-4 pb-4 border-b border-white/5 flex justify-between items-center bg-black/5">
                            <h3 className="font-normal text-base" style={{ color: 'var(--g-text-primary)' }}>{editing ? 'Edit Table' : 'Add Table'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={submit} className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 pt-0 space-y-5">
                            {/* Assign Room */}
                            <div className="pt-6">
                                <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--g-text-muted)' }}>Assign Room</label>
                                <select value={form.room_id} onChange={e => setForm({ ...form, room_id: Number(e.target.value) })} className="w-full rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Name + Capacity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--g-text-muted)' }}>Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required placeholder="Table 1" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--g-text-muted)' }}>Capacity</label>
                                    <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} className="w-full rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} required />
                                </div>
                            </div>

                            {/* Shape picker */}
                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold block mb-2" style={{ color: 'var(--g-text-muted)' }}>Shape</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {SHAPES.map(s => {
                                        const sel = form.shape === s;
                                        let preview;
                                        if (s === 'square') preview = <div className="w-8 h-8 rounded-lg" style={{ border: `2px solid ${sel ? '#E84C30' : 'rgba(255,255,255,0.15)'}` }} />;
                                        else if (s === 'circle') preview = <div className="w-8 h-8 rounded-full" style={{ border: `2px solid ${sel ? '#E84C30' : 'rgba(255,255,255,0.15)'}` }} />;
                                        else if (s === 'ellipse') preview = <div className="w-10 h-7 rounded-lg" style={{ borderRadius: '50%', border: `2px solid ${sel ? '#E84C30' : 'rgba(255,255,255,0.15)'}` }} />;
                                        else preview = <div className="w-11 h-7 rounded-lg" style={{ border: `2px solid ${sel ? '#E84C30' : 'rgba(255,255,255,0.15)'}` }} />;
                                        return (
                                            <button key={s} type="button" onClick={() => setForm({ ...form, shape: s })}
                                                className={`flex flex-col items-center gap-1.5 py-2 rounded-lg transition-all ${sel ? 'ring-1 ring-[#E84C30]/40' : ''}`}
                                                style={{ backgroundColor: sel ? 'rgba(232,76,48,0.08)' : 'var(--g-bg-tertiary)', border: `1px solid ${sel ? 'rgba(232,76,48,0.3)' : 'var(--g-border)'}` }}
                                            >
                                                {preview}
                                                <span className="text-[9px] font-bold uppercase" style={{ color: sel ? '#E84C30' : 'var(--g-text-muted)' }}>{s}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Width & Height */}
                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold block mb-2" style={{ color: 'var(--g-text-muted)' }}>Size (px)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Width</label>
                                        <input type="number" min="30" max="300" value={form.width} onChange={e => setForm({ ...form, width: +e.target.value })} className="w-full rounded-lg px-3 py-1 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--g-text-muted)' }}>Height</label>
                                        <input type="number" min="30" max="300" value={form.height} onChange={e => setForm({ ...form, height: +e.target.value })} className="w-full rounded-lg px-3 py-1 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Orientation */}
                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold block mb-2" style={{ color: 'var(--g-text-muted)' }}>Orientation</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-1.5 flex-wrap flex-1">
                                        {ORIENTATIONS.map(deg => {
                                            const sel = form.orientation === deg;
                                            return (
                                                <button key={deg} type="button" onClick={() => setForm({ ...form, orientation: deg })}
                                                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                                    style={sel ? { backgroundColor: 'rgba(232,76,48,0.15)', color: '#E84C30', border: '1px solid rgba(232,76,48,0.3)' } : { backgroundColor: 'var(--g-bg-tertiary)', color: 'var(--g-text-muted)', border: '1px solid var(--g-border)' }}
                                                >
                                                    {deg}°
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {/* Preview */}
                                    <div className="shrink-0 w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--g-bg-tertiary)', border: '1px solid var(--g-border)' }}>
                                        <div style={{
                                            width: Math.min(form.width, 50) * 0.7,
                                            height: Math.min(form.height, 50) * 0.7,
                                            borderRadius: form.shape === 'circle' || form.shape === 'ellipse' ? '50%' : '6px',
                                            border: '2px solid #E84C30',
                                            backgroundColor: 'rgba(232,76,48,0.1)',
                                            transform: `rotate(${form.orientation}deg)`,
                                            transition: 'all 0.2s',
                                        }} />
                                    </div>
                                </div>
                            </div>

                            {/* Status (edit only) */}
                            {editing && (
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--g-text-muted)' }}>Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 outline-none border transition-all" style={{ backgroundColor: 'var(--g-input-bg)', borderColor: 'var(--g-input-border)', color: 'var(--g-text-primary)' }}>
                                        <option value="available">Available</option><option value="occupied">Occupied</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mx-[-24px] px-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white/40 font-bold hover:bg-white/5 transition text-sm">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#E84C30] text-white font-bold rounded-lg hover:bg-[#D4432A] transition-all text-sm">Save Table</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Print Preview Modal */}
            {qrPrintTable && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2D2D2D] rounded-lg w-full max-w-sm overflow-hidden shadow-2xl border border-white/10">
                        <div className="p-4 pb-4 border-b border-white/5 flex justify-between items-center bg-black/5">
                            <h3 className="text-base font-normal text-white">Print QR Code</h3>
                            <button onClick={() => setQrPrintTable(null)} className="text-white/30 hover:text-white transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="px-4 pb-6 pt-6">
                            <p className="text-white/40 text-xs mb-6 text-center">Preview for <span className="text-white font-bold">{qrPrintTable.name}</span></p>

                            <div className="flex justify-center mb-8 bg-white p-4 rounded-lg shadow-inner mx-auto w-fit">
                                <div ref={qrPrintRef}>
                                    <div className="card" style={{ textAlign: 'center', padding: '20px', border: '2px solid #222', borderRadius: '16px', maxWidth: '280px', backgroundColor: '#fff', color: '#000' }}>
                                        <div className="sub" style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Scan to Order</div>
                                        <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-1px', color: '#000' }}>{qrPrintTable.name}</h1>
                                        <div className="sub" style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>{qrPrintTable.capacity} Persons</div>
                                        <QRCodeCanvas
                                            value={`${window.location.origin}/menu?table_id=${qrPrintTable.id}`}
                                            size={180}
                                            level="H"
                                            includeMargin={false}
                                        />
                                        <div className="inst" style={{ fontSize: '12px', color: '#555', lineHeight: '1.4', marginTop: '20px' }}>Scan to see our <strong>Digital Menu</strong> and place your order directly.</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-white/5 mx-[-24px] px-4">
                                <button
                                    onClick={() => setQrPrintTable(null)}
                                    className="flex-1 px-4 py-2 bg-white/5 text-white/40 rounded-lg text-xs font-bold hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePrintQr}
                                    className="flex-[1.5] px-4 py-2 bg-[#E84C30] text-white rounded-lg text-xs font-bold shadow-lg shadow-[#E84C30]/20 hover:bg-[#D4432A] transition-all"
                                >
                                    Print Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText || 'Confirm'}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />
        </AdminLayout >
    );
}

