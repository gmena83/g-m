'use client';

import { ImageViewer } from '@/components/gallery/ImageViewer';
import { getImageById } from '@/lib/mockData';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ImagePage() {
    const params = useParams();
    const imageId = params.id as string;
    const image = getImageById(imageId);

    if (!image) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen flex items-center justify-center bg-[#0a0a0f]"
            >
                <div className="text-center">
                    <h1 className="text-2xl font-light text-white mb-4">Image not found</h1>
                    <Link
                        href="/"
                        className="text-[#00f0ff] hover:text-white transition-colors"
                    >
                        ← Return to gallery
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <ImageViewer
            imageUrl={image.url}
            description={image.description}
            category={image.category}
        />
    );
}
