import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, ArrowUp } from 'lucide-react';

const Footer = () => {
    const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null

    return (
        <footer className="w-full py-12 px-4 border-t border-light-border/10 dark:border-white/10 mt-12 bg-light-canvas dark:bg-dark-canvas z-10 relative">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-75 hover:opacity-100 transition-opacity">
                <div>
                    <a href="#top" className="font-black text-xl hover:opacity-80 transition-opacity">
                        SkillForge<span className="text-orange-500">.</span>
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        © {new Date().getFullYear()} SkillForge Inc. Crafted for builders & unicorn hiring.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-gray-600 dark:text-gray-400">
                    <button
                        type="button"
                        onClick={() => setLegalModal('terms')}
                        className="hover:text-orange-500 transition-colors"
                    >
                        Terms of Service
                    </button>
                    <button
                        type="button"
                        onClick={() => setLegalModal('privacy')}
                        className="hover:text-orange-500 transition-colors"
                    >
                        Privacy Policy
                    </button>
                    <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-orange-500 transition-colors"
                    >
                        Twitter / X
                    </a>
                    <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-orange-500 transition-colors"
                    >
                        LinkedIn
                    </a>
                    <a
                        href="https://discord.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-orange-500 transition-colors"
                    >
                        Discord
                    </a>
                </div>

                <a
                    href="#top"
                    aria-label="Scroll to top"
                    className="p-2.5 rounded-full border border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all text-gray-500 hover:text-black dark:hover:text-white"
                >
                    <ArrowUp className="w-4 h-4" />
                </a>
            </div>

            {/* Legal Modal */}
            <AnimatePresence>
                {legalModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 text-left"
                        onClick={() => setLegalModal(null)}
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
                                    <FileText className="w-5 h-5 text-orange-500" />
                                    <h3 className="text-xl font-black text-black dark:text-white">
                                        {legalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLegalModal(null)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
                                {legalModal === 'terms' ? (
                                    <>
                                        <p className="font-bold text-black dark:text-white">1. Verified Skill Certification</p>
                                        <p>SkillForge assesses candidate capabilities through proctored dynamic exams and AI evaluations. Scores represent verified capability benchmarks.</p>
                                        <p className="font-bold text-black dark:text-white">2. Job Match & Applications</p>
                                        <p>Candidate profiles are matched with hiring partners. Recruiters review verified skills and can extend interview calls or provide constructive feedback.</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-bold text-black dark:text-white">1. Data Security & Storage</p>
                                        <p>Your resume and candidate data are stored securely and used exclusively for assessment scoring and hiring matching.</p>
                                        <p className="font-bold text-black dark:text-white">2. Zero Unauthorized Sharing</p>
                                        <p>We never sell your contact credentials or private information to external third-party advertisers.</p>
                                    </>
                                )}
                            </div>

                            <div className="mt-6 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setLegalModal(null)}
                                    className="px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </footer>
    );
};

export default Footer;
