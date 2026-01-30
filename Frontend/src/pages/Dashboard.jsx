import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Play } from 'lucide-react';

const Dashboard = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await apiClient.get('list/');
                setExams(response.data);
            } catch (err) {
                console.error('Failed to fetch exams', err);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const handleStartExam = async (examId) => {
        try {
            const response = await apiClient.post('start/', { exam_id: examId });
            navigate(`/exam/${examId}`, { state: { sessionId: response.data.session_id } });
        } catch (err) {
            alert('Failed to start exam');
        }
    };

    if (loading) return <div className="text-center mt-20 heading-xl animate-pulse">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="heading-xl">Your Exams</h1>
                    <p className="font-heading font-bold opacity-60 text-2xl mt-2 ml-1">Choose a challenge to begin</p>
                </div>
                <span className="handwritten text-orange-500 text-3xl mb-4">Good Luck!</span>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {exams.map((exam, index) => (
                    <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="floating-card p-8 group hover:border-orange-500/50 cursor-pointer"
                        onClick={() => handleStartExam(exam.id)}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 rounded-3xl bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                                <BookOpen size={32} />
                            </div>
                            <div className="flex items-center gap-2 font-heading font-black text-xl opacity-40">
                                <Clock size={20} />
                                {exam.duration_minutes}m
                            </div>
                        </div>

                        <h3 className="font-heading font-black text-3xl mb-4 group-hover:text-orange-500 transition-colors">
                            {exam.title}
                        </h3>

                        <div className="flex items-center gap-2 text-orange-500 font-heading font-black text-xl">
                            Start Exam <Play size={20} fill="currentColor" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {exams.length === 0 && (
                <div className="floating-card p-12 text-center">
                    <h2 className="heading-xl text-4xl opacity-40">No exams available yet</h2>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
