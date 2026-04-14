import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, router } from '@inertiajs/react';

const FIELD_DEFINITIONS = {
    payment_gateway: {
        title: 'Payment Gateway',
        description: 'Konfigurasi QRIS & integrasi pembayaran otomatis.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>,
        is_custom_ui: true,
        fields: [
            { key: 'active_provider', label: 'Provider Aktif', type: 'select', options: ['midtrans', 'xendit', 'tripay', 'ipaymu'] },
            { key: 'xendit_secret_key', label: 'Xendit Secret Key', type: 'text', is_secret: true },
            { key: 'tripay_api_key', label: 'Tripay API Key', type: 'text', is_secret: true },
            { key: 'tripay_secret_key', label: 'Tripay Private Key', type: 'text', is_secret: true },
            { key: 'tripay_merchant_id', label: 'Tripay Merchant Code', type: 'text' },
            { key: 'tripay_mode', label: 'Tripay Mode', type: 'select', options: ['sandbox', 'production'] },
            { key: 'midtrans_secret_key', label: 'Midtrans Server Key', type: 'text', is_secret: true },
            { key: 'midtrans_mode', label: 'Midtrans Mode', type: 'select', options: ['sandbox', 'production'] },
            { key: 'ipaymu_api_key', label: 'iPaymu API Key', type: 'text', is_secret: true },
            { key: 'ipaymu_merchant_id', label: 'iPaymu Virtual Account', type: 'text' },
        ],
    },
    whatsapp_gateway: {
        title: 'WhatsApp Gateway',
        description: 'Notifikasi otomatis ke pelanggan & staf.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>,
        fields: [
            { key: 'provider', label: 'Provider', type: 'select', options: ['fonnte', 'wablas', 'meta'] },
            { key: 'api_url', label: 'API URL', type: 'text', placeholder: 'https://api.fonnte.com/send' },
            { key: 'api_token', label: 'API Token', type: 'text', is_secret: true },
            { key: 'sender_number', label: 'Nomor Pengirim', type: 'text', placeholder: '628xxxxxxxxxx' },
        ],
    },
    cashier_printer: {
        title: 'Printer Kasir',
        description: 'Pengaturan cetak struk di modul POS.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>,
        fields: [
            { key: 'type', label: 'Tipe Koneksi', type: 'select', options: ['bluetooth', 'system'] },
            { key: 'device_name', label: 'Nama Perangkat', type: 'text', placeholder: 'Thermal Printer P25' },
            { key: 'paper_size', label: 'Ukuran Kertas', type: 'select', options: ['58mm', '80mm'] },
            { key: 'auto_print', label: 'Auto Print', type: 'toggle' },
        ],
    },
    kitchen_printer: {
        title: 'Printer Dapur',
        description: 'Pengaturan cetak slip pesanan (KDS).',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>,
        fields: [
            { key: 'type', label: 'Tipe Koneksi', type: 'select', options: ['network', 'windows', 'dummy'] },
            { key: 'ip_address', label: 'Alamat IP', type: 'text', placeholder: '192.168.1.100' },
            { key: 'port', label: 'Port', type: 'text', placeholder: '9100' },
            { key: 'device_name', label: 'Nama Printer', type: 'text', placeholder: 'POS-58' },
            { key: 'auto_print', label: 'Auto Print', type: 'toggle' },
        ],
    },
    business_info: {
        title: 'Informasi Bisnis',
        description: 'Nama outlet, alamat, dan kontak yang muncul di struk.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>,
        fields: [
            { key: 'store_name', label: 'Nama Toko/Outlet', type: 'text', placeholder: 'Garasi 66 POS' },
            { key: 'address', label: 'Alamat', type: 'text', placeholder: 'Jl. Contoh No. 123' },
            { key: 'phone', label: 'No. Telepon', type: 'text', placeholder: '021-xxxxxxx' },
            { key: 'footer_text', label: 'Pesan Kaki Struk', type: 'text', placeholder: 'Terima kasih atas kunjungan Anda!' },
        ],
    },
    pos_settings: {
        title: 'Pengaturan POS',
        description: 'Konfigurasi pajak, biaya layanan, dan operasional kasir.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l5 0m-5 4l5 0m-5-8l5 0m1 4l3 0m-3 4l3 0m-3-8l3 0M3 21h18a2 2 0 002-2V5a2 2 0 00-2-2H3a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>,
        fields: [
            { key: 'tax_percentage', label: 'Pajak / PPN (%)', type: 'text', placeholder: '11' },
            { key: 'service_charge', label: 'Service Charge (%)', type: 'text', placeholder: '0' },
            { key: 'qris_timeout_minutes', label: 'QRIS Timeout (Menit)', type: 'text', placeholder: '15' },
            { key: 'bank_transfer_timeout_minutes', label: 'Bank Transfer Timeout (Menit)', type: 'text', placeholder: '60' },
            { key: 'enable_stock_check', label: 'Cek Stok Saat Checkout', type: 'toggle' },
            { key: 'allow_negative_stock', label: 'Izinkan Stok Negatif', type: 'toggle' },
        ],
    },
    bank_accounts: {
        title: 'Rekening Bank',
        description: 'Daftar rekening untuk metode pembayaran Transfer.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>,
        is_custom_ui: true,
        fields: [
            { key: 'accounts_json', label: 'Daftar Rekening', type: 'hidden' },
        ],
    },
};

const Toggle = ({ enabled, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`${enabled ? 'bg-[#E84C30]' : 'bg-white/10'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E84C30] focus:ring-offset-2 focus:ring-offset-black`}
    >
        <span className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
    </button>
);

const AccordionItem = ({ title, isActive, isSelected, onSelect, onToggle, children }) => (
    <div className={`border border-white/5 rounded-xl overflow-hidden transition-all duration-300 ${isActive ? 'bg-white/[0.02] ring-1 ring-[#E84C30]/20' : 'bg-[#2D2D2D]'}`}>
        <div 
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            onClick={onToggle}
        >
            <div className="flex items-center gap-4">
                <div 
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#E84C30] bg-[#E84C30]' : 'border-white/20'}`}
                >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
                <span className={`text-sm font-bold uppercase tracking-widest ${isSelected ? 'text-white' : 'text-white/40'}`}>{title}</span>
            </div>
            <svg className={`w-5 h-5 text-white/20 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
        {isActive && (
            <div className="p-4 border-t border-white/5 bg-black/10 animate-in slide-in-from-top-2 duration-300">
                {children}
            </div>
        )}
    </div>
);

const BankListEditor = ({ value, onChange }) => {
    const accounts = useMemo(() => {
        try {
            return JSON.parse(value || '[]');
        } catch (e) {
            return [];
        }
    }, [value]);

    const handleAccountChange = (index, field, val) => {
        const newAccounts = [...accounts];
        newAccounts[index][field] = val;
        onChange(JSON.stringify(newAccounts));
    };

    const addAccount = () => {
        const newAccounts = [...accounts, { name: '', number: '', holder: '' }];
        onChange(JSON.stringify(newAccounts));
    };

    const removeAccount = (index) => {
        const newAccounts = accounts.filter((_, i) => i !== index);
        onChange(JSON.stringify(newAccounts));
    };

    return (
        <div className="space-y-4">
            {accounts.map((acc, idx) => (
                <div key={idx} className="bg-white/[0.03] p-4 rounded-xl border border-white/5 space-y-4 relative group">
                    <button 
                        type="button" 
                        onClick={() => removeAccount(idx)}
                        className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Nama Bank</label>
                            <input 
                                type="text" 
                                value={acc.name} 
                                onChange={(e) => handleAccountChange(idx, 'name', e.target.value)}
                                placeholder="Contoh: BCA, Mandiri"
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/50"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Nomor Rekening</label>
                            <input 
                                type="text" 
                                value={acc.number} 
                                onChange={(e) => handleAccountChange(idx, 'number', e.target.value)}
                                placeholder="Masukkan nomor rekening"
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#E84C30]/50"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Atas Nama</label>
                        <input 
                            type="text" 
                            value={acc.holder} 
                            onChange={(e) => handleAccountChange(idx, 'holder', e.target.value)}
                            placeholder="Nama pemilik rekening"
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/50"
                        />
                    </div>
                </div>
            ))}
            
            <button
                type="button"
                onClick={addAccount}
                className="w-full py-4 border-2 border-dashed border-white/5 rounded-xl text-white/30 hover:text-white hover:border-[#E84C30]/50 hover:bg-[#E84C30]/5 transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Tambah Rekening
            </button>
        </div>
    );
};

export default function Settings({ settings: initialSettings }) {
    const [activeTab, setActiveTab] = useState(Object.keys(FIELD_DEFINITIONS)[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAccordion, setOpenAccordion] = useState('xendit');
    const [visibleFields, setVisibleFields] = useState({});
    
    const toggleVisibility = (key) => {
        setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    const [settings, setSettings] = useState(() => {
        const merged = {};
        Object.entries(FIELD_DEFINITIONS).forEach(([group, def]) => {
            merged[group] = {};
            def.fields.forEach(field => {
                const existing = initialSettings?.[group]?.[field.key];
                merged[group][field.key] = {
                    value: existing?.raw || existing?.value || (field.type === 'toggle' ? '0' : ''),
                    is_secret: field.is_secret,
                };
            });
        });
        return merged;
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = (group, key, value) => {
        setSettings(prev => ({
            ...prev,
            [group]: {
                ...prev[group],
                [key]: { ...prev[group][key], value: typeof value === 'boolean' ? (value ? '1' : '0') : value },
            },
        }));
        setSaved(false);
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        router.put(route('admin.settings.update'), { settings }, {
            onSuccess: () => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); },
            onError: () => setSaving(false),
            preserveScroll: true
        });
    };

    const activeGroupDef = FIELD_DEFINITIONS[activeTab];

    const renderField = (group, field) => {
        let computeValue = settings[group]?.[field.key]?.value || '';
        if (group === 'payment_gateway' && field.key === 'callback_url') {
            const provider = settings.payment_gateway?.active_provider?.value?.trim()?.toLowerCase() || 'midtrans';
            computeValue = `${window.location.origin}/payment/callback/${provider}`;
        }

        return (
            <div key={field.key} className="group/field mb-6 last:mb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="max-w-xs">
                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] block mb-1">
                            {field.label}
                        </label>
                        {field.is_secret && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase tracking-widest border border-amber-500/20">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                Secret
                            </span>
                        )}
                    </div>

                    <div className="w-full md:w-80 lg:w-96">
                        {field.type === 'toggle' ? (
                            <div className="flex items-center gap-3">
                                <Toggle 
                                    enabled={computeValue === '1'} 
                                    onChange={(val) => handleChange(group, field.key, val)}
                                />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${computeValue === '1' ? 'text-emerald-400' : 'text-white/20'}`}>
                                    {computeValue === '1' ? 'Aktif' : 'Non-Aktif'}
                                </span>
                            </div>
                        ) : field.type === 'select' ? (
                            <select
                                value={computeValue}
                                onChange={e => handleChange(group, field.key, e.target.value)}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C30]/50 transition-all hover:border-white/20"
                            >
                                <option value="">Pilih {field.label}</option>
                                {field.options.map(opt => (
                                    <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="relative group/input">
                                <input
                                    type={field.is_secret ? (visibleFields[field.key] ? 'text' : 'password') : 'text'}
                                    value={computeValue}
                                    onChange={e => !field.is_readonly && handleChange(group, field.key, e.target.value)}
                                    readOnly={field.is_readonly}
                                    placeholder={field.placeholder}
                                    className={`w-full bg-white/5 border border-white/10 text-white placeholder-white/10 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#E84C30]/50 transition-all hover:border-white/20 ${field.is_readonly ? 'opacity-50 cursor-not-allowed' : ''} ${field.is_secret ? 'pr-12' : ''}`}
                                />
                                {field.is_secret && (
                                    <button
                                        type="button"
                                        onClick={() => toggleVisibility(field.key)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-[#E84C30] transition-colors"
                                    >
                                        {visibleFields[field.key] ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout title="Settings">
            <div className="max-w-6xl mx-auto px-4 sm:px-4 lg:px-6 pb-32">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-4xl font-normal text-white tracking-tight">System Settings</h2>
                        <p className="text-sm text-white/40 mt-2 max-w-xl">
                            Pusat konfigurasi seluruh modul aplikasi. Perubahan akan langsung berdampak pada operasional POS dan KDS.
                        </p>
                    </div>
                    
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-white/30 group-focus-within:text-[#E84C30] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Cari pengaturan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#E84C30]/50 transition-all"
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* Sidebar Tabs */}
                    <aside className="w-full lg:w-72 shrink-0">
                        <nav className="space-y-1">
                            {Object.entries(FIELD_DEFINITIONS).map(([key, def]) => {
                                const isActive = activeTab === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group ${
                                            isActive 
                                            ? 'bg-gradient-to-r from-[#E84C30] to-[#D4432A] text-white shadow-lg shadow-[#E84C30]/20 translate-x-1' 
                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <div className={`${isActive ? 'text-white' : 'text-[#E84C30] bg-[#E84C30]/10'} p-2 rounded-lg transition-colors`}>
                                            {def.icon}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold tracking-wide">{def.title}</div>
                                            <div className={`text-[10px] uppercase tracking-widest mt-0.5 ${isActive ? 'text-white/70' : 'text-white/20'}`}>
                                                {def.is_custom_ui ? 'Custom Layout' : `${def.fields.length} Fields`}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-[#2D2D2D] rounded-xl border border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            
                            {/* Section Header */}
                            <div className="p-6 border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                                <h3 className="text-xl font-normal text-white flex items-center gap-3">
                                    <span className="text-[#E84C30]">{activeGroupDef.icon}</span>
                                    {activeGroupDef.title}
                                </h3>
                                <p className="text-sm text-white/40 mt-1">{activeGroupDef.description}</p>
                            </div>

                            {/* Form Fields */}
                            <div className="p-6">
                                {activeGroupDef.is_custom_ui && activeTab === 'payment_gateway' ? (
                                    <div className="space-y-4">
                                        <AccordionItem 
                                            title="Xendit" 
                                            isActive={openAccordion === 'xendit'} 
                                            isSelected={settings.payment_gateway.active_provider.value === 'xendit'}
                                            onToggle={() => setOpenAccordion(openAccordion === 'xendit' ? '' : 'xendit')}
                                            onSelect={() => handleChange('payment_gateway', 'active_provider', 'xendit')}
                                        >
                                            {renderField('payment_gateway', { key: 'xendit_secret_key', label: 'Secret Key', type: 'text', is_secret: true })}
                                        </AccordionItem>

                                        <AccordionItem 
                                            title="Tripay" 
                                            isActive={openAccordion === 'tripay'} 
                                            isSelected={settings.payment_gateway.active_provider.value === 'tripay'}
                                            onToggle={() => setOpenAccordion(openAccordion === 'tripay' ? '' : 'tripay')}
                                            onSelect={() => handleChange('payment_gateway', 'active_provider', 'tripay')}
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {renderField('payment_gateway', { key: 'tripay_merchant_id', label: 'Merchant Code', type: 'text' })}
                                                {renderField('payment_gateway', { key: 'tripay_mode', label: 'Mode', type: 'select', options: ['sandbox', 'production'] })}
                                            </div>
                                            {renderField('payment_gateway', { key: 'tripay_api_key', label: 'API Key', type: 'text', is_secret: true })}
                                            {renderField('payment_gateway', { key: 'tripay_secret_key', label: 'Private Key', type: 'text', is_secret: true })}
                                        </AccordionItem>

                                        <AccordionItem 
                                            title="Midtrans" 
                                            isActive={openAccordion === 'midtrans'} 
                                            isSelected={settings.payment_gateway.active_provider.value === 'midtrans'}
                                            onToggle={() => setOpenAccordion(openAccordion === 'midtrans' ? '' : 'midtrans')}
                                            onSelect={() => handleChange('payment_gateway', 'active_provider', 'midtrans')}
                                        >
                                            {renderField('payment_gateway', { key: 'midtrans_mode', label: 'Mode', type: 'select', options: ['sandbox', 'production'] })}
                                            {renderField('payment_gateway', { key: 'midtrans_secret_key', label: 'Server Key', type: 'text', is_secret: true })}
                                        </AccordionItem>

                                        <AccordionItem 
                                            title="iPaymu" 
                                            isActive={openAccordion === 'ipaymu'} 
                                            isSelected={settings.payment_gateway.active_provider.value === 'ipaymu'}
                                            onToggle={() => setOpenAccordion(openAccordion === 'ipaymu' ? '' : 'ipaymu')}
                                            onSelect={() => handleChange('payment_gateway', 'active_provider', 'ipaymu')}
                                        >
                                            {renderField('payment_gateway', { key: 'ipaymu_merchant_id', label: 'Virtual Account', type: 'text' })}
                                            {renderField('payment_gateway', { key: 'ipaymu_api_key', label: 'API Key', type: 'text', is_secret: true })}
                                        </AccordionItem>
                                        
                                        <div className="mt-8 pt-8 border-t border-white/5">
                                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] block mb-3">Callback URL (Webhook)</label>
                                            <div className="relative group/input">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={`${window.location.origin}/payment/callback/${settings.payment_gateway.active_provider.value}`}
                                                    className="w-full bg-white/5 border border-white/10 text-white/50 rounded-lg px-4 py-2 text-xs font-mono"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/payment/callback/${settings.payment_gateway.active_provider.value}`)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-[#E84C30] transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-white/20 mt-2 uppercase tracking-widest italic">Salin URL ini ke dashboard provider payment gateway Anda.</p>
                                        </div>
                                    </div>
                                ) : activeGroupDef.is_custom_ui && activeTab === 'bank_accounts' ? (
                                    <BankListEditor 
                                        value={settings.bank_accounts.accounts_json.value} 
                                        onChange={(val) => handleChange('bank_accounts', 'accounts_json', val)}
                                    />
                                ) : (
                                    activeGroupDef.fields.map(field => renderField(activeTab, field))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Save Action Bar */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
                    <div className="bg-[#2D2D2D]/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-3 flex items-center gap-4 shadow-2xl ring-1 ring-black/50">
                        <div className="hidden sm:flex items-center gap-3 px-2">
                            {saved ? (
                                <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest animate-in fade-in zoom-in">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                    Tersimpan
                                </span>
                            ) : (
                                <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
                                    {saving ? 'Sedang menyimpan...' : 'Perubahan belum disimpan'}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="bg-[#E84C30] hover:bg-[#D4432A] text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-[#E84C30]/20 transition-all hover:scale-[1.05] active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                            )}
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

