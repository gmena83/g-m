'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Camera, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

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
                        <a
                            href="/"
                            className="block text-center text-sm text-white/40 hover:text-white transition-colors"
                        >
                            ← Back to Gallery
                        </a>
                    </GlassCard>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <GlassCard intensity="strong" glow="cyan" hover={false} className="w-full max-w-2xl p-16">
                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-24 h-24 mx-auto mb-10 rounded-full bg-[#00f0ff]/10 flex items-center justify-center border border-[#00f0ff]/20"
                    >
                        <Camera size={48} className="text-[#00f0ff]" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-light text-center text-white mb-4 tracking-wide"
                    >
                        Admin Portal
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-center text-white/50 mb-12 tracking-[0.2em] uppercase font-light"
                    >
                        G&M Photography Management
                    </motion.p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="relative"
                        >
                            <Mail
                                size={20}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40"
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl px-6 py-4 pl-14 text-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all"
                                required
                                autoFocus
                            />
                        </motion.div>

                        {/* Password Field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="relative"
                        >
                            <Lock
                                size={20}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40"
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl px-6 py-4 pl-14 text-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all"
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
                        <a
                            href="/"
                            className="text-sm text-white/40 hover:text-white transition-colors"
                        >
                            ← Back to Gallery
                        </a>
                    </motion.div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
