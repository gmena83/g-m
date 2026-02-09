'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface PasswordGateProps {
    onSuccess: () => void;
    title?: string;
}

// Password is checked client-side for this simple case
// For production, use middleware or server-side validation
const CORRECT_PASSWORD = 'Phenom21!FIRE';

export function PasswordGate({ onSuccess, title = 'Private Collection' }: PasswordGateProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password === CORRECT_PASSWORD) {
            // Store access in sessionStorage
            sessionStorage.setItem('intimate-access', 'granted');
            onSuccess();
        } else {
            setError('Access denied');
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            setTimeout(() => setError(''), 3000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]"
        >
            <motion.div
                animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
            >
                <GlassCard
                    intensity="strong"
                    glow="magenta"
                    hover={false}
                    className="w-full max-w-md p-8"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ff00aa]/10 flex items-center justify-center"
                    >
                        <Lock size={32} className="text-[#ff00aa]" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-light text-center text-white mb-2"
                    >
                        {title}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-center text-white/40 mb-8"
                    >
                        This section contains private content. Please enter the password to continue.
                    </motion.p>

                    <form onSubmit={handleSubmit}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="relative mb-4"
                        >
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-[#ff00aa]/50 focus:ring-1 focus:ring-[#ff00aa]/30 transition-all"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </motion.div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[#ff00aa] text-sm text-center mb-4"
                            >
                                {error}
                            </motion.p>
                        )}

                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#ff00aa] to-[#ff00aa]/80 text-white font-medium py-3 rounded-xl cursor-pointer shadow-[0_0_30px_rgba(255,0,170,0.3)] hover:shadow-[0_0_40px_rgba(255,0,170,0.5)] transition-shadow"
                        >
                            Enter Gallery
                        </motion.button>
                    </form>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
}
