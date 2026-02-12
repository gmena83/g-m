'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

/* ── 8-bit pixel sprites for background animation ── */
function PixelCamera({ x, y, delay, size = 24 }: { x: string; y: string; delay: number; size?: number }) {
    return (
        <motion.svg
            viewBox="0 0 16 16"
            width={size}
            height={size}
            className="absolute text-[#00f0ff]"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 0.15, 0.15, 0], y: [20, 0, 0, -20] }}
            transition={{ duration: 8, delay, repeat: Infinity, ease: 'linear' }}
        >
            {/* 8-bit camera body */}
            <rect x="1" y="5" width="14" height="9" fill="currentColor" />
            <rect x="5" y="3" width="4" height="2" fill="currentColor" />
            {/* lens */}
            <rect x="5" y="7" width="6" height="6" fill="#0a0a0f" />
            <rect x="6" y="8" width="4" height="4" fill="currentColor" opacity="0.4" />
            <rect x="7" y="9" width="2" height="2" fill="#0a0a0f" />
            {/* flash */}
            <rect x="12" y="6" width="2" height="2" fill="#ff00aa" opacity="0.6" />
        </motion.svg>
    );
}

function PixelFlash({ x, y, delay }: { x: string; y: string; delay: number }) {
    return (
        <motion.svg
            viewBox="0 0 8 12"
            width={12}
            height={18}
            className="absolute"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.2, 0, 0.2, 0], scale: [0.5, 1, 0.5, 1, 0.5] }}
            transition={{ duration: 6, delay, repeat: Infinity }}
        >
            {/* 8-bit lightning bolt / flash */}
            <rect x="4" y="0" width="2" height="3" fill="#fbbf24" />
            <rect x="2" y="3" width="4" height="2" fill="#fbbf24" />
            <rect x="3" y="5" width="2" height="3" fill="#fbbf24" />
            <rect x="1" y="8" width="4" height="2" fill="#fbbf24" />
            <rect x="2" y="10" width="2" height="2" fill="#fbbf24" />
        </motion.svg>
    );
}

function PixelFilm({ x, y, delay }: { x: string; y: string; delay: number }) {
    return (
        <motion.svg
            viewBox="0 0 10 16"
            width={14}
            height={22}
            className="absolute text-[#ff00aa]"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, rotate: -10 }}
            animate={{ opacity: [0, 0.12, 0.12, 0], y: [30, 0, 0, -30], rotate: [-10, 0, 0, 10] }}
            transition={{ duration: 10, delay, repeat: Infinity, ease: 'linear' }}
        >
            {/* 8-bit film strip */}
            <rect x="0" y="0" width="10" height="16" fill="currentColor" />
            <rect x="1" y="1" width="2" height="2" fill="#0a0a0f" />
            <rect x="7" y="1" width="2" height="2" fill="#0a0a0f" />
            <rect x="3" y="4" width="4" height="4" fill="#0a0a0f" />
            <rect x="1" y="9" width="2" height="2" fill="#0a0a0f" />
            <rect x="7" y="9" width="2" height="2" fill="#0a0a0f" />
            <rect x="1" y="13" width="2" height="2" fill="#0a0a0f" />
            <rect x="7" y="13" width="2" height="2" fill="#0a0a0f" />
        </motion.svg>
    );
}

/* ── Old-timey bellows camera SVG icon (thick pen sketch style) ── */
function VintageCameraIcon({ size = 72 }: { size?: number }) {
    return (
        <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#00f0ff]"
        >
            {/* Tripod legs */}
            <line x1="22" y1="50" x2="14" y2="62" />
            <line x1="32" y1="50" x2="32" y2="62" />
            <line x1="42" y1="50" x2="50" y2="62" />

            {/* Camera body (box) */}
            <rect x="10" y="24" width="44" height="26" rx="2" strokeWidth="2.8" />

            {/* Bellows (accordion folds) */}
            <line x1="18" y1="26" x2="18" y2="48" strokeWidth="1.5" opacity="0.5" />
            <line x1="24" y1="26" x2="24" y2="48" strokeWidth="1.5" opacity="0.5" />
            <line x1="30" y1="26" x2="30" y2="48" strokeWidth="1.5" opacity="0.5" />

            {/* Lens barrel */}
            <circle cx="42" cy="37" r="8" strokeWidth="2.5" />
            <circle cx="42" cy="37" r="4" strokeWidth="2" />
            <circle cx="42" cy="37" r="1.5" fill="currentColor" stroke="none" />

            {/* Viewfinder on top */}
            <rect x="14" y="16" width="16" height="8" rx="1.5" strokeWidth="2.2" />
            <line x1="22" y1="16" x2="22" y2="12" strokeWidth="2" />
            <line x1="18" y1="12" x2="26" y2="12" strokeWidth="2" />

            {/* Flash tray */}
            <line x1="46" y1="24" x2="46" y2="18" strokeWidth="2" />
            <rect x="42" y="14" width="8" height="4" rx="1" strokeWidth="1.8" />
        </svg>
    );
}

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!auth) {
            setError('Firebase not configured. See .env.local');
            return;
        }

        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/admin/dashboard');
        } catch (err: unknown) {
            setError('Invalid credentials. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Show configuration notice if Firebase is not set up
    if (!isFirebaseConfigured) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <GlassCard intensity="strong" glow="magenta" hover={false} className="w-full max-w-xl p-8">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ff00aa]/10 flex items-center justify-center">
                            <AlertTriangle size={32} className="text-[#ff00aa]" />
                        </div>
                        <h1 className="text-2xl font-light text-center text-white mb-4">
                            Firebase Not Configured
                        </h1>
                        <p className="text-sm text-center text-white/60 mb-6">
                            To enable admin features, add your Firebase credentials to:
                        </p>
                        <code className="block bg-black/30 rounded-lg p-3 text-[#00f0ff] text-xs text-center mb-6">
                            gallery/.env.local
                        </code>
                        <p className="text-xs text-white/40 text-center mb-6">
                            Required: NEXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, APP_ID
                        </p>
                        <Link
                            href="/"
                            className="text-sm text-white/40 hover:text-white transition-colors"
                        >
                            ← Back to Gallery
                        </Link>
                    </GlassCard>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f] relative overflow-hidden">
            {/* ── 8-bit Photography Background Animation ── */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                {/* floating pixel cameras */}
                <PixelCamera x="8%" y="15%" delay={0} size={28} />
                <PixelCamera x="85%" y="10%" delay={2} size={22} />
                <PixelCamera x="72%" y="70%" delay={4} size={26} />
                <PixelCamera x="15%" y="75%" delay={6} size={20} />
                <PixelCamera x="50%" y="85%" delay={1} size={24} />
                <PixelCamera x="92%" y="45%" delay={3} size={18} />
                <PixelCamera x="5%" y="45%" delay={5} size={30} />

                {/* floating pixel flashes */}
                <PixelFlash x="25%" y="20%" delay={1.5} />
                <PixelFlash x="78%" y="35%" delay={3.5} />
                <PixelFlash x="60%" y="80%" delay={5.5} />
                <PixelFlash x="35%" y="60%" delay={7} />

                {/* floating pixel film strips */}
                <PixelFilm x="18%" y="55%" delay={2.5} />
                <PixelFilm x="80%" y="55%" delay={0.5} />
                <PixelFilm x="45%" y="12%" delay={4.5} />
                <PixelFilm x="65%" y="40%" delay={6.5} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full"
                style={{ maxWidth: '960px' }}
            >
                <GlassCard intensity="strong" glow="cyan" hover={false} className="w-full" style={{ padding: '96px' }}>
                    {/* ── Header Block (50% larger) ── */}
                    <div className="text-center mb-14">
                        {/* Old-timey camera icon — centered above title */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="flex justify-center mb-8"
                        >
                            <VintageCameraIcon size={96} />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-5xl font-light text-white mb-5 tracking-wide"
                        >
                            Admin Portal
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-base text-white/50 tracking-[0.25em] uppercase font-light px-4"
                        >
                            G&M Photography Management
                        </motion.p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field — icon only, no placeholder text label */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="relative"
                        >
                            <Mail
                                size={22}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00f0ff]/60"
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-label="Email address"
                                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl px-14 py-4 text-lg text-white text-center focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all"
                                required
                                autoFocus
                            />
                        </motion.div>

                        {/* Password Field — icon only, no placeholder text label */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="relative"
                        >
                            <Lock
                                size={22}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ff00aa]/60"
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                aria-label="Password"
                                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl px-14 py-4 text-lg text-white text-center focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all"
                                required
                            />
                        </motion.div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00f0ff]/80 text-[#0a0a0f] font-semibold py-4 rounded-2xl cursor-pointer shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg mt-8"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </motion.button>
                    </form>

                    {/* Back link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-6 text-center"
                    >
                        <Link
                            href="/"
                            className="text-sm text-white/40 hover:text-white transition-colors"
                        >
                            ← Back to Gallery
                        </Link>
                    </motion.div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
