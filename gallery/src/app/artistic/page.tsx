'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';
import { ExpandingMenu } from '@/components/ui/ExpandingMenu';
import { PasswordGate } from '@/components/ui/PasswordGate';
import { CinematicScroll } from '@/components/gallery/CinematicScroll';
import { getImagesByCategory, ImageData } from '@/lib/galleryService';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function ArtisticPage() {
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [images, setImages] = useState<ImageData[]>([]);
    const [imagesLoading, setImagesLoading] = useState(false);

    useEffect(() => {
        const access = sessionStorage.getItem('intimate-access');
        if (access === 'granted') {
            setHasAccess(true);
        }
        setIsLoading((prev) => {
            if (prev) return false;
            return prev;
        });
    }, []);

    useEffect(() => {
        if (hasAccess) {
            setImagesLoading(true);
            // Fetch both 'artistic' and 'intimate' categories for backwards compat
            Promise.all([
                getImagesByCategory('artistic'),
                getImagesByCategory('intimate'),
            ]).then(([artistic, intimate]) => {
                setImages([...artistic, ...intimate]);
                setImagesLoading(false);
            }).catch(() => setImagesLoading(false));
        }
    }, [hasAccess]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-[#ff00aa] border-t-transparent rounded-full"
                />
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

    return (
        <main className="relative min-h-screen">
            <Logo />
            <ExpandingMenu />

            {/* Category Header */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40">
                <span className="text-[10px] font-medium tracking-[0.5em] text-[#ff00aa] uppercase bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                    Artistic
                </span>
            </div>

            {images.length > 0 ? (
                <CinematicScroll images={images} />
            ) : (
                <div className="h-screen flex items-center justify-center bg-[#0a0a0f] text-white/40">
                    No artistic images found
                </div>
            )}

            {/* Footer */}
            <footer className="relative z-10 py-20 text-center bg-[#0a0a0f]">
                <p className="text-xs tracking-[0.5em] text-white/20 uppercase">
                    G&M Photography © {new Date().getFullYear()}
                </p>
            </footer>
        </main>
    );
}
