import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Camera, CheckCircle } from 'lucide-react';

const ExamView = () => {
    const { examId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const sessionId = state?.sessionId;

    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [risk, setRisk] = useState(0);
    const [loading, setLoading] = useState(true);
    const [finished, setFinished] = useState(false);

    const videoRef = useRef(null);

    useEffect(() => {
        if (!sessionId) {
            navigate('/dashboard');
            return;
        }

        const fetchData = async () => {
            try {
                const qRes = await apiClient.get(`${examId}/questions/`);
                setQuestions(qRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        startProctoring();

        return () => {
            stopProctoring();
        };
    }, [examId, sessionId]);

    const startProctoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            sendEvent('CAMERA_DENIED', 1);
        }

        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibility);
    };

    const stopProctoring = () => {
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('visibilitychange', handleVisibility);
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const handleBlur = () => sendEvent('TAB_SWITCH', 0.8);
    const handleVisibility = () => {
        if (document.hidden) sendEvent('TAB_SWITCH', 1.0);
    };

    const sendEvent = async (type, confidence = 1) => {
        try {
            const res = await apiClient.post('event/', {
                session_id: sessionId,
                event_type: type,
                confidence
            });
            setRisk(res.data.risk);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAnswer = (questionId, option) => {
        setAnswers({ ...answers, [questionId]: option });
    };

    const handleSubmit = async () => {
        try {
            await apiClient.post('end/', { session_id: sessionId });
            setFinished(true);
        } catch (err) {
            alert('Failed to submit exam');
        }
    };

    if (loading) return <div className="text-center mt-20 heading-xl">Loading Questions...</div>;

    if (finished) {
        return (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="floating-card p-12 text-center space-y-6">
                    <CheckCircle size={80} className="mx-auto text-green-500" />
                    <h1 className="heading-xl text-5xl">Exam Submitted!</h1>
                    <p className="font-heading font-bold opacity-60 text-xl">Your results are being processed.</p>
                    <button onClick={() => navigate('/dashboard')} className="pill-button bg-accent-border text-white">Back to Dashboard</button>
                </motion.div>
            </div>
        );
    }

    const currentQ = questions[currentIdx];

    return (
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Proctoring Panel */}
            <div className="lg:w-1/3 space-y-6">
                <div className="floating-card p-6 overflow-hidden relative">
                    <video ref={videoRef} autoPlay muted className="w-full rounded-2xl bg-black aspect-video object-cover mb-4" />
                    <div className="flex items-center gap-2 font-heading font-black text-orange-500 mb-2">
                        <Camera size={20} /> LIVE PROCTORING
                    </div>
                    <div className="h-4 bg-orange-100 dark:bg-orange-900/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-orange-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(risk * 10, 100)}%` }}
                        />
                    </div>
                    <p className="text-right font-heading font-black text-sm mt-1 opacity-40">RISK LEVEL: {(risk * 10).toFixed(1)}%</p>
                </div>

                <div className="floating-card p-6 border-red-500/20">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="text-red-500 shrink-0" />
                        <div>
                            <h4 className="font-heading font-black">Proctor Warnings</h4>
                            <p className="text-sm opacity-60">Tab switching and looking away are flagged automatically.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Panel - Question Area */}
            <div className="lg:w-2/3 space-y-8">
                <div className="flex justify-between items-center px-4">
                    <div className="font-heading font-black text-2xl">
                        Question {currentIdx + 1} <span className="opacity-30">/ {questions.length}</span>
                    </div>
                    <div className="handwritten text-orange-500">Focused</div>
                </div>

                <div className="floating-card p-10 min-h-[400px] flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIdx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <h2 className="font-heading font-black text-4xl leading-tight">
                                {currentQ?.text}
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                {['a', 'b', 'c', 'd'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => handleAnswer(currentQ.id, opt)}
                                        className={`w-full p-6 text-left rounded-3xl font-heading font-bold text-xl transition-all border-2 
                      ${answers[currentQ.id] === opt
                                                ? 'bg-orange-500 text-white border-orange-500 shadow-lg translate-x-2'
                                                : 'bg-canvas-light dark:bg-canvas-dark border-accent-border/10 hover:border-accent-border/40'}`}
                                    >
                                        <span className="uppercase mr-4 opacity-40 font-black">{opt}.</span>
                                        {currentQ[`option_${opt}`]}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-between mt-12">
                        <button
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx(currentIdx - 1)}
                            className="pill-button disabled:opacity-30"
                        >
                            Previous
                        </button>

                        {currentIdx === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                className="pill-button bg-orange-500 text-white border-orange-600"
                            >
                                Submit Exam
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentIdx(currentIdx + 1)}
                                className="pill-button bg-accent-border text-white dark:bg-white dark:text-black"
                            >
                                Next Question
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamView;
