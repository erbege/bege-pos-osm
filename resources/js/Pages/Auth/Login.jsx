import { useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <InputLabel htmlFor="email" value="Email" className="text-white/40 text-[10px] uppercase font-normal tracking-widest mb-2 px-1" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:ring-[#E84C30] focus:border-[#E84C30] transition-all"
                        autoComplete="off"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="admin@garasi66.com"
                    />

                    <InputError message={errors.email} className="mt-2 text-red-400 text-[10px] font-bold px-1" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" className="text-white/40 text-[10px] uppercase font-normal tracking-widest mb-2 px-1" />

                    <div className="relative group">
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:ring-[#E84C30] focus:border-[#E84C30] transition-all pr-14"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors p-2"
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-2 text-red-400 text-[10px] font-bold px-1" />
                </div>

                <div className="flex items-center justify-between px-1">
                    <label className="flex items-center cursor-pointer group">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="bg-white/5 border-white/10 text-[#E84C30] rounded-lg focus:ring-[#E84C30]/40"
                        />
                        <span className="ms-2 text-[11px] font-bold text-white/30 group-hover:text-white/60 transition-colors">
                            Remember me
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-[11px] font-bold text-[#E84C30] hover:text-[#D4432A] transition-colors"
                        >
                            Forgot Password?
                        </Link>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        className="w-full bg-[#E84C30] hover:bg-[#D4432A] text-white py-2 rounded-lg font-normal text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#E84C30]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        disabled={processing}
                    >
                        {processing ? 'Signing In...' : 'Sign In To POS'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
