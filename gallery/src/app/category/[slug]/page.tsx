import { Logo } from '@/components/ui/Logo';
import { ExpandingMenu } from '@/components/ui/ExpandingMenu';
import { CinematicScroll } from '@/components/gallery/CinematicScroll';
import { getImagesByCategory } from '@/lib/mockData';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

const categoryTitles: Record<string, string> = {
    events: 'Events',
    portraits: 'Portraits',
    nature: 'Nature',
    street: 'Street',
};

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;

    if (!['events', 'portraits', 'nature', 'street'].includes(slug)) {
        notFound();
    }

    const images = getImagesByCategory(slug);

    return (
        <main className="relative min-h-screen">
            <Logo />
            <ExpandingMenu />

            {/* Category Header */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40">
                <span className="text-[10px] font-medium tracking-[0.5em] text-[#00f0ff] uppercase bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                    {categoryTitles[slug] || slug}
                </span>
            </div>

            {/* Cinematic Gallery */}
            <CinematicScroll images={images} />

            {/* Footer */}
            <footer className="relative z-10 py-20 text-center bg-[#0a0a0f]">
                <p className="text-xs tracking-[0.5em] text-white/20 uppercase">
                    G&M Photography © {new Date().getFullYear()}
                </p>
            </footer>
        </main>
    );
}
