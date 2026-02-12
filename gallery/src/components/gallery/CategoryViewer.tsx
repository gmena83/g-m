'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Home, Eye, EyeOff, Languages, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface ImageData {
    id: string;
    url: string;
    thumbnailUrl?: string;
    category: string;
    description?: string;
    descriptionEs?: string;
}

interface CategoryViewerProps {
    images: ImageData[];
    categoryTitle: string;
}

export function CategoryViewer({ images, categoryTitle }: CategoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 = prev, 1 = next
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [thumbnailTimeout, setThumbnailTimeout] = useState<NodeJS.Timeout | null>(null);

    // Feature State
    const [showDescription, setShowDescription] = useState(true);
    const [language, setLanguage] = useState<'en' | 'es'>('en');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const currentImage = images[currentIndex];

    // Reset audio when image changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);
        setIsLoadingAudio(false);
    }, [currentIndex]);

    const goTo = useCallback((index: number) => {
        if (index === currentIndex || index < 0 || index >= images.length) return;
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
    }, [currentIndex, images.length]);

    const goNext = useCallback(() => {
        if (currentIndex < images.length - 1) {
            setDirection(1);
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, images.length]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'Escape') window.location.href = '/';
            // Toggle controls shortcuts could be added here
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goNext, goPrev]);

    // Handle thumbnail visibility
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const threshold = window.innerHeight - 150;
        if (e.clientY > threshold) {
            setShowThumbnails(true);
            if (thumbnailTimeout) clearTimeout(thumbnailTimeout);
        } else {
            if (!thumbnailTimeout) {
                const timeout = setTimeout(() => {
                    setShowThumbnails(false);
                    setThumbnailTimeout(null);
                }, 1500);
                setThumbnailTimeout(timeout);
            }
        }
    }, [thumbnailTimeout]);

    // Toggle Audio Logic
    const toggleAudio = async () => {
        if (isPlaying) {
            if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
            return;
        }

        // Determine text to read
        const textToRead = language === 'en'
            ? currentImage.description
            : (currentImage.descriptionEs || "Descripción en español no disponible.");

        if (!textToRead) return;

        setIsLoadingAudio(true);

        try {
            // Check if we already have this audio helper?
            // For now, fetch from our new API
            const response = await fetch('/api/narrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToRead,
                    // Optional: voiceId can be passed here if we want different voices for different categories
                    // voiceData: { ... } 
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch audio');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => setIsPlaying(false);
            audio.play();
            setIsPlaying(true);
        } catch (error) {
            console.error('Audio playback failed:', error);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    // 3D flip animation variants
    const flipVariants: Variants = {
        enter: (dir: number) => ({
            rotateY: dir > 0 ? 90 : -90,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            rotateY: 0,
            opacity: 1,
            scale: 1,
            transition: {
                rotateY: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                opacity: { duration: 0.4, delay: 0.1 },
                scale: { duration: 0.5 },
            },
        },
        exit: (dir: number) => ({
            rotateY: dir > 0 ? -90 : 90,
            opacity: 0,
            scale: 0.95,
            transition: {
                rotateY: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                opacity: { duration: 0.3 },
                scale: { duration: 0.4 },
            },
        }),
    };

    if (!currentImage) return null;

    const currentDescription = language === 'en'
        ? currentImage.description
        : (currentImage.descriptionEs || "Descripción en español no disponible.");

    return (
        <div
            className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-hidden"
            onMouseMove={handleMouseMove}
            style={{ perspective: '1200px' }}
        >
            {/* Back to Homepage Button */}
            <Link
                href="/"
                className="absolute top-6 right-6 z-60 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.1] transition-all duration-300"
            >
                <Home size={18} />
                <span className="text-sm font-medium">Home</span>
            </Link>

            {/* HEADER AREA: Title + Controls */}
            <div className="absolute top-6 left-6 z-60 flex flex-col gap-4 items-start">

                {/* Category Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="text-xl font-light tracking-[0.4em] text-[#00f0ff] uppercase bg-white/5 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-lg shadow-[#00f0ff]/10">
                        {categoryTitle}
                    </span>
                </motion.div>

                {/* Controls Bar */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2"
                >
                    {/* Toggle Description Visibility */}
                    <button
                        onClick={() => setShowDescription(!showDescription)}
                        className={`p-2 rounded-full transition-colors ${showDescription ? 'text-[#00f0ff] bg-white/10' : 'text-white/50 hover:text-white'}`}
                        title={showDescription ? "Hide Description" : "Show Description"}
                    >
                        {showDescription ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>

                    <div className="w-px h-4 bg-white/10" />

                    {/* Check if description exists before enabling lang/audio */}
                    {currentDescription ? (
                        <>
                            {/* Language Toggle */}
                            <button
                                onClick={() => setLanguage(prev => prev === 'en' ? 'es' : 'en')}
                                className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium tracking-wider text-white hover:bg-white/10 transition-colors"
                            >
                                <Languages size={14} className="text-[#ff00aa]" />
                                <span className={language === 'en' ? 'text-white' : 'text-white/50'}>EN</span>
                                <span className="text-white/20">|</span>
                                <span className={language === 'es' ? 'text-white' : 'text-white/50'}>ES</span>
                            </button>

                            <div className="w-px h-4 bg-white/10" />

                            {/* Audio Toggle */}
                            <button
                                onClick={toggleAudio}
                                disabled={isLoadingAudio}
                                className={`p-2 rounded-full transition-colors ${isPlaying ? 'text-[#ff00aa] bg-white/10' : 'text-white/50 hover:text-white'}`}
                                title={isPlaying ? "Stop Narration" : "Play Narration"}
                            >
                                {isLoadingAudio ? (
                                    <Loader2 size={18} className="animate-spin text-[#ff00aa]" />
                                ) : isPlaying ? (
                                    <Volume2 size={18} />
                                ) : (
                                    <VolumeX size={18} />
                                )}
                            </button>
                        </>
                    ) : (
                        <span className="text-xs text-white/30 px-2 italic">No description</span>
                    )}
                </motion.div>
            </div>

            {/* Image Counter */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-60">
                <span className="text-[11px] font-light tracking-widest text-white/40">
                    {currentIndex + 1} / {images.length}
                </span>
            </div>

            {/* Main Image with 3D Flip */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentImage.id}
                        custom={direction}
                        variants={flipVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-0"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <Image
                            src={currentImage.url}
                            alt={currentDescription || categoryTitle}
                            fill
                            className="object-contain"
                            priority
                            sizes="100vw"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,15,0.3)_100%)]" />

            {/* Left Arrow */}
            {currentIndex > 0 && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.1, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goPrev}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-60 w-14 h-14 flex items-center justify-center rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.1] cursor-pointer transition-colors"
                    aria-label="Previous image"
                >
                    <ChevronLeft size={28} />
                </motion.button>
            )}

            {/* Right Arrow */}
            {currentIndex < images.length - 1 && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.1, x: 3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goNext}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-60 w-14 h-14 flex items-center justify-center rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.1] cursor-pointer transition-colors"
                    aria-label="Next image"
                >
                    <ChevronRight size={28} />
                </motion.button>
            )}

            {/* Description - Styled Block */}
            <AnimatePresence>
                {showDescription && currentDescription && (
                    <motion.div
                        key={`desc-${currentImage.id}-${language}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.2 }}
                        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-6 pointer-events-none"
                    >
                        <div className="bg-black/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-2xl">
                            <p className="text-base text-white/90 leading-relaxed font-light text-center">
                                &ldquo;{currentDescription}&rdquo;
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Thumbnail Strip (appears on hover near bottom) */}
            <AnimatePresence>
                {showThumbnails && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-0 left-0 right-0 z-60 bg-gradient-to-t from-black/90 to-transparent pt-12 pb-6 px-6"
                    >
                        <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-4xl mx-auto py-2">
                            {images.map((img, idx) => (
                                <motion.button
                                    key={img.id}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => goTo(idx)}
                                    className={`
                                        relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer
                                        transition-all duration-300 border-2
                                        ${idx === currentIndex
                                            ? 'border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                                            : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                                        }
                                    `}
                                    aria-label={`View image ${idx + 1}`}
                                >
                                    <Image
                                        src={img.thumbnailUrl || img.url}
                                        alt={`Thumbnail ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
