'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

interface ImageData {
    id: string;
    url: string;
    thumbnailUrl?: string;
    category: string;
    description?: string;
}

interface CinematicScrollProps {
    images: ImageData[];
}

export function CinematicScroll({ images }: CinematicScrollProps) {
    return (
        <div className="relative">
            {images.map((image, index) => (
                <CinematicSlide
                    key={image.id}
                    image={image}
                    index={index}
                    total={images.length}
                />
            ))}
        </div>
    );
}

interface CinematicSlideProps {
    image: ImageData;
    index: number;
    total: number;
}

function CinematicSlide({ image, index }: CinematicSlideProps) {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100]);

    return (
        <motion.section
            ref={ref}
            className="cinematic-section relative overflow-hidden"
        >
            {/* Background Image with Parallax */}
            <motion.div
                style={{ scale }}
                className="absolute inset-0"
            >
                <Image
                    src={image.url}
                    alt={image.description || 'Gallery image'}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="100vw"
                />
            </motion.div>

            {/* Gradient Overlays */}
            <div className="image-overlay" />
            <div className="image-overlay-subtle" />

            {/* Content */}
            <motion.div
                style={{ opacity, y }}
                className="relative z-10 flex items-end justify-center h-full pb-20"
            >
                <Link
                    href={`/image/${image.id}`}
                    className="group text-center"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="glass-strong px-10 py-8 rounded-full cursor-pointer min-w-[280px]"
                    >
                        <span className="text-[10px] font-medium tracking-[0.5em] text-[#00f0ff] uppercase block mb-3 whitespace-nowrap mr-[-0.5em]">
                            {image.category}
                        </span>
                        <span className="text-sm text-white/60 group-hover:text-white transition-colors whitespace-nowrap">
                            View Full Image →
                        </span>
                    </motion.div>
                </Link>
            </motion.div>

            {/* Scroll Indicator (only on first slide) */}
            {index === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
                    >
                        <motion.div className="w-1 h-2 bg-white/50 rounded-full" />
                    </motion.div>
                </motion.div>
            )}
        </motion.section>
    );
}
