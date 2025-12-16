import { useState } from 'react'
import Particles from '../components/ui/background'
import { LayoutTextFlip } from '../components/ui/layout-text-flip'
import { TimelineDemo } from '../components/ui/timelineProps'
import DualSection from '../components/ui/dual-section'
import Footer from '../components/ui/footer'
import ClickSpark from '../components/ClickSpark'
import { GlobeDemo } from '../components/ui/globeProps'
import ScrollVelocity from '../components/ui/scroll-velocity'

import '../App.css'

function Home() {
    return (
        <>

            {/* Hero Section with Particles Background - Responsive */}
            <div className="w-full h-[400px] md:h-[600px] absolute">
                <Particles
                    particleColors={['#b2ffc8', '#b2ffc8']}
                    particleCount={window.innerWidth < 768 ? 30 : 100}
                    particleSpread={10}
                    speed={0.1}
                    particleBaseSize={window.innerWidth < 768 ? 60 : 100}
                    moveParticlesOnHover={true}
                    alphaParticles={false}
                    disableRotation={false}
                />
            </div>
            <ClickSpark sparkColor="#000000ff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400} easing="ease-out" extraScale={1.0}>
                {/* Hero - Text Flip Animation */}
                <div className="px-4 md:px-0">
                    <LayoutTextFlip />
                </div>

                {/* Scroll Velocity - Hidden on mobile */}
                <div className="hidden md:block">
                    <ScrollVelocity
                        texts={['Match Align Sync Blend', 'Discover Explore Hunt Scout', 'Advance Thrive Ascend']}
                        velocity={50}
                        className="custom-scroll-text text-gray-300"
                    />
                </div>

                {/* Globe Demo - Hidden on mobile, visible on md and up */}
                <div className="hidden md:block mt-20">
                    <GlobeDemo />
                </div>

                {/* Dual Section - For Freelancers & Clients - Responsive */}
                <div className="px-4 md:px-0">
                    <DualSection />
                </div>

            </ClickSpark>
            {/* Footer */}
            <Footer />
        </>
    )
}

export default Home

