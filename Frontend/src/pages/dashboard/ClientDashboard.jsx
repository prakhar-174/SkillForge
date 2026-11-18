import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../../components/layout/ThemeToggle';
import {
    LogOut,
    Users,
    Briefcase,
    Plus,
    MapPin,
    DollarSign,
    Target,
    X,
    Mail,
    Github,
    Linkedin,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Sparkles,
    AlertCircle,
    Send,
    MessageSquare,
    Check,
    PhoneCall
} from 'lucide-react';
import Button from '../../components/ui/Button';
import JobPostModal from '../../components/client/JobPostModal';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = () => {
    const { logout, user, tokens } = useAuthStore();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);

    // Applicant Action States
    const [actionLoading, setActionLoading] = useState(false);
    const [actionToast, setActionToast] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [interviewModalOpen, setInterviewModalOpen] = useState(false);
    const [activeApplicant, setActiveApplicant] = useState(null);
    const [rejectionFeedback, setRejectionFeedback] = useState('');
    const [interviewDetails, setInterviewDetails] = useState('');

    const fetchProfile = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/accounts/profile/', {
                headers: { 'Authorization': `Bearer ${tokens?.access}` }
            });
            if (response.ok) setProfile(await response.json());
        } catch (e) { console.error(e); }
    };

    const fetchJobs = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/project/my-jobs/', {
                headers: { 'Authorization': `Bearer ${tokens?.access}` }
            });
            if (response.ok) {
                const data = await response.json();
                setJobs(data);
            }
        } catch (error) {
            console.error('Failed to fetch jobs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tokens?.access) {
            fetchJobs();
            fetchProfile();
        }
    }, [tokens]);

    const handleJobCreated = (newJob) => {
        setJobs([newJob, ...jobs]);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const viewApplicants = async (job) => {
        setSelectedJob(job);
        try {
            const response = await fetch(`http://localhost:8000/api/project/applicants/${job.id}/`, {
                headers: { 'Authorization': `Bearer ${tokens?.access}` }
            });
            if (response.ok) {
                setApplicants(await response.json());
            }
        } catch (e) { console.error(e); }
        setIsApplicantModalOpen(true);
    };

    const openRejectModal = (applicant) => {
        setActiveApplicant(applicant);
        setRejectionFeedback(applicant.feedback_note || '');
        setRejectModalOpen(true);
    };

    const openInterviewModal = (applicant) => {
        setActiveApplicant(applicant);
        setInterviewDetails(applicant.interview_details || '');
        setInterviewModalOpen(true);
    };

    const handleApplicantAction = async (action, note = '') => {
        if (!activeApplicant) return;
        setActionLoading(true);
        try {
            const payload = {
                application_id: activeApplicant.application_id,
                action: action,
                feedback_note: action === 'reject' ? note : '',
                interview_details: action === 'interview' ? note : ''
            };
            const response = await fetch('http://localhost:8000/api/project/applications/action/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens?.access}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                // Update local applicants list
                setApplicants(prev => prev.map(app => {
                    if (app.application_id === activeApplicant.application_id) {
                        return {
                            ...app,
                            status: action === 'interview' ? 'interview' : 'rejected',
                            feedback_note: action === 'reject' ? note : app.feedback_note,
                            interview_details: action === 'interview' ? note : app.interview_details
                        };
                    }
                    return app;
                }));

                // Close action modals & reset
                setRejectModalOpen(false);
                setInterviewModalOpen(false);
                setRejectionFeedback('');
                setInterviewDetails('');

                setActionToast({
                    type: 'success',
                    message: action === 'interview'
                        ? `🎉 Interview invitation sent to ${activeApplicant.name}!`
                        : `Application for ${activeApplicant.name} marked as rejected.`
                });
                setTimeout(() => setActionToast(null), 4000);
            } else {
                const err = await response.json();
                alert(err.error || 'Failed to update application');
            }
        } catch (e) {
            console.error('Error updating application action:', e);
            alert('Network error while processing application action');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas transition-colors duration-500 p-6 md:p-12 font-sans text-light-border dark:text-white">
            {/* Header */}
            <header className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter">
                        Welcome, {user?.name || 'Recruiter'}! 🚀
                    </h1>
                    <p className="font-script text-xl text-gray-500 dark:text-gray-400">
                        Find your next unicorn employee today.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="!bg-orange-500 !text-white !border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:!bg-orange-600 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Post Project
                    </Button>
                    <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
                    <ThemeToggle />
                    <Button
                        onClick={handleLogout}
                        variant="secondary"
                        className="!px-3 !py-2 !text-xs flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            <JobPostModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onJobCreated={handleJobCreated}
            />

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Stat Card - Job Posts */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-dark-card border-2 border-light-border dark:border-gray-700 rounded-[3rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                >
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mb-4 text-pink-500">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Job Posts</h3>
                    <p className="text-4xl font-black text-black dark:text-white">{jobs.length}</p>
                    <p className="text-sm text-gray-400 mt-2 font-mono">
                        {jobs.filter(j => j.status === 'open').length} active campaigns
                    </p>
                </motion.div>

                {/* Profile Card */}
                <div className="bg-white dark:bg-dark-card border-2 border-light-border dark:border-gray-700 rounded-[3rem] p-8 h-fit lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black">Company Profile</h3>
                        <Button onClick={() => navigate('/client/onboarding')} variant="secondary" className="!text-xs !py-1">Edit</Button>
                    </div>
                    {profile ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Company</label>
                                <p className="font-bold text-lg">{profile.company_name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Industry</label>
                                <p className="font-medium">{profile.industry}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Location</label>
                                <p className="font-medium flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.address || 'Remote'}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 italic">Loading profile...</p>
                    )}
                </div>

                {/* Main Content Area - Job List */}
                <div className="md:col-span-2 lg:col-span-3">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                        Active Postings <span className="text-sm font-normal bg-black text-white px-2 py-1 rounded-full">{jobs.length}</span>
                    </h2>

                    {jobs.length === 0 ? (
                        <div className="bg-white dark:bg-dark-card border-2 border-light-border dark:border-gray-700 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center border-dashed min-h-[300px]">
                            <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="font-bold text-xl mb-2 text-black dark:text-white">The Forge is cold.</p>
                            <p className="font-script text-gray-500 text-lg">Post your first project to start hiring!</p>
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                variant="outline"
                                className="mt-6"
                            >
                                Ignite the Forge
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence>
                                {jobs.map((job) => (
                                    <motion.div
                                        key={job.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-none relative group hover:-translate-y-1 transition-transform"
                                    >
                                        <div className="absolute top-4 right-4 rotate-12 bg-yellow-300 text-black text-xs font-bold px-2 py-1 shadow-sm font-script">
                                            Job Authenticity Verified
                                        </div>

                                        <div className="flex justify-between items-start mb-4 mt-2">
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                                {job.category}
                                            </span>
                                            <span className="text-sm font-bold text-gray-400">
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold mb-2 line-clamp-1">{job.title}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                                            {job.description}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300 mb-6">
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="w-4 h-4" />
                                                {job.budget_type === 'fixed' ? `$${job.budget_amount}` : `$${job.budget_amount}/hr`}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Target className="w-4 h-4 text-orange-500" />
                                                {job.min_skill_score}+ Score
                                            </span>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-gray-400" />
                                                <span className="font-bold">{job.applicant_count || 0}</span>
                                                <span className="text-sm text-gray-500">applicants</span>
                                            </div>
                                            <button
                                                onClick={() => viewApplicants(job)}
                                                className="text-sm font-bold text-blue-600 hover:underline decoration-wavy"
                                            >
                                                View Applicants
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Applicants Modal */}
            <AnimatePresence>
                {isApplicantModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsApplicantModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-dark-card rounded-[2.5rem] p-6 md:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto border-2 border-black dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-black">Applicants</h2>
                                        <span className="text-xs font-black bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 rounded-full">
                                            {applicants.length}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium mt-0.5">Role: <span className="font-bold text-black dark:text-white">{selectedJob?.title}</span></p>
                                </div>
                                <button
                                    onClick={() => setIsApplicantModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Toast Notification Banner */}
                            {actionToast && (
                                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center justify-between shadow-sm">
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-emerald-600" />
                                        {actionToast.message}
                                    </span>
                                    <button onClick={() => setActionToast(null)} className="text-emerald-700 hover:text-black dark:hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {applicants.length === 0 ? (
                                <div className="text-center py-16">
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300">No applicants yet</p>
                                    <p className="text-gray-400 text-sm mt-1">Candidates matching your criteria will appear here once they apply.</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {applicants.map((applicant) => (
                                        <div
                                            key={applicant.application_id || applicant.email}
                                            className="border-2 border-gray-200 dark:border-gray-700 rounded-[2rem] p-6 hover:border-black dark:hover:border-white transition-all bg-stone-50/50 dark:bg-dark-card"
                                        >
                                            {/* Candidate Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-black text-black dark:text-white">
                                                            {applicant.name || 'Anonymous Candidate'}
                                                        </h3>
                                                        {applicant.match != null && (
                                                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                                                                {applicant.match}% Match
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                                                        <Mail className="w-3.5 h-3.5" /> {applicant.email}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full">
                                                        {applicant.experience_level || 'Entry'}
                                                    </span>

                                                    {/* Status Badge */}
                                                    {applicant.status === 'interview' && (
                                                        <span className="text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 shadow-sm">
                                                            <Calendar className="w-3.5 h-3.5" /> Interview Called
                                                        </span>
                                                    )}
                                                    {applicant.status === 'rejected' && (
                                                        <span className="text-xs font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full border border-rose-300 dark:border-rose-700 flex items-center gap-1.5 shadow-sm">
                                                            <XCircle className="w-3.5 h-3.5" /> Rejected
                                                        </span>
                                                    )}
                                                    {applicant.status === 'accepted' && (
                                                        <span className="text-xs font-black bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-300 dark:border-blue-700 flex items-center gap-1.5 shadow-sm">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Accepted
                                                        </span>
                                                    )}
                                                    {(!applicant.status || applicant.status === 'pending') && (
                                                        <span className="text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 shadow-sm">
                                                            <Clock className="w-3.5 h-3.5" /> Pending Review
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Candidate Details */}
                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wide">Education</label>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{applicant.education || 'Not specified'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wide">Skills</label>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">{applicant.skills || 'Not specified'}</p>
                                                </div>
                                            </div>

                                            {/* Social / Portfolio Links */}
                                            <div className="mt-3 flex items-center gap-3">
                                                {applicant.github_url && (
                                                    <a
                                                        href={applicant.github_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 transition-colors"
                                                    >
                                                        <Github className="w-3.5 h-3.5" /> GitHub
                                                    </a>
                                                )}
                                                {applicant.linkedin_url && (
                                                    <a
                                                        href={applicant.linkedin_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 transition-colors"
                                                    >
                                                        <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                                                    </a>
                                                )}
                                            </div>

                                            {/* Notes / Details Sent Previously */}
                                            {applicant.feedback_note && (
                                                <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200">
                                                    <span className="font-black flex items-center gap-1.5 mb-1 text-rose-700 dark:text-rose-400">
                                                        <AlertCircle className="w-3.5 h-3.5" /> Constructive Feedback Sent to Candidate:
                                                    </span>
                                                    <p className="italic">"{applicant.feedback_note}"</p>
                                                </div>
                                            )}
                                            {applicant.interview_details && (
                                                <div className="mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200">
                                                    <span className="font-black flex items-center gap-1.5 mb-1 text-emerald-700 dark:text-emerald-400">
                                                        <Calendar className="w-3.5 h-3.5" /> Interview Details Sent to Candidate:
                                                    </span>
                                                    <p className="font-medium">"{applicant.interview_details}"</p>
                                                </div>
                                            )}

                                            {/* Action Buttons Row */}
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                                                <span className="text-xs font-bold text-gray-400">
                                                    Applied: {applicant.applied_at ? new Date(applicant.applied_at).toLocaleDateString() : 'Recently'}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    {/* Call for Interview button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openInterviewModal(applicant)}
                                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 ${
                                                            applicant.status === 'interview'
                                                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                                                                : 'bg-emerald-500 hover:bg-emerald-600 text-white border-black dark:border-emerald-400'
                                                        }`}
                                                    >
                                                        <PhoneCall className="w-3.5 h-3.5" />
                                                        {applicant.status === 'interview' ? 'Update Interview' : 'Call for Interview'}
                                                    </button>

                                                    {/* Reject button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openRejectModal(applicant)}
                                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 ${
                                                            applicant.status === 'rejected'
                                                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-500'
                                                                : 'bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 border-rose-400 hover:border-rose-600'
                                                        }`}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        {applicant.status === 'rejected' ? 'Update Rejection' : 'Reject'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rejection Feedback Modal (Optional constructive note popup) */}
            <AnimatePresence>
                {rejectModalOpen && activeApplicant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={() => setRejectModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-dark-card rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full border-2 border-black dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                                        <XCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-black dark:text-white">Reject Application</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Candidate: <span className="font-bold text-black dark:text-white">{activeApplicant.name}</span></p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setRejectModalOpen(false)}
                                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-black dark:hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                                <p className="font-bold flex items-center gap-1.5 mb-1">
                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" /> Optional Constructive Feedback:
                                </p>
                                <p className="text-[11px] leading-relaxed">
                                    Giving specific feedback helps candidates understand where to skill up. You can write custom advice below, click quick suggestions, or directly reject without a note.
                                </p>
                            </div>

                            {/* Quick Suggestion Chips */}
                            <div className="mb-3">
                                <label className="text-[11px] font-black uppercase text-gray-400 mb-1.5 block">Quick Feedback Templates:</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        "Needs deeper experience with React & modern frontend frameworks",
                                        "Strengthen backend API integration & database fundamentals",
                                        "Portfolio lacks live deployed projects with real user interactions",
                                        "Role requirements prioritize higher production experience"
                                    ].map((chip, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setRejectionFeedback(chip)}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-950/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors text-left"
                                        >
                                            + {chip}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-1.5 block">
                                    Feedback Note (Optional):
                                </label>
                                <textarea
                                    rows={3}
                                    value={rejectionFeedback}
                                    onChange={(e) => setRejectionFeedback(e.target.value)}
                                    placeholder="e.g. Thank you for your interest! We recommend strengthening practical experience in state management and testing before re-applying..."
                                    className="w-full p-3 rounded-xl border-2 border-black dark:border-gray-700 bg-white dark:bg-dark-input text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-rose-500 resize-none font-sans"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setRejectModalOpen(false)}
                                    className="w-full sm:w-auto !text-xs !py-2"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleApplicantAction('reject', '')}
                                    className="w-full sm:w-auto !text-xs !py-2 !border-rose-300 hover:!bg-rose-50 dark:hover:!bg-rose-950/30 text-rose-600"
                                    disabled={actionLoading}
                                >
                                    Direct Reject
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleApplicantAction('reject', rejectionFeedback)}
                                    className="w-full sm:w-auto !text-xs !py-2 !bg-rose-600 hover:!bg-rose-700 !text-white !border-black"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Saving...' : 'Send Feedback & Reject'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interview Details Modal */}
            <AnimatePresence>
                {interviewModalOpen && activeApplicant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={() => setInterviewModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-dark-card rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full border-2 border-black dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                                        <PhoneCall className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-black dark:text-white">Call for Interview</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Candidate: <span className="font-bold text-black dark:text-white">{activeApplicant.name}</span></p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setInterviewModalOpen(false)}
                                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-black dark:hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                                <p className="font-bold flex items-center gap-1.5 mb-1">
                                    <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Candidate Shortlisting:
                                </p>
                                <p className="text-[11px] leading-relaxed">
                                    Calling this candidate for an interview will immediately notify them on their student dashboard with your invitation and any interview details or meeting link you specify.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-1.5 block">
                                    Interview Details / Meeting Link (Optional):
                                </label>
                                <textarea
                                    rows={3}
                                    value={interviewDetails}
                                    onChange={(e) => setInterviewDetails(e.target.value)}
                                    placeholder="e.g. Technical Round 1 via Google Meet. Link: meet.google.com/abc-defg-hij on Friday at 3:00 PM."
                                    className="w-full p-3 rounded-xl border-2 border-black dark:border-gray-700 bg-white dark:bg-dark-input text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 resize-none font-sans"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setInterviewModalOpen(false)}
                                    className="w-full sm:w-auto !text-xs !py-2"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleApplicantAction('interview', interviewDetails)}
                                    className="w-full sm:w-auto !text-xs !py-2 !bg-emerald-600 hover:!bg-emerald-700 !text-white !border-black flex items-center justify-center gap-1.5"
                                    disabled={actionLoading}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    {actionLoading ? 'Sending...' : 'Confirm & Call for Interview'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClientDashboard;
