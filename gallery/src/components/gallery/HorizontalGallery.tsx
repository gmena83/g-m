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

interface HorizontalGalleryProps {
    images: ImageData[];
    title?: string;
}

export function HorizontalGallery({ images, title }: HorizontalGalleryProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0, 0.2], [50, 0]);

    return (
        <motion.section
            ref={containerRef}
            style={{ opacity, y }}
            className="relative py-8"
        >
            {title && (
                <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="text-xs font-medium tracking-[0.5em] text-white/40 uppercase mb-6 pl-6"
                >
                    {title}
                </motion.h2>
            )}

            <div className="horizontal-scroll pl-6">
                {images.map((image, index) => (
                    <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="relative"
                    >
                        <Link
                            href={`/image/${image.id}`}
                            className="block relative group cursor-pointer"
                        >
                            <div className="relative w-[70vw] md:w-[50vw] lg:w-[35vw] h-[50vh] overflow-hidden rounded-lg">
                                <Image
                                    src={image.thumbnailUrl || image.url}
                                    alt={image.description || 'Gallery image'}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    sizes="(max-width: 768px) 70vw, (max-width: 1200px) 50vw, 35vw"
                                />

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Glow border on hover */}
                                <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-[#00f0ff]/50 transition-colors duration-300" />

                                {/* Category tag */}
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    className="absolute bottom-4 left-4 text-[10px] font-medium tracking-[0.3em] text-white/60 uppercase bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full whitespace-nowrap"
                                >
                                    {image.category}
                                </motion.span>
                            </div>
                        </Link>
                    </motion.div>
                ))}

                {/* End spacer */}
                <div className="w-6 flex-shrink-0" />
            </div>
        </motion.section>
    );
}
