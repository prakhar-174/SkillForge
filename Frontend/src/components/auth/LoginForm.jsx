import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Mail, Lock, User, Github, Linkedin, ArrowRight, X, KeyRound, Sparkles } from 'lucide-react';

const LoginForm = () => {
    const { setAuthMode, login } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [oauthNotice, setOauthNotice] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const user = await login(formData.email, formData.password);
            // Redirect based on role
            if (user.role === 'student') {
                navigate('/student/dashboard');
            } else if (user.role === 'client') {
                navigate('/client/dashboard');
            } else {
                // Fallback or admin
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-black dark:text-white mb-2">Welcome Back</h2>
                <p className="text-gray-500 dark:text-gray-400">Enter your credentials to access your account</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8 relative">
                <div className="absolute inset-0 p-1 flex">
                    <motion.div
                        layoutId="tab"
                        className="w-1/2 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                    />
                </div>
                <button className="flex-1 relative z-10 py-2.5 text-sm font-bold text-black dark:text-white">Login</button>
                <button
                    onClick={() => setAuthMode('register')}
                    className="flex-1 relative z-10 py-2.5 text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    icon={Mail}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <Input
                    label="Password"
                    type="password"
                    name="password"
                    icon={Lock}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                        <span className="text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">Remember me</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="font-bold text-blue-500 hover:underline"
                    >
                        Forgot Password?
                    </button>
                </div>

                <Button
                    className="w-full text-lg py-4 flex items-center justify-center gap-2"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                </Button>

                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm font-medium text-center"
                    >
                        {error}
                    </motion.p>
                )}
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-light-canvas dark:bg-dark-canvas text-gray-500 font-medium">Or continue with</span></div>
            </div>

            {oauthNotice && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium text-center flex items-center justify-between"
                >
                    <span>{oauthNotice}</span>
                    <button type="button" onClick={() => setOauthNotice(null)} className="text-blue-500 hover:text-black">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setOauthNotice("GitHub Single Sign-On is currently rolling out. Please log in using your registered email and password.")}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-bold text-black dark:text-white"
                >
                    <Github className="w-5 h-5" />
                    Github
                </button>
                <button
                    type="button"
                    onClick={() => setOauthNotice("LinkedIn Single Sign-On is currently rolling out. Please log in using your registered email and password.")}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-bold text-black dark:text-white"
                >
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    LinkedIn
                </button>
            </div>

            <p className="mt-8 text-center text-gray-500">
                Don't have an account? <button onClick={() => setAuthMode('register')} className="font-bold text-blue-500 hover:underline">Create Account</button>
            </p>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowForgotModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] p-6 max-w-md w-full border-2 border-black dark:border-gray-700 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <KeyRound className="w-5 h-5 text-orange-500" />
                                    <h3 className="text-xl font-black text-black dark:text-white">Password Recovery</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                For security reasons during this preview phase, password resets are processed through our automated security desk.
                            </p>
                            <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-xs text-orange-900 dark:text-orange-200 mb-6 font-medium">
                                If you cannot remember your credentials, please contact support or reset via your administrator at <span className="font-bold">support@skillforge.io</span> with your registered email.
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                className="w-full py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                            >
                                Understood
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default LoginForm;
