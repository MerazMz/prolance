import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import ImageUpload from '../components/ui/ImageUpload';
import MultiImageUpload from '../components/ui/MultiImageUpload';
import {
    HiOutlineCheckCircle,
    HiOutlineEye,
    HiOutlineEyeOff,
    HiOutlineArrowRight,
    HiOutlineArrowLeft,
    HiRefresh,
    HiOutlineDocumentText,
    HiOutlineCurrencyDollar,
    HiOutlineClock,
    HiOutlinePhotograph,
    HiOutlineX,
    HiCheck
} from 'react-icons/hi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const STEPS = [
    { id: 1, name: 'Basic Info', icon: HiOutlineDocumentText },
    { id: 2, name: 'Budget & Timeline', icon: HiOutlineCurrencyDollar },
    { id: 3, name: 'Media & Skills', icon: HiOutlinePhotograph },
    { id: 4, name: 'Review', icon: HiOutlineCheckCircle }
];

export default function PostProject() {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const isEditMode = Boolean(projectId);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        budgetMin: '',
        budgetMax: '',
        budgetType: 'fixed',
        duration: '',
        skillsRequired: '',
        visibility: 'public',
        thumbnail: '',
        images: []
    });

    // CAPTCHA state
    const [captchaId, setCaptchaId] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
    const [captchaLoading, setCaptchaLoading] = useState(false);
    const [captchaError, setCaptchaError] = useState('');

    const categories = [
        'Programming & Tech',
        'Graphics & Design',
        'Digital Marketing',
        'Writing & Translation',
        'Video & Animation',
        'AI Services',
        'Music & Audio',
        'Business',
        'Consulting',
        'Other'
    ];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    // Load existing project data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            loadProjectData();
        } else {
            // Load saved form data from sessionStorage
            const savedData = sessionStorage.getItem('postProjectFormData');
            const savedStep = sessionStorage.getItem('postProjectStep');

            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    setFormData(parsedData);
                } catch (err) {
                    console.error('Error loading saved form data:', err);
                }
            }

            if (savedStep) {
                setCurrentStep(parseInt(savedStep));
            }
        }

        loadCaptcha();
    }, [isEditMode, projectId]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/projects/${projectId}`,
                { headers: { Authorization: token } }
            );

            const project = response.data.project;
            setFormData({
                title: project.title || '',
                description: project.description || '',
                category: project.category || '',
                budgetMin: project.budget?.min || '',
                budgetMax: project.budget?.max || '',
                budgetType: project.budget?.type || 'fixed',
                duration: project.duration || '',
                skillsRequired: project.skillsRequired?.join(', ') || '',
                visibility: project.visibility || 'public',
                thumbnail: project.thumbnail || '',
                images: project.images || []
            });
        } catch (error) {
            console.error('Error loading project:', error);
            setError('Failed to load project data');
        } finally {
            setLoading(false);
        }
    };

    // Save form data to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem('postProjectFormData', JSON.stringify(formData));
    }, [formData]);

    // Save current step to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('postProjectStep', currentStep.toString());
    }, [currentStep]);

    const loadCaptcha = async () => {
        try {
            setCaptchaLoading(true);
            setCaptchaError('');
            setCaptchaAnswer('');
            setIsCaptchaVerified(false);

            const response = await axios.get(`${API_BASE_URL}/api/captcha/generate`);

            if (response.data.success) {
                setCaptchaId(response.data.captchaId);
                setCaptchaSvg(response.data.captchaSvg);
            }
        } catch (err) {
            setCaptchaError('Failed to load CAPTCHA. Please refresh.');
        } finally {
            setCaptchaLoading(false);
        }
    };

    const verifyCaptcha = async () => {
        if (!captchaAnswer.trim()) {
            setCaptchaError('Please enter the CAPTCHA text');
            return;
        }

        try {
            setCaptchaLoading(true);
            setCaptchaError('');

            const response = await axios.post(`${API_BASE_URL}/api/captcha/verify`, {
                captchaId,
                answer: captchaAnswer
            });

            if (response.data.success) {
                setIsCaptchaVerified(true);
                setCaptchaError('');
            }
        } catch (err) {
            setCaptchaLoading(false);

            if (err.response?.status === 400) {
                setCaptchaError('Wrong CAPTCHA. Please try again.');
            } else {
                setCaptchaError(err.response?.data?.message || 'Verification failed.');
            }
            setIsCaptchaVerified(false);

            setTimeout(() => {
                loadCaptcha();
            }, 2000);
            return;
        } finally {
            setCaptchaLoading(false);
        }
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!formData.title.trim()) {
                    setError('Please enter a project title');
                    return false;
                }
                if (formData.description.length < 50) {
                    setError('Description must be at least 50 characters');
                    return false;
                }
                if (!formData.category) {
                    setError('Please select a category');
                    return false;
                }
                break;
            case 2:
                if (!formData.budgetMin || !formData.budgetMax) {
                    setError('Please enter budget range');
                    return false;
                }
                if (Number(formData.budgetMin) >= Number(formData.budgetMax)) {
                    setError('Maximum budget must be greater than minimum budget');
                    return false;
                }
                if (!formData.duration) {
                    setError('Please enter project duration');
                    return false;
                }
                break;
            case 3:
                // Optional fields, no validation needed
                break;
            case 4:
                if (!isCaptchaVerified) {
                    setError('Please verify CAPTCHA');
                    return false;
                }
                break;
        }
        setError('');
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError('');
    };

    const handleSubmit = async () => {
        if (!validateStep(4)) return;

        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');

            const skills = formData.skillsRequired
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const projectData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                budget: {
                    min: Number(formData.budgetMin),
                    max: Number(formData.budgetMax),
                    type: formData.budgetType
                },
                duration: formData.duration,
                skillsRequired: skills,
                visibility: formData.visibility,
                thumbnail: formData.thumbnail,
                images: formData.images
            };

            const response = isEditMode
                ? await axios.put(
                    `${API_BASE_URL}/api/projects/${projectId}`,
                    projectData,
                    {
                        headers: {
                            Authorization: token,
                            'Content-Type': 'application/json'
                        }
                    }
                )
                : await axios.post(
                    `${API_BASE_URL}/api/projects`,
                    projectData,
                    {
                        headers: {
                            Authorization: token,
                            'Content-Type': 'application/json'
                        }
                    }
                );

            if (response.data.success) {
                // Clear saved form data from sessionStorage (only for new projects)
                if (!isEditMode) {
                    sessionStorage.removeItem('postProjectFormData');
                    sessionStorage.removeItem('postProjectStep');

                    // Reset form data state to initial values
                    setFormData({
                        title: '',
                        description: '',
                        category: '',
                        budgetMin: '',
                        budgetMax: '',
                        budgetType: 'fixed',
                        duration: '',
                        skillsRequired: '',
                        visibility: 'public',
                        thumbnail: '',
                        images: []
                    });
                    setCurrentStep(1);
                }

                setSuccess(true);
                setTimeout(() => {
                    navigate('/my-projects');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} project`);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center bg-white p-12 rounded-2xl shadow-sm"
                >
                    <HiOutlineCheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-medium text-gray-900 mb-2">
                        {isEditMode ? 'Project Updated!' : 'Project Created!'}
                    </h2>
                    <p className="text-sm text-gray-500">Redirecting to your projects...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-medium text-gray-900 mb-2">
                            {isEditMode ? 'Edit Project' : 'Post a New Project'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {isEditMode ? 'Update your project details' : 'Follow the steps to create your project listing'}
                        </p>
                    </div>
                    {currentStep > 1 && !isEditMode && (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('Are you sure you want to start over? All progress will be lost.')) {
                                    sessionStorage.removeItem('postProjectFormData');
                                    sessionStorage.removeItem('postProjectStep');
                                    window.location.reload();
                                }
                            }}
                            className="text-xs text-gray-400 hover:text-red-500 transition"
                        >
                            Start Over
                        </button>
                    )}
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm p-8">
                    {/* Progress Steps - Slim */}
                    <div className="mb-8 pb-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            {STEPS.map((step, index) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;

                                return (
                                    <>
                                        <div key={step.id} className="flex flex-col items-center">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition ${isCompleted
                                                    ? 'bg-green-600 text-white'
                                                    : isActive
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                {step.id}
                                            </div>
                                            <span
                                                className={`text-xs font-medium mt-2 whitespace-nowrap ${isActive ? 'text-green-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                                                    }`}
                                            >
                                                {step.name}
                                            </span>
                                        </div>
                                        {index < STEPS.length - 1 && (
                                            <div
                                                className={`flex-1 h-0.5 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'
                                                    }`}
                                            />
                                        )}
                                    </>
                                );
                            })}
                        </div>
                    </div>
                    <AnimatePresence mode="wait">
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                {/* Project Title */}
                                <div className="group">
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                                        Project Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        placeholder="e.g., Build a responsive e-commerce website"
                                        className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all"
                                    />
                                </div>

                                {/* Description */}
                                <div className="group">
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        placeholder="Describe your project in detail. What are you trying to achieve? What skills are needed?"
                                        rows={6}
                                        className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none resize-none transition-all"
                                    />
                                    <div className="flex items-center justify-between mt-1.5">
                                        <p className="text-xs text-gray-400">
                                            Minimum 50 characters required
                                        </p>
                                        <p className={`text-xs font-medium ${formData.description.length >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                                            {formData.description.length}/50
                                        </p>
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="group">
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                                        Category
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.category}
                                            onChange={(e) => handleChange('category', e.target.value)}
                                            className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Budget & Timeline */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                {/* Budget Range */}
                                <div className="group">
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                                        Budget Range (₹)
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <input
                                                type="number"
                                                value={formData.budgetMin}
                                                onChange={(e) => handleChange('budgetMin', e.target.value)}
                                                placeholder="Min"
                                                className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                value={formData.budgetMax}
                                                onChange={(e) => handleChange('budgetMax', e.target.value)}
                                                placeholder="Max"
                                                className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={formData.budgetType}
                                                onChange={(e) => handleChange('budgetType', e.target.value)}
                                                className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none appearance-none cursor-pointer transition-all"
                                            >
                                                <option value="fixed">Fixed</option>
                                                <option value="hourly">Hourly</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Duration */}
                                <div className="group">
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                                        Project Duration
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={(e) => handleChange('duration', e.target.value)}
                                        placeholder="e.g., 2-3 weeks"
                                        className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all"
                                    />
                                </div>

                                {/* Visibility */}
                                <div className="group">
                                    <label className="block text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wide">
                                        Project Visibility
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('visibility', 'public')}
                                            className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${formData.visibility === 'public'
                                                ? 'border-green-500 bg-green-50 shadow-sm'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className={`flex-shrink-0 ${formData.visibility === 'public' ? 'text-green-600' : 'text-gray-400'}`}>
                                                <HiOutlineEye size={20} />
                                            </div>
                                            <div className="text-left flex-1">
                                                <p className={`text-sm font-medium ${formData.visibility === 'public' ? 'text-green-700' : 'text-gray-700'}`}>
                                                    Public
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">Visible to everyone</p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleChange('visibility', 'private')}
                                            className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${formData.visibility === 'private'
                                                ? 'border-green-500 bg-green-50 shadow-sm'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className={`flex-shrink-0 ${formData.visibility === 'private' ? 'text-green-600' : 'text-gray-400'}`}>
                                                <HiOutlineEyeOff size={20} />
                                            </div>
                                            <div className="text-left flex-1">
                                                <p className={`text-sm font-medium ${formData.visibility === 'private' ? 'text-green-700' : 'text-gray-700'}`}>
                                                    Private
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">Only you can see</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Media & Skills */}
                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                {/* Skills Required */}
                                <div className="group">
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                                        Skills Required (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.skillsRequired}
                                        onChange={(e) => handleChange('skillsRequired', e.target.value)}
                                        placeholder="e.g., React, Node.js, MongoDB"
                                        className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none transition-all"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5">Separate multiple skills with commas</p>
                                </div>

                                {/* Project Thumbnail */}
                                <div className="group">
                                    <label className="block text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wide">
                                        Project Thumbnail (Optional)
                                    </label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <ImageUpload
                                            value={formData.thumbnail}
                                            onChange={(value) => handleChange('thumbnail', value)}
                                            label="Upload Thumbnail"
                                        />
                                    </div>
                                </div>

                                {/* Additional Images */}
                                <div className="group">
                                    <label className="block text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wide">
                                        Additional Images (Optional)
                                    </label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <MultiImageUpload
                                            values={formData.images}
                                            onChange={(value) => handleChange('images', value)}
                                            maxImages={5}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Review & CAPTCHA */}
                        {currentStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                {/* Project Overview */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Project Overview</h3>
                                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5 border border-green-100">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{formData.title || 'Untitled Project'}</h4>
                                        {formData.description && (
                                            <p className="text-sm text-gray-600 line-clamp-3 text-left mb-5">{formData.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                                                {formData.category || 'No category'}
                                            </span>
                                            <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                                                {formData.visibility === 'public' ? 'Public' : 'Private'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Details Grid */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Project Details</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Budget Card */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Budget</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                ₹{formData.budgetMin || '0'} - ₹{formData.budgetMax || '0'}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize mt-0.5">{formData.budgetType} rate</p>
                                        </div>

                                        {/* Duration Card */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                                            <p className="text-lg font-semibold text-gray-900">{formData.duration || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills & Media */}
                                {(formData.skillsRequired || formData.thumbnail || formData.images?.length > 0) && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">Additional Information</h3>
                                        <div className="space-y-3">
                                            {/* Skills */}
                                            {formData.skillsRequired && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Required Skills</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.skillsRequired.split(',').map((skill, index) => (
                                                            <span key={index} className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                                                                {skill.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Thumbnail & Images */}
                                            {(formData.thumbnail || formData.images?.length > 0) && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Project Media</p>
                                                    <div className="flex gap-2 overflow-x-auto">
                                                        {formData.thumbnail && (
                                                            <div className="relative flex-shrink-0">
                                                                <img
                                                                    src={formData.thumbnail}
                                                                    alt="Thumbnail"
                                                                    className="w-20 h-20 object-cover rounded-lg border-2 border-green-500"
                                                                />
                                                                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                                                    Main
                                                                </span>
                                                            </div>
                                                        )}
                                                        {formData.images?.map((img, index) => (
                                                            <img
                                                                key={index}
                                                                src={img}
                                                                alt={`Image ${index + 1}`}
                                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* CAPTCHA Verification */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Security Verification</h3>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        {captchaLoading ? (
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                                                Loading CAPTCHA...
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {/* CAPTCHA Row */}
                                                <div className="flex items-center gap-3">
                                                    {/* CAPTCHA Image */}
                                                    <div
                                                        className="border border-gray-300 rounded-lg bg-white flex-shrink-0"
                                                        dangerouslySetInnerHTML={{ __html: captchaSvg }}
                                                    />
                                                    {/* Refresh Button */}
                                                    <button
                                                        type="button"
                                                        onClick={loadCaptcha}
                                                        disabled={isCaptchaVerified}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                                                        title="Refresh CAPTCHA"
                                                    >
                                                        <HiRefresh size={20} />
                                                    </button>
                                                    {/* Input and Verify Button */}
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <input
                                                            type="text"
                                                            value={captchaAnswer}
                                                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                                                            placeholder="Enter code"
                                                            disabled={isCaptchaVerified}
                                                            className="w-100 h-13 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none disabled:bg-gray-100"
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter' && !isCaptchaVerified) {
                                                                    e.preventDefault();
                                                                    verifyCaptcha();
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={verifyCaptcha}
                                                            disabled={captchaLoading || isCaptchaVerified || !captchaAnswer.trim()}
                                                            className="h-13 w-full px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium whitespace-nowrap"
                                                        >
                                                            {isCaptchaVerified ? '✓ Verified' : 'Verify'}
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Success Message */}
                                                {isCaptchaVerified && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                                        <HiCheck className="text-green-600 flex-shrink-0" size={16} />
                                                        <p className="text-xs text-green-600 font-medium">CAPTCHA verified successfully!</p>
                                                    </div>
                                                )}
                                                {/* Error Message */}
                                                {captchaError && !isCaptchaVerified && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                                                        <HiOutlineX className="text-red-600 flex-shrink-0" size={16} />
                                                        <p className="text-xs text-red-600 font-medium">{captchaError}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={currentStep === 1 ? () => navigate(-1) : handleBack}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition"
                        >
                            <HiOutlineArrowLeft size={16} />
                            {currentStep === 1 ? 'Cancel' : 'Back'}
                        </button>

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                            >
                                Next
                                <HiOutlineArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || !isCaptchaVerified}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineCheckCircle size={16} />
                                        {isEditMode ? 'Update Project' : 'Publish Project'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
}
