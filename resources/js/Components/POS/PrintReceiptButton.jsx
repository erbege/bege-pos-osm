import { useState } from 'react';
import { formatRupiah } from '@/Lib/utils';
import { useUIStore } from '@/Stores/useUIStore';

export default function PrintReceiptButton({ order }) {
    const [isPrinting, setIsPrinting] = useState(false);
    const businessInfo = useUIStore((s) => s.businessInfo);

    /**
     * Generate ESC/POS formatted receipt text.
     * Designed for 58mm thermal printers (max ~32 chars per line).
     */
    const generateReceiptText = () => {
        let r = '';

        // --- HEADER ---
        r += '\x1B\x61\x01'; // ESC a 1 = Align Center
        r += '\x1B\x45\x01'; // ESC E 1 = Bold ON
        r += `${businessInfo.storeName || 'GARASI 66 COFFEE'}\n`;
        r += '\x1B\x45\x00'; // Bold OFF
        r += `${businessInfo.address || ''}\n`;
        if (businessInfo.phone) r += `Telp: ${businessInfo.phone}\n`;
        r += '--------------------------------\n';

        // --- ORDER INFO ---
        r += '\x1B\x61\x00'; // Align Left
        r += `No  : ${order.order_number || '-'}\n`;
        r += `Meja: ${order.table_number || 'Takeaway'}\n`;
        r += `Waktu: ${new Date().toLocaleString('id-ID')}\n`;
        r += '--------------------------------\n';

        // --- ITEMS ---
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                const name = item.name || item.menu?.name || 'Item';
                const qty = item.qty || item.quantity || 1;
                const price = item.price || 0;
                const lineTotal = price * qty;

                r += `${qty}x ${name}\n`;
                const priceStr = formatRupiah(lineTotal);
                const padding = 32 - priceStr.length;
                r += ' '.repeat(Math.max(0, padding)) + priceStr + '\n';

                if (item.notes) {
                    r += `   *${item.notes}\n`;
                }
            });
        }

        // --- TOTALS ---
        r += '--------------------------------\n';
        if (order.subtotal != null) {
            r += `Subtotal        : ${formatRupiah(order.subtotal)}\n`;
        }
        if (order.discount_amount && order.discount_amount > 0) {
            r += `Diskon          : -${formatRupiah(order.discount_amount)}\n`;
        }
        if (order.tax_amount && order.tax_amount > 0) {
            r += `PPN             : ${formatRupiah(order.tax_amount)}\n`;
        }

        r += '\x1B\x45\x01'; // Bold ON
        r += `TOTAL           : ${formatRupiah(order.grand_total || order.total_amount || 0)}\n`;
        r += '\x1B\x45\x00'; // Bold OFF

        r += '--------------------------------\n';
        r += '\x1B\x61\x01'; // Align Center
        r += `${businessInfo.footerText || 'Terima Kasih!'}\n`;
        r += 'Powered by BEGE-POS\n\n\n\n';

        // Auto-cut command
        r += '\x1D\x56\x42\x00';

        return r;
    };

    /**
     * Print via Web Bluetooth API (Chrome on desktop/laptop).
     */
    const handleWebBluetoothPrint = async () => {
        setIsPrinting(true);
        try {
            const receiptText = generateReceiptText();
            const encoder = new TextEncoder();
            const data = encoder.encode(receiptText);

            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'],
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

            // Send in chunks to avoid buffer overflow
            const chunkSize = 256;
            for (let i = 0; i < data.length; i += chunkSize) {
                await characteristic.writeValue(data.slice(i, i + chunkSize));
            }

            alert('Struk berhasil dicetak!');
        } catch (error) {
            console.error('Bluetooth print error:', error);
            alert('Gagal mencetak. Pastikan Bluetooth aktif dan printer terhubung.');
        } finally {
            setIsPrinting(false);
        }
    };

    /**
     * Print via RawBT app (Android tablet).
     */
    const handleRawBTPrint = () => {
        const receiptText = generateReceiptText();
        const base64Text = btoa(unescape(encodeURIComponent(receiptText)));
        window.location.href = `rawbt:base64,${base64Text}`;
    };

    return (
        <div className="flex gap-2 w-full mt-4">
            {/* Web Bluetooth — Desktop/Laptop */}
            <button
                onClick={handleWebBluetoothPrint}
                disabled={isPrinting}
                className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2 text-sm"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {isPrinting ? 'Mencetak...' : 'Cetak (Bluetooth)'}
            </button>

            {/* RawBT — Android Tablet */}
            <button
                onClick={handleRawBTPrint}
                className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 rounded-lg transition-colors border border-blue-300 text-sm"
            >
                Cetak via RawBT
            </button>
        </div>
    );
}
