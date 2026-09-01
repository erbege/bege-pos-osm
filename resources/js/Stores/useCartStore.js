import { create } from 'zustand';
import axios from 'axios';

/**
 * Zustand Cart Store for POS and Customer Self-Order.
 *
 * Key design choice: Items with the same menu ID but different notes
 * are treated as separate cart lines (important for F&B).
 */
export const useCartStore = create((set, get) => ({
    // --- STATE ---
    items: [],
    orderId: null, // Track existing order if loading/editing
    discountCode: '',
    appliedDiscount: null, // { code, amount }
    taxPercentage: 11, // Default 11% (standard in ID)
    isApplyingDiscount: false,
    customerName: '',
    customerPhone: '',
    searchQuery: '',
    orderType: 'dine-in', // Default to dine-in
    tableId: null,
    tableName: '',

    // --- COMPUTED (via getters in components, calculated here for convenience) ---
    getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.qty, 0),
    getDiscountAmount: () => get().appliedDiscount?.amount || 0,
    getTaxAmount: () => {
        const afterDiscount = get().getSubtotal() - get().getDiscountAmount();
        return Math.round(afterDiscount * (get().taxPercentage / 100));
    },
    getGrandTotal: () => {
        const afterDiscount = get().getSubtotal() - get().getDiscountAmount();
        const tax = afterDiscount * (get().taxPercentage / 100);
        return Math.max(0, Math.round(afterDiscount + tax));
    },
    getTotalItems: () => get().items.reduce((sum, item) => sum + item.qty, 0),

    // --- ACTIONS ---

    setCustomerName: (name) => set({ customerName: name }),
    setCustomerPhone: (phone) => set({ customerPhone: phone }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setOrderType: (type) => set({ orderType: type }),
    setTable: async (id, name) => {
        set({ tableId: id, tableName: name, orderType: id ? 'dine-in' : get().orderType });
        
        // Sync to backend session in background
        try {
            await axios.post(route('customer.set_active_table'), { table_id: id });
        } catch (err) {
            console.error('Failed to sync table session:', err);
        }
    },

    /**
     * Set the current order ID.
     */
    setOrderId: (id) => set({ orderId: id }),

    /**
     * Load an entire order into the cart for editing.
     */
    loadOrder: (order) => {
        console.log('Loading order into cart:', order);
        set({
            orderId: order.id,
            customerName: order.customer_name || '',
            customerPhone: order.customer_phone || '',
            items: order.items.map(item => ({
                cart_id: `loaded-${item.id}-${Date.now()}`,
                id: item.menu_id,
                name: item.menu?.name || 'Unknown',
                price: parseFloat(item.price),
                image: item.menu?.image,
                qty: item.qty,
                notes: item.notes || '',
            })),
            appliedDiscount: order.discount ? { code: order.discount.code, amount: parseFloat(order.discount_amount) } : null,
            discountCode: order.discount?.code || '',
        });
    },

    /**
     * Add a menu item to cart. If the same item (same ID and same notes) exists,
     * increment its quantity. Otherwise, add a new line.
     */
    addItem: (menu, qty = 1, notes = '') => set((state) => {
        const existingIndex = state.items.findIndex(
            (item) => item.id === menu.id && item.notes === notes
        );

        let newItems = [...state.items];

        if (existingIndex >= 0) {
            newItems[existingIndex] = {
                ...newItems[existingIndex],
                qty: newItems[existingIndex].qty + qty,
            };
        } else {
            newItems.push({
                cart_id: Date.now() + Math.random(),
                id: menu.id,
                name: menu.name,
                price: menu.price,
                image: menu.image,
                qty,
                notes,
            });
        }

        return { items: newItems };
    }),

    /**
     * Update the quantity of a cart item by its cart_id.
     * Removes the item if quantity drops to 0 or below.
     */
    updateQuantity: (cartId, newQty) => set((state) => {
        if (newQty <= 0) {
            return { items: state.items.filter((item) => item.cart_id !== cartId) };
        }
        return {
            items: state.items.map((item) =>
                item.cart_id === cartId ? { ...item, qty: newQty } : item
            ),
        };
    }),

    /**
     * Update notes for a specific cart item.
     */
    updateNotes: (cartId, notes) => set((state) => ({
        items: state.items.map((item) =>
            item.cart_id === cartId ? { ...item, notes } : item
        ),
    })),

    /**
     * Remove a specific item from the cart.
     */
    removeItem: (cartId) => set((state) => ({
        items: state.items.filter((item) => item.cart_id !== cartId),
    })),

    /**
     * Set the discount code input value.
     */
    setDiscountCode: (code) => set({ discountCode: code }),

    /**
     * Apply a manual discount (direct amount or percentage).
     * Used mainly in POS for staff-authorized discounts.
     */
    setManualDiscount: (value, type = 'fixed', name = 'Manual Discount', isAutomatic = false) => set((state) => {
        const subtotal = state.getSubtotal();
        let amount = 0;

        if (type === 'percentage') {
            amount = (subtotal * value) / 100;
        } else {
            amount = Math.min(value, subtotal);
        }

        return {
            appliedDiscount: {
                code: name, // Using 'code' field to store the name/label
                amount: amount,
                isManual: true,
                manualType: type,
                manualValue: value,
                is_automatic: isAutomatic
            },
            discountCode: ''
        };
    }),

    /**
     * Clear any applied discount.
     */
    clearDiscount: () => set({ 
        appliedDiscount: null, 
        discountCode: '' 
    }),

    /**
     * Validate and apply a discount code via the API.
     */
    applyDiscount: async () => {
        const { discountCode, getSubtotal } = get();
        if (!discountCode) return;

        set({ isApplyingDiscount: true });
        try {
            const response = await axios.post('/api/v1/discounts/validate', {
                code: discountCode,
                subtotal: getSubtotal(),
            });
            set({
                appliedDiscount: {
                    code: response.data.code,
                    amount: response.data.discount_amount,
                },
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Invalid or expired discount code.');
            set({ appliedDiscount: null });
        } finally {
            set({ isApplyingDiscount: false });
        }
    },

    /**
     * Set the tax percentage.
     */
    setTaxPercentage: (percent) => set({ taxPercentage: percent }),

    /**
     * Clear the entire cart (called after successful checkout).
     */
    clearCart: () => set({
        items: [],
        orderId: null,
        discountCode: '',
        appliedDiscount: null,
    }),

    /**
     * Build the payload to send to the backend for checkout.
     * Only includes the data the StoreOrderRequest expects.
     */
    getCheckoutPayload: (paymentMethod) => {
        const state = get();
        return {
            order_id: state.orderId,
            items: state.items.map((item) => ({
                id: item.id,
                qty: item.qty,
                notes: item.notes || null,
            })),
            payment_method: paymentMethod,
            customer_name: state.customerName || null,
            customer_phone: state.customerPhone || null,
            discount_code: state.appliedDiscount?.code || null,
            discount_amount: state.appliedDiscount?.amount || 0,
            manual_discount_amount: state.appliedDiscount?.isManual ? state.appliedDiscount.amount : null,
            tax_percentage: state.taxPercentage,
            tax_amount: state.getTaxAmount(),
            grand_total: state.getGrandTotal(),
        };
    },
}));
