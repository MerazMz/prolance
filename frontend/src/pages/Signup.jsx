import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import Particles from '../components/ui/background';
import signupIllustration from '../assets/signup_illustration_1764590349002.png';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('freelancer');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Basic validation
        if (!name || !email || !password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        const result = await signup(name, email, password, role);

        if (result.success) {
            // Redirect to login page after successful signup
            navigate('/login', { state: { message: 'Account created successfully! Please login.' } });
        } else {
            setError(result.error?.message || 'Signup failed. Please try again.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex bg-white">
            {/* Left Side - Illustration with Particles */}
            <div className="hidden rounded-3xl lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-50 to-white items-center justify-center p-12 overflow-hidden">
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
                    <img src={signupIllustration} alt="Signup" className="w-full h-auto" />
                    <div className="mt-8 text-center">
                        <h2 className="text-2xl font-light text-gray-700 mb-2">Join Our Community</h2>
                        <p className="text-sm text-gray-500 font-light">
                            Start your journey as a freelancer or hire top talent
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-light text-gray-700 mb-2">Create Account</h1>
                        <p className="text-sm text-gray-500 font-light">
                            Fill in your details to get started
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
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Name Input */}
                        <div>
                            {/* <label className="block text-xs text-gray-500 mb-2 font-light">
                                Full Name
                            </label> */}
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-green-600 focus:outline-none transition-all font-light text-gray-700"
                                placeholder="Full Name"
                                disabled={isLoading}
                            />
                        </div>

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
                                placeholder="Password"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-gray-400 mt-1 font-light">At least 6 characters</p>
                        </div>

                        {/* Role Selection */}
                        <div className="relative">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-green-600 focus:outline-none transition-all font-light text-gray-700 appearance-none bg-white cursor-pointer"
                                disabled={isLoading}
                            >
                                <option value="freelancer">Work as a Freelancer</option>
                                <option value="client">Hire as a Client</option>
                                <option value="both">Both - Hire and Work on Projects</option>
                            </select>
                            {/* Custom Dropdown Arrow */}
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-green-600 text-white font-light py-2.5 text-sm rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-4 flex items-center">
                        <div className="flex-1 border-t border-gray-100"></div>
                        <span className="px-4 text-xs text-gray-400 font-light">or</span>
                        <div className="flex-1 border-t border-gray-100"></div>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500 font-light">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-green-600 hover:text-green-700 transition"
                            >
                                Login
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
