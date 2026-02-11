'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CategoryViewer } from '@/components/gallery/CategoryViewer';
import { getImagesByCategory, ImageData } from '@/lib/galleryService';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const categoryTitles: Record<string, string> = {
    events: 'Events',
    portraits: 'Portraits',
    nature: 'Nature',
    street: 'Street',
};

export default function CategoryPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(true);

    const title = categoryTitles[slug];

    useEffect(() => {
        if (!title) return;

        const fetchImages = async () => {
            try {
                const data = await getImagesByCategory(slug);
                setImages(data);
            } catch (error) {
                console.error('Error fetching category images:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [slug, title]);

    // Invalid category
    if (!title) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center">
                    <h1 className="text-2xl font-light text-white mb-4">Category not found</h1>
                    <Link
                        href="/"
                        className="text-[#00f0ff] hover:text-white transition-colors"
                    >
                        ← Return to gallery
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin" />
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center">
                    <h1 className="text-2xl font-light text-white mb-2">{title}</h1>
                    <p className="text-white/40 mb-6">No images in this collection yet</p>
                    <Link
                        href="/"
                        className="text-[#00f0ff] hover:text-white transition-colors"
                    >
                        ← Return to gallery
                    </Link>
                </div>
            </div>
        );
    }

    return <CategoryViewer images={images} categoryTitle={title} />;
}
