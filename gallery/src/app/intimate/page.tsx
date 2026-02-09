'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';
import { ExpandingMenu } from '@/components/ui/ExpandingMenu';
import { PasswordGate } from '@/components/ui/PasswordGate';
import { CinematicScroll } from '@/components/gallery/CinematicScroll';
import { motion } from 'framer-motion';

// Mock intimate images (in production, these would come from Firebase with proper access controls)
const intimateImages = [
    {
        id: 'int-1',
        url: '/images/intimate-1.jpg',
        category: 'intimate' as const,
        description: 'The human form, rendered in light and shadow, speaks to something primal within us. A celebration of vulnerability, of trust, of the extraordinary beauty hidden in the ordinary.',
        createdAt: new Date('2024-03-01'),
    },
    {
        id: 'int-2',
        url: '/images/intimate-2.jpg',
        category: 'intimate' as const,
        description: 'In the quiet spaces between heartbeats, the body tells stories words cannot express. Each curve a verse, each shadow a secret.',
        createdAt: new Date('2024-03-05'),
    },
];

export default function IntimatePage() {
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user already has access from this session
        const access = sessionStorage.getItem('intimate-access');
        if (access === 'granted') {
            setHasAccess(true);
        }
        setIsLoading(false);
    }, []);

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
                    title="Intimate Collection"
                />
            </>
        );
    }

    return (
        <main className="relative min-h-screen">
            <Logo />
            <ExpandingMenu />

            {/* Category Header */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40">
                <span className="text-[10px] font-medium tracking-[0.5em] text-[#ff00aa] uppercase bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                    Intimate
                </span>
            </div>

            {/* Cinematic Gallery */}
            <CinematicScroll images={intimateImages} />

            {/* Footer */}
            <footer className="relative z-10 py-20 text-center bg-[#0a0a0f]">
                <p className="text-xs tracking-[0.5em] text-white/20 uppercase">
                    G&M Photography © {new Date().getFullYear()}
                </p>
            </footer>
        </main>
    );
}
