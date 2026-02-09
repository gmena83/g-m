import { Logo } from '@/components/ui/Logo';
import { ExpandingMenu } from '@/components/ui/ExpandingMenu';
import { HorizontalGallery } from '@/components/gallery/HorizontalGallery';
import { CinematicScroll } from '@/components/gallery/CinematicScroll';
import { mockImages, featuredImages, getImagesByCategory } from '@/lib/mockData';

export default function HomePage() {
  const portraits = getImagesByCategory('portraits');
  const events = getImagesByCategory('events');
  const nature = getImagesByCategory('nature');
  const street = getImagesByCategory('street');

  return (
    <main className="relative min-h-screen">
      {/* Logo */}
      <Logo />

      {/* Menu */}
      <ExpandingMenu />

      {/* Hero - Cinematic Section with Featured Images */}
      <section className="relative">
        <CinematicScroll images={featuredImages} />
      </section>

      {/* Horizontal Gallery Sections */}
      <section className="relative z-10 bg-[#0a0a0f] py-20">
        <HorizontalGallery images={portraits} title="Portraits" />

        <div className="h-20" />

        <HorizontalGallery images={events} title="Events" />

        <div className="h-20" />

        <HorizontalGallery images={nature} title="Nature" />

        <div className="h-20" />

        <HorizontalGallery images={street} title="Street" />
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 text-center bg-[#0a0a0f]">
        <p className="text-xs tracking-[0.5em] text-white/20 uppercase">
          G&M Photography © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
