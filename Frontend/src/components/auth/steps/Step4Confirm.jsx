import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Edit2, Shield, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SummaryItem = ({ label, value, step, setStep }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    return (
        <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
            <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{label}</span>
                <span className="text-sm font-medium text-black dark:text-white block">
                    {Array.isArray(value) ? value.join(', ') : value}
                </span>
            </div>
            <button
                type="button"
                onClick={() => setStep(step)}
                className="p-1.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
            >
                <Edit2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

const Step4Confirm = () => {
    const { role, formData, updateFormData, setStep } = useAuthStore();
    const [modalContent, setModalContent] = useState(null); // 'terms' | 'privacy' | null

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-black dark:text-white">Review & Confirm</h2>
                <p className="text-gray-500 text-sm">One last look to verify your account details.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <SummaryItem label="Role" value={role === 'student' ? 'Student / Individual' : 'Client / Recruiter'} step={1} setStep={setStep} />
                <SummaryItem label="Full Name" value={formData.fullName} step={2} setStep={setStep} />
                <SummaryItem label="Verified Email" value={formData.email} step={2} setStep={setStep} />

                {role === 'client' && (
                    <>
                        <SummaryItem label="Company" value={formData.companyName} step={2} setStep={setStep} />
                        <SummaryItem label="Designation" value={formData.designation} step={2} setStep={setStep} />
                        <SummaryItem label="Industry" value={formData.industry} step={3} setStep={setStep} />
                    </>
                )}

                {role === 'student' && (
                    <>
                        <SummaryItem label="Primary Goal" value={formData.learningGoal} step={3} setStep={setStep} />
                        <SummaryItem label="Experience Level" value={formData.experienceLevel} step={3} setStep={setStep} />
                        <SummaryItem label="Interested Domains" value={formData.interests} step={3} setStep={setStep} />
                    </>
                )}
            </div>

            <label className={`flex items-start gap-3 cursor-pointer group p-4 border-2 rounded-2xl transition-all ${
                formData.termsAgreed 
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20' 
                    : 'border-stone-200 dark:border-gray-800 hover:border-blue-300'
            }`}>
                <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                    checked={!!formData.termsAgreed}
                    onChange={(e) => updateFormData({ termsAgreed: e.target.checked })}
                />
                <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    I agree to the{' '}
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalContent('terms'); }}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalContent('privacy'); }}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Privacy Policy
                    </button>
                    . I consent to secure assessment verification and account updates.
                </span>
            </label>

            {/* Legal Modal */}
            <AnimatePresence>
                {modalContent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 text-left"
                        onClick={() => setModalContent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border-2 border-black dark:border-gray-700 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <h3 className="text-xl font-black text-black dark:text-white">
                                        {modalContent === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setModalContent(null)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
                                {modalContent === 'terms' ? (
                                    <>
                                        <p className="font-bold text-black dark:text-white">1. Skill Verification Standards</p>
                                        <p>By creating an account on SkillForge, you commit to honest assessment completion without unapproved third-party automated assistance. Assessment results constitute your verified platform profile.</p>
                                        <p className="font-bold text-black dark:text-white">2. Recruiter & Student Matching</p>
                                        <p>Recruiters may review candidate match scores, skills, and portfolio submissions. Candidates receive direct notices regarding interview invitations and constructive feedback.</p>
                                        <p className="font-bold text-black dark:text-white">3. Platform Conduct</p>
                                        <p>All users agree to adhere to anti-harassment and professional recruitment protocols. Spam, automated scraping, or falsification of credentials will result in immediate termination.</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-bold text-black dark:text-white">1. Data Collection & Use</p>
                                        <p>SkillForge collects your name, email, educational background, skills, and resume strictly for profile evaluation and matching with verified hiring companies.</p>
                                        <p className="font-bold text-black dark:text-white">2. Confidentiality & Security</p>
                                        <p>Your passwords and tokens are encrypted and salted. We never sell your personal data to third parties.</p>
                                        <p className="font-bold text-black dark:text-white">3. Your Data Rights</p>
                                        <p>You can update, modify, or request deletion of your profile data at any time via your dashboard or by writing to support@skillforge.io.</p>
                                    </>
                                )}
                            </div>

                            <div className="mt-6 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        updateFormData({ termsAgreed: true });
                                        setModalContent(null);
                                    }}
                                    className="px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                                >
                                    I Understand & Accept
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Step4Confirm;
