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

    const handleSumit = async (e: FormEvent) => {
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
                    pdpaConsent: formData.pdpaConsent,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'การลงทะเบียนผิดพลาด');
            }

            const signInResult = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (signInResult?.error) {
                throw new Error("Login อัตโนมัติไม่สำเร็จ กรุณาลองเข้าสู่ระบบอีกครั้ง");
            }

            router.replace('/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h1>ลงทะเบียนสำหรับนักเรียน</h1>
            <form onSubmit={handleSumit}>
                <fieldset>
                    <legend>1.ค้นหาข้อมูลผู้สมัคร</legend>
                    <div className="mb-4">
                    <label>เลขบัตรประชาชนผู้สมัครสอบ: </label>
                    <input
                        id="nationalId"
                        type="text"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleInputChange}
                        maxLength={13}
                        required
                        className='border border-black'
                    />
                    <button type="button" onClick={handleFetchApplicant} disabled={isFetching}>{isFetching ? 'กำลังค้นหา...' : 'ตรวจสอบข้อมูล'}</button>
                    </div>
                </fieldset>

                {applicantData && (
                    <fieldset>
                        <legend>2. ข้อมูลผู้สมัคร</legend>
                        <p>คำนำหน้าชื่อ: {applicantData.title}</p>
                        <p>ชื่อ: {applicantData.firstName}</p>
                        <p>ชื่อกลาง: {applicantData.middleName || '-'}</p>
                        <p>นามสกุล: {applicantData.lastName}</p>
                        <p>วันเกิด: {applicantData.dateOfBirth}</p>
                        <p>จังหวัดโรงเรียน: {applicantData.school.province}</p>
                        <p>โรงเรียน: {applicantData.school.name}</p>
                        <p>GPA รวม: {applicantData.gpaTotal || 'N/A'}</p>
                        <p>GPA คณิต: {applicantData.gpaMath || 'N/A'}</p>
                        <p>GPA วิทย์: {applicantData.gpaScience || 'N/A'}</p>
                    </fieldset>
                )}

                {nationalIdChecked && applicantData && (
                    <fieldset>
                        <legend>3.สร้างบัญชีผู้ใช้</legend>
                        <label>รหัสหลังบัตรประชาชน
                            <input
                                type="text"
                                name="laserCode"
                                value={formData.laserCode}
                                onChange={handleInputChange}
                            />
                        </label>
                        <label>
                            อีเมล (ใช้ในการติดต่อและเข้าสู่ระบบ):
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <label>
                            รหัสผ่าน:
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                minLength={8}
                            />
                        </label>
                        <label>
                            ยืนยันรหัสผ่าน:
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                            />
                        </label>

                    </fieldset>
                )}

                {nationalIdChecked && applicantData && (
                    <fieldset>
                        <legend>4. การยินยอม</legend>
                        <label>
                            <input
                                type="checkbox"
                                name="pdpaConsent"
                                checked={formData.pdpaConsent}
                                onChange={handleInputChange}
                                required
                            />
                            ข้าพเจ้ายอมรับข้อกำหนดและเงื่อนไขการใช้งาน (PDPA)
                        </label>
                        <button type="submit">ลงทะเบียน</button>
                    </fieldset>
                )}
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    )
}