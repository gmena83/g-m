'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Filter } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAllImages, ImageData } from '@/lib/galleryService';
import { updateImageCategory, Category } from '@/lib/categoryService';

interface ImageRelabelerProps {
    categories: Category[];
}

export function ImageRelabeler({ categories }: ImageRelabelerProps) {
    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState<string>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchImages = async () => {
        setLoading(true);
        const data = await getAllImages();
        setImages(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleCategoryChange = async (imageId: string, newCategory: string) => {
        setUpdatingId(imageId);
        const success = await updateImageCategory(imageId, newCategory);
        if (success) {
            setImages((prev) =>
                prev.map((img) =>
                    img.id === imageId ? { ...img, category: newCategory } : img
                )
            );
        }
        setUpdatingId(null);
    };

    const filtered = filterCat === 'all'
        ? images
        : images.filter((img) => img.category === filterCat);

    const getCategoryColor = (slug: string): string => {
        const colors: Record<string, string> = {
            events: '#00f0ff',
            portraits: '#a78bfa',
            nature: '#34d399',
            street: '#fbbf24',
            artistic: '#ff00aa',
        };
        return colors[slug] || '#00f0ff';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#00f0ff] animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Filter Bar */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Filter size={14} className="text-white/40" />
                <button
                    onClick={() => setFilterCat('all')}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${filterCat === 'all'
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-white/40 hover:text-white/60'
                        }`}
                >
                    All ({images.length})
                </button>
                {categories.map((cat) => {
                    const count = images.filter((i) => i.category === cat.slug).length;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setFilterCat(cat.slug)}
                            className={`px-3 py-1 rounded-full text-xs transition-all ${filterCat === cat.slug
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            {cat.name} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Thumbnail Grid */}
            {filtered.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">
                    No images found{filterCat !== 'all' ? ` in "${filterCat}"` : ''}
                </p>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {filtered.map((img) => (
                        <motion.div
                            key={img.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative"
                        >
                            <div
                                className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all"
                                style={{
                                    borderColor: getCategoryColor(img.category) + '40',
                                }}
                            >
                                <Image
                                    src={img.thumbnailUrl || img.url}
                                    alt={img.description || 'Gallery image'}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 12vw"
                                />

                                {/* Loading overlay */}
                                {updatingId === img.id && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Loader2 size={16} className="animate-spin text-[#00f0ff]" />
                                    </div>
                                )}
                            </div>

                            {/* Category Dropdown */}
                            <select
                                value={img.category}
                                onChange={(e) => handleCategoryChange(img.id, e.target.value)}
                                disabled={updatingId === img.id}
                                className="w-full mt-1 bg-white/[0.05] border border-white/[0.1] rounded-md px-1.5 py-1 text-[10px] text-white/70 focus:outline-none focus:border-[#00f0ff]/50 cursor-pointer disabled:opacity-50 appearance-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 4px center',
                                }}
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.slug} style={{ backgroundColor: '#0a0a0f', color: '#ffffff' }}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
