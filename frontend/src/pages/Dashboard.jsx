import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineBriefcase,
    HiOutlineCurrencyDollar,
    HiOutlineEye,
    HiOutlineDocumentText,
    HiOutlineUser,
    HiOutlinePlusCircle,
    HiOutlineCog,
<<<<<<< Updated upstream
    HiOutlineInbox
=======
    HiOutlineInbox,
    HiOutlineCheckCircle,
    HiOutlineCode,
    HiOutlineColorSwatch,
    HiOutlineTrendingUp,
    HiOutlinePencil,
    HiOutlineFilm,
    HiOutlineLightningBolt,
    HiOutlineMusicNote,
    HiOutlineChatAlt2
>>>>>>> Stashed changes
} from 'react-icons/hi';
import CategoryProjectsDialog from '../components/CategoryProjectsDialog';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
<<<<<<< Updated upstream
=======
    const [stats, setStats] = useState({
        activeProjects: 0,
        completedProjects: 0,
        totalEarnings: 0,
        totalSpent: 0,
        profileViews: 0
    });
    const [recentProjects, setRecentProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('authToken');

            // Fetch user profile with stats
            const profileResponse = await axios.get(
                `${API_BASE_URL}/api/users/me`,
                { headers: { Authorization: token } }
            );

            const userData = profileResponse.data.user;

            // Fetch projects
            const projectsResponse = await axios.get(
                `${API_BASE_URL}/api/projects/my/projects`,
                { headers: { Authorization: token } }
            );

            const projects = projectsResponse.data.projects || [];
            const activeProjects = projects.filter(p =>
                ['open', 'in-progress', 'completed'].includes(p.status)
            ).length;

            setStats({
                activeProjects,
                completedProjects: userData.completedProjects || 0,
                totalEarnings: userData.totalEarnings || 0,
                totalSpent: userData.totalSpent || 0,
                profileViews: userData.profileViews || 0
            });

            setRecentProjects(projects.slice(0, 5));
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'text-blue-600 bg-blue-50';
            case 'in-progress': return 'text-yellow-600 bg-yellow-50';
            case 'completed': return 'text-purple-600 bg-purple-50';
            case 'closed': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const categories = [
        { name: 'Programming & Tech', icon: HiOutlineCode, color: 'blue' },
        { name: 'Graphics & Design', icon: HiOutlineColorSwatch, color: 'purple' },
        { name: 'Digital Marketing', icon: HiOutlineTrendingUp, color: 'green' },
        { name: 'Writing & Translation', icon: HiOutlinePencil, color: 'yellow' },
        { name: 'Video & Animation', icon: HiOutlineFilm, color: 'red' },
        { name: 'AI Services', icon: HiOutlineLightningBolt, color: 'indigo' },
        { name: 'Music & Audio', icon: HiOutlineMusicNote, color: 'pink' },
        { name: 'Business', icon: HiOutlineBriefcase, color: 'gray' },
        { name: 'Consulting', icon: HiOutlineChatAlt2, color: 'teal' }
    ];

    const handleCategoryClick = (categoryName) => {
        setSelectedCategory(categoryName);
        setShowCategoryDialog(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 mt-3">Loading dashboard...</p>
                </div>
            </div>
        );
    }
>>>>>>> Stashed changes

    return (
        <div className="min-h-screen w-full bg-white">
            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-8 py-10">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl font-light text-gray-700 mb-2">
                        Welcome back, <span className="text-green-600">{user?.name}</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-light">
                        Here's what's happening with your account today
                    </p>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="bg-white rounded-lg border border-gray-100 p-6 hover:border-gray-200 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                                <HiOutlineBriefcase className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <h3 className="text-xs text-gray-500 font-light">Active Projects</h3>
                                <p className="text-2xl font-light text-gray-700">0</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 font-light">No active projects</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="bg-white rounded-lg border border-gray-100 p-6 hover:border-gray-200 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                <HiOutlineCurrencyDollar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xs text-gray-500 font-light">Total Earnings</h3>
                                <p className="text-2xl font-light text-gray-700">₹0</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 font-light">Start earning today</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="bg-white rounded-lg border border-gray-100 p-6 hover:border-gray-200 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                                <HiOutlineEye className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <h3 className="text-xs text-gray-500 font-light">Profile Views</h3>
                                <p className="text-2xl font-light text-gray-700">0</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 font-light">Build your profile</p>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="bg-white rounded-lg border border-gray-100 p-8 mb-8"
                >
                    <h2 className="text-lg font-light text-gray-700 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => navigate('/projects')}
                            className="p-5 rounded-lg border border-gray-100 hover:border-green-600 hover:bg-green-50/30 transition-all text-left group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <HiOutlineDocumentText className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                                <h3 className="text-sm font-medium text-gray-700 group-hover:text-green-600">Browse Projects</h3>
                            </div>
                            <p className="text-xs text-gray-400 font-light">Find your next gig</p>
                        </button>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-5 rounded-lg border border-gray-100 hover:border-green-600 hover:bg-green-50/30 transition-all text-left group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <HiOutlineUser className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                                <h3 className="text-sm font-medium text-gray-700 group-hover:text-green-600">Edit Profile</h3>
                            </div>
                            <p className="text-xs text-gray-400 font-light">Update your details</p>
                        </button>

                        <button
                            onClick={() => navigate('/post-project')}
                            className="p-5 rounded-lg border border-gray-100 hover:border-green-600 hover:bg-green-50/30 transition-all text-left group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <HiOutlinePlusCircle className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                                <h3 className="text-sm font-medium text-gray-700 group-hover:text-green-600">Post a Job</h3>
                            </div>
                            <p className="text-xs text-gray-400 font-light">Hire talented freelancers</p>
                        </button>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-5 rounded-lg border border-gray-100 hover:border-green-600 hover:bg-green-50/30 transition-all text-left group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <HiOutlineCog className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                                <h3 className="text-sm font-medium text-gray-700 group-hover:text-green-600">Settings</h3>
                            </div>
                            <p className="text-xs text-gray-400 font-light">Manage your account</p>
                        </button>
                    </div>
                </motion.div>

<<<<<<< Updated upstream
                {/* Recent Activity */}
=======
                {/* Browse by Category */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.5 }}
                    className="bg-white rounded-lg border border-gray-100 p-8 mb-8"
                >
                    <h2 className="text-lg font-light text-gray-700 mb-6">Browse by Category</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category, index) => {
                            const Icon = category.icon;
                            return (
                                <motion.button
                                    key={category.name}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.55 + (index * 0.05), duration: 0.3 }}
                                    onClick={() => handleCategoryClick(category.name)}
                                    className="p-5 rounded-lg border border-gray-100 hover:border-green-600 hover:bg-green-50/30 transition-all text-left group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 bg-${category.color}-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition`}>
                                            <Icon className={`w-5 h-5 text-${category.color}-600 group-hover:text-green-600 transition`} />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition">
                                            {category.name}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-400 font-light group-hover:text-green-600 transition">
                                        Explore →
                                    </p>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

>>>>>>> Stashed changes
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="bg-white rounded-lg border border-gray-100 p-8"
                >
                    <h2 className="text-lg font-light text-gray-700 mb-6">Recent Activity</h2>
                    <div className="text-center py-12">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <HiOutlineInbox className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-light mb-1">No recent activity</p>
                        <p className="text-xs text-gray-400 font-light">Your activity will appear here</p>
                    </div>
                </motion.div>
            </div>

            {/* Category Projects Dialog */}
            <CategoryProjectsDialog
                isOpen={showCategoryDialog}
                onClose={() => setShowCategoryDialog(false)}
                category={selectedCategory}
            />
        </div>
    );
}