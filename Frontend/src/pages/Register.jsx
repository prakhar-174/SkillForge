import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { motion } from 'framer-motion';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await apiClient.post('auth/register/', { username, email, password });
            localStorage.setItem('access_token', response.data.tokens.access);
            localStorage.setItem('refresh_token', response.data.tokens.refresh);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="floating-card w-full max-w-md p-10 space-y-8"
            >
                <div className="text-center">
                    <h1 className="heading-xl text-5xl mb-2">Join Us</h1>
                    <span className="handwritten text-orange-500 absolute -bottom-4 -left-4">Fresh!</span>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-heading font-black text-xl ml-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-6 py-4 rounded-full border-2 border-accent-border/10 focus:border-accent-border outline-none transition-all dark:bg-card-dark dark:border-white/10"
                            placeholder="Username"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-heading font-black text-xl ml-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-6 py-4 rounded-full border-2 border-accent-border/10 focus:border-accent-border outline-none transition-all dark:bg-card-dark dark:border-white/10"
                            placeholder="email@example.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-heading font-black text-xl ml-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-6 py-4 rounded-full border-2 border-accent-border/10 focus:border-accent-border outline-none transition-all dark:bg-card-dark dark:border-white/10"
                            placeholder="Password"
                            required
                        />
                    </div>

                    <button type="submit" className="pill-button w-full bg-accent-border text-white dark:bg-white dark:text-black">
                        Create Account
                    </button>
                </form>

                <div className="text-center pt-4">
                    <p className="font-heading font-bold opacity-60">
                        Already have an account?
                        <Link to="/login" className="ml-2 text-orange-500 hover:underline">Login</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
