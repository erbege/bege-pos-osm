import React, { useState } from 'react';
import StaffLayout from '@/Layouts/StaffLayout';
import { usePage } from '@inertiajs/react';

const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

export default function MyPayslip() {
    const { employee, payslips } = usePage().props;
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    if (!employee) {
        return <StaffLayout title="Slip Gaji"><div className="p-6 text-center text-gray-500">Akun belum terhubung.</div></StaffLayout>;
    }

    const payTypeLabels = {
        salary_and_hourly: 'Gaji Pokok + Per Jam',
        salary_only: 'Gaji Pokok',
        hourly_only: 'Per Jam',
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const earnings = selectedPayroll?.components?.filter(c => c.component_type === 'earning') || [];
    const deductions = selectedPayroll?.components?.filter(c => c.component_type === 'deduction') || [];

    return (
        <StaffLayout title="Slip Gaji">
            <div className="p-4 space-y-4">
                {/* Payslip List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-700">💰 Riwayat Slip Gaji</h3>
                    {payslips?.data?.length > 0 ? (
                        <div className="divide-y">
                            {payslips.data.map(p => (
                                <button key={p.id} onClick={() => setSelectedPayroll(p)}
                                    className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors text-left">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {monthNames[p.month - 1]} {p.year}
                                        </p>
                                        <p className="text-xs text-gray-400">{payTypeLabels[p.pay_type] || p.pay_type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-blue-600">{formatCurrency(p.net_salary)}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {p.status === 'paid' ? 'Lunas' : 'Disetujui'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="px-4 pb-4 text-sm text-gray-400">Belum ada slip gaji.</p>
                    )}
                </div>

                {/* Detail Modal */}
                {selectedPayroll && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-800">Slip Gaji</h3>
                                    <p className="text-xs text-gray-500">{monthNames[selectedPayroll.month - 1]} {selectedPayroll.year}</p>
                                </div>
                                <button onClick={() => setSelectedPayroll(null)} className="text-gray-400 text-lg">✕</button>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1">
                                <div className="flex justify-between"><span className="text-gray-500">Model Gaji</span><span className="font-medium">{payTypeLabels[selectedPayroll.pay_type]}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Total Jam</span><span className="font-medium">{selectedPayroll.total_hours} jam</span></div>
                                {selectedPayroll.pay_type !== 'salary_only' && (
                                    <div className="flex justify-between"><span className="text-gray-500">Tarif/Jam</span><span className="font-medium">{formatCurrency(selectedPayroll.hourly_rate)}</span></div>
                                )}
                            </div>

                            {/* Earnings */}
                            <div>
                                <h4 className="text-xs font-semibold text-emerald-700 mb-2">💰 Pendapatan</h4>
                                <div className="space-y-1.5">
                                    {earnings.map(c => (
                                        <div key={c.id} className="flex justify-between text-xs">
                                            <span className="text-gray-600">{c.name}</span>
                                            <span className="font-medium text-gray-800">{formatCurrency(c.amount)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-xs font-bold border-t pt-1.5 border-emerald-200">
                                        <span>Total Pendapatan</span>
                                        <span className="text-emerald-700">{formatCurrency(earnings.reduce((s, c) => s + parseFloat(c.amount), 0))}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            {deductions.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-red-700 mb-2">📉 Potongan</h4>
                                    <div className="space-y-1.5">
                                        {deductions.map(c => (
                                            <div key={c.id} className="flex justify-between text-xs">
                                                <span className="text-gray-600">{c.name}</span>
                                                <span className="font-medium text-red-600">-{formatCurrency(c.amount)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-xs font-bold border-t pt-1.5 border-red-200">
                                            <span>Total Potongan</span>
                                            <span className="text-red-700">-{formatCurrency(deductions.reduce((s, c) => s + parseFloat(c.amount), 0))}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Net */}
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white text-center">
                                <p className="text-xs text-blue-200 mb-1">Gaji Bersih (Take Home Pay)</p>
                                <p className="text-2xl font-bold">{formatCurrency(selectedPayroll.net_salary)}</p>
                            </div>

                            {/* Download */}
                            <a href={route('staff.payslips.pdf', selectedPayroll.id)}
                                className="block w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl text-center hover:bg-gray-200 transition-all text-sm">
                                📄 Download PDF
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </StaffLayout>
    );
}
