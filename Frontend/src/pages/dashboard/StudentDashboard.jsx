import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../../components/layout/ThemeToggle';
import {
    LogOut,
    BookOpen,
    Target,
    Award,
    Play,
    ChevronRight,
    Briefcase,
    User,
    Star,
    X,
    MapPin,
    DollarSign,
    Send,
    CheckCircle,
    Github,
    Linkedin,
    ExternalLink,
    Flame,
    Trophy,
    Zap,
    Crown,
    Medal,
    Sparkles,
    Globe,
    Bell,
    Calendar,
    MessageSquare,
    CheckCheck,
    AlertCircle,
    Clock,
    Lightbulb,
    PhoneCall
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const { logout, user, tokens } = useAuthStore();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [recommendation, setRecommendation] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [applyingTo, setApplyingTo] = useState(null);

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Leaderboard state
    const [leaderboardCriteria, setLeaderboardCriteria] = useState('overall');
    const [leaderboardDomain, setLeaderboardDomain] = useState('Frontend Development');
    const [leaderboardData, setLeaderboardData] = useState({ rankings: [], my_stats: null, available_domains: [] });
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    useEffect(() => {
        if (user && user.onboarding_stage < 2) {
            navigate('/student/onboarding');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            if (!tokens?.access) return;
            // Fetch Profile
            try {
                const res = await fetch('http://localhost:8000/api/accounts/profile/', {
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
                if (res.ok) {
                    const profData = await res.json();
                    setProfile(profData);
                    if (profData.primary_domain) {
                        setLeaderboardDomain(profData.primary_domain);
                    }
                }
            } catch (e) { console.error(e); }

            // Fetch Recommendation
            try {
                const res = await fetch('http://localhost:8000/api/verification/recommendation/', {
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'ready' && data.recommendation) {
                        try {
                            const recData = typeof data.recommendation === 'string'
                                ? JSON.parse(data.recommendation)
                                : data.recommendation;
                            setRecommendation({
                                status: 'ready',
                                star_rating: recData.star_rating,
                                strengths: recData.strengths,
                                weaknesses: recData.weaknesses,
                                recommended_tags: recData.recommended_tags,
                                personality_score: data.personality_score,
                                skill_score: data.skill_score,
                                stage: data.stage
                            });
                        } catch (parseErr) {
                            console.error('Failed to parse recommendation:', parseErr);
                            setRecommendation(data);
                        }
                    } else {
                        setRecommendation(data);
                    }
                }
            } catch (e) { console.error(e); }

            // Fetch My Applications
            try {
                const res = await fetch('http://localhost:8000/api/project/my-applications/', {
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
                if (res.ok) setMyApplications(await res.json());
            } catch (e) { console.error(e); }

            // Fetch Notifications
            try {
                const res = await fetch('http://localhost:8000/api/project/notifications/', {
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unread_count || 0);
                }
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, [tokens]);

    const fetchNotifications = async () => {
        if (!tokens?.access) return;
        try {
            const res = await fetch('http://localhost:8000/api/project/notifications/', {
                headers: { 'Authorization': `Bearer ${tokens.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (e) { console.error(e); }
    };

    const markAllNotificationsRead = async () => {
        if (!tokens?.access) return;
        try {
            const res = await fetch('http://localhost:8000/api/project/notifications/read/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens.access}`
                },
                body: JSON.stringify({})
            });
            if (res.ok) {
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }
        } catch (e) { console.error(e); }
    };

    const markSingleNotificationRead = async (notificationId) => {
        if (!tokens?.access) return;
        try {
            const res = await fetch('http://localhost:8000/api/project/notifications/read/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens.access}`
                },
                body: JSON.stringify({ notification_id: notificationId })
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (e) { console.error(e); }
    };

    // Fetch Leaderboard
    const fetchLeaderboard = async (criteria = leaderboardCriteria, domain = leaderboardDomain) => {
        if (!tokens?.access) return;
        setLeaderboardLoading(true);
        try {
            const url = `http://localhost:8000/api/verification/leaderboard/?criteria=${criteria}&domain=${encodeURIComponent(domain)}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${tokens.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLeaderboardData(data);
            }
        } catch (e) {
            console.error('Failed to fetch leaderboard:', e);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(leaderboardCriteria, leaderboardDomain);
    }, [tokens, leaderboardCriteria, leaderboardDomain]);

    const fetchJobs = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/project/jobs/', {
                headers: { 'Authorization': `Bearer ${tokens.access}` }
            });
            if (res.ok) setJobs(await res.json());
        } catch (e) { console.error(e); }
    };

    const openBrowseJobs = () => {
        fetchJobs();
        setIsJobModalOpen(true);
    };

    const handleApply = async (jobId) => {
        setApplyingTo(jobId);
        try {
            const res = await fetch('http://localhost:8000/api/project/apply/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens.access}`
                },
                body: JSON.stringify({ job_id: jobId })
            });
            if (res.ok) {
                alert('Application submitted!');
                setMyApplications(prev => [...prev, { job: jobId, status: 'pending' }]);
                fetchJobs(); // Refresh to update counts
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to apply');
            }
        } catch (e) { console.error(e); }
        setApplyingTo(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const hasApplied = (jobId) => myApplications.some(app => app.job === jobId);

    return (
        <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas transition-colors duration-500 p-6 md:p-12 font-sans text-light-border dark:text-white">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                            Hello, {(profile?.full_name || user?.name || 'Candidate').split(" ")[0]}! 👋
                        </h1>
                        {/* Dynamic Streak Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/70 border-2 border-orange-500 text-orange-600 dark:text-orange-400 font-black text-xs shadow-sm hover:scale-105 transition-transform">
                            <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
                            <span>{profile?.streak || 1} DAY STREAK</span>
                        </div>
                        {profile?.points != null && profile?.points > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-black text-xs shadow-sm">
                                <Zap className="w-3.5 h-3.5 fill-purple-500 text-purple-500" />
                                <span>{profile.points} XP</span>
                            </div>
                        )}
                    </div>
                    <p className="font-script text-xl text-gray-500 dark:text-gray-400 mt-1">
                        Ready to forge your path today?
                    </p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
                    {/* Notifications Button */}
                    <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(true)}
                        className="relative p-2.5 rounded-2xl bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center text-stone-800 dark:text-stone-200"
                        title="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-rose-500 text-white font-black text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-dark-canvas animate-bounce shadow">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Action Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-[3rem] p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-none relative">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
                                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white">
                                        {profile?.full_name || 'My Profile'}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400">
                                        {profile?.email || user?.email}
                                    </p>
                                </div>
                            </div>
                            <Button onClick={() => navigate('/student/onboarding')} variant="secondary" className="!text-xs !py-1.5 !px-4 self-start sm:self-auto">
                                Update Profile
                            </Button>
                        </div>
                        {profile ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Education</label>
                                    <p className="font-bold text-lg">{profile.education || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Role</label>
                                    <p className="font-bold text-lg">{profile.experience_level || 'Aspirant'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Bio</label>
                                    <p className="font-medium text-gray-600 dark:text-gray-300">{profile.bio || 'No bio added yet.'}</p>
                                </div>
                                {profile.skills && (
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Skills</label>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {profile.skills.split(',').map((skill, i) => (
                                                <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Social / Profile Links */}
                                <div className="md:col-span-2 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3">
                                    {profile.github_url ? (
                                        <a
                                            href={profile.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors border border-neutral-300 dark:border-neutral-700"
                                        >
                                            <Github className="w-4 h-4 text-black dark:text-white" />
                                            <span>GitHub</span>
                                            <ExternalLink className="w-3 h-3 opacity-60" />
                                        </a>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
                                            <Github className="w-3.5 h-3.5" /> No GitHub linked
                                        </span>
                                    )}

                                    {profile.linkedin_url ? (
                                        <a
                                            href={profile.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors border border-blue-200 dark:border-blue-800"
                                        >
                                            <Linkedin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span>LinkedIn</span>
                                            <ExternalLink className="w-3 h-3 opacity-60" />
                                        </a>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
                                            <Linkedin className="w-3.5 h-3.5" /> No LinkedIn linked
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="italic text-gray-400">Loading profile data...</p>
                        )}
                    </div>

                    {/* Phase Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-purple-900 to-black rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl transition-transform hover:scale-[1.01]">
                            <div className="relative z-10 flex flex-col items-start h-full justify-between">
                                <div>
                                    <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3 inline-block">Phase 1</span>
                                    <h2 className="text-2xl font-black mb-2">Personality</h2>
                                    <p className="text-gray-300 mb-4 text-sm">Discover your persona.</p>
                                </div>
                                <Button onClick={() => navigate('/student/personality-test')} className="!bg-white !text-black !border-none hover:scale-105 active:scale-95 px-4 shadow-xl flex items-center gap-2 w-full justify-center text-sm">
                                    Start <Play className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-20" />
                        </div>

                        <div className="bg-gradient-to-br from-black to-gray-800 dark:from-gray-800 dark:to-black rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl transition-transform hover:scale-[1.01]">
                            <div className="relative z-10 flex flex-col items-start h-full justify-between">
                                <div>
                                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3 inline-block">Phase 2</span>
                                    <h2 className="text-2xl font-black mb-2">Skill Check</h2>
                                    <p className="text-gray-300 mb-4 text-sm">Verify your prowess.</p>
                                </div>
                                <Button onClick={() => navigate('/student/assessment')} className="!bg-orange-500 !text-white !border-none hover:scale-105 active:scale-95 px-4 shadow-xl flex items-center gap-2 w-full justify-center text-sm">
                                    Start <Play className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500 rounded-full blur-[60px] opacity-20" />
                        </div>

                        <div className="bg-gradient-to-br from-pink-600 to-purple-700 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl transition-transform hover:scale-[1.01]">
                            <div className="relative z-10 flex flex-col items-start h-full justify-between">
                                <div>
                                    <span className="bg-pink-400 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3 inline-block">Phase 3</span>
                                    <h2 className="text-2xl font-black mb-2">Upskill</h2>
                                    <p className="text-gray-300 mb-4 text-sm">AI-powered learning.</p>
                                </div>
                                <Button onClick={() => navigate('/student/upskill')} className="!bg-white !text-pink-600 !border-none hover:scale-105 active:scale-95 px-4 shadow-xl flex items-center gap-2 w-full justify-center text-sm">
                                    Learn <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="absolute right-0 top-0 w-32 h-32 bg-pink-400 rounded-full blur-[60px] opacity-20" />
                        </div>
                    </div>

                    {/* Stats Grid - 4 Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* 1. Skill Score */}
                        <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600"><Target className="w-4 h-4" /></div>
                                <h3 className="text-xs font-black uppercase text-gray-400">Skill Score</h3>
                            </div>
                            <p className="text-2xl md:text-3xl font-black">
                                {(() => {
                                    const rawScore = recommendation?.skill_score ?? profile?.skill_score ?? 0;
                                    const num = Number(rawScore);
                                    if (!isNaN(num) && num > 0) {
                                        return `${num.toFixed(0)}%`;
                                    }
                                    return '0%';
                                })()}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">Verified prowess</p>
                        </motion.div>

                        {/* 2. Daily Streak */}
                        <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-orange-100 dark:bg-orange-950/60 rounded-xl text-orange-600"><Flame className="w-4 h-4 fill-orange-500" /></div>
                                <h3 className="text-xs font-black uppercase text-gray-400">Daily Streak</h3>
                            </div>
                            <p className="text-2xl md:text-3xl font-black text-orange-500">
                                {profile?.streak || 1}d
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">Active daily login</p>
                        </motion.div>

                        {/* 3. Platform Points */}
                        <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-600"><Zap className="w-4 h-4 fill-purple-500" /></div>
                                <h3 className="text-xs font-black uppercase text-gray-400">Total XP</h3>
                            </div>
                            <p className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400">
                                {profile?.points || 150}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">Test score & streak</p>
                        </motion.div>

                        {/* 4. Applications */}
                        <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-green-100 dark:bg-green-950/60 rounded-xl text-green-600"><BookOpen className="w-4 h-4" /></div>
                                <h3 className="text-xs font-black uppercase text-gray-400">Applications</h3>
                            </div>
                            <p className="text-2xl md:text-3xl font-black">{myApplications.length}</p>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">Jobs applied to</p>
                        </motion.div>
                    </div>

                    {/* Leaderboard Section */}
                    <div className="bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-[3rem] p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                        {/* Leaderboard Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black tracking-tight text-light-border dark:text-white">
                                        Platform Leaderboard
                                    </h3>
                                    <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">
                                        Rankings determined by test scores, daily streak, and evaluated XP.
                                    </p>
                                </div>
                            </div>

                            {/* Criteria Switcher (Overall vs Domain) */}
                            <div className="flex items-center bg-stone-100 dark:bg-gray-800 p-1 rounded-2xl border border-stone-200 dark:border-gray-700 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setLeaderboardCriteria('overall')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                        leaderboardCriteria === 'overall'
                                            ? 'bg-white dark:bg-dark-card text-black dark:text-white shadow-sm border border-stone-200 dark:border-gray-700'
                                            : 'text-stone-500 hover:text-black dark:hover:text-white'
                                    }`}
                                >
                                    <Globe className="w-3.5 h-3.5" /> Overall
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLeaderboardCriteria('domain')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                        leaderboardCriteria === 'domain'
                                            ? 'bg-white dark:bg-dark-card text-black dark:text-white shadow-sm border border-stone-200 dark:border-gray-700'
                                            : 'text-stone-500 hover:text-black dark:hover:text-white'
                                    }`}
                                >
                                    <Target className="w-3.5 h-3.5 text-orange-500" /> By Domain
                                </button>
                            </div>
                        </div>

                        {/* Domain Filter Pills (When 'domain' criteria is active) */}
                        {leaderboardCriteria === 'domain' && (
                            <div className="mb-6">
                                <label className="block text-[11px] font-black uppercase text-stone-400 dark:text-gray-500 mb-2">
                                    Specialized Domain:
                                </label>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    {(leaderboardData.available_domains?.length > 0 ? leaderboardData.available_domains : [
                                        "Frontend Development",
                                        "Backend Development",
                                        "Full Stack Development",
                                        "Mobile App Development",
                                        "AI / Machine Learning & Data Science",
                                        "DevOps & Cloud Engineering",
                                        "UI/UX Design & Product",
                                        "Cybersecurity"
                                    ]).map((dom) => (
                                        <button
                                            key={dom}
                                            type="button"
                                            onClick={() => setLeaderboardDomain(dom)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                                                leaderboardDomain === dom
                                                    ? 'bg-orange-500 text-white border-black dark:border-orange-400 shadow-sm'
                                                    : 'bg-stone-50 dark:bg-gray-800 text-stone-700 dark:text-gray-300 border-stone-200 dark:border-gray-700 hover:border-black dark:hover:border-gray-500'
                                            }`}
                                        >
                                            {dom}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* User Standing Banner */}
                        {leaderboardData.my_stats && (
                            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-2 border-orange-400 dark:border-orange-500/50 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow">
                                        #{leaderboardData.my_stats.rank}
                                    </span>
                                    <div>
                                        <p className="text-xs font-black text-light-border dark:text-white">
                                            Your Standing ({leaderboardCriteria === 'domain' ? leaderboardDomain : 'Overall Platform'})
                                        </p>
                                        <p className="text-[11px] text-stone-500 dark:text-gray-400 font-medium">
                                            Log in daily and score high on assessments to rise on the leaderboard!
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs font-black">
                                    <span className="px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 text-orange-500 flex items-center gap-1">
                                        <Flame className="w-3.5 h-3.5 fill-orange-500" /> {leaderboardData.my_stats.streak || profile?.streak || 1}d Streak
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 fill-purple-500" /> {leaderboardData.my_stats.points || profile?.points || 0} XP
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Top 3 Spotlight Podium */}
                        {leaderboardData.rankings?.length >= 3 && (
                            <div className="grid grid-cols-3 gap-3 mb-6 items-end">
                                {/* 2nd Place (Silver) */}
                                {leaderboardData.rankings[1] && (
                                    <div className="bg-stone-50 dark:bg-gray-800/80 rounded-2xl p-4 text-center border-2 border-stone-300 dark:border-gray-700 relative">
                                        <div className="w-7 h-7 mx-auto rounded-full bg-stone-300 text-black font-black text-xs flex items-center justify-center mb-2 shadow">
                                            2
                                        </div>
                                        <div className="w-10 h-10 mx-auto rounded-full bg-stone-200 dark:bg-gray-700 font-black text-sm flex items-center justify-center text-stone-800 dark:text-white mb-1.5">
                                            {leaderboardData.rankings[1].avatar_initial}
                                        </div>
                                        <h4 className="text-xs font-black truncate max-w-full">
                                            {leaderboardData.rankings[1].full_name}
                                        </h4>
                                        <p className="text-[10px] text-stone-500 dark:text-gray-400 truncate">
                                            {leaderboardData.rankings[1].domain}
                                        </p>
                                        <div className="mt-2 text-xs font-black text-purple-600 dark:text-purple-400">
                                            {leaderboardData.rankings[1].points} XP
                                        </div>
                                    </div>
                                )}

                                {/* 1st Place (Gold) - Elevated */}
                                {leaderboardData.rankings[0] && (
                                    <div className="bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-gray-800 rounded-2xl p-4 text-center border-2 border-amber-400 shadow-[0_4px_12px_rgba(245,158,11,0.2)] relative -translate-y-2">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-500">
                                            <Crown className="w-6 h-6 fill-amber-400 text-amber-500 animate-bounce" />
                                        </div>
                                        <div className="w-8 h-8 mx-auto rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center mb-2 shadow mt-1">
                                            1
                                        </div>
                                        <div className="w-12 h-12 mx-auto rounded-full bg-amber-200 dark:bg-amber-900/60 font-black text-base flex items-center justify-center text-amber-900 dark:text-amber-200 mb-1.5 shadow-sm">
                                            {leaderboardData.rankings[0].avatar_initial}
                                        </div>
                                        <h4 className="text-sm font-black truncate max-w-full">
                                            {leaderboardData.rankings[0].full_name}
                                        </h4>
                                        <p className="text-[10px] text-stone-500 dark:text-gray-400 truncate">
                                            {leaderboardData.rankings[0].domain}
                                        </p>
                                        <div className="mt-2 text-sm font-black text-amber-600 dark:text-amber-400">
                                            {leaderboardData.rankings[0].points} XP
                                        </div>
                                    </div>
                                )}

                                {/* 3rd Place (Bronze) */}
                                {leaderboardData.rankings[2] && (
                                    <div className="bg-stone-50 dark:bg-gray-800/80 rounded-2xl p-4 text-center border-2 border-amber-800/30 dark:border-amber-900/50 relative">
                                        <div className="w-7 h-7 mx-auto rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center mb-2 shadow">
                                            3
                                        </div>
                                        <div className="w-10 h-10 mx-auto rounded-full bg-stone-200 dark:bg-gray-700 font-black text-sm flex items-center justify-center text-stone-800 dark:text-white mb-1.5">
                                            {leaderboardData.rankings[2].avatar_initial}
                                        </div>
                                        <h4 className="text-xs font-black truncate max-w-full">
                                            {leaderboardData.rankings[2].full_name}
                                        </h4>
                                        <p className="text-[10px] text-stone-500 dark:text-gray-400 truncate">
                                            {leaderboardData.rankings[2].domain}
                                        </p>
                                        <div className="mt-2 text-xs font-black text-purple-600 dark:text-purple-400">
                                            {leaderboardData.rankings[2].points} XP
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rankings List */}
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {leaderboardLoading ? (
                                <p className="text-center py-6 text-xs text-stone-400">Updating rankings...</p>
                            ) : leaderboardData.rankings?.length === 0 ? (
                                <p className="text-center py-6 text-xs text-stone-400">No candidates have completed assessments in this domain yet. Be the first!</p>
                            ) : (
                                leaderboardData.rankings?.map((item) => (
                                    <div
                                        key={item.user_id}
                                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                                            item.is_current_user
                                                ? 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-500 shadow-sm'
                                                : 'bg-stone-50/60 dark:bg-gray-800/50 border-stone-200 dark:border-gray-700 hover:border-black dark:hover:border-gray-500'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center ${
                                                item.rank === 1
                                                    ? 'bg-amber-400 text-black'
                                                    : item.rank === 2
                                                    ? 'bg-stone-300 text-black'
                                                    : item.rank === 3
                                                    ? 'bg-amber-700 text-white'
                                                    : 'bg-stone-200 dark:bg-gray-700 text-stone-700 dark:text-gray-300'
                                            }`}>
                                                {item.rank}
                                            </span>
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-200 to-stone-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-black text-xs text-stone-800 dark:text-white">
                                                {item.avatar_initial}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-bold text-sm leading-snug">
                                                        {item.full_name}
                                                    </p>
                                                    {item.is_current_user && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-orange-500 text-white">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-stone-500 dark:text-gray-400">
                                                    {item.domain}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs font-bold">
                                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 text-orange-500 font-extrabold text-[11px]">
                                                <Flame className="w-3 h-3 fill-orange-500" /> {item.streak}d
                                            </span>
                                            <span className="hidden sm:inline-block text-stone-600 dark:text-gray-300 font-extrabold text-xs">
                                                {item.skill_score}%
                                            </span>
                                            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-black text-xs">
                                                {item.points} XP
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Recommendation & Browse Jobs */}
                <div className="space-y-8">
                    {/* AI Recommendation Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <Award className="w-6 h-6" /> AI Recommendation
                        </h3>
                        {recommendation?.status === 'ready' ? (
                            <div className="space-y-4">
                                {/* Star Rating */}
                                <div className="flex items-center gap-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < Math.round(recommendation.star_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-white/30'}`} />
                                    ))}
                                    <span className="text-sm ml-2">{recommendation.star_rating?.toFixed(1) || '0.0'}/5</span>
                                </div>

                                {/* Stage Badge */}
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${recommendation.stage === 'verified' ? 'bg-green-500' : 'bg-orange-400'}`}>
                                        {recommendation.stage === 'verified' ? '✓ Verified' : 'Needs Improvement'}
                                    </span>
                                </div>

                                {/* Scores */}
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="bg-white/10 rounded-xl p-3">
                                        <p className="text-2xl font-black">{recommendation.personality_score || 0}</p>
                                        <p className="text-xs text-white/70">Personality</p>
                                    </div>
                                    <div className="bg-white/10 rounded-xl p-3">
                                        <p className="text-2xl font-black">{recommendation.skill_score?.toFixed(1) || '0.0'}%</p>
                                        <p className="text-xs text-white/70">Skill Test</p>
                                    </div>
                                </div>

                                {/* Strengths */}
                                {recommendation.strengths && recommendation.strengths.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase text-white/70 mb-1">Strengths</p>
                                        <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
                                            {(Array.isArray(recommendation.strengths) ? recommendation.strengths.slice(0, 3) : [recommendation.strengths]).map((s, i) => (
                                                <li key={i} className="flex items-start gap-1"><span className="text-green-300">✓</span> {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Weaknesses */}
                                {recommendation.weaknesses && recommendation.weaknesses.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase text-white/70 mb-1">Areas to Improve</p>
                                        <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
                                            {(Array.isArray(recommendation.weaknesses) ? recommendation.weaknesses.slice(0, 2) : [recommendation.weaknesses]).map((w, i) => (
                                                <li key={i} className="flex items-start gap-1"><span className="text-orange-300">!</span> {w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommended Tags */}
                                {recommendation.recommended_tags && recommendation.recommended_tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {(Array.isArray(recommendation.recommended_tags) ? recommendation.recommended_tags : []).map((tag, i) => (
                                            <span key={i} className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-white/80">{recommendation?.message || 'Complete Phase 2 Skill Test to unlock your personalized AI recommendation.'}</p>
                        )}
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-10" />
                    </div>

                    {/* My Applications */}
                    <div className="bg-white dark:bg-dark-card border-2 border-light-border dark:border-gray-700 rounded-[2.5rem] p-8">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5" /> My Applications</h3>
                        {myApplications.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {myApplications.map((app, idx) => (
                                    <div key={idx} className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-sm text-black dark:text-white">{app.job_title || `Job #${app.job}`}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{app.company_name || 'Company'}</p>
                                            </div>
                                            {app.status === 'interview' && (
                                                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shadow-sm">
                                                    <Sparkles className="w-3 h-3 text-emerald-600" /> Interview Call
                                                </span>
                                            )}
                                            {app.status === 'rejected' && (
                                                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center gap-1 shadow-sm">
                                                    <AlertCircle className="w-3 h-3 text-rose-600" /> Declined
                                                </span>
                                            )}
                                            {app.status === 'accepted' && (
                                                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 flex items-center gap-1 shadow-sm">
                                                    <CheckCircle className="w-3 h-3 text-blue-600" /> Accepted
                                                </span>
                                            )}
                                            {(!app.status || app.status === 'pending') && (
                                                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-sm">
                                                    <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                                                </span>
                                            )}
                                        </div>

                                        {/* Feedback Note from recruiter */}
                                        {app.feedback_note && (
                                            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200">
                                                <span className="font-bold flex items-center gap-1 mb-0.5 text-amber-700 dark:text-amber-400">
                                                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> Recruiter Feedback:
                                                </span>
                                                <p className="italic">"{app.feedback_note}"</p>
                                            </div>
                                        )}
                                        {app.interview_details && (
                                            <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200">
                                                <span className="font-bold flex items-center gap-1 mb-0.5 text-emerald-700 dark:text-emerald-400">
                                                    <Calendar className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Interview Details:
                                                </span>
                                                <p className="font-medium">"{app.interview_details}"</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No applications yet. Browse jobs to apply!</p>
                        )}
                        <Button onClick={openBrowseJobs} className="w-full mt-6 flex items-center justify-center gap-2 !bg-black !text-white dark:!bg-white dark:!text-black">
                            <Briefcase className="w-4 h-4" /> Browse Jobs
                        </Button>
                    </div>
                </div>
            </div>

            {/* Browse Jobs Modal */}
            <AnimatePresence>
                {isJobModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsJobModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto border-2 border-black dark:border-gray-700"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-3xl font-black">Browse Jobs</h2>
                                <button onClick={() => setIsJobModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {jobs.length === 0 ? (
                                <p className="text-center text-gray-500 py-12">No open jobs at the moment. Check back later!</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {jobs.map(job => (
                                        <div key={job.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-black dark:hover:border-white transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{job.category}</span>
                                                <span className="text-xs text-gray-500">{job.company_name}</span>
                                            </div>
                                            <h3 className="text-lg font-bold mb-2">{job.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> ${job.budget_amount}</span>
                                                <span className="flex items-center gap-1"><Target className="w-4 h-4 text-orange-500" /> {job.min_skill_score}+ Score</span>
                                            </div>
                                            {hasApplied(job.id) ? (
                                                <Button disabled className="w-full !bg-green-100 !text-green-700 !border-green-300 flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Applied
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => handleApply(job.id)}
                                                    disabled={applyingTo === job.id}
                                                    className="w-full flex items-center justify-center gap-2"
                                                >
                                                    {applyingTo === job.id ? 'Applying...' : <><Send className="w-4 h-4" /> Apply Now</>}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notifications Modal / Drawer */}
            <AnimatePresence>
                {isNotificationsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsNotificationsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-dark-card rounded-[2.5rem] p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto border-2 border-black dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-black text-black dark:text-white">Notifications</h2>
                                            {unreadCount > 0 && (
                                                <span className="text-xs font-black bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                                                    {unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-stone-500 dark:text-gray-400">
                                            Updates on your job applications and recruiter decisions
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={markAllNotificationsRead}
                                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                        >
                                            <CheckCheck className="w-4 h-4" /> Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsNotificationsOpen(false)}
                                        className="p-2 hover:bg-stone-100 dark:hover:bg-gray-800 rounded-full transition-colors text-stone-500 hover:text-black dark:hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {notifications.length === 0 ? (
                                <div className="text-center py-16">
                                    <Bell className="w-14 h-14 text-stone-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-base font-bold text-stone-700 dark:text-gray-300">All caught up!</p>
                                    <p className="text-xs text-stone-400 dark:text-gray-500 mt-1">
                                        When recruiters review your job applications, their interview calls and feedback will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => !n.is_read && markSingleNotificationRead(n.id)}
                                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                                                !n.is_read
                                                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-orange-400 dark:border-orange-500/60 shadow-sm'
                                                    : 'bg-stone-50/60 dark:bg-gray-800/40 border-stone-200 dark:border-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                                                        n.notification_type === 'interview'
                                                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600'
                                                            : n.notification_type === 'rejected'
                                                            ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600'
                                                            : 'bg-blue-100 dark:bg-blue-950/70 text-blue-600'
                                                    }`}>
                                                        {n.notification_type === 'interview' ? (
                                                            <Calendar className="w-5 h-5" />
                                                        ) : n.notification_type === 'rejected' ? (
                                                            <AlertCircle className="w-5 h-5" />
                                                        ) : (
                                                            <Bell className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="font-black text-sm text-black dark:text-white">
                                                                {n.title}
                                                            </h4>
                                                            {!n.is_read && (
                                                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                                                            <span className="font-bold text-stone-700 dark:text-gray-300">{n.company_name}</span> • {n.job_title}
                                                        </p>
                                                        <p className="text-xs text-stone-600 dark:text-gray-300 mt-2 leading-relaxed">
                                                            {n.message}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-stone-400 dark:text-gray-500 whitespace-nowrap font-mono">
                                                    {new Date(n.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Feedback Note or Interview Details */}
                                            {n.feedback_note && (
                                                <div className={`mt-3 p-3.5 rounded-xl border text-xs leading-relaxed ${
                                                    n.notification_type === 'rejected'
                                                        ? 'bg-amber-100/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                                                        : 'bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                                                }`}>
                                                    <p className="font-black flex items-center gap-1.5 mb-1">
                                                        {n.notification_type === 'rejected' ? (
                                                            <>
                                                                <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" /> Recruiter Feedback for Improvement:
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Interview Details & Instructions:
                                                            </>
                                                        )}
                                                    </p>
                                                    <p className="font-medium italic">"{n.feedback_note}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentDashboard;
