import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import Particles from '../components/ui/background';
import loginIllustration from '../assets/login_illustration_1764590330755.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Basic validation
        if (!email || !password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error?.message || 'Login failed. Please try again.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex bg-white">
            {/* Left Side - Illustration with Particles */}
            <div className="rounded-3xl hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-50 to-white items-center justify-center p-12 overflow-hidden">
                {/* Background Particles */}
                <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                    <Particles
                        particleColors={['#b2ffc8', '#b2ffc8']}
                        particleCount={300}
                        particleSpread={10}
                        speed={0.1}
                        particleBaseSize={100}
                        moveParticlesOnHover={true}
                        alphaParticles={false}
                        disableRotation={false}
                    />
                </div>

                {/* Illustration */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 max-w-lg"
                >
                    <img src={loginIllustration} alt="Login" className="w-full h-auto" />
                    <div className="mt-8 text-center">
                        <h2 className="text-2xl font-light text-gray-700 mb-2">Welcome Back</h2>
                        <p className="text-sm text-gray-500 font-light">
                            Continue your journey with Pro&lt;lancer&gt;
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-light text-gray-700 mb-2">Login</h1>
                        <p className="text-sm text-gray-500 font-light">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-light"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            {/* <label className="block text-xs text-gray-500 mb-2 font-light">
                                Email Address
                            </label> */}
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-green-600 focus:outline-none transition-all font-light text-gray-700"
                                placeholder="your.email@example.com"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            {/* <label className="block text-xs text-gray-500 mb-2 font-light">
                                Password
                            </label> */}
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-green-600 focus:outline-none transition-all font-light text-gray-700"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-green-600 text-white font-light py-2.5 text-sm rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-4 flex items-center">
                        <div className="flex-1 border-t border-gray-100"></div>
                        <span className="px-4 text-xs text-gray-400 font-light">or</span>
                        <div className="flex-1 border-t border-gray-100"></div>
                    </div>

                    {/* Signup Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500 font-light">
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="text-green-600 hover:text-green-700 transition"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="text-center mt-4">
                        <Link
                            to="/"
                            className="text-xs text-gray-400 hover:text-gray-600 transition font-light"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
