import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import SplineScene from "../components/ui/spline";


export default function Support() {
    const [startDust, setStartDust] = useState(false);

    useEffect(() => {
        // start the dust animation 1s after appearing
        const t = setTimeout(() => setStartDust(true), 1400);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="min-h-screen bg-white relative overflow-hidden dark:bg-black">
            {/* Spline 3D Background */}
            <div className="absolute inset-0 z-0 -mt-50 transition-all duration-1000 ease-in-out">
                <SplineScene />
            </div>

            {/* Animated Text Overlay */}
            <div className="flex justify-center items-center h-full gap-150 text-6xl font-light text-gray-500 relative mt-80 dark:text-white">

                <h1>We Don't</h1>
                <h1 className="text-green-400 dark:text-green-500">&lt;Support&gt;</h1>


            </div>
        </div>
    );
}
