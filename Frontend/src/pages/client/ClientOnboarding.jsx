import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Building, MapPin, Globe, Briefcase, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ThemeToggle from '../../components/layout/ThemeToggle';

const ClientOnboarding = () => {
    const { user, tokens } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Check if user is editing an existing profile
    const isEditMode = Boolean(user?.onboarding_stage && user.onboarding_stage >= 2);

    // Using snake_case keys to match backend Serializer exactly
    const [profile, setProfile] = useState({
        company_name: '',
        industry: '',
        website: '',
        address: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!tokens?.access) return;
            try {
                const response = await fetch('http://localhost:8000/api/accounts/profile/', {
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setProfile({
                        company_name: data.company_name || '',
                        industry: data.industry || '',
                        website: data.website || '',
                        address: data.address || '',
                    });
                }
            } catch (error) {
                console.error("Error fetching profile", error);
            }
        };
        fetchProfile();
    }, [tokens]);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const isUpdate = user?.onboarding_stage && user.onboarding_stage >= 2;

        const url = isUpdate
            ? 'http://localhost:8000/api/accounts/profile/update/'
            : 'http://localhost:8000/api/accounts/onboarding/';

        const method = isUpdate ? 'PATCH' : 'PUT';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens.access}`
                },
                body: JSON.stringify(profile)
            });

            if (response.ok) {
                setSavedSuccess(true);
                setTimeout(() => {
                    navigate('/client/dashboard');
                }, 900);
            } else {
                const err = await response.json().catch(() => ({}));
                alert(err.error || "Update failed. Please check the details.");
            }
        } catch (error) {
            console.error("Error submitting form", error);
            alert("Network error updating profile.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas p-6 flex flex-col justify-between transition-colors duration-300">
            {/* Top Navigation Bar */}
            <div className="max-w-4xl w-full mx-auto flex items-center justify-between mb-8 pb-2">
                <Button
                    onClick={() => navigate('/client/dashboard')}
                    variant="secondary"
                    className="!text-xs !py-2 !px-4 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
                <ThemeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl w-full mx-auto my-auto py-4"
            >
                <header className="mb-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tighter text-black dark:text-white">
                        {isEditMode ? 'Edit Company Profile' : 'Welcome to the Forge'} <span className="text-orange-500">⚒️</span>
                    </h1>
                    <p className="font-script text-xl md:text-2xl text-gray-500 dark:text-gray-400 rotate-1">
                        {isEditMode ? 'Update your company HQ & hiring credentials.' : `Let's set up your HQ, ${user?.name || 'Partner'}!`}
                    </p>
                </header>

                <div className="bg-white dark:bg-dark-card border-4 border-black dark:border-gray-700 rounded-[3rem] p-8 md:p-12 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-none relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100 dark:bg-yellow-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Company Name"
                                name="company_name"
                                value={profile.company_name}
                                onChange={handleChange}
                                icon={Building}
                                placeholder="e.g. BarterNow Inc."
                                required
                            />
                            <Input
                                label="Industry"
                                name="industry"
                                value={profile.industry}
                                onChange={handleChange}
                                icon={Briefcase}
                                placeholder="e.g. Fintech, EdTech, SaaS"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Website"
                                name="website"
                                value={profile.website}
                                onChange={handleChange}
                                icon={Globe}
                                placeholder="https://barternow.in"
                            />
                            <Input
                                label="Location / Address"
                                name="address"
                                value={profile.address}
                                onChange={handleChange}
                                icon={MapPin}
                                placeholder="e.g. Remote, San Francisco"
                            />
                        </div>

                        <AnimatePresence>
                            {savedSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="p-3 bg-green-100 dark:bg-green-950/70 border-2 border-green-500 text-green-800 dark:text-green-300 rounded-2xl flex items-center gap-2 text-sm font-bold"
                                >
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Company profile saved successfully! Redirecting to dashboard...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate('/client/dashboard')}
                                className="!py-3 !px-6 text-sm font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || savedSuccess}
                                className="px-8 py-3.5 text-base md:text-lg flex items-center gap-2 !bg-yellow-400 hover:!bg-yellow-500 !text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:shadow-none font-black"
                            >
                                {isLoading ? 'Saving Changes...' : isEditMode ? 'Save Profile' : 'Complete Setup'}
                                {!isLoading && <ArrowRight className="w-5 h-5" />}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>

            <div className="text-center text-xs text-stone-400 dark:text-gray-500 font-bold py-2">
                SkillForge Enterprise Recruiter &bull; Verified Partner Portal
            </div>
        </div>
    );
};

export default ClientOnboarding;
