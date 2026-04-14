import CustomerLayout from '@/Layouts/CustomerLayout';

export default function Payment() {
    return (
        <CustomerLayout title="Payment">
            <h1 className="text-2xl font-bold mb-4">Make Payment</h1>
            <p className="text-slate-600">Scan QR Code here.</p>
        </CustomerLayout>
    );
}
