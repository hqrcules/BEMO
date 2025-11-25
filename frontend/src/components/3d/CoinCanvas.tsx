import React, { useEffect, useRef } from 'react';

const CoinCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width: number, height: number;
        let renderX: number, renderY: number, renderRadius: number;

        const coin = {
            rotation: 0,
            tiltX: 0,
            tiltY: 0,
            targetTiltX: 0,
            targetTiltY: 0
        };

        const resize = () => {
            // Use window dimensions for full-screen fixed canvas behavior
            width = window.innerWidth;
            height = window.innerHeight;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            // Positioning Logic
            if (width >= 1024) {
                renderX = width * 0.75; // 75% to the right for better visual balance
                renderY = height * 0.5;
                renderRadius = Math.min(width, height) * 0.32;
            } else {
                renderX = width * 0.5;
                renderY = height * 0.3; // Move up a bit on mobile
                renderRadius = width * 0.35;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const normX = (e.clientX - width / 2) / (width / 2);
            const normY = (e.clientY - height / 2) / (height / 2);
            coin.targetTiltY = normX * 0.4;
            coin.targetTiltX = normY * 0.4;
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Smooth inertia for tilt (physics-like motion)
            coin.tiltX += (coin.targetTiltX - coin.tiltX) * 0.05;
            coin.tiltY += (coin.targetTiltY - coin.tiltY) * 0.05;

            coin.rotation += 0.008;

            const isDark = document.documentElement.classList.contains('dark') ||
                document.documentElement.classList.contains('dark-theme');

            // Mobile Opacity Adjustment
            const isMobile = width < 1024;
            ctx.globalAlpha = isMobile ? 0.2 : 1.0;

            ctx.save();
            ctx.translate(renderX, renderY);

            // Perspective
            const scaleY = 1 - Math.abs(coin.tiltX) * 0.2;
            ctx.scale(1, scaleY);
            ctx.rotate(coin.tiltY * 0.3);

            // Draw Thickness (more layers for better depth)
            const layers = 28;
            for (let i = 0; i < layers; i++) {
                ctx.beginPath();
                const depthOffset = i * (coin.tiltX * 2);
                ctx.ellipse(0, depthOffset, renderRadius, renderRadius, 0, 0, Math.PI * 2);

                const grad = ctx.createLinearGradient(-renderRadius, 0, renderRadius, 0);

                if (isDark) {
                    grad.addColorStop(0, '#333');
                    grad.addColorStop(0.2, '#DDD');
                    grad.addColorStop(0.5, '#666');
                    grad.addColorStop(0.8, '#DDD');
                    grad.addColorStop(1, '#333');
                } else {
                    grad.addColorStop(0, '#BBB');
                    grad.addColorStop(0.2, '#FFF');
                    grad.addColorStop(0.5, '#DDD');
                    grad.addColorStop(0.8, '#FFF');
                    grad.addColorStop(1, '#BBB');
                }

                ctx.fillStyle = grad;
                ctx.fill();
            }

            // Draw Face
            const faceOffset = layers * (coin.tiltX * 2);
            ctx.beginPath();
            ctx.ellipse(0, faceOffset, renderRadius, renderRadius, 0, 0, Math.PI * 2);

            const faceGrad = ctx.createRadialGradient(0, faceOffset, 10, 0, faceOffset, renderRadius);

            if (isDark) {
                faceGrad.addColorStop(0, '#222');
                faceGrad.addColorStop(0.7, '#111');
                faceGrad.addColorStop(0.95, '#FFF');
                faceGrad.addColorStop(1, '#111');
            } else {
                faceGrad.addColorStop(0, '#EEE');
                faceGrad.addColorStop(0.7, '#CCC');
                faceGrad.addColorStop(0.95, '#666');
                faceGrad.addColorStop(1, '#CCC');
            }

            ctx.fillStyle = faceGrad;
            ctx.fill();

            // Details
            ctx.save();
            ctx.clip();

            // Lines/Pattern
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
            ctx.lineWidth = 1.5;

            const time = Date.now() * 0.0005;

            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                const angle = (i / 20) * Math.PI * 2 + time + coin.rotation;
                ctx.moveTo(0, faceOffset);
                ctx.lineTo(
                    Math.cos(angle) * renderRadius,
                    Math.sin(angle) * renderRadius + faceOffset
                );
                ctx.stroke();
            }

            // Logo
            ctx.fillStyle = isDark ? '#E5E5E5' : '#1A1A1A';
            const fontSize = Math.round(renderRadius * 0.5);
            ctx.font = `bold ${fontSize}px Cinzel, serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isDark) {
                ctx.shadowColor = 'rgba(255,255,255,0.6)';
                ctx.shadowBlur = 20;
            } else {
                ctx.shadowColor = 'rgba(0,0,0,0.15)';
                ctx.shadowBlur = 10;
            }

            ctx.save();
            ctx.translate(0, faceOffset);
            ctx.rotate(Math.sin(time * 0.5) * 0.1);
            ctx.fillText('B', 0, fontSize * 0.05);
            ctx.restore();

            ctx.restore();
            ctx.restore();

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        document.addEventListener('mousemove', handleMouseMove as any);

        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            document.removeEventListener('mousemove', handleMouseMove as any);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />;
};

export default CoinCanvas;