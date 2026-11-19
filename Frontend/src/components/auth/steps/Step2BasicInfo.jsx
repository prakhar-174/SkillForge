import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import Input from '../../ui/Input';
import { User, Mail, Lock, Phone, Building, IdCard, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const validateStep2 = (formData, role) => {
    const errors = {};

    // Full name
    if (!formData.fullName || !formData.fullName.trim()) {
        errors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 2) {
        errors.fullName = "Full name must be at least 2 characters.";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.fullName.trim())) {
        errors.fullName = "Please enter a valid name (letters and spaces only).";
    }

    // Email / Gmail validation
    const email = (formData.email || '').trim().toLowerCase();
    if (!email) {
        errors.email = "Email address is required.";
    } else {
        const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        if (!emailRegex.test(email) || !email.includes('.')) {
            errors.email = "Enter a valid email format (e.g., yourname@gmail.com).";
        } else {
            const parts = email.split('@');
            if (parts.length !== 2 || !parts[0] || !parts[1]) {
                errors.email = "Invalid email address structure.";
            } else {
                const local = parts[0];
                const domain = parts[1];
                const domainParts = domain.split('.');
                const tld = domainParts[domainParts.length - 1];

                if (domainParts.length < 2 || !/^[a-zA-Z]{2,}$/.test(tld)) {
                    errors.email = "Email domain must include a valid extension (e.g. .com, .edu).";
                } else if (['gmail.com', 'googlemail.com'].includes(domain)) {
                    // Strict Gmail check
                    if (local.length < 6) {
                        errors.email = "Gmail username must be at least 6 characters before @gmail.com.";
                    } else if (local.length > 30) {
                        errors.email = "Gmail username cannot exceed 30 characters.";
                    } else if (!/^[a-z0-9.]+$/.test(local)) {
                        errors.email = "Gmail username can only contain letters, numbers, and periods.";
                    } else if (local.startsWith('.') || local.endsWith('.')) {
                        errors.email = "Gmail username cannot start or end with a period.";
                    } else if (local.includes('..')) {
                        errors.email = "Gmail username cannot have consecutive periods (..).";
                    } else if (!/[a-z]/.test(local)) {
                        errors.email = "Gmail username must contain at least one letter.";
                    } else {
                        const clean = local.replace(/\./g, '');
                        if (new Set(clean.split('')).size <= 1) {
                            errors.email = "Please enter a legitimate Gmail address, not repetitive characters.";
                        }
                    }
                }
            }
        }
    }

    // Password validation
    const pwd = formData.password || '';
    if (!pwd) {
        errors.password = "Password is required.";
    } else if (pwd.length < 8) {
        errors.password = "Password must be at least 8 characters.";
    } else if (!/[a-zA-Z]/.test(pwd)) {
        errors.password = "Password must contain at least one letter.";
    } else if (!/[0-9\W]/.test(pwd)) {
        errors.password = "Password must contain at least one number or symbol.";
    }

    // Confirm password
    if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
    } else if (formData.confirmPassword !== pwd) {
        errors.confirmPassword = "Passwords do not match.";
    }

    // Client fields
    if (role === 'client') {
        if (!formData.companyName || !formData.companyName.trim()) {
            errors.companyName = "Company name is required for recruiter accounts.";
        }
        if (formData.phoneNumber && !/^[+0-9\s-]{7,15}$/.test(formData.phoneNumber.trim())) {
            errors.phoneNumber = "Please enter a valid phone number (7-15 digits).";
        }
    }

    return errors;
};

const Step2BasicInfo = () => {
    const { role, formData, updateFormData } = useAuthStore();
    const [touched, setTouched] = useState({});

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const errors = validateStep2(formData, role);

    // Password strength calculation
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { score: 0, text: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 10) score++;
        if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd)) score++;

        if (score <= 2) return { score: 33, text: 'Weak', color: 'bg-rose-500 text-rose-500' };
        if (score <= 4) return { score: 66, text: 'Medium', color: 'bg-amber-500 text-amber-500' };
        return { score: 100, text: 'Strong', color: 'bg-emerald-500 text-emerald-500' };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-black dark:text-white">Basic Information</h2>
                <p className="text-gray-500 text-sm">Provide your verified credentials to secure your account.</p>
            </div>

            <div className="space-y-4">
                {/* Full Name */}
                <Input
                    label="Full Name"
                    name="fullName"
                    icon={User}
                    value={formData.fullName}
                    onChange={(e) => updateFormData({ fullName: e.target.value })}
                    onBlur={() => handleBlur('fullName')}
                    error={touched.fullName ? errors.fullName : undefined}
                    success={touched.fullName && !errors.fullName && formData.fullName?.trim().length >= 2}
                />

                {/* Email Address */}
                <div>
                    <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        icon={Mail}
                        value={formData.email}
                        onChange={(e) => updateFormData({ email: e.target.value })}
                        onBlur={() => handleBlur('email')}
                        error={touched.email ? errors.email : undefined}
                        success={touched.email && !errors.email && formData.email?.trim().length > 0}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 ml-1 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        Valid Gmail address (e.g. name@gmail.com) or verified institutional email.
                    </p>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            icon={Lock}
                            value={formData.password}
                            onChange={(e) => updateFormData({ password: e.target.value })}
                            onBlur={() => handleBlur('password')}
                            error={touched.password ? errors.password : undefined}
                            success={touched.password && !errors.password && formData.password?.length >= 8}
                        />
                        {formData.password && (
                            <div className="mt-1.5 ml-1 flex items-center gap-2">
                                <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${passwordStrength.color.split(' ')[0]}`}
                                        style={{ width: `${passwordStrength.score}%` }}
                                    />
                                </div>
                                <span className={`text-[10px] font-black uppercase ${passwordStrength.color.split(' ')[1]}`}>
                                    {passwordStrength.text}
                                </span>
                            </div>
                        )}
                    </div>

                    <Input
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        icon={Lock}
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                        onBlur={() => handleBlur('confirmPassword')}
                        error={touched.confirmPassword ? errors.confirmPassword : undefined}
                        success={touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword?.length >= 8}
                    />
                </div>

                {/* Client Specific Fields */}
                {role === 'client' && (
                    <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-4 fade-in duration-500">
                        <Input
                            label="Company Name"
                            name="companyName"
                            icon={Building}
                            value={formData.companyName}
                            onChange={(e) => updateFormData({ companyName: e.target.value })}
                            onBlur={() => handleBlur('companyName')}
                            error={touched.companyName ? errors.companyName : undefined}
                            success={touched.companyName && !errors.companyName && formData.companyName?.trim().length >= 2}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Phone Number (Optional)"
                                name="phoneNumber"
                                icon={Phone}
                                value={formData.phoneNumber}
                                onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                                onBlur={() => handleBlur('phoneNumber')}
                                error={touched.phoneNumber ? errors.phoneNumber : undefined}
                                success={touched.phoneNumber && !errors.phoneNumber && formData.phoneNumber?.trim().length >= 7}
                            />
                            <Input
                                label="Designation (Optional)"
                                name="designation"
                                icon={IdCard}
                                value={formData.designation}
                                onChange={(e) => updateFormData({ designation: e.target.value })}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Step2BasicInfo;
