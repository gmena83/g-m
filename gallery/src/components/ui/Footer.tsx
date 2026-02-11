'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Camera } from 'lucide-react';
import { ContactModal } from './ContactModal';

interface CategoryLink {
    name: string;
    slug: string;
    href: string;
    imageUrl?: string;
}

interface FooterProps {
    categories: CategoryLink[];
}

export function Footer({ categories }: FooterProps) {
    const [contactOpen, setContactOpen] = useState(false);

    return (
        <>
            <footer className="relative z-10 bg-[#0a0a0f] border-t border-white/[0.05]">
                {/* Category Thumbnails Grid */}
                {categories.length > 0 && (
                    <div className="max-w-6xl mx-auto px-6 py-16">
                        <h3 className="text-[10px] font-medium tracking-[0.5em] text-[#00f0ff] uppercase text-center mb-10">
                            Explore Collections
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {categories.map((cat, index) => (
                                <motion.div
                                    key={cat.slug}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <Link
                                        href={cat.href}
                                        className="group relative block aspect-[4/3] rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05] hover:border-[#00f0ff]/30 transition-all duration-500"
                                    >
                                        {cat.imageUrl ? (
                                            <Image
                                                src={cat.imageUrl}
                                                alt={cat.name}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                sizes="(max-width: 768px) 50vw, 20vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.05] to-transparent">
                                                <Camera size={24} className="text-white/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                        <div className="absolute bottom-3 left-0 right-0 text-center">
                                            <span className="text-[10px] font-medium tracking-[0.3em] text-white/80 uppercase group-hover:text-[#00f0ff] transition-colors">
                                                {cat.name}
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Bar */}
                <div className="border-t border-white/[0.05] py-8 px-6">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Brand */}
                        <div className="text-center md:text-left">
                            <p className="text-sm font-light text-white/60 tracking-wider">
                                <span className="text-[#00f0ff]">G&M</span> Photography
                            </p>
                            <p className="text-xs text-white/20 mt-1">
                                © {new Date().getFullYear()} All rights reserved
                            </p>
                        </div>

                        {/* Contact Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setContactOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-white/70 hover:text-white hover:border-[#00f0ff]/30 hover:bg-white/[0.08] cursor-pointer transition-all duration-300"
                        >
                            <Mail size={16} />
                            <span className="text-sm font-medium tracking-wide">Contact Us</span>
                        </motion.button>
                    </div>
                </div>
            </footer>

            <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
        </>
    );
}
