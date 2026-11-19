import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

// Steps
import Step1Role from './steps/Step1Role';
import Step2BasicInfo, { validateStep2 } from './steps/Step2BasicInfo';
import Step3Details from './steps/Step3Details';
import Step4Confirm from './steps/Step4Confirm';
import SuccessState from './SuccessState';

const RegisterWizard = () => {
    const { step, nextStep, prevStep, role, setAuthMode, signup, formData } = useAuthStore();
    const navigate = useNavigate();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [stepError, setStepError] = useState(null);

    // Step configuration
    const steps = [
        { id: 1, title: 'Role' },
        { id: 2, title: 'Basic Info' },
        { id: 3, title: 'Details' },
        { id: 4, title: 'Confirm' },
    ];

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1Role />;
            case 2: return <Step2BasicInfo />;
            case 3: return <Step3Details />;
            case 4: return <Step4Confirm />;
            default: return null;
        }
    }

    const handleNext = () => {
        setStepError(null);

        if (step === 1) {
            if (!role) {
                setStepError("Please select a path (Student or Recruiter) to continue.");
                return;
            }
        }

        if (step === 2) {
            const errors = validateStep2(formData, role);
            if (Object.keys(errors).length > 0) {
                const firstErrorMessage = Object.values(errors)[0];
                setStepError(firstErrorMessage);
                return;
            }
        }

        if (step === 4) {
            if (!formData.termsAgreed) {
                setStepError("Please review and agree to the Terms of Service & Privacy Policy.");
                return;
            }
            handleComplete();
        } else {
            nextStep();
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        setStepError(null);
        try {
            const user = await signup();
            setIsSuccess(true);
            setTimeout(() => {
                if (user.role === 'student') {
                    navigate('/student/dashboard');
                } else if (user.role === 'client') {
                    navigate('/client/dashboard');
                }
            }, 1800);
        } catch (error) {
            console.error('Registration failed:', error);
            setStepError(error.message || 'Registration failed. Please verify your credentials and try again.');
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return <SuccessState />;
    }

    return (
        <div className="w-full">
            {/* Header / Progress */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative mb-2">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full -z-10" />
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full -z-10 transition-all duration-300"
                        style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                    />

                    {steps.map((s) => {
                        const isActive = s.id === step;
                        const isCompleted = s.id < step;

                        return (
                            <div key={s.id} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-4
                                     ${isActive ? 'bg-blue-500 text-white border-white dark:border-black scale-110 shadow-lg' :
                                        isCompleted ? 'bg-blue-500 text-white border-white dark:border-black' :
                                            'bg-gray-200 dark:bg-gray-800 text-gray-500 border-transparent'}
                                 `}>
                                    {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-between px-1">
                    {steps.map((s) => (
                        <span key={s.id} className={`text-[10px] font-bold uppercase tracking-wider transition-colors
                             ${s.id === step ? 'text-blue-500' : 'text-gray-400'}
                         `}>{s.title}</span>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Step Error Banner */}
            {stepError && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{stepError}</span>
                </motion.div>
            )}

            {/* Navigation Actions */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                {step === 1 ? (
                    <button
                        onClick={() => setAuthMode('login')}
                        className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white"
                    >
                        Back to Login
                    </button>
                ) : (
                    <button
                        onClick={prevStep}
                        className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                )}

                <Button
                    onClick={handleNext}
                    disabled={(step === 1 && !role) || isLoading}
                    className="px-8 py-3 !bg-black dark:!bg-white !text-white dark:!text-black min-w-[140px]"
                >
                    {isLoading ? 'Creating...' : step === 4 ? 'Create Account' : 'Continue'}
                    {!isLoading && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
            </div>
        </div>
    );
};

export default RegisterWizard;
