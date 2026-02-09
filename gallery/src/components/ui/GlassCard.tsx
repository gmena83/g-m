'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
    intensity?: 'light' | 'medium' | 'strong';
    glow?: 'cyan' | 'magenta' | 'none';
    hover?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className = '', intensity = 'medium', glow = 'none', hover = true, ...props }, ref) => {
        const intensityClasses = {
            light: 'bg-white/[0.03] backdrop-blur-md border-white/[0.05]',
            medium: 'bg-white/[0.05] backdrop-blur-xl border-white/[0.1]',
            strong: 'bg-white/[0.08] backdrop-blur-2xl border-white/[0.15]',
        };

        const glowClasses = {
            none: '',
            cyan: 'shadow-[0_0_30px_rgba(0,240,255,0.15)]',
            magenta: 'shadow-[0_0_30px_rgba(255,0,170,0.15)]',
        };

        return (
            <motion.div
                ref={ref}
                className={`
          ${intensityClasses[intensity]}
          ${glowClasses[glow]}
          border rounded-2xl
          ${className}
        `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={hover ? {
                    scale: 1.02,
                    boxShadow: glow === 'cyan'
                        ? '0 0 40px rgba(0,240,255,0.25)'
                        : glow === 'magenta'
                            ? '0 0 40px rgba(255,0,170,0.25)'
                            : '0 0 20px rgba(255,255,255,0.1)'
                } : undefined}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

GlassCard.displayName = 'GlassCard';
