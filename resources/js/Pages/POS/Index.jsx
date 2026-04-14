import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import PosLayout from '@/Layouts/PosLayout';
import { useCartStore } from '@/Stores/useCartStore';
import { useUIStore } from '@/Stores/useUIStore';
import PrintReceiptButton from '@/Components/POS/PrintReceiptButton';
import IncomingOrders from '@/Components/POS/IncomingOrders';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Drawer from '@/Components/Drawer';

export default function Index({ categories, menus, rooms, todayReservations, recommendedMenus, printerSettings, posSettings, discounts }) {
    const [activeTab, setActiveTab] = useState('cart'); // 'cart', 'incoming', 'reservations'
    const [localRooms, setLocalRooms] = useState(rooms);

    useEffect(() => {
        setLocalRooms(rooms);
    }, [rooms]);
    
    // Initialize Printer Settings in Store
    const setPrinterSettings = useUIStore((s) => s.setPrinterSettings);
    const setBusinessInfo = useUIStore((s) => s.setBusinessInfo);
    const setTaxPercentage = useCartStore((s) => s.setTaxPercentage);

    useEffect(() => {
        if (printerSettings) {
            setPrinterSettings({
                type: printerSettings.type || 'system',
                deviceName: printerSettings.device_name || '',
                paperSize: printerSettings.paper_size || '58mm',
                autoPrint: printerSettings.auto_print === '1' || printerSettings.auto_print === true,
            });
        }
        
        if (posSettings) {
            if (posSettings.tax_percentage) {
                setTaxPercentage(parseFloat(posSettings.tax_percentage));
            }
            
            setBusinessInfo({
                storeName: posSettings.store_name || 'GARASI 66 COFFEE',
                address: posSettings.address || 'Coffee & Roastery',
                phone: posSettings.phone || '',
                footerText: posSettings.footer_text || 'Terima Kasih!',
            });
        }
    }, [printerSettings, posSettings]);

    // Flatten tables for backward compatibility with lookups
    const tables = rooms ? rooms.flatMap(room => room.tables || []) : [];
    // --- Zustand Cart Store ---
    const items = useCartStore((s) => s.items);
    const addItem = useCartStore((s) => s.addItem);
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const updateNotes = useCartStore((s) => s.updateNotes);
    const removeItem = useCartStore((s) => s.removeItem);
    const clearCart = useCartStore((s) => s.clearCart);
    const customerName = useCartStore((s) => s.customerName);
    const setCustomerName = useCartStore((s) => s.setCustomerName);
    const customerPhone = useCartStore((s) => s.customerPhone);
    const setCustomerPhone = useCartStore((s) => s.setCustomerPhone);
    const getSubtotal = useCartStore((s) => s.getSubtotal);
    const getGrandTotal = useCartStore((s) => s.getGrandTotal);
    const getTotalItems = useCartStore((s) => s.getTotalItems);
    const discountCode = useCartStore((s) => s.discountCode);
    const setDiscountCode = useCartStore((s) => s.setDiscountCode);
    const applyDiscount = useCartStore((s) => s.applyDiscount);
    const setManualDiscount = useCartStore((s) => s.setManualDiscount);
    const clearDiscount = useCartStore((s) => s.clearDiscount);
    const appliedDiscount = useCartStore((s) => s.appliedDiscount);
    const isApplyingDiscount = useCartStore((s) => s.isApplyingDiscount);

    // --- Local UI state (not shared across pages) ---
    const [manualDiscountValue, setManualDiscountValue] = useState('');
    const [manualDiscountType, setManualDiscountType] = useState('fixed'); // 'fixed' or 'percentage'

    const handleApplyManualDiscount = () => {
        const val = parseFloat(manualDiscountValue);
        if (isNaN(val) || val <= 0) return;

        if (manualDiscountType === 'percentage') {
            setManualDiscount(val, 'percentage', `Manual ${val}%`);
        } else {
            setManualDiscount(val, 'fixed', 'Manual Rp');
        }
        setShowVoucherDrawer(false);
        setManualDiscountValue('');
    };

    const getCheckoutPayload = useCartStore((s) => s.getCheckoutPayload);
    const taxPercentage = useCartStore((s) => s.taxPercentage);
    const getTaxAmount = useCartStore((s) => s.getTaxAmount);
    const orderId = useCartStore((s) => s.orderId);
    const loadOrder = useCartStore((s) => s.loadOrder);

    // --- Local UI state (not shared across pages) ---
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [selectedBank, setSelectedBank] = useState(null);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrUrl, setQrUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineQueueLength, setOfflineQueueLength] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastOrder, setLastOrder] = useState(null);
    const [showRecommendations, setShowRecommendations] = useState(false);
    
    // EDC Standalone state
    const [showEDCModal, setShowEDCModal] = useState(false);
    const [approvalCode, setApprovalCode] = useState('');

    // Bank Transfer (PG) state
    const [showBankModal, setShowBankModal] = useState(false);
    const [showVaModal, setShowVaModal] = useState(false);
    const [vaData, setVaData] = useState(null);

    const AVAILABLE_BANKS = [
        { id: 'BCA_VA', name: 'BCA Virtual Account', icon: 'BCA' },
        { id: 'BNI_VA', name: 'BNI Virtual Account', icon: 'BNI' },
        { id: 'BRI_VA', name: 'BRI Virtual Account', icon: 'BRI' },
        { id: 'MANDIRI_VA', name: 'Mandiri Virtual Account', icon: 'Mandiri' },
        { id: 'PERMATA_VA', name: 'Permata Virtual Account', icon: 'Permata' },
    ];

    // --- Incoming Self-Orders ---
    const [incomingOrders, setIncomingOrders] = useState([]);
    const [showTableDrawer, setShowTableDrawer] = useState(false);
    const [showVoucherDrawer, setShowVoucherDrawer] = useState(false);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({ 
        show: false, 
        title: '', 
        message: '', 
        type: 'primary', 
        confirmText: 'Konfirmasi',
        cancelText: 'Batal',
        onConfirm: () => { },
        onCancel: null,
        hideCancel: false
    });
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));
    
    const showAlert = (title, message, type = 'primary') => {
        setConfirmModal({
            show: true,
            title,
            message,
            type,
            confirmText: 'OK',
            cancelText: '',
            hideCancel: true,
            onConfirm: closeConfirm
        });
    };

    const showConfirm = (title, message, onConfirm, type = 'primary', confirmText = 'Ya', cancelText = 'Tidak') => {
        setConfirmModal({
            show: true,
            title,
            message,
            type,
            confirmText,
            cancelText,
            hideCancel: false,
            onConfirm: () => {
                onConfirm();
                closeConfirm();
            },
            onCancel: closeConfirm
        });
    };
    const releaseTable = (table) => {
        setConfirmModal({ 
            show: true, 
            title: 'Release Table', 
            message: `Release "${table.name}" and set status back to available?`, 
            type: 'primary', 
            confirmText: 'Release', 
            onConfirm: () => { 
                if (isProcessing) return;
                setIsProcessing(true);
                router.post(route('pos.tables.release', table.id), {}, { 
                    preserveScroll: true, 
                    onSuccess: () => { if (selectedTableId === table.id) setSelectedTableId(null); },
                    onFinish: () => { setIsProcessing(false); closeConfirm(); }
                }); 
            } 
        });
    };

    const subtotal = getSubtotal();
    const grandTotal = getGrandTotal();

    // --- Automatic Discount Application ---
    useEffect(() => {
        if (!discounts) return;

        // Reset automatic discount if payment method or bank changes
        if (appliedDiscount && appliedDiscount.is_automatic) {
            clearDiscount();
        }

        // Find applicable automatic discount
        const autoDiscount = discounts.find(d => {
            if (!d.is_automatic) return false;
            
            // Check Payment Method
            if (d.payment_method && d.payment_method.toUpperCase() !== paymentMethod.toUpperCase()) return false;
            
            // Check Bank Name
            if (d.bank_name && d.bank_name.toUpperCase() !== selectedBank?.toUpperCase()) return false;
            
            // Check Min Purchase
            if (subtotal < d.min_purchase_amount) return false;

            return true;
        });

        if (autoDiscount) {
            setManualDiscount(
                autoDiscount.value, 
                autoDiscount.type, 
                `${autoDiscount.name}${autoDiscount.bank_name ? ' (' + autoDiscount.bank_name + ')' : ''}`,
                true // flag as automatic
            );
        }
    }, [paymentMethod, selectedBank, subtotal, discounts]);

    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); syncOfflineOrders(); };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        const savedQueue = JSON.parse(localStorage.getItem('offline_orders') || '[]');
        setOfflineQueueLength(savedQueue.length);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Fetch existing pending orders on mount
    useEffect(() => {
        axios.get(route('admin.pos.pending_orders'))
            .then(res => setIncomingOrders(res.data))
            .catch(() => { });
    }, []);

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

    // Listen for real-time self-order events via Echo
    useEffect(() => {
        if (typeof Echo === 'undefined') return;
        const channel = Echo.channel('cashier');
        channel.listen('.new.self.order', (e) => {
            setIncomingOrders(prev => {
                if (prev.find(o => o.id === e.order.id)) return prev;
                return [e.order, ...prev];
            });
            // Play notification sound
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                osc.type = 'sine';
                gain.gain.value = 0.3;
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
                setTimeout(() => {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.frequency.value = 1320;
                    osc2.type = 'sine';
                    gain2.gain.value = 0.3;
                    osc2.start();
                    osc2.stop(ctx.currentTime + 0.2);
                }, 180);
            } catch (err) { }
        }).listen('.order.paid', (e) => {
            setIncomingOrders(prev => prev.filter(o => o.id !== e.order.id));
        });
        return () => Echo.leaveChannel('cashier');
    }, []);

    const handleOrderConfirmed = (orderId) => {
        setIncomingOrders(prev => prev.filter(o => o.id !== orderId));
    };

    const handleCheckIn = (reservationId) => {
        setConfirmModal({
            show: true,
            title: 'Check-in Reservation',
            message: 'Are you sure you want to check-in this reservation and lock the tables?',
            type: 'primary',
            confirmText: 'Check-in',
            onConfirm: () => {
                router.post(route('pos.reservations.check-in', reservationId), {}, {
                    onSuccess: () => {
                        closeConfirm();
                    },
                    onError: (errors) => {
                        showAlert("Error", "Error during check-in: " + Object.values(errors).join('\n'), 'danger');
                        closeConfirm();
                    }
                });
            }
        });
    };

    const syncOfflineOrders = () => {
        const queue = JSON.parse(localStorage.getItem('offline_orders') || '[]');
        if (queue.length === 0) return;
        axios.post('/api/v1/sync/orders', { orders: queue })
            .then(() => { localStorage.removeItem('offline_orders'); setOfflineQueueLength(0); showAlert("Sync Success", `${queue.length} offline orders synced!`, 'success'); })
            .catch(err => console.error('Sync failed:', err));
    };

    const filteredMenus = menus.filter(menu => {
        const matchesCategory = selectedCategory ? menu.category_id === selectedCategory : true;
        const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleTableSelect = (table) => {
        const activeOrder = table.activeOrder || table.active_order;

        const performLoad = () => {
            loadOrder(activeOrder);
            setSelectedTableId(table.id);
            setShowTableDrawer(false);
        };

        const performNew = () => {
            clearCart();
            setSelectedTableId(table.id);
            setShowTableDrawer(false);
        };

        if (activeOrder) {
            // Check if cart is currently busy
            if (items.length > 0 && orderId !== activeOrder.id) {
                setConfirmModal({
                    show: true,
                    title: 'Load Running Order',
                    message: 'Table has a running order. Clear current cart and load it?',
                    type: 'primary',
                    confirmText: 'Clear & Load',
                    onConfirm: () => {
                        performLoad();
                        closeConfirm();
                    }
                });
                return;
            }
            performLoad();
        } else {
            // New order for this table
            if (orderId) {
                setConfirmModal({
                    show: true,
                    title: 'New Table Order',
                    message: 'Clear current running order and start new for this table?',
                    type: 'warning',
                    confirmText: 'Clear & Start New',
                    onConfirm: () => {
                        performNew();
                        closeConfirm();
                    }
                });
                return;
            }
            setSelectedTableId(table.id);
            setShowTableDrawer(false);
        }
    };

    const handleCheckout = () => {
        if (isProcessing) return;
        
        if (!navigator.onLine) {
            if (paymentMethod === 'QRIS' || paymentMethod === 'EDC') { 
                showAlert("Offline Mode", `${paymentMethod} is unavailable offline. Please use Cash.`, 'danger'); 
                return; 
            }
            const offlineOrder = { offline_uuid: crypto.randomUUID(), ...getCheckoutPayload('Cash'), created_at: new Date().toISOString() };
            const existingQueue = JSON.parse(localStorage.getItem('offline_orders') || '[]');
            existingQueue.push(offlineOrder);
            localStorage.setItem('offline_orders', JSON.stringify(existingQueue));
            setOfflineQueueLength(existingQueue.length);
            clearCart();
            showAlert("Offline Mode", "Order saved locally. Will auto-sync when connection returns.", 'primary');
            return;
        }

        // Reset selected bank if method doesn't support it
        if (paymentMethod === 'Cash' || paymentMethod === 'QRIS') {
            setSelectedBank(null);
        }

        // Trigger EDC Modal for EDC payment
        if (paymentMethod === 'EDC') {
            setShowEDCModal(true);
            return;
        }

        // Trigger Bank Selection for Transfer
        if (paymentMethod === 'Transfer') {
            setShowBankModal(true);
            return;
        }

        setIsProcessing(true);
        const payload = { 
            ...getCheckoutPayload(paymentMethod), 
            table_id: selectedTableId,
            order_id: orderId // Include orderId if editing an existing order
        };

        if (paymentMethod === 'Cash') {
            router.post(route('pos.checkout'), payload, {
                onSuccess: () => { setLastOrder({ items: [...items], grand_total: grandTotal }); clearCart(); setSelectedTableId(null); },
                onError: (errors) => { setTimeout(() => showAlert("Checkout Error", Object.values(errors).join('\n'), 'danger'), 100); },
                onFinish: () => setIsProcessing(false)
            });
        } else if (paymentMethod === 'QRIS') {
            axios.post(route('pos.checkout'), payload)
                .then(response => {
                    if (response.data.qr_url) {
                        setQrUrl(response.data.qr_url);
                        setShowQrModal(true);
                    } else {
                        showAlert("QR Error", "Payment successful but QR URL is missing.", 'danger');
                    }
                })
                .catch(err => {
                    const message = err.response?.data?.message || err.response?.data?.error || "Payment Failed.";
                    alert(message);
                })
                .finally(() => setIsProcessing(false));
        } else {
            // Other methods (EDC handled above, Transfer/EDC fallback)
            router.post(route('pos.checkout'), payload, {
                onSuccess: () => { clearCart(); setSelectedTableId(null); },
                onFinish: () => setIsProcessing(false)
            });
        }
    };

    const handleEDCCheckout = () => {
        if (!selectedBank) {
            showAlert("Input Required", "Please select the Bank first.", 'primary');
            return;
        }
        if (!approvalCode) {
            showAlert("Input Required", "Please enter the Approval Code from the EDC slip.", 'primary');
            return;
        }

        setIsProcessing(true);
        setShowEDCModal(false);

        const payload = { 
            ...getCheckoutPayload('EDC'), 
            table_id: selectedTableId,
            approval_code: approvalCode,
            payment_channel: selectedBank // Treat selected bank as payment channel for EDC
        };

        router.post(route('pos.checkout'), payload, {
            onSuccess: () => { 
                setLastOrder({ items: [...items], grand_total: grandTotal });
                clearCart(); 
                setSelectedTableId(null);
                setApprovalCode('');
                setSelectedBank(null);
            },
            onError: (errors) => { 
                setShowEDCModal(true);
                setTimeout(() => showAlert("Checkout Error", Object.values(errors).join('\n'), 'danger'), 100); 
            },
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleBankSelect = (bankId) => {
        setSelectedBank(bankId); // Track the bank for automatic discounts
        setIsProcessing(true);
        setShowBankModal(false);

        const payload = { 
            ...getCheckoutPayload('Transfer'), 
            table_id: selectedTableId,
            payment_channel: bankId
        };

        axios.post(route('pos.checkout'), payload)
            .then(response => {
                if (response.data.virtual_account) {
                    setVaData(response.data);
                    setShowVaModal(true);
                } else {
                    alert("VA Generation successful but account number is missing.");
                }
            })
            .catch(err => {
                const message = err.response?.data?.message || err.response?.data?.error || "VA Generation Failed.";
                alert(message);
            })
            .finally(() => setIsProcessing(false));
    };

    const handleSaveOrder = () => {
        setIsProcessing(true);
        const payload = { 
            ...getCheckoutPayload('SAVE'), 
            table_id: selectedTableId,
            order_id: orderId 
        };

        axios.post(route('pos.checkout'), payload)
            .then(res => {
                if (res.data.success) {
                    clearCart();
                    setSelectedTableId(null);
                    // Refresh incoming orders
                    axios.get(route('admin.pos.pending_orders')).then(res => setIncomingOrders(res.data));
                    showAlert("Success", "Order saved successfully.", 'success');
                }
            })
            .catch(err => {
                const message = err.response?.data?.message || "Error saving order.";
                alert(message);
            })
            .finally(() => setIsProcessing(false));
    };

    return (
        <PosLayout>
            <div className="flex flex-col lg:flex-row gap-4 h-full">

                {/* ═══════════════════════ LEFT: MENU CATALOG ═══════════════════════ */}
                <div className="flex-1 flex flex-col h-full bg-[#2D2D2D] rounded-lg border border-white/5 overflow-hidden">

                    {/* Search + Categories */}
                    <div className="p-2 border-b border-white/5 space-y-3 shrink-0">
                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 transition-all"
                            />
                        </div>

                        {/* Categories */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${selectedCategory === null
                                    ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/25'
                                    : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'
                                    }`}
                            >All</button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${selectedCategory === cat.id
                                        ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/25'
                                        : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'
                                        }`}
                                >{cat.name}</button>
                            ))}

                            <button
                                onClick={() => setShowRecommendations(!showRecommendations)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-normal uppercase tracking-wider transition-all whitespace-nowrap border ml-auto ${showRecommendations
                                    ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-400/20'
                                    : 'bg-amber-400/10 text-amber-500 border-amber-400/20 hover:bg-amber-400/20'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                Rekomendasi
                            </button>
                        </div>
                    </div>

                    {/* Recommendations Popup Slider */}
                    {showRecommendations && (
                        <div className="mx-2 mb-2 p-3 bg-gradient-to-r from-amber-400/10 to-transparent border border-amber-400/20 rounded-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    <h4 className="text-[10px] font-normal uppercase tracking-[0.2em] text-amber-400">Best Sellers</h4>
                                </div>
                                <button onClick={() => setShowRecommendations(false)} className="text-white/20 hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                                {recommendedMenus.map(menu => (
                                    <button
                                        key={`rec-${menu.id}`}
                                        onClick={() => { addItem(menu); setShowRecommendations(false); }}
                                        className="shrink-0 w-32 bg-[#222] rounded-lg border border-white/5 p-1.5 hover:border-amber-400/40 transition-all group text-left"
                                    >
                                        <div className="aspect-square rounded-md overflow-hidden bg-black/40 mb-1.5">
                                            {menu.image ? (
                                                <img src={menu.image.startsWith('http') ? menu.image : `/storage/${menu.image}`} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-amber-400/5">
                                                    <span className="text-amber-400/20 font-normal text-xl uppercase">{menu.name.substring(0, 1)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <h5 className="text-[10px] font-bold text-white leading-tight line-clamp-1 group-hover:text-amber-400 transition-colors uppercase tracking-tighter">{menu.name}</h5>
                                        <p className="text-[10px] font-normal text-amber-400">Rp {Number(menu.price).toLocaleString('id-ID')}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {filteredMenus.map(menu => (
                                <button
                                    key={menu.id}
                                    onClick={() => addItem(menu)}
                                    className="bg-[#222] rounded-lg border border-white/5 hover:border-[#E84C30]/40 transition-all duration-200 group text-left overflow-hidden hover:shadow-lg hover:shadow-[#E84C30]/5 active:scale-[0.97]"
                                >
                                    <div className="aspect-square bg-[#1A1A1A] overflow-hidden">
                                        {menu.image ? (
                                            <img src={menu.image.startsWith('http') ? menu.image : `/storage/${menu.image}`} alt={menu.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-[#E84C30]/30 font-normal text-3xl uppercase">{menu.name.substring(0, 1)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2">
                                        <h3 className="text-white font-semibold text-xs leading-tight line-clamp-2 mb-1.5 group-hover:text-[#E84C30] transition-colors">{menu.name}</h3>
                                        <span className="text-[#E84C30] font-normal text-sm">Rp {Number(menu.price).toLocaleString('id-ID')}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {filteredMenus.length === 0 && (
                            <div className="h-full flex items-center justify-center text-white/20">
                                <p className="text-sm">No items found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════ RIGHT: CART / CHECKOUT ═══════════════════════ */}
                <div className="w-full lg:w-[380px] flex flex-col bg-[#2D2D2D] rounded-lg border border-white/5 h-full overflow-hidden shrink-0">

                    {/* Cart Header with Tab Toggle */}
                    <div className="p-2 border-b border-white/5 bg-[#E84C30] shrink-0">
                        <div className="flex items-center gap-1">
                            {/* Cart Tab */}
                            <button
                                onClick={() => setActiveTab('cart')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'cart' ? 'bg-black/20 text-white' : 'text-white/50 hover:text-white/80'}`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                Cart
                                <span className="text-[8px] bg-black/20 px-1 rounded-full">{getTotalItems()}</span>
                            </button>

                            {/* Incoming Orders Tab */}
                            <button
                                onClick={() => setActiveTab('incoming')}
                                className={`relative flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'incoming' ? 'bg-black/20 text-white' : 'text-white/50 hover:text-white/80'}`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                Orders
                                {incomingOrders.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-[8px] font-normal rounded-full flex items-center justify-center shadow-lg">
                                        {incomingOrders.length}
                                    </span>
                                )}
                            </button>

                            {/* Reservations Tab */}
                            <button
                                onClick={() => setActiveTab('reservations')}
                                className={`relative flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'reservations' ? 'bg-black/20 text-white' : 'text-white/50 hover:text-white/80'}`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                Booking
                                {todayReservations.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#E84C30] text-[8px] font-normal rounded-full flex items-center justify-center shadow-lg">
                                        {todayReservations.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center justify-end gap-2 mt-2">
                            {!isOnline && (
                                <span className="text-[10px] px-2 py-0.5 bg-black/20 text-white/80 rounded-full font-bold animate-pulse">OFFLINE</span>
                            )}
                            {offlineQueueLength > 0 && (
                                <span className="text-[10px] px-2 py-0.5 bg-black/20 text-white/80 rounded-full font-bold">{offlineQueueLength} Queued</span>
                            )}
                        </div>
                    </div>

                    {/* Content: Cart Items OR Incoming Orders OR Reservations */}
                    {activeTab === 'incoming' ? (
                        <div className="flex-1 overflow-y-auto p-2">
                            <IncomingOrders
                                orders={incomingOrders}
                                onOrderConfirmed={handleOrderConfirmed}
                                onLoadOrder={(order) => {
                                    const performLoad = () => {
                                        loadOrder(order);
                                        setSelectedTableId(order.table_id);
                                        setActiveTab('cart');
                                    };

                                    if (items.length > 0 && orderId !== order.id) {
                                        setConfirmModal({
                                            show: true,
                                            title: 'Load Order',
                                            message: 'Cart is not empty. Clear cart and load this order?',
                                            type: 'primary',
                                            confirmText: 'Clear & Load',
                                            onConfirm: () => {
                                                performLoad();
                                                closeConfirm();
                                            }
                                        });
                                        return;
                                    }
                                    performLoad();
                                }}
                            />
                        </div>
                    ) : activeTab === 'reservations' ? (
                        <div className="flex-1 overflow-y-auto p-2 space-y-3">
                            {todayReservations.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/10 py-12">
                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <p className="text-xs font-bold uppercase tracking-widest leading-loose">No Booking Today</p>
                                </div>
                            ) : (
                                todayReservations.map(res => (
                                    <div key={res.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/5 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-xs font-normal text-white">{res.customer_name}</div>
                                                <div className="text-[10px] text-white/40 mt-0.5">{res.customer_phone || '-'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-normal text-emerald-400">{res.start_time.substring(0, 5)} WIB</div>
                                                <div className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{res.pax || res.guest_count} Pax</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                                            <div className="text-[9px] font-normal px-1.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 uppercase tracking-tighter">
                                                {res.tables?.map(t => t.name).join(' + ') || 'No Table'}
                                            </div>
                                            <button
                                                onClick={() => handleCheckIn(res.id)}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-normal uppercase tracking-widest transition-all"
                                            >
                                                Check-in
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                                {items.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-white/15">
                                        <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                        <p className="text-sm font-medium">Empty cart</p>
                                        <p className="text-xs text-white/10 mt-1">Tap items on the left to add them</p>
                                    </div>
                                ) : (
                                    items.map(item => (
                                        <div key={item.cart_id} className="group bg-white/[0.03] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-all">
                                            <div className="flex gap-3 items-start">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-white text-sm truncate">{item.name}</h4>
                                                    <div className="text-white/30 text-xs mt-0.5">Rp {Number(item.price).toLocaleString('id-ID')} × {item.qty}</div>
                                                </div>
                                                <div className="font-bold text-[#E84C30] text-sm whitespace-nowrap">
                                                    Rp {(item.price * item.qty).toLocaleString('id-ID')}
                                                </div>
                                            </div>

                                            {/* Controls Row */}
                                            <div className="flex items-center justify-between mt-2 gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Note..."
                                                    value={item.notes || ''}
                                                    onChange={(e) => updateNotes(item.cart_id, e.target.value)}
                                                    className="flex-1 text-[11px] bg-transparent border-b border-white/10 text-white/60 placeholder-white/15 py-1 px-0 focus:outline-none focus:border-[#E84C30]/40 transition-colors"
                                                />
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => updateQuantity(item.cart_id, item.qty - 1)}
                                                        className="w-7 h-7 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
                                                    >−</button>
                                                    <span className="w-7 text-center text-white text-sm font-bold">{item.qty}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.cart_id, item.qty + 1)}
                                                        className="w-7 h-7 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
                                                    >+</button>
                                                    <button
                                                        onClick={() => removeItem(item.cart_id)}
                                                        className="w-7 h-7 rounded-lg text-white/20 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all ml-1"
                                                        title="Remove"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Checkout Footer */}
                            <div className="p-2 border-t border-white/5 bg-[#222] space-y-3 shrink-0">
                                {orderId && (
                                    <div className="flex items-center justify-between bg-[#E84C30]/10 border border-[#E84C30]/20 rounded-lg px-3 py-1.5">
                                        <span className="text-[10px] text-[#E84C30] font-bold uppercase tracking-wider">Editing Order #{orderId}</span>
                                        <button onClick={() => clearCart()} className="text-[10px] text-white/40 hover:text-white uppercase font-bold transition-colors">Cancel</button>
                                    </div>
                                )}
                                {/* Subtotal */}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40">Subtotal</span>
                                    <span className="text-white/70 font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span>
                                </div>


                                {appliedDiscount && (
                                    <div className="flex justify-between items-center text-sm text-emerald-400">
                                        <span className="font-medium text-xs">Discount ({appliedDiscount.code})</span>
                                        <span className="font-bold">- Rp {appliedDiscount.amount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}

                                {/* Tax */}
                                {taxPercentage > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/40">Tax ({taxPercentage}%)</span>
                                        <span className="text-white/70 font-semibold">Rp {getTaxAmount().toLocaleString('id-ID')}</span>
                                    </div>
                                )}

                                {/* Grand Total */}
                                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                    <span className="text-white font-bold">Total</span>
                                    <span className="text-2xl font-normal text-white">
                                        Rp {grandTotal.toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {/* Customer Info Section */}
                                <div className="py-2 space-y-2 border-t border-white/5 mt-2">
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                placeholder="Customer Name..."
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 transition-all"
                                            />
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                type="tel"
                                                placeholder="WhatsApp No..."
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#E84C30]/40 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Controls Row: Table, Voucher | Payment Methods */}
                                <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5 items-center">
                                    {/* Table Icon Button */}
                                    <button
                                        onClick={() => setShowTableDrawer(true)}
                                        title={selectedTableId ? tables.find(t => t.id === selectedTableId)?.name : 'Select Table'}
                                        className={`p-2.5 rounded-lg transition-all border shrink-0 flex items-center justify-center ${selectedTableId
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                    </button>

                                    {/* Voucher Icon Button */}
                                    <button
                                        onClick={() => setShowVoucherDrawer(true)}
                                        title={appliedDiscount ? `Applied: ${appliedDiscount.code}` : 'Apply Voucher'}
                                        className={`p-2.5 rounded-lg transition-all border shrink-0 flex items-center justify-center ${appliedDiscount
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                                    </button>

                                    {/* Vertical Divider */}
                                    <div className="w-px h-6 bg-white/10 mx-0.5" />

                                    {/* Payment Method - Cash */}
                                    <button
                                        onClick={() => setPaymentMethod('Cash')}
                                        className={`flex-1 py-1.5 text-[10px] font-normal uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 border border-transparent ${paymentMethod === 'Cash'
                                            ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/25'
                                            : 'text-white/40 hover:text-white/70'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                        Cash
                                    </button>

                                    {/* Payment Method - QRIS */}
                                    <button
                                        onClick={() => setPaymentMethod('QRIS')}
                                        className={`flex-1 py-1.5 text-[10px] font-normal uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 border border-transparent ${paymentMethod === 'QRIS'
                                            ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/25'
                                            : 'text-white/40 hover:text-white/70'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                                        QRIS
                                    </button>

                                    {/* Payment Method - Transfer */}
                                    <button
                                        onClick={() => setPaymentMethod('Transfer')}
                                        className={`flex-1 py-1.5 text-[10px] font-normal uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 border border-transparent ${paymentMethod === 'Transfer'
                                            ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/25'
                                            : 'text-white/40 hover:text-white/70'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                        Bank
                                    </button>

                                    {/* Payment Method - EDC */}
                                    <button
                                        onClick={() => setPaymentMethod('EDC')}
                                        className={`flex-1 py-1.5 text-[10px] font-normal uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 border border-transparent ${paymentMethod === 'EDC'
                                            ? 'bg-[#E84C30] text-white shadow-lg shadow-[#E84C30]/25'
                                            : 'text-white/40 hover:text-white/70'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                        EDC
                                    </button>
                                </div>

                                {/* Checkout Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveOrder}
                                        disabled={items.length === 0 || isProcessing}
                                        className="flex-1 py-1.5 rounded-lg font-normal text-sm uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98]"
                                        title="Simpan pesanan untuk dibayar nanti"
                                    >
                                        Simpan
                                    </button>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={items.length === 0 || isProcessing}
                                        className="flex-[2] py-1.5 rounded-lg font-normal text-sm uppercase tracking-widest transition-all bg-[#E84C30] text-white hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 hover:shadow-[#E84C30]/40 disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98]"
                                    >
                                        {isProcessing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                                Processing...
                                            </span>
                                        ) : `Pay via ${paymentMethod}`}
                                    </button>
                                </div>

                                {/* Print Receipt (appears after successful cash checkout) */}
                                {lastOrder && (
                                    <PrintReceiptButton order={lastOrder} />
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ═══════════════════════ QR MODAL ═══════════════════════ */}
                {showQrModal && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-12 overflow-y-auto bg-black/80 backdrop-blur-md">
                        <div className="bg-[#2D2D2D] rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-white/10 my-auto">
                            <div className="p-6 pb-4 text-center bg-black/5 border-b border-white/5">
                                <div className="w-12 h-12 rounded-lg bg-[#E84C30]/10 text-[#E84C30] mx-auto mb-4 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                                </div>
                                <h3 className="text-xl font-normal text-white mb-1">Scan to Pay</h3>
                                <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Use your E-Wallet (OVO, GoPay, Dana, LinkAja)</p>
                            </div>
                            <div className="p-6 text-center">
                                <div className="bg-white rounded-lg p-4 inline-block mb-8 shadow-inner">
                                    {qrUrl ? (
                                        <img src={qrUrl} alt="QRIS Code" className="w-48 h-48 mx-auto" />
                                    ) : (
                                        <div className="w-48 h-48 mx-auto bg-gray-100 animate-pulse rounded-lg"></div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-white/5 mx-[-24px] px-6">
                                    <button
                                        onClick={() => setShowQrModal(false)}
                                        className="flex-1 py-2 px-3 rounded-lg font-bold text-white/40 border border-white/10 hover:bg-white/5 transition text-sm"
                                    >Cancel</button>
                                    <a
                                        href={qrUrl?.replace('https://quickchart.io/qr?text=', '').replace('&size=300', '')}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-[1.5] py-2 px-3 rounded-lg font-bold text-white bg-[#E84C30] hover:bg-[#D4432A] shadow-lg shadow-[#E84C30]/20 transition text-sm text-center"
                                        onClick={() => { setTimeout(() => { setShowQrModal(false); clearCart(); router.visit(route('pos.index'), { preserveScroll: true }); }, 2000); }}
                                    >Simulate</a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table Selection Drawer */}
            <Drawer
                show={showTableDrawer}
                onClose={() => setShowTableDrawer(false)}
                title="Select Table"
            >
                <div className="space-y-6">
                    {/* Dine-in No Table Option */}
                    <button
                        onClick={() => { setSelectedTableId(null); setShowTableDrawer(false); }}
                        className={`w-full p-2 rounded-lg border transition-all text-left ${selectedTableId === null
                            ? 'bg-[#E84C30] border-[#E84C30] text-white shadow-lg shadow-[#E84C30]/20'
                            : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                            }`}
                    >
                        <div className="font-bold">Dine-in (No Table)</div>
                        <div className="text-[10px] opacity-60 uppercase tracking-widest mt-1">Take away or quick dine-in</div>
                    </button>

                    {rooms && rooms.map(room => (
                        <div key={room.id} className="space-y-3">
                            <h4 className="text-[11px] font-normal text-white/30 uppercase tracking-[0.2em]">{room.name}</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {room.tables && room.tables.map(t => {
                                    const activeOrder = t.activeOrder || t.active_order;
                                    const hasActiveOrder = activeOrder !== undefined && activeOrder !== null;
                                    const isOccupied = t.status === 'occupied';
                                    const isSelected = selectedTableId === t.id;
                                    const isReserved = t.reservations && t.reservations.length > 0;

                                    return (
                                        <button
                                            key={t.id}
                                            disabled={false}
                                            onClick={() => handleTableSelect({ ...t, active_order: activeOrder })}
                                            className={`relative p-2 rounded-lg border transition-all text-center group ${isSelected
                                                ? 'bg-[#E84C30] border-[#E84C30] text-white shadow-lg'
                                                : hasActiveOrder
                                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                    : isOccupied
                                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                        : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                                                }`}
                                        >
                                            <div className="text-sm font-normal">{t.name}</div>
                                            <div className="text-[9px] mt-0.5 opacity-40 group-hover:opacity-60 transition-opacity">
                                                {hasActiveOrder ? 'Running Order' : `${t.capacity}p`}
                                            </div>
                                            {isOccupied && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            )}
                                            {hasActiveOrder && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                            )}
                                            {isReserved && !isOccupied && !hasActiveOrder && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Occupied Tables Quick Release */}
                    {tables.filter(t => t.status === 'occupied').length > 0 && (
                        <div className="pt-6 border-t border-white/5 space-y-3">
                            <h4 className="text-[11px] font-normal text-amber-500/50 uppercase tracking-[0.2em]">Release Occupied</h4>
                            <div className="flex flex-wrap gap-2">
                                {tables.filter(t => t.status === 'occupied').map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => releaseTable(t)}
                                        className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition-all"
                                    >
                                        Release {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Drawer>

            {/* Voucher Drawer */}
            <Drawer
                show={showVoucherDrawer}
                onClose={() => setShowVoucherDrawer(false)}
                title="Apply Discount"
            >
                <div className="space-y-6">
                    {/* Voucher Code Input */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-normal text-white/30 uppercase tracking-[0.2em]">Voucher Code</h4>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="CODE123"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                disabled={appliedDiscount !== null}
                                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#E84C30]/40 disabled:opacity-40 transition-all text-center text-xl font-normal tracking-widest uppercase"
                            />
                        </div>
                        {!appliedDiscount && (
                            <button
                                onClick={async () => {
                                    await applyDiscount();
                                    if (useCartStore.getState().appliedDiscount) setShowVoucherDrawer(false);
                                }}
                                disabled={!discountCode || isApplyingDiscount}
                                className="w-full py-2 rounded-lg font-normal text-[11px] uppercase tracking-widest transition-all bg-[#E84C30] text-white hover:bg-[#D4432A] disabled:opacity-20 shadow-lg shadow-[#E84C30]/20"
                            >
                                {isApplyingDiscount ? 'Validating...' : 'Apply Voucher'}
                            </button>
                        )}
                    </div>

                    {/* Manual Discount Option (POS ONLY) */}
                    {!appliedDiscount && (
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <h4 className="text-[10px] font-normal text-white/30 uppercase tracking-[0.2em]">Manual Discount</h4>
                            
                            <div className="flex bg-black/20 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setManualDiscountType('fixed')}
                                    className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${manualDiscountType === 'fixed' ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                                >
                                    Rupiah (Rp)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setManualDiscountType('percentage')}
                                    className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${manualDiscountType === 'percentage' ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                                >
                                    Persen (%)
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 uppercase">
                                        {manualDiscountType === 'fixed' ? 'Rp' : '%'}
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={manualDiscountValue}
                                        onChange={(e) => setManualDiscountValue(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/10 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-bold"
                                    />
                                </div>
                                <button
                                    onClick={handleApplyManualDiscount}
                                    disabled={!manualDiscountValue || manualDiscountValue <= 0}
                                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-20"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}

                    {appliedDiscount && (
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-emerald-400 font-bold text-xs uppercase tracking-[0.2em]">Discount Applied</div>
                                    <div className="text-[10px] text-white/40 mt-1 uppercase font-medium">{appliedDiscount.code}</div>
                                    <div className="text-xl font-normal text-emerald-400 mt-2">- Rp {appliedDiscount.amount.toLocaleString('id-ID')}</div>
                                </div>
                                <button
                                    onClick={clearDiscount}
                                    className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Remove Discount"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Drawer>

            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText || 'Confirm'}
                cancelText={confirmModal.cancelText || 'Batal'}
                hideCancel={confirmModal.hideCancel}
                isProcessing={isProcessing}
                onConfirm={confirmModal.onConfirm}
                onCancel={confirmModal.onCancel || closeConfirm}
            />

            {/* EDC Standalone Modal */}
            {showEDCModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#2D2D2D] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/10">
                        <div className="p-6 text-center border-b border-white/5">
                            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">EDC Payment</h3>
                            <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-bold">Standalone Integration</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mb-1">Total Amount to Swipe</p>
                                <div className="text-3xl font-normal text-white tracking-tight">
                                    Rp {grandTotal.toLocaleString('id-ID')}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Approval Code (from slip)</label>
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={approvalCode}
                                    onChange={(e) => setApprovalCode(e.target.value.toUpperCase())}
                                    className="w-full bg-black/40 border border-white/10 text-white text-center rounded-xl px-4 py-3 text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    autoFocus
                                />
                                <p className="text-[9px] text-white/20 text-center">Please input the manual nominal on EDC machine first</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => { setShowEDCModal(false); setApprovalCode(''); }}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white/40 border border-white/5 hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
                                >Cancel</button>
                                <button
                                    onClick={handleEDCCheckout}
                                    disabled={!approvalCode || isProcessing}
                                    className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all text-sm uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? 'Processing...' : 'Confirm Paid'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Bank Selection Modal */}
            {showBankModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#2D2D2D] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/10">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-xl font-bold text-white">Select Bank</h3>
                            <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-bold">Virtual Account Transfer</p>
                        </div>
                        <div className="p-4 grid grid-cols-1 gap-2">
                            {AVAILABLE_BANKS.map(bank => (
                                <button
                                    key={bank.id}
                                    onClick={() => handleBankSelect(bank.id)}
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white/60 group-hover:text-white">
                                            {bank.icon}
                                        </div>
                                        <span className="text-sm font-medium text-white/80 group-hover:text-white">{bank.name}</span>
                                    </div>
                                    <svg className="w-5 h-5 text-white/20 group-hover:text-[#E84C30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            ))}
                        </div>
                        <div className="p-4 bg-black/20">
                            <button
                                onClick={() => setShowBankModal(false)}
                                className="w-full py-3 rounded-xl font-bold text-white/40 hover:text-white transition-all text-xs uppercase tracking-widest"
                            >Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Virtual Account Modal */}
            {showVaModal && vaData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#2D2D2D] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/10">
                        <div className="p-6 text-center border-b border-white/5 bg-emerald-500/10">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">{vaData.bank?.replace('_VA', '')} Transfer</h3>
                            <p className="text-emerald-400/60 text-[10px] uppercase tracking-widest font-bold">Waiting for Payment</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mb-1">Account Number</p>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-3xl font-mono text-white tracking-widest">{vaData.virtual_account}</span>
                                    <button 
                                        onClick={() => { navigator.clipboard.writeText(vaData.virtual_account); showAlert("Success", "Account number copied to clipboard!", 'success'); }}
                                        className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/30">Total Amount</span>
                                    <span className="text-white font-bold font-mono">Rp {grandTotal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/30">Expired At</span>
                                    <span className="text-amber-400 font-medium">{new Date(vaData.expired_at).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] text-white/40 text-center leading-relaxed">
                                    Please transfer exactly the amount above.<br/>Payment will be detected automatically.
                                </p>
                                <button
                                    onClick={() => { setShowVaModal(false); clearCart(); setSelectedTableId(null); router.visit(route('pos.index'), { preserveScroll: true }); }}
                                    className="w-full py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all text-sm uppercase tracking-widest"
                                >Done / Simulation</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PosLayout>
    );
}
