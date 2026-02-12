'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';
import { ExpandingMenu } from '@/components/ui/ExpandingMenu';
import { PasswordGate } from '@/components/ui/PasswordGate';
import { CategoryViewer } from '@/components/gallery/CategoryViewer';
import { getImagesByCategory, ImageData } from '@/lib/galleryService';
import { Loader2 } from 'lucide-react';

export default function ArtisticPage() {
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [images, setImages] = useState<ImageData[]>([]);
    const [imagesLoading, setImagesLoading] = useState(false);

    useEffect(() => {
        // Check for session access
        const access = sessionStorage.getItem('intimate-access');
        if (access === 'granted') {
            setHasAccess(true);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (hasAccess) {
            setImagesLoading(true);
            // Fetch both 'artistic' and 'intimate' categories
            Promise.all([
                getImagesByCategory('artistic'),
                getImagesByCategory('intimate'),
            ]).then(([artistic, intimate]) => {
                // Combine and sort by date descending
                const combined = [...artistic, ...intimate].sort((a, b) =>
                    b.createdAt.getTime() - a.createdAt.getTime()
                );
                setImages(combined);
                setImagesLoading(false);
            }).catch((err) => {
                console.error("Failed to load images", err);
                setImagesLoading(false);
            });
        }
    }, [hasAccess]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <Loader2 className="w-8 h-8 text-[#ff00aa] animate-spin" />
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <>
                <Logo />
                <ExpandingMenu />
                <PasswordGate
                    onSuccess={() => setHasAccess(true)}
                    title="Artistic Collection"
                />
            </>
        );
    }

    if (imagesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <Loader2 className="w-8 h-8 text-[#ff00aa] animate-spin" />
            </div>
        );
    }

    // Use standard CategoryViewer layout
    // passing the combined images and the "Artistic" title
    return <CategoryViewer images={images} categoryTitle="Artistic" />;
}
