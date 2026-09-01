import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number);
};

export default function PrintReceipt({ order, posSettings }) {
    useEffect(() => {
        // Auto print and then close window if it's a popup
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    return (
        <div className="bg-white min-h-screen text-black font-mono p-4 max-w-[300px] mx-auto text-sm print:p-0 print:max-w-full">
            <Head title={`Print Order #${order.id}`} />

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { margin: 0; }
                    body { margin: 1cm; }
                    .no-print { display: none !important; }
                }
                body {
                    background: white;
                    color: black;
                }
            `}} />

            <div className="text-center mb-4">
                <h1 className="text-lg font-bold uppercase">{posSettings.store_name || 'GARASI 66 COFFEE'}</h1>
                <p className="text-[10px] leading-tight">{posSettings.address || ''}</p>
                {posSettings.phone && <p className="text-[10px]">Telp: {posSettings.phone}</p>}
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span>#{order.id}</span>
                </div>
                <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span>{new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span className="uppercase">{order.user?.name || 'Self-Order'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Meja:</span>
                    <span className="uppercase">{order.table?.name || 'Takeaway'}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            <div className="space-y-3">
                {order.items.map((item, idx) => (
                    <div key={idx} className="text-[11px]">
                        <div className="flex justify-between font-bold">
                            <span className="flex-1">{item.qty}x {item.menu?.name}</span>
                            <span>{formatRupiah(item.price * item.qty)}</span>
                        </div>
                        {item.notes && <div className="text-[10px] italic ml-4">* {item.notes}</div>}
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatRupiah(order.subtotal || 0)}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between">
                        <span>Diskon {order.discount?.code ? `(${order.discount.code})` : ''}</span>
                        <span>-{formatRupiah(order.discount_amount)}</span>
                    </div>
                )}
                {Number(order.tax_amount) > 0 && (
                    <div className="flex justify-between">
                        <span>Pajak (PPN)</span>
                        <span>+{formatRupiah(order.tax_amount)}</span>
                    </div>
                )}
                {Number(order.dp_amount_deducted) > 0 && (
                    <div className="flex justify-between">
                        <span>DP Reservasi</span>
                        <span>-{formatRupiah(order.dp_amount_deducted)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2">
                    <span>TOTAL</span>
                    <span>{formatRupiah(order.total_amount)}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-black my-2 pt-2 text-[10px]">
                <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="uppercase font-bold">{order.payment_method || 'Cash'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="uppercase font-bold">{order.status}</span>
                </div>
            </div>

            <div className="text-center mt-6 text-[10px]">
                <p className="font-bold">{posSettings.footer_text || 'Terima kasih atas kunjungan Anda!'}</p>
                <p className="opacity-50 mt-1">Powered by BEGE-POS</p>
            </div>

            <div className="no-print mt-8 flex flex-col gap-2">
                <button 
                    onClick={() => window.print()}
                    className="w-full py-3 bg-black text-white font-bold rounded-lg uppercase tracking-widest"
                >
                    Print Receipt
                </button>
                <button 
                    onClick={() => window.close()}
                    className="w-full py-3 bg-gray-100 text-black font-bold rounded-lg border border-gray-300 uppercase tracking-widest"
                >
                    Close Window
                </button>
            </div>
        </div>
    );
}
