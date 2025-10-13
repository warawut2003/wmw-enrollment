"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ApplicantData {
    title: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    dateOfBirth: string;
    school: {
        name: string;
        province: string;
    };
    gpaTotal?: number | null;
    gpaMath?: number | null;
    gpaScience?: number | null;
    email?: string | null;
}


export default function SignUpPage() {
    const router = useRouter();

    
    const [formData, setFormData] = useState({
        nationalId: '',
        laserCode: '',
        email: '',
        password: '',
        confirmPassword: '',
        pdpaConsent: false,
    });

    const [applicantData, setApplicantData] = useState<ApplicantData | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nationalIdChecked, setNationalIdChecked] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFetchApplicant = async () => {
        if (formData.nationalId.length !== 13) {
            setError('เลขบัตรประชาชนต้องมีความยาว 13 หลัก');
            return;
        }

        setIsFetching(true);
        setError(null);
        setApplicantData(null);
        setNationalIdChecked(false);

        try {
            const res = await fetch(`/api/applicants/${formData.nationalId}`);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'ไม่พบข้อมูลผู้สมัคร')
            }

            const data = await res.json();

            const formattedData: ApplicantData = {
                ...data,
                dateOfBirth: new Date(data.dateOfBirth).toLocaleDateString('th-TH', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }),
            };

            setApplicantData(formattedData);
            setFormData(prev => ({
                ...prev,
                email: data.email || '',
            }));
            setNationalIdChecked(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            return setError('รหัสผ่านไม่ตรงกัน');
        }
        if (!formData.pdpaConsent) {
            return setError("กรุณายอมรับข้อกำหนดและเงื่อนไข");
        }
        if (!nationalIdChecked || !applicantData) {
            return setError("กรุณาตรวจสอบเลขบัตรประชาชนก่อนลงทะเบียน");
        }

        try {
            const res = await fetch('/api/auth/sign-up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nationalId: formData.nationalId,
                    laserCode: formData.laserCode,
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    pdpaConsent: formData.pdpaConsent,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'การลงทะเบียนผิดพลาด');
            }

            setVerificationSent(true);

            
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className='min-h-screen bg-gray-50 flex item-center justify-center p-4'>
            <div className='max-w-4xl w-full bg-white p-8 rounded-lg shadow-md'>
                {verificationSent ? (
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-green-600">ลงทะเบียนสำเร็จ!</h1>
                        <p className="mt-4 text-gray-700">
                            เราได้ส่งลิงก์สำหรับยืนยันตัวตนไปที่อีเมล <strong className="font-semibold">{formData.email}</strong> แล้ว
                        </p>
                        <p className="mt-2 text-gray-500">กรุณาตรวจสอบกล่องจดหมาย (และโฟลเดอร์สแปม) เพื่อดำเนินการต่อ</p>
                    </div>
                ) : (
                <>
                <h1 className='text-2xl font-bold text-center text-gray-800 mb-6'>ลงทะเบียนสำหรับนักเรียน</h1>
                <form onSubmit={handleSubmit} className='space-y-6'>
                    <fieldset className='border p-4 rounded-md'>
                        <legend className='text-lg font-semibold px-2'>1.ค้นหาข้อมูลผู้สมัคร</legend>
                        <div className='flex items-end gap-4'>
                            <div className='flex-grow'>
                                <label htmlFor="nationalId" className='block text-sm font-medium text-gray-700'>เลขบัตรประชาชนผู้สมัครสอบ</label>
                                <input type="text"
                                    id="nationalId"
                                    name="nationalId"
                                    value={formData.nationalId}
                                    onChange={handleInputChange}
                                    maxLength={13}
                                    required
                                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleFetchApplicant}
                                disabled={isFetching}
                                className='px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400'>
                                {isFetching ? 'กำลังค้นหา...' : 'ตรวจสอบข้อมูล'}
                            </button>
                        </div>
                    </fieldset>

                    {applicantData && (
                        <fieldset className='border p-4 rounded-md'>
                            <legend className='text-lg font-semibold px-2'>2. ข้อมูลผู้สมัคร</legend>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-2'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700'>คำนำหน้าชื่อ</label>
                                    <input type="text" value={applicantData.title} disabled className='mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2' />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700'>ชื่อ</label>
                                    <input type="text" value={applicantData.firstName} disabled className='mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2' />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
                                    <input type="text" value={applicantData.lastName} disabled className='mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2' />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">วันเกิด</label>
                                    <input type="text" value={applicantData.dateOfBirth} disabled className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">โรงเรียน</label>
                                    <input type="text" value={applicantData.school.name} disabled className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">จังหวัดโรงเรียน</label>
                                    <input type="text" value={applicantData.school.province} disabled className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">จังหวัดโรงเรียน</label>
                                    <input type="text" value={applicantData.school.province} disabled className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ผลการเรียนรวมทุกรายวิชา</label>
                                    <input type="text" value={applicantData.gpaTotal || 'N/A'} disabled className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ผลการเรียนกลุ่มสาระการเรียนรู้คณิตศาสตร์</label>
                                    <input type="text" value={applicantData.gpaMath || 'N/A'} disabled className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2"/>
                                </div>
                                
                                {/* แถวที่ 4 */}
                                <div className="md:col-start-1">
                                    <label className="block text-sm font-medium text-gray-700">ผลการเรียนกลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</label>
                                    <input type="text" value={applicantData.gpaScience || 'N/A'} disabled className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2"/>
                                </div>
                            </div>
                        </fieldset>
                    )}

                    {nationalIdChecked && applicantData && (
                        <>
                            <fieldset className='border p-4 rounded-md'>
                                <legend className='text-lg font-semibold px-2'>
                                    3. สร้างบัญชีผู้ใช้
                                </legend>
                                <div>
                                    <label htmlFor="laserCode" className='block text-sm font-medium text-gray-700'>รหัสหลังบัตรประชาชน</label>
                                    <input type="text" id="laserCode" name="laserCode" value={formData.laserCode} onChange={handleInputChange} className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500' />
                                </div>
                                <div>
                                    <label htmlFor="email" className='block text-sm font-medium text-gray-700'>อีเมล</label>
                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500' />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</label>
                                    <input id="password" type="password" name="password" value={formData.password} onChange={handleInputChange} required minLength={8} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่าน</label>
                                    <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                
                            </fieldset>

                            <fieldset className='border p-4 rounded-md'>
                                <legend className='text-lg font-semibold px-2'>4. การยินยอม</legend>
                                <div className='flex items-start mt-2'>
                                    <input type="checkbox" name="pdpaConsent" id="pdpaConsent" checked = {formData.pdpaConsent} onChange = {handleInputChange}  required
                                    className='h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                                    />
                                    <label htmlFor="pdpaConsent" className ='ml-2 block text-sm text-gray-900'>
                                        ข้าพเจ้ายอมรับข้อกำหนดและเงื่อนไขการใช้งาน (PDPA)
                                    </label>
                                </div>
                                <div className='mt-6 text-center'>
                                    <button type = "submit" className='w-full md:w-1/2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700'>
                                        ลงทะเบียน
                                    </button>
                                </div>
                            </fieldset>
                        </>
                    )}
                    {error && <p className='text-center text-sm text-red-600'>{error}</p>}
                </form>
                </>
                )}
            </div>
        </div>
    )
}