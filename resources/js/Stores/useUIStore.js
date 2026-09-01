import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand UI Store to manage persistent UI states like sidebar collision.
 */
export const useUIStore = create(
    persist(
        (set) => ({
            isSidebarCollapsed: true, // Collapsed by default as per user request
            printerSettings: {
                type: 'system', // 'system' (browser print), 'bluetooth' (ESC/POS), 'network' (ESC/POS)
                deviceName: null,
                paperSize: '58mm', // '58mm', '80mm'
                autoPrint: false,
            },
            businessInfo: {
                storeName: 'GARASI 66 COFFEE',
                address: 'Coffee & Roastery',
                phone: '',
                footerText: 'Terima Kasih!',
            },
            printerStatus: 'ready', // 'ready', 'printing', 'error', 'offline'
            isPrinterDrawerOpen: false,

            toggleSidebar: () => set((state) => ({
                isSidebarCollapsed: !state.isSidebarCollapsed
            })),

            setSidebarCollapsed: (collapsed) => set({
                isSidebarCollapsed: collapsed
            }),

            updatePrinterSettings: (settings) => set((state) => ({
                printerSettings: { ...state.printerSettings, ...settings }
            })),

            setPrinterSettings: (settings) => set({
                printerSettings: settings
            }),

            setBusinessInfo: (info) => set({
                businessInfo: info
            }),

            setPrinterStatus: (status) => set({ printerStatus: status }),

            togglePrinterDrawer: (open) => set((state) => ({
                isPrinterDrawerOpen: open !== undefined ? open : !state.isPrinterDrawerOpen
            })),
        }),
        {
            name: 'ui-storage', // name of the item in localStorage
        }
    )
);
