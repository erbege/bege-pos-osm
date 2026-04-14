import React from 'react';
import Modal from './Modal';
import SecondaryButton from './SecondaryButton';
import PrimaryButton from './PrimaryButton';
import DangerButton from './DangerButton';

export default function ConfirmationModal({
    show,
    title,
    message,
    onConfirm,
    onCancel,
    onClose, // Fallback for common mistake
    type = 'primary', // primary, danger, success
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    isProcessing = false,
    hideCancel = false
}) {
    const ConfirmButton = type === 'danger' ? DangerButton : PrimaryButton;
    const handleCancel = onCancel || onClose;

    return (
        <Modal show={show} onClose={hideCancel ? null : handleCancel} maxWidth="md">
            <div className="p-2 bg-[#2D2D2D]">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${type === 'danger' ? 'bg-red-500/10 text-red-500' :
                        type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-[#E84C30]/10 text-[#E84C30]'
                        }`}>
                        {type === 'danger' && (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        )}
                        {type === 'success' && (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        )}
                        {type === 'primary' && (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-normal text-white tracking-tight">{title}</h3>
                        <p className="text-white/40 text-sm mt-1">{message}</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    {!hideCancel && (
                        <button
                            onClick={handleCancel}
                            disabled={isProcessing}
                            className="flex-1 px-4 py-2 bg-white/5 text-white/40 rounded-lg text-xs font-normal uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className={`${hideCancel ? 'w-full' : 'flex-[1.5]'} px-4 py-2 rounded-lg text-xs font-normal uppercase tracking-widest text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${type === 'danger' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' :
                            type === 'success' ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600' :
                                'bg-[#E84C30] shadow-[#E84C30]/20 hover:bg-[#D4432A]'
                            }`}
                    >
                        {isProcessing ? 'Memproses...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
