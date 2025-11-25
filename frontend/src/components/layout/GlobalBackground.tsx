import React from 'react';

const GlobalBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Base: Deep Obsidian Radial Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#050505] to-[#050505] dark:from-[#1a1a1a] dark:via-[#050505] dark:to-[#050505]" />

            {/* Light Mode: Marble Texture */}
            <div className="absolute inset-0 hidden light-theme:block bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#E5E7EB] via-[#F4F4F6] to-[#FAFAFA]" />

            {/* Floating Geometric Elements - Larger Circle */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] border border-white/5 rounded-full opacity-20 animate-float"
                 style={{ animationDelay: '0s', animationDuration: '8s' }} />

            {/* Medium Circle */}
            <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] border border-white/5 rounded-full opacity-15 animate-float"
                 style={{ animationDelay: '2s', animationDuration: '10s' }} />

            {/* Small Circle */}
            <div className="absolute top-[30%] left-[20%] w-[200px] h-[200px] border border-white/5 rounded-full opacity-10 animate-float hidden lg:block"
                 style={{ animationDelay: '4s', animationDuration: '12s' }} />

            {/* Diagonal Lines - Creating Depth */}
            <div className="absolute top-[40%] left-[-10%] w-[120%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -rotate-12" />
            <div className="absolute top-[60%] right-[-10%] w-[120%] h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-6 hidden md:block" />
            <div className="absolute bottom-[20%] left-[-5%] w-[110%] h-[1px] bg-gradient-to-r from-transparent via-white/8 to-transparent -rotate-3 hidden lg:block" />

            {/* Grid Pattern - Subtle */}
            <div className="absolute inset-0 opacity-[0.02]"
                 style={{
                     backgroundImage: 'linear-gradient(rgba(229, 229, 229, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(229, 229, 229, 0.1) 1px, transparent 1px)',
                     backgroundSize: '100px 100px'
                 }} />

            {/* Vignette Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(5,5,5,0.4)_100%)]" />
        </div>
    );
};

export default GlobalBackground;
