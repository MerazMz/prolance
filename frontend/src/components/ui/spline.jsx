import Spline from '@splinetool/react-spline';
import { useState, useEffect } from 'react';

export default function SplineScene() {
    return (
        <div className="w-full h-full">
            <Spline
                scene="https://prod.spline.design/nHoYIuhOMDFFkM5z/scene.splinecode"
            />
        </div>
    );
}

// Preloader component - renders hidden Spline to cache it
export function SplinePreloader() {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        // Start preloading after a short delay to not block initial render
        const timer = setTimeout(() => setShouldLoad(true), 500);
        return () => clearTimeout(timer);
    }, []);

    if (!shouldLoad) return null;

    return (
        <div
            style={{
                position: 'absolute',
                left: '-9999px',
                width: '1px',
                height: '1px',
                pointerEvents: 'none',
                opacity: 0
            }}
            aria-hidden="true"
        >
            <Spline scene="https://prod.spline.design/nHoYIuhOMDFFkM5z/scene.splinecode" />
        </div>
    );
}
