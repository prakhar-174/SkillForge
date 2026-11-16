import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/layout/ThemeToggle';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import ProctorWrapper from '../../components/assessment/ProctorWrapper';

const PersonalityTest = () => {
    const { tokens } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/verification/personality/questions/', {
                    headers: { 'Authorization': `Bearer ${tokens?.access}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setQuestions(data);
                }
            } catch (error) { console.error("Failed to load questions", error); }
            finally { setLoading(false); }
        };
        fetchQuestions();
    }, [tokens]);

    const startTest = async () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            try { await elem.requestFullscreen(); } catch (e) { }
        }
        setStarted(true);
    };

    const handleOptionSelect = (qId, value) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await fetch('http://localhost:8000/api/verification/personality/submit/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens?.access}`
                },
                body: JSON.stringify({ answers })
            });
            if (response.ok) {
                navigate('/student/dashboard');
            } else {
                alert("Submission failed. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("Network error submitting assessment.");
        } finally {
            setSubmitting(false);
        }
    };

    const answeredCount = Object.keys(answers).length;
    const allAnswered = questions.length > 0 && answeredCount >= questions.length;

    if (loading) {
        return (
            <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-border dark:text-white flex items-center justify-center font-bold text-xl">
                Loading Archetype Assessment...
            </div>
        );
    }

    if (!started) {
        return (
            <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-border dark:text-white flex flex-col justify-between p-6 md:p-12 transition-colors duration-300">
                {/* Header */}
                <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
                    <Button
                        onClick={() => navigate('/student/dashboard')}
                        variant="secondary"
                        className="!text-xs !py-2 !px-4 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit to Dashboard
                    </Button>
                    <ThemeToggle />
                </div>

                {/* Intro Card */}
                <div className="max-w-2xl w-full mx-auto text-center my-auto py-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black uppercase tracking-wider mb-6 border border-purple-300 dark:border-purple-800">
                        <Sparkles className="w-4 h-4" /> Phase 1 Assessment
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-light-border dark:text-white">
                        Personality <span className="text-purple-600 dark:text-purple-400">Archetype</span>
                    </h1>
                    <p className="text-stone-600 dark:text-gray-400 text-base md:text-lg mb-8 max-w-lg mx-auto font-medium">
                        Discover your unique engineering mindset, work dynamics, and leadership tendencies to unlock tailored opportunities.
                    </p>

                    <div className="bg-white dark:bg-dark-card p-6 md:p-8 rounded-[2.5rem] border-2 border-black dark:border-gray-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-none mb-8 text-left space-y-4">
                        <h3 className="text-lg font-black flex items-center gap-2 text-light-border dark:text-white">
                            <ShieldCheck className="text-green-500 w-5 h-5" /> Test Guidelines
                        </h3>
                        <ul className="space-y-3 text-sm text-stone-600 dark:text-gray-300 font-medium">
                            <li className="flex items-center gap-2.5">
                                <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                <span>{questions.length || 7} thoughtful situational questions.</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                <span>Fullscreen mode & camera proctoring will be active.</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                <span>Answer intuitively — there are no "wrong" answers.</span>
                            </li>
                        </ul>
                    </div>

                    <Button
                        onClick={startTest}
                        className="px-10 py-4 text-lg md:text-xl !bg-purple-600 !text-white hover:!bg-purple-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                        Begin Assessment <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>

                <div className="text-center text-xs text-stone-400 dark:text-gray-500 font-bold">
                    SkillForge AI Verification System &bull; Secure Environment
                </div>
            </div>
        );
    }

    return (
        <ProctorWrapper onDisqualify={() => { }} onWarning={() => { }}>
            <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas text-light-border dark:text-white p-6 md:p-12 transition-colors duration-300">
                {/* Top Nav Bar */}
                <div className="max-w-4xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-stone-200 dark:border-gray-800">
                    <Button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to exit? Your answers will not be saved.")) {
                                navigate('/student/dashboard');
                            }
                        }}
                        variant="secondary"
                        className="!text-xs !py-1.5 !px-3.5 flex items-center gap-1.5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Button>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-black uppercase text-purple-600 dark:text-purple-400">
                            {answeredCount} of {questions.length} Answered
                        </div>
                        <div className="w-28 md:w-36 h-2.5 bg-stone-200 dark:bg-gray-800 rounded-full overflow-hidden border border-stone-300 dark:border-gray-700">
                            <div
                                className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                                style={{ width: `${(answeredCount / (questions.length || 1)) * 100}%` }}
                            />
                        </div>
                    </div>

                    <ThemeToggle />
                </div>

                <header className="mb-10 max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter text-light-border dark:text-white">
                        Personality Archetype <Sparkles className="w-8 h-8 inline text-purple-500 animate-pulse" />
                    </h1>
                    <p className="text-sm md:text-base text-stone-600 dark:text-gray-400 font-medium">
                        Select the response that best matches your instinctual approach.
                    </p>
                </header>

                <div className="max-w-4xl mx-auto space-y-8">
                    {questions.map((q, idx) => {
                        const qId = q.id || idx + 1;
                        const currentAnswer = answers[qId];

                        return (
                            <motion.div
                                key={qId}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-dark-card border-2 border-black dark:border-gray-700 rounded-[2rem] p-6 md:p-8 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                            >
                                <div className="flex items-center gap-2.5 mb-3">
                                    <span className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center border border-purple-300 dark:border-purple-800">
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs uppercase font-extrabold tracking-wider text-purple-600 dark:text-purple-400">
                                        Question {idx + 1}
                                    </span>
                                </div>

                                <h3 className="text-lg md:text-xl font-black text-light-border dark:text-white mb-6 leading-snug">
                                    {q.question}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {(q.options ? Object.entries(q.options) : [
                                        ['Strongly Disagree', 1],
                                        ['Disagree', 2],
                                        ['Neutral', 3],
                                        ['Agree', 4],
                                        ['Strongly Agree', 5]
                                    ]).map((opt, i) => {
                                        const label = Array.isArray(opt) ? opt[0] : opt;
                                        const val = label;
                                        const isSelected = currentAnswer === val;

                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleOptionSelect(qId, val)}
                                                className={`p-4 rounded-2xl border-2 font-bold transition-all text-left flex items-center justify-between text-sm md:text-base ${
                                                    isSelected
                                                        ? 'bg-purple-600 text-white border-black dark:border-purple-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-none scale-[1.01]'
                                                        : 'bg-stone-50 dark:bg-gray-800/80 border-stone-300 dark:border-gray-700 text-stone-800 dark:text-gray-100 hover:border-black dark:hover:border-gray-400 hover:bg-stone-100 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                <span>{label}</span>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-colors ${
                                                    isSelected
                                                        ? 'border-white bg-white text-purple-600'
                                                        : 'border-stone-400 dark:border-gray-500'
                                                }`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Bottom Action */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-28">
                        <div className="text-xs font-bold text-stone-500 dark:text-gray-400">
                            {allAnswered ? 'All questions answered! Ready to submit.' : `Please complete all questions (${answeredCount}/${questions.length})`}
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`px-10 py-4 text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 ${
                                allAnswered
                                    ? '!bg-purple-600 hover:!bg-purple-700 !text-white'
                                    : '!bg-stone-300 dark:!bg-gray-700 !text-stone-500 dark:!text-gray-400 !border-stone-400 dark:!border-gray-600 cursor-not-allowed'
                            }`}
                        >
                            {submitting ? 'Submitting...' : 'Submit Analysis'} <ArrowRight className="w-5 h-5 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </ProctorWrapper>
    );
};

export default PersonalityTest;
