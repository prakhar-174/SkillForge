import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import ProctorWrapper from '../../components/assessment/ProctorWrapper';
import ThemeToggle from '../../components/layout/ThemeToggle';
import Button from '../../components/ui/Button';
import {
    CheckCircle,
    Clock,
    ArrowRight,
    ArrowLeft,
    Shield,
    Globe,
    Server,
    Layers,
    Smartphone,
    Cpu,
    Cloud,
    Palette,
    Lock,
    Award,
    RotateCcw,
    Sparkles,
    Check
} from 'lucide-react';

const DOMAIN_OPTIONS = [
    {
        id: "Frontend Development",
        name: "Frontend Development",
        icon: Globe,
        color: "text-blue-500",
        borderColor: "border-blue-500",
        bgLight: "bg-blue-50 dark:bg-blue-950/30",
        description: "React, Next.js, Vue, TypeScript, Tailwind CSS, Web Performance & UI Architecture"
    },
    {
        id: "Backend Development",
        name: "Backend Development",
        icon: Server,
        color: "text-emerald-500",
        borderColor: "border-emerald-500",
        bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
        description: "Node.js, Python, Django, FastAPI, Databases, REST/GraphQL APIs & Scalability"
    },
    {
        id: "Full Stack Development",
        name: "Full Stack Development",
        icon: Layers,
        color: "text-purple-500",
        borderColor: "border-purple-500",
        bgLight: "bg-purple-50 dark:bg-purple-950/30",
        description: "End-to-End System Design, Client-Server State, Auth, DB Modeling & Deployments"
    },
    {
        id: "Mobile App Development",
        name: "Mobile App Development",
        icon: Smartphone,
        color: "text-cyan-500",
        borderColor: "border-cyan-500",
        bgLight: "bg-cyan-50 dark:bg-cyan-950/30",
        description: "React Native, Flutter, Swift/iOS, Kotlin/Android, Offline Sync & Native Modules"
    },
    {
        id: "AI / Machine Learning & Data Science",
        name: "AI & Data Science",
        icon: Cpu,
        color: "text-pink-500",
        borderColor: "border-pink-500",
        bgLight: "bg-pink-50 dark:bg-pink-950/30",
        description: "Python, PyTorch, Pandas, Scikit-learn, LLMs, RAG Pipelines & Model Optimization"
    },
    {
        id: "DevOps & Cloud Engineering",
        name: "DevOps & Cloud",
        icon: Cloud,
        color: "text-amber-500",
        borderColor: "border-amber-500",
        bgLight: "bg-amber-50 dark:bg-amber-950/30",
        description: "Docker, Kubernetes, AWS/GCP, CI/CD Pipelines, Terraform & Infrastructure as Code"
    },
    {
        id: "UI/UX Design & Product",
        name: "UI/UX & Product Design",
        icon: Palette,
        color: "text-indigo-500",
        borderColor: "border-indigo-500",
        bgLight: "bg-indigo-50 dark:bg-indigo-950/30",
        description: "Design Systems, Figma Tokens, Usability Testing, Wireframing & WCAG Accessibility"
    },
    {
        id: "Cybersecurity",
        name: "Cybersecurity",
        icon: Lock,
        color: "text-red-500",
        borderColor: "border-red-500",
        bgLight: "bg-red-50 dark:bg-red-950/30",
        description: "AppSec, OWASP Top 10, Auth & JWT Security, Vulnerability Scanning & Cryptography"
    }
];

// Helper to strip accidental prefixes like "A) ", "B. ", "(C) " from options
const cleanOptionText = (text) => {
    if (typeof text !== 'string') return String(text || '');
    return text.replace(/^[\(\[]?[A-Da-d][\)\]\.\:\-]\s*/, '').trim();
};

const AssessmentPage = () => {
    const { tokens } = useAuthStore();
    const navigate = useNavigate();

    // Flow State: 'select_domain' | 'generating' | 'exam' | 'completed'
    const [phase, setPhase] = useState('select_domain');
    const [profile, setProfile] = useState(null);
    const [selectedDomain, setSelectedDomain] = useState("Frontend Development");
    const [focusSkills, setFocusSkills] = useState("");

    // Exam State
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [sessionId, setSessionId] = useState(null);
    const [attemptId, setAttemptId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
    const [testResult, setTestResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch student profile on mount to pre-select domain and skills
    useEffect(() => {
        const fetchStudentProfile = async () => {
            if (!tokens?.access) return;
            try {
                const res = await fetch('http://localhost:8000/api/accounts/profile/', {
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    if (data.skills) {
                        setFocusSkills(data.skills);
                        // Auto-match domain if possible
                        const skillsLower = data.skills.toLowerCase();
                        if (skillsLower.includes('python') && (skillsLower.includes('django') || skillsLower.includes('fastapi') || skillsLower.includes('backend'))) {
                            setSelectedDomain("Backend Development");
                        } else if (skillsLower.includes('machine') || skillsLower.includes('ai') || skillsLower.includes('torch')) {
                            setSelectedDomain("AI / Machine Learning & Data Science");
                        } else if (skillsLower.includes('docker') || skillsLower.includes('kubernetes') || skillsLower.includes('cloud')) {
                            setSelectedDomain("DevOps & Cloud Engineering");
                        } else if (skillsLower.includes('flutter') || skillsLower.includes('native') || skillsLower.includes('ios') || skillsLower.includes('android')) {
                            setSelectedDomain("Mobile App Development");
                        } else if (skillsLower.includes('figma') || skillsLower.includes('design') || skillsLower.includes('ui/ux')) {
                            setSelectedDomain("UI/UX Design & Product");
                        } else {
                            setSelectedDomain("Frontend Development");
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };
        fetchStudentProfile();
    }, [tokens]);

    // Timer Logic for active exam
    useEffect(() => {
        if (phase !== 'exam' || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    submitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Step 1: Start Test & Request Permissions
    const handleStartAssessment = async () => {
        // Step A: Request camera permission
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Camera permission denied", err);
            alert("Camera access is strictly required for technical assessment proctoring. Please enable camera access in your browser.");
            return;
        }

        // Step B: Enter Fullscreen
        const elem = document.documentElement;
        const requestFS = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
        if (requestFS) {
            try {
                await requestFS.call(elem);
            } catch (err) {
                console.warn("Fullscreen permission note:", err);
            }
        }

        // Step C: Generate randomized test
        setPhase('generating');
        try {
            const res = await fetch('http://localhost:8000/api/verification/generate-test/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens?.access}`
                },
                body: JSON.stringify({
                    domain: selectedDomain,
                    skills: focusSkills
                })
            });

            if (res.ok) {
                const data = await res.json();
                setAttemptId(data.attempt_id);
                setSessionId(data.session_id);
                if (data.questions && data.questions.length > 0) {
                    setQuestions(data.questions);
                    setCurrentQuestion(0);
                    setAnswers({});
                    setTimeLeft(1800);
                    setPhase('exam');
                } else {
                    alert("Failed to generate questions. Please retry.");
                    setPhase('select_domain');
                }
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.error || "Failed to initialize test.");
                setPhase('select_domain');
            }
        } catch (err) {
            console.error(err);
            alert("Network error connecting to verification engine.");
            setPhase('select_domain');
        }
    };

    // Handle Option Selection
    const handleAnswerSelect = (optionIdx) => {
        const optionLetter = String.fromCharCode(65 + optionIdx); // 'A', 'B', 'C', 'D'
        setAnswers(prev => ({
            ...prev,
            [currentQuestion]: optionLetter
        }));
    };

    // Next / Prev Questions
    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(curr => curr + 1);
        } else {
            submitExam();
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(curr => curr - 1);
        }
    };

    // Submit Exam
    const submitExam = async () => {
        if (submitting) return;
        setSubmitting(true);

        // Convert answers map to ordered letter array
        const answersList = questions.map((_, idx) => answers[idx] || null);

        try {
            const res = await fetch('http://localhost:8000/api/verification/submit-test/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens?.access}`
                },
                body: JSON.stringify({
                    attempt_id: attemptId,
                    answers: answersList
                })
            });

            if (res.ok) {
                const data = await res.json();
                setTestResult(data);
                setPhase('completed');
            } else {
                alert("Failed to submit assessment. Please retry.");
            }
        } catch (err) {
            console.error("Submission failed", err);
            alert("Network error submitting test.");
        } finally {
            setSubmitting(false);
        }
    };

    // Proctor violation logging
    const logEvent = async (eventType) => {
        if (!sessionId) return;
        try {
            await fetch('http://localhost:8000/api/proctor/events/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens?.access}`
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    event_type: eventType,
                    confidence: 1.0
                })
            });
        } catch (e) { console.error("Log failed", e); }
    };

    const handleDisqualify = () => {
        logEvent("disqualified");
        alert("Disqualified due to security violations.");
        navigate('/student/dashboard');
    };

    const handleWarning = (msg) => {
        console.warn("Proctor warning:", msg);
        logEvent("violation_warning");
    };

    // -------------------------------------------------------------
    // VIEW 1: DOMAIN SELECTION SCREEN
    // -------------------------------------------------------------
    if (phase === 'select_domain') {
        return (
            <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-border dark:text-white p-6 md:p-12 transition-colors duration-300">
                {/* Top Nav */}
                <header className="max-w-5xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-stone-200 dark:border-gray-800">
                    <Button
                        onClick={() => navigate('/student/dashboard')}
                        variant="secondary"
                        className="!text-xs !py-2 !px-4 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                    </div>
                </header>

                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-black uppercase tracking-wider mb-4 border border-orange-300 dark:border-orange-800">
                            <Sparkles className="w-4 h-4" /> Phase 2: Technical Verification
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter text-light-border dark:text-white">
                            Select Your <span className="text-orange-500">Tech Domain</span>
                        </h1>
                        <p className="text-stone-600 dark:text-gray-400 text-sm md:text-base max-w-xl mx-auto font-medium">
                            Choose your specialization. SkillForge AI will dynamically generate a unique, non-repeating scenario-based technical exam tailored to your skills.
                        </p>
                    </div>

                    {/* Domain Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {DOMAIN_OPTIONS.map((domain) => {
                            const IconComponent = domain.icon;
                            const isSelected = selectedDomain === domain.id;

                            return (
                                <button
                                    key={domain.id}
                                    type="button"
                                    onClick={() => setSelectedDomain(domain.id)}
                                    className={`p-5 rounded-3xl border-2 text-left transition-all relative flex flex-col justify-between ${
                                        isSelected
                                            ? 'bg-white dark:bg-dark-card border-black dark:border-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.2)] scale-[1.02]'
                                            : 'bg-white/80 dark:bg-dark-card/60 border-stone-200 dark:border-gray-800 hover:border-black dark:hover:border-gray-600'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow">
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        </div>
                                    )}
                                    <div>
                                        <div className={`w-12 h-12 rounded-2xl ${domain.bgLight} flex items-center justify-center mb-4 border border-stone-200 dark:border-gray-700`}>
                                            <IconComponent className={`w-6 h-6 ${domain.color}`} />
                                        </div>
                                        <h3 className="text-base font-black text-light-border dark:text-white mb-1.5 leading-snug">
                                            {domain.name}
                                        </h3>
                                        <p className="text-xs text-stone-500 dark:text-gray-400 leading-relaxed font-medium">
                                            {domain.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Skill Customization & Summary Card */}
                    <div className="bg-white dark:bg-dark-card rounded-[2.5rem] border-2 border-black dark:border-gray-700 p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-none mb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div>
                                <label className="block text-xs font-black uppercase text-stone-500 dark:text-gray-400 mb-2">
                                    Target Focus Skills (Optional customization)
                                </label>
                                <input
                                    type="text"
                                    value={focusSkills}
                                    onChange={(e) => setFocusSkills(e.target.value)}
                                    placeholder="e.g. React, Next.js, TypeScript, Tailwind"
                                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-gray-800 border-2 border-stone-300 dark:border-gray-700 font-bold text-sm text-light-border dark:text-white focus:outline-none focus:border-black dark:focus:border-orange-500 transition-colors"
                                />
                                <p className="text-xs text-stone-500 dark:text-gray-400 mt-2 font-medium">
                                    Loaded from your profile. Questions will adapt to these specific technologies.
                                </p>
                            </div>

                            <div className="bg-stone-50 dark:bg-gray-800/80 rounded-2xl p-5 border border-stone-200 dark:border-gray-700 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-stone-500 dark:text-gray-400">Selected Domain:</span>
                                    <span className="text-orange-500 font-black">{selectedDomain}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-stone-500 dark:text-gray-400">Question Format:</span>
                                    <span className="text-light-border dark:text-white">5 Scenario-Based MCQs</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-stone-500 dark:text-gray-400">Time Limit:</span>
                                    <span className="text-light-border dark:text-white">30 Minutes</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-stone-500 dark:text-gray-400">Proctoring:</span>
                                    <span className="text-emerald-500 font-black flex items-center gap-1">
                                        <Shield className="w-3.5 h-3.5" /> Fullscreen & Camera
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-stone-100 dark:border-gray-800">
                            <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">
                                By starting, you consent to camera monitoring and anti-cheating fullscreen enforcement.
                            </p>
                            <Button
                                onClick={handleStartAssessment}
                                className="w-full sm:w-auto px-10 py-4 text-base font-black !bg-orange-500 hover:!bg-orange-600 !text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Generate & Start Assessment <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // VIEW 2: LOADING / GENERATING STATE
    // -------------------------------------------------------------
    if (phase === 'generating') {
        return (
            <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-border dark:text-white flex flex-col items-center justify-center p-8 text-center transition-colors duration-300">
                <div className="max-w-md w-full bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-[2.5rem] p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-none flex flex-col items-center">
                    <div className="w-16 h-16 rounded-3xl bg-orange-500 text-white flex items-center justify-center shadow-lg mb-6 animate-spin">
                        <RotateCcw className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 text-light-border dark:text-white">
                        Forging Your Assessment
                    </h2>
                    <p className="text-stone-500 dark:text-gray-400 text-sm mb-6 font-medium">
                        SkillForge AI is generating 5 randomized real-world scenario questions for <span className="font-bold text-orange-500">{selectedDomain}</span>...
                    </p>
                    <div className="w-full bg-stone-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden border border-stone-200 dark:border-gray-700">
                        <div className="h-full bg-orange-500 rounded-full animate-pulse w-3/4" />
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // VIEW 3: COMPLETED RESULTS SCREEN
    // -------------------------------------------------------------
    if (phase === 'completed' && testResult) {
        const passed = testResult.passed;
        const percentage = testResult.percentage || 0;
        const score = testResult.score || 0;
        const total = testResult.total || 5;

        return (
            <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-border dark:text-white flex flex-col items-center justify-center p-6 md:p-12 transition-colors duration-300">
                <div className="max-w-xl w-full bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-[3rem] p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-none text-center">
                    <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl ${
                        passed ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
                    }`}>
                        <Award className="w-10 h-10" />
                    </div>

                    <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-3 bg-stone-100 dark:bg-gray-800 border border-stone-300 dark:border-gray-700">
                        {selectedDomain} Assessment
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-light-border dark:text-white">
                        {passed ? 'Verification Passed! 🎉' : 'Assessment Completed'}
                    </h1>
                    <p className="text-stone-600 dark:text-gray-400 text-sm mb-6 font-medium">
                        {passed
                            ? 'Your technical domain competence has been evaluated and verified on your student dashboard.'
                            : 'Good effort! Review the recommendation areas and retry when ready to elevate your score.'}
                    </p>

                    {/* Score Highlight Box */}
                    <div className="bg-stone-50 dark:bg-gray-800/80 rounded-2xl p-6 border-2 border-stone-200 dark:border-gray-700 mb-6">
                        <div className="text-5xl font-black text-light-border dark:text-white mb-1">
                            {percentage.toFixed(0)}%
                        </div>
                        <p className="text-xs font-bold uppercase text-stone-500 dark:text-gray-400">
                            {score} of {total} Questions Correct
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase text-white shadow-sm" style={{
                            backgroundColor: passed ? '#10B981' : '#F59E0B'
                        }}>
                            {passed ? '✓ Status: Verified Talent' : '! Status: Needs Improvement'}
                        </div>
                    </div>

                    <Button
                        onClick={() => navigate('/student/dashboard')}
                        className="w-full py-4 text-lg font-black !bg-black !text-white dark:!bg-white dark:!text-black hover:scale-105 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // VIEW 4: PROCTORED ACTIVE EXAM
    // -------------------------------------------------------------
    const currentQ = questions[currentQuestion];
    const selectedAnswer = answers[currentQuestion];

    return (
        <ProctorWrapper onDisqualify={handleDisqualify} onWarning={handleWarning}>
            <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-border dark:text-white p-4 md:p-8 flex flex-col justify-between transition-colors duration-300">
                {/* Top Nav Bar */}
                <header className="max-w-4xl w-full mx-auto flex items-center justify-between mb-6 pb-4 border-b border-stone-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 text-xs font-black uppercase tracking-wider border border-orange-300 dark:border-orange-800">
                            {selectedDomain}
                        </span>
                        <span className="text-xs font-extrabold text-stone-500 dark:text-gray-400">
                            Question {currentQuestion + 1} of {questions.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-stone-900 text-orange-400 px-4 py-1.5 rounded-full font-mono font-bold text-sm shadow-md border border-stone-700">
                            <Clock className="w-4 h-4 text-orange-400 animate-pulse" />
                            {formatTime(timeLeft)}
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                {/* Question & Options Area */}
                <main className="max-w-4xl w-full mx-auto my-auto py-4">
                    {currentQ && (
                        <motion.div
                            key={currentQuestion}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-[2.5rem] p-6 md:p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                        >
                            {/* Question meta */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs uppercase font-black px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-gray-800 text-stone-600 dark:text-gray-300 border border-stone-300 dark:border-gray-700">
                                    Difficulty: {currentQ.difficulty || 'Medium'}
                                </span>
                                <span className="text-xs uppercase font-black px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-gray-800 text-stone-600 dark:text-gray-300 border border-stone-300 dark:border-gray-700">
                                    Type: {currentQ.type || 'Practical Scenario'}
                                </span>
                            </div>

                            {/* Question text */}
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-light-border dark:text-white mb-8 leading-snug">
                                {currentQ.question || currentQ.text}
                            </h2>

                            {/* Options */}
                            <div className="grid grid-cols-1 gap-3.5">
                                {(currentQ.options || []).map((rawOption, idx) => {
                                    const optionLetter = String.fromCharCode(65 + idx);
                                    const isChosen = selectedAnswer === optionLetter;
                                    const cleanText = cleanOptionText(rawOption);

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAnswerSelect(idx)}
                                            className={`p-4 md:p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                                                isChosen
                                                    ? 'bg-orange-500 text-white border-black dark:border-orange-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] scale-[1.01]'
                                                    : 'bg-stone-50 dark:bg-gray-800/80 border-stone-200 dark:border-gray-700 text-stone-800 dark:text-gray-100 hover:border-black dark:hover:border-gray-400 hover:bg-stone-100 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                                                isChosen
                                                    ? 'bg-white text-orange-600 border-white'
                                                    : 'bg-white dark:bg-gray-900 border-stone-300 dark:border-gray-600 text-stone-700 dark:text-gray-300'
                                            }`}>
                                                {optionLetter}
                                            </span>
                                            <span className="text-sm md:text-base font-medium pt-0.5 leading-relaxed">
                                                {cleanText}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </main>

                {/* Bottom Navigation Controls */}
                <footer className="max-w-4xl w-full mx-auto flex items-center justify-between pt-6 pb-20 border-t border-stone-200 dark:border-gray-800">
                    <Button
                        onClick={handlePrev}
                        disabled={currentQuestion === 0}
                        variant="secondary"
                        className={`!text-sm !py-2.5 !px-5 flex items-center gap-1.5 ${
                            currentQuestion === 0 ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                    >
                        <ArrowLeft className="w-4 h-4" /> Previous
                    </Button>

                    {/* Question Dots */}
                    <div className="flex items-center gap-2">
                        {questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentQuestion(i)}
                                className={`w-3 h-3 rounded-full transition-all ${
                                    currentQuestion === i
                                        ? 'w-8 bg-orange-500'
                                        : answers[i]
                                        ? 'bg-stone-800 dark:bg-white'
                                        : 'bg-stone-300 dark:bg-gray-700'
                                }`}
                                title={`Question ${i + 1}`}
                            />
                        ))}
                    </div>

                    <Button
                        onClick={handleNext}
                        disabled={submitting}
                        className="!text-sm !py-2.5 !px-6 !bg-orange-500 hover:!bg-orange-600 !text-white font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
                    >
                        {currentQuestion === questions.length - 1
                            ? (submitting ? 'Submitting...' : 'Submit Assessment')
                            : 'Next Question'}
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </footer>
            </div>
        </ProctorWrapper>
    );
};

export default AssessmentPage;