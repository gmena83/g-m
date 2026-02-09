'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useVoiceNarration } from '@/hooks/useVoiceNarration';
import { GlassCard } from '@/components/ui/GlassCard';

interface ImageViewerProps {
    imageUrl: string;
    description?: string;
    category: string;
    onClose?: () => void;
}

export function ImageViewer({ imageUrl, description, category, onClose }: ImageViewerProps) {
    const router = useRouter();
    const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
    const { isPlaying, isPaused, isSupported, toggle, stop } = useVoiceNarration();

    const handleClose = () => {
        stop();
        if (onClose) {
            onClose();
        } else {
            router.back();
        }
    };

    const handleNarration = () => {
        if (description) {
            toggle(description);
        }
    };

    // Stop narration on unmount
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0a0a0f]"
        >
            {/* Full-screen Image */}
            <motion.div
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0"
            >
                <Image
                    src={imageUrl}
                    alt={description || 'Full size image'}
                    fill
                    className="object-contain"
                    priority
                    sizes="100vw"
                />
            </motion.div>

            {/* Vignette Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,15,0.4)_100%)]" />

            {/* Close Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onClick={handleClose}
                className="absolute top-6 right-6 z-60 w-12 h-12 flex items-center justify-center rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-white cursor-pointer hover:bg-white/[0.1] transition-colors"
                aria-label="Close"
            >
                <X size={24} />
            </motion.button>

            {/* Category Badge */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute top-6 left-6 z-60"
            >
                <span className="text-[10px] font-medium tracking-[0.5em] text-[#00f0ff] uppercase bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                    {category}
                </span>
            </motion.div>

            {/* Bottom Controls & Description */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-0 left-0 right-0 p-6"
            >
                <div className="max-w-3xl mx-auto">
                    {/* Narration Button */}
                    <div className="flex justify-center mb-4 gap-4">
                        {isSupported && description && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNarration}
                                className={`
                  flex items-center gap-3 px-6 py-3 rounded-full
                  bg-white/[0.05] backdrop-blur-xl border border-white/[0.1]
                  text-white cursor-pointer transition-all duration-300
                  ${isPlaying && !isPaused ? 'border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.3)]' : ''}
                  hover:bg-white/[0.1]
                `}
                                aria-label={isPlaying ? 'Stop narration' : 'Play narration'}
                            >
                                {isPlaying && !isPaused ? (
                                    <>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                            <Volume2 size={20} className="text-[#00f0ff]" />
                                        </motion.div>
                                        <span className="text-sm font-medium">Stop Narration</span>
                                    </>
                                ) : (
                                    <>
                                        <VolumeX size={20} />
                                        <span className="text-sm font-medium">Listen to Story</span>
                                    </>
                                )}
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsDescriptionVisible(!isDescriptionVisible)}
                            className="px-6 py-3 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-white cursor-pointer hover:bg-white/[0.1] transition-all text-sm font-medium"
                        >
                            {isDescriptionVisible ? 'Hide Story' : 'Read Story'}
                        </motion.button>
                    </div>

                    {/* Description Panel */}
                    <AnimatePresence>
                        {isDescriptionVisible && description && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: 20, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <GlassCard intensity="strong" glow="cyan" hover={false} className="p-6">
                                    <p className="text-white/80 text-center leading-relaxed italic">
                                        "{description}"
                                    </p>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
