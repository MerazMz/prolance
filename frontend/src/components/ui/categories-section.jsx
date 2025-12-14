import React, { useState } from 'react';
import { FiCode, FiPenTool, FiVideo, FiTrendingUp, FiMusic, FiFileText, FiActivity, FiBook, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import CategoryProjectsDialog from '../CategoryProjectsDialog';

export default function PopularCategories() {
    const categories = [
        {
            icon: <FiCode className="w-8 h-8" />,
            title: "Programming & Tech",
            count: "2,500+ freelancers",
            color: "from-blue-50 to-blue-100 border-blue-200"
        },
        {
            icon: <FiPenTool className="w-8 h-8" />,
            title: "Design & Creative",
            count: "1,800+ freelancers",
            color: "from-purple-50 to-purple-100 border-purple-200"
        },
        {
            icon: <FiVideo className="w-8 h-8" />,
            title: "Video & Animation",
            count: "1,200+ freelancers",
            color: "from-pink-50 to-pink-100 border-pink-200"
        },
        {
            icon: <FiTrendingUp className="w-8 h-8" />,
            title: "Digital Marketing",
            count: "950+ freelancers",
            color: "from-green-50 to-green-100 border-green-200"
        },
        {
            icon: <FiMusic className="w-8 h-8" />,
            title: "Music & Audio",
            count: "680+ freelancers",
            color: "from-amber-50 to-amber-100 border-amber-200"
        },
        {
            icon: <FiFileText className="w-8 h-8" />,
            title: "Writing & Translation",
            count: "1,100+ freelancers",
            color: "from-teal-50 to-teal-100 border-teal-200"
        },
        {
            icon: <FiActivity className="w-8 h-8" />,
            title: "Health & Fitness",
            count: "420+ freelancers",
            color: "from-red-50 to-red-100 border-red-200"
        },
        {
            icon: <FiBook className="w-8 h-8" />,
            title: "Education",
            count: "750+ freelancers",
            color: "from-indigo-50 to-indigo-100 border-indigo-200"
        },
        {
            icon: <FiShield className="w-8 h-8" />,
            title: "Legal",
            count: "380+ freelancers",
            color: "from-slate-50 to-slate-100 border-slate-200"
        }
    ];

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);

    const handleCategoryClick = (categoryName) => {
        setSelectedCategory(categoryName);
        setShowCategoryDialog(true);
    };

    return (
        <div className="w-full py-20 px-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Popular Categories
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Explore thousands of talented professionals across various fields
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category, index) => (
                        <button
                            key={index}
                            onClick={() => handleCategoryClick(category.title)}
                            className={`group p-8 rounded-xl border bg-gradient-to-br ${category.color} hover:shadow-xl transition-all duration-300 cursor-pointer`}
                        >
                            <div className="text-gray-700 mb-4 group-hover:scale-110 transition-transform duration-300">
                                {category.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                {category.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {category.count}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link
                        to="#"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-all duration-300"
                    >
                        View All Categories
                    </Link>
                </div>
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
