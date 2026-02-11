'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

interface ImageData {
    id: string;
    url: string;
    thumbnailUrl?: string;
    category: string;
    description?: string;
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

    const currentImage = images[currentIndex];

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
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goNext, goPrev]);

    // Handle thumbnail visibility on mouse move near bottom
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

    // 3D flip animation variants
    const flipVariants = {
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

            {/* Category Badge */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-6 left-6 z-60"
            >
                <span className="text-[10px] font-medium tracking-[0.5em] text-[#00f0ff] uppercase bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                    {categoryTitle}
                </span>
            </motion.div>

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
                            alt={currentImage.description || categoryTitle}
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

            {/* Description */}
            {currentImage.description && (
                <motion.div
                    key={`desc-${currentImage.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 max-w-xl text-center"
                >
                    <p className="text-sm text-white/50 italic leading-relaxed px-6">
                        &ldquo;{currentImage.description}&rdquo;
                    </p>
                </motion.div>
            )}

            {/* Thumbnail Strip (appears on hover near bottom) */}
            <AnimatePresence>
                {showThumbnails && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-0 left-0 right-0 z-60 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4 px-6"
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
