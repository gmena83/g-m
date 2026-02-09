'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function Logo() {
    return (
        <Link href="/" className="fixed top-6 left-6 z-50 group">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative"
            >
                {/* Glitch layers */}
                <span className="absolute inset-0 text-2xl font-light tracking-[0.3em] text-[#00f0ff] opacity-0 group-hover:opacity-100 group-hover:animate-pulse blur-[1px] transition-opacity duration-300" aria-hidden="true">
                    G&M
                </span>
                <span className="absolute inset-0 text-2xl font-light tracking-[0.3em] text-[#ff00aa] opacity-0 group-hover:opacity-70 translate-x-[2px] translate-y-[-1px] transition-all duration-300" aria-hidden="true">
                    G&M
                </span>

                {/* Main text */}
                <motion.div
                    className="relative"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    <span className="text-2xl font-light tracking-[0.3em] text-white">
                        G<span className="text-[#00f0ff]">&</span>M
                    </span>
                    <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '100%', opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="block h-[1px] bg-gradient-to-r from-[#00f0ff] via-white to-[#ff00aa] mt-1"
                    />
                    <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="block text-[10px] tracking-[0.5em] text-white/40 mt-1 font-medium uppercase"
                    >
                        Photography
                    </motion.span>
                </motion.div>
            </motion.div>
        </Link>
    );
}
