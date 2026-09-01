/**
 * Utility to format and print kitchen slips via ESC/POS
 */
export const KitchenPrintService = {
    formatOrder(order) {
        const line = '--------------------------------\n';
        const divider = '================================\n';
        let text = '\x1B\x40'; // Initialize printer
        
        // Header: Order ID & Table
        text += '\x1B\x61\x01'; // Center align
        text += '\x1B\x21\x30'; // Double height & width
        text += `ORDER #${order.id}\n`;
        text += '\x1B\x21\x00'; // Normal size
        
        if (order.table) {
            text += `MEJA: ${order.table.name}\n`;
        }
        text += `Waktu: ${new Date(order.created_at).toLocaleTimeString('id-ID')}\n`;
        text += divider;

        // Items
        text += '\x1B\x61\x00'; // Left align
        order.items.forEach((item) => {
            text += '\x1B\x21\x10'; // Double height for item name/qty
            text += `${item.qty}x ${item.menu?.name}\n`;
            text += '\x1B\x21\x00'; // Back to normal
            
            if (item.notes) {
                text += `  * NOTE: ${item.notes}\n`;
            }
            text += line;
        });

        // Footer
        text += '\x1B\x61\x01';
        text += '\n\n\n\n\n';
        text += '\x1B\x6D'; // Paper cut (if supported)
        
        return text;
    },

    async printViaBluetooth(order, deviceName = 'Printer') {
        try {
            const text = this.formatOrder(order);
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: deviceName }, { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            
            // Send in chunks of 20 bytes for stability
            for (let i = 0; i < data.length; i += 20) {
                await characteristic.writeValue(data.slice(i, i + 20));
            }
            
            await server.disconnect();
            return true;
        } catch (error) {
            console.error('Kitchen Print Error:', error);
            return false;
        }
    }
};
