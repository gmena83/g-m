'use client';

import { Logo } from '@/components/ui/Logo';
import { ExpandingMenu } from '@/components/ui/ExpandingMenu';
import { Footer } from '@/components/ui/Footer';
import { LensFlare } from '@/components/ui/LensFlare';
import { useEffect, useState } from 'react';
import { getAllImages, ImageData } from '@/lib/galleryService';
import { Loader2 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

// The categories displayed as hero slides
const heroCategories = [
  { slug: 'events', title: 'Events', href: '/category/events' },
  { slug: 'portraits', title: 'Portraits', href: '/category/portraits' },
  { slug: 'nature', title: 'Nature', href: '/category/nature' },
  { slug: 'street', title: 'Street', href: '/category/street' },
  { slug: 'artistic', title: 'Artistic', href: '/artistic' },
];

// Fallback SFW image for artistic category when no images exist
const ARTISTIC_PLACEHOLDER = 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1920&q=80';

export default function HomePage() {
  const [allImages, setAllImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllImages();
        setAllImages(data);
      } catch (error) {
        console.error('Failed to fetch gallery data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin" />
      </div>
    );
  }

  // Pick one representative image per category for the hero
  const getCategoryImage = (slug: string): string | null => {
    // For 'artistic', also check legacy 'intimate' category
    const matchSlugs = slug === 'artistic' ? ['artistic', 'intimate'] : [slug];
    const img = allImages.find((i) => matchSlugs.includes(i.category.toLowerCase()));

    if (slug === 'artistic') {
      // Never show actual artistic/intimate images on homepage
      return ARTISTIC_PLACEHOLDER;
    }

    return img?.url || null;
  };

  // Build category links for the footer
  const footerCategories = heroCategories.map((cat) => ({
    name: cat.title,
    slug: cat.slug,
    href: cat.href,
    imageUrl: getCategoryImage(cat.slug) || undefined,
  }));

  // Filter categories that have at least one image (or artistic which always shows)
  const activeCategories = heroCategories.filter((cat) => {
    if (cat.slug === 'artistic') return true;
    const matchSlugs = [cat.slug];
    return allImages.some((i) => matchSlugs.includes(i.category.toLowerCase()));
  });

  return (
    <main className="relative min-h-screen">
      <Logo />
      <ExpandingMenu />

      {/* Hero Category Slides */}
      <section className="relative">
        {activeCategories.length > 0 ? (
          <div>
            {activeCategories.map((cat, index) => (
              <div key={cat.slug}>
                <HeroSlide
                  title={cat.title}
                  href={cat.href}
                  imageUrl={getCategoryImage(cat.slug)}
                  index={index}
                />
                {/* Lens Flare between slides */}
                {index < activeCategories.length - 1 && (
                  <LensFlare />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-screen flex items-center justify-center bg-[#0a0a0f] text-white/40">
            No images uploaded yet — use the Admin Dashboard to get started
          </div>
        )}
      </section>

      {/* Footer with category thumbnails and contact */}
      <Footer categories={footerCategories} />
    </main>
  );
}

// --- Hero Slide Component ---
interface HeroSlideProps {
  title: string;
  href: string;
  imageUrl: string | null;
  index: number;
}

function HeroSlide({ title, href, imageUrl, index }: HeroSlideProps) {
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
      {imageUrl ? (
        <motion.div style={{ scale }} className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={`${title} photography`}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#12121a] to-[#0a0a0f]" />
      )}

      {/* Gradient Overlays */}
      <div className="image-overlay" />
      <div className="image-overlay-subtle" />

      {/* Content - Category Selector */}
      <motion.div
        style={{ opacity, y }}
        className="relative z-10 flex items-end justify-center h-full pb-20"
      >
        <Link href={href} className="group text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="glass-strong px-12 py-10 rounded-full cursor-pointer min-w-[320px]"
          >
            <span className="text-[11px] font-medium tracking-[0.5em] text-[#00f0ff] uppercase block mb-3 whitespace-nowrap mr-[-0.5em]">
              {title}
            </span>
            <span className="text-sm text-white/60 group-hover:text-white transition-colors whitespace-nowrap">
              Explore Collection →
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
