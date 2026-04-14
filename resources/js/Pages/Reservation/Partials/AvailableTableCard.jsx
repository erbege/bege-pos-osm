import React from 'react';

export default function AvailableTableCard({ tables, totalCapacity, type, name, index, onSelect }) {
    // tables is an array of Table objects
    // name and totalCapacity are provided by the engine for better display logic

    return (
        <div className="bg-[#2D2D2D] rounded-lg border border-white/5 p-3 hover:border-[#E84C30]/40 transition-all group animate-bounce-in flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xl hover:shadow-[#E84C30]/5">
            <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                    {type === 'combination' ? (
                        <div className="flex items-center gap-2 bg-[#E84C30] px-2.5 py-1 rounded-lg">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="text-white text-[9px] font-normal uppercase tracking-widest">Smart Combo</span>
                        </div>
                    ) : (
                        <span className="bg-white/5 border border-white/10 text-white/40 text-[9px] px-2.5 py-1 rounded-lg font-normal uppercase tracking-widest">
                            Single Table
                        </span>
                    )}
                </div>
                <h3 className="text-lg font-normal text-white tracking-tight">
                    {name}
                </h3>
            </div>

            <button
                onClick={() => onSelect(tables)}
                className="w-full sm:w-auto px-7 py-1.5 bg-white text-black rounded-lg text-[10px] font-normal uppercase tracking-[0.15em] hover:bg-[#E84C30] hover:text-white transition-all transform active:scale-95 shadow-lg shadow-white/5"
            >
                Pilih Opsi
            </button>
        </div>
    );
}
