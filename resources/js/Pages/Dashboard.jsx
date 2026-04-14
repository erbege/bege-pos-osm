import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({ auth, todaysSales = 0, totalOrdersToday = 0, activeTables = 0 }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Admin Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-3 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-2 text-gray-900 dark:text-gray-100">
                            Welcome to the POS Admin Dashboard, {auth.user.name}!
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        {/* Summary Cards */}
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                            <h3 className="text-slate-500 font-medium text-sm">Today's Sales</h3>
                            <div className="text-2xl font-bold mt-2 text-indigo-600">
                                Rp {Number(todaysSales).toLocaleString('id-ID')}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                            <h3 className="text-slate-500 font-medium text-sm">Total Orders</h3>
                            <div className="text-2xl font-bold mt-2 text-emerald-600">
                                {totalOrdersToday}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                            <h3 className="text-slate-500 font-medium text-sm">Active Tables</h3>
                            <div className="text-2xl font-bold mt-2 text-amber-500">
                                {activeTables}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
