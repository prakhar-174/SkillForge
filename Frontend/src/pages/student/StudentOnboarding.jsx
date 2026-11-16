import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { User, FileText, Code, Link as LinkIcon, UploadCloud, ArrowRight, ArrowLeft, Linkedin, Lock, CheckCircle, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ThemeToggle from '../../components/layout/ThemeToggle';

const StudentOnboarding = () => {
    const { user, tokens, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isNameImmutable, setIsNameImmutable] = useState(false);
    const [existingResumeName, setExistingResumeName] = useState('');
    const [fileError, setFileError] = useState('');

    // snake_case keys for backend compatibility
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        education: '',
        experience_level: 'Beginner',
        github_url: '',
        linkedin_url: '',
        portfolio_links: '',
        skills: ''
    });
    const [resume, setResume] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!tokens?.access) return;
            try {
                const response = await fetch('http://localhost:8000/api/accounts/profile/', {
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setFormData({
                        full_name: data.full_name || '',
                        bio: data.bio || '',
                        education: data.education || '',
                        experience_level: data.experience_level || 'Beginner',
                        github_url: data.github_url || '',
                        linkedin_url: data.linkedin_url || '',
                        portfolio_links: data.portfolio_links || '',
                        skills: data.skills || ''
                    });

                    // If full_name is already set on the profile, it cannot be changed
                    if (data.full_name && data.full_name.trim().length > 0) {
                        setIsNameImmutable(true);
                    }

                    if (data.resume) {
                        const fname = data.resume.split('/').pop();
                        setExistingResumeName(fname);
                    }
                }
            } catch (error) { console.error(error); }
        };
        fetchProfile();
    }, [tokens]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFileError('');
        const file = e.target.files[0];
        if (file) {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            if (!isPdf) {
                setFileError('Invalid file format. Please upload a PDF file only.');
                e.target.value = '';
                setResume(null);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setFileError('File size exceeds the 10MB limit. Please upload a smaller PDF.');
                e.target.value = '';
                setResume(null);
                return;
            }
            setResume(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFileError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            // Keep full_name or skip if disabled/immutable
            data.append(key, formData[key] ?? '');
        });
        if (resume) {
            data.append('resume', resume);
        }

        const isUpdate = isNameImmutable || (user?.onboarding_stage && user.onboarding_stage >= 2);
        const url = isUpdate
            ? 'http://localhost:8000/api/accounts/profile/update/'
            : 'http://localhost:8000/api/accounts/onboarding/';
        const method = isUpdate ? 'PATCH' : 'PUT';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${tokens.access}`
                },
                body: data
            });

            if (response.ok) {
                setIsLoading(false);
                setIsSuccess(true);

                // Update local auth state with onboarding stage & name
                if (updateUser) {
                    updateUser({
                        onboarding_stage: 2,
                        name: formData.full_name
                    });
                }

                // Show success message and smoothly redirect to dashboard
                setTimeout(() => {
                    navigate('/student/dashboard');
                }, 1200);
            } else {
                setIsLoading(false);
                const err = await response.json();
                console.error("Onboarding failed", err);
                const errMsg = err.resume || err.error || err.detail || JSON.stringify(err);
                alert("Failed to save profile: " + errMsg);
            }
        } catch (error) {
            setIsLoading(false);
            console.error("Error submitting form", error);
            alert("Network error. Please make sure the server is reachable.");
        }
    };

    return (
        <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas p-6 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl w-full"
            >
                {/* Top Navigation Row */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={() => navigate('/student/dashboard')}
                        className="inline-flex items-center gap-2 font-bold text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer px-3 py-2 rounded-xl bg-white/60 dark:bg-dark-card border border-gray-300 dark:border-gray-700 shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <ThemeToggle />
                </div>

                <header className="mb-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter text-black dark:text-white">
                        {isNameImmutable ? (
                            <>Update Your Profile ⚒️</>
                        ) : (
                            <>Welcome to the Forge, <span className="text-blue-500">{formData.full_name || user?.name || 'Candidate'}</span>! ⚒️</>
                        )}
                    </h1>
                    <p className="font-script text-xl text-gray-500">
                        {isNameImmutable ? 'Keep your credentials and links up to date.' : "Let's craft your digital identity."}
                    </p>
                </header>

                <div className="bg-white dark:bg-dark-card border-4 border-black dark:border-gray-700 rounded-[3rem] p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Identity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Input
                                    label="Full Name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    icon={User}
                                    placeholder="John Doe"
                                    required
                                    disabled={isNameImmutable}
                                    className={isNameImmutable ? "!bg-gray-100 dark:!bg-gray-800 !text-gray-500 cursor-not-allowed select-none opacity-80" : ""}
                                />
                                {isNameImmutable && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 mt-1.5 ml-1">
                                        <Lock className="w-3.5 h-3.5 inline flex-shrink-0" />
                                        <span>Full Name is immutable once created.</span>
                                    </div>
                                )}
                            </div>
                            <Input
                                label="Education"
                                name="education"
                                value={formData.education}
                                onChange={handleChange}
                                icon={FileText}
                                placeholder="B.Tech, BE, etc."
                                required
                            />
                        </div>

                        {/* Section 2: Skills & Bio */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1">Technical Skills (Comma separated)</label>
                            <div className="relative">
                                <Code className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-black dark:focus:border-white focus:ring-0 transition-all font-bold"
                                    placeholder="React, Python, Django, AWS..."
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1">Bio / Summary</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-black dark:focus:border-white focus:ring-0 transition-all resize-none font-medium"
                                placeholder="Short description about yourself..."
                            />
                        </div>

                        {/* Section 3: Links & Resume */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="GitHub Profile URL"
                                name="github_url"
                                value={formData.github_url}
                                onChange={handleChange}
                                icon={LinkIcon}
                                placeholder="https://github.com/..."
                            />

                            <Input
                                label="LinkedIn Profile URL"
                                name="linkedin_url"
                                value={formData.linkedin_url}
                                onChange={handleChange}
                                icon={Linkedin}
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>

                        {/* Resume Section with strict PDF check */}
                        <div>
                            <div className="flex items-center justify-between mb-1 ml-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Upload Resume (PDF only)
                                </label>
                                <span className="text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">
                                    .pdf only (max 10MB)
                                </span>
                            </div>
                            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group">
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 text-center">
                                    {resume ? (
                                        <span className="text-blue-600 dark:text-blue-400">Selected: {resume.name}</span>
                                    ) : existingResumeName ? (
                                        <span>Current: <strong className="text-green-600">{existingResumeName}</strong> (Click to upload new PDF)</span>
                                    ) : (
                                        "Click to Upload Resume (PDF only)"
                                    )}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Single PDF file up to 10MB</p>
                            </div>
                            {fileError && (
                                <p className="text-xs font-bold text-red-500 mt-1.5 ml-1">{fileError}</p>
                            )}
                        </div>

                        {/* Success notification banner */}
                        {isSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="p-4 rounded-2xl bg-green-500/15 border-2 border-green-500 text-green-700 dark:text-green-300 flex items-center gap-3 font-bold shadow-md"
                            >
                                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                <div>
                                    <p className="font-black text-base">Changes saved successfully! 🎉</p>
                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400">Redirecting to your dashboard...</p>
                                </div>
                            </motion.div>
                        )}

                        <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate('/student/dashboard')}
                                disabled={isLoading || isSuccess}
                                className="w-full sm:w-auto px-8 py-3 text-base"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || isSuccess}
                                className={`w-full sm:w-auto px-10 py-3 text-base flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                                    isSuccess ? '!bg-green-500 !text-white !border-green-700' : ''
                                }`}
                            >
                                {isSuccess ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-white" />
                                        Saved Successfully!
                                    </>
                                ) : isLoading ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        Save & Continue
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default StudentOnboarding;
