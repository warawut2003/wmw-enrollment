"use client";

import { useState, FormEvent, useEffect } from "react";
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from "@/components/ui/Button";


export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [successMessage, setSuccessMessage] = useState<string | null>('');

    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setSuccessMessage('✅ ยืนยันอีเมลสำเร็จแล้ว! กรุณาเข้าสู่ระบบ');
        }
    }, [searchParams]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await signIn('credentials', {
                // redirect: false,
                email: email,
                password: password,
            });

            if (result?.error) {
                if (result.error === 'CredentialsSignin') {
                    setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                } else {
                    setError(result.error);
                }
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Login failed:', error);
            setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md space-y-6">
                <h1 className="text-2xl font-bold text-center text-gray-800">
                    เข้าสู่ระบบ
                </h1>

                {/* แสดงข้อความ Success ถ้ามี */}
                {successMessage && (
                    <p className="text-green-700 bg-green-100 p-3 rounded-md text-center">
                        {successMessage}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            อีเมล
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            รหัสผ่าน
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* แสดงข้อความ Error ถ้ามี */}
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        variant="primary"
                    >เข้าสู่ระบบ</Button>

                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    ยังไม่มีบัญชี?{' '}
                    <Link href="/sign-up" className="font-medium text-indigo-600 hover:underline">
                        ลงทะเบียนที่นี่
                    </Link>
                </p>
            </div>
        </div>
    );
}
