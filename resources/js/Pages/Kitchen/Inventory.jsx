import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function Inventory({ auth, materials }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        qty: '',
        type: 'adjustment',
        notes: ''
    });

    const filteredMaterials = materials.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleQuickUpdate = (material) => {
        setSelectedMaterial(material);
        reset();
        setShowModal(true);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('kitchen.inventory.update', selectedMaterial.id), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#1A1A1A] flex flex-col text-left">
            <Head title="Kitchen Stock" />

            <header className="bg-[#2D2D2D] border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href={route('kitchen.index')} className="text-white/40 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight">Kitchen Stock</h1>
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Quick Management</p>
                    </div>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    {materials.length} Items
                </div>
            </header>

            <div className="p-4 space-y-4 flex-1">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search ingredients..."
                        className="w-full bg-[#2D2D2D] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {filteredMaterials.map(m => (
                        <button 
                            key={m.id}
                            onClick={() => handleQuickUpdate(m)}
                            className="bg-[#2D2D2D] p-4 rounded-2xl border border-white/5 flex justify-between items-center active:scale-[0.98] transition-all text-left"
                        >
                            <div>
                                <div className="font-bold text-white">{m.name}</div>
                                <div className="text-[10px] text-white/30 uppercase font-black mt-1">Current Stock</div>
                            </div>
                            <div className="text-right">
                                <div className={`text-lg font-black font-mono ${m.stock <= m.min_stock ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {parseFloat(m.stock).toFixed(1)}
                                </div>
                                <div className="text-[10px] text-white/20 uppercase font-bold">{m.unit}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="sm">
                <div className="bg-[#1E1E1E] rounded-3xl p-6 space-y-6">
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white">{selectedMaterial?.name}</h3>
                        <p className="text-xs text-white/30 uppercase font-black tracking-widest mt-1">Stock Correction</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                type="button" 
                                onClick={() => setData('type', 'adjustment')}
                                className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${data.type === 'adjustment' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                                Correction
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setData('type', 'waste')}
                                className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${data.type === 'waste' ? 'bg-red-500 text-white border-red-500' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                                Wastage
                            </button>
                        </div>

                        <div className="relative">
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-5 text-3xl font-black font-mono text-white text-center focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40"
                                value={data.qty}
                                onChange={e => setData('qty', e.target.value)}
                                placeholder="0.0"
                                required
                                autoFocus
                            />
                            <div className="text-center mt-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                                Enter positive or negative delta
                            </div>
                        </div>

                        <textarea 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white h-24 resize-none focus:outline-none"
                            placeholder="Add reason/note..."
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                        />

                        <button 
                            type="submit" 
                            disabled={processing}
                            className="w-full py-4 bg-[#E84C30] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#E84C30]/20 disabled:opacity-30"
                        >
                            {processing ? 'Syncing...' : 'Commit Update'}
                        </button>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
