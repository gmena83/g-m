'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Menu, X, Camera, Users, TreePine, Building2, Lock } from 'lucide-react';
import Link from 'next/link';

interface Category {
    name: string;
    slug: string;
    icon: React.ReactNode;
    locked?: boolean;
}

const categories: Category[] = [
    { name: 'Events', slug: 'events', icon: <Camera size={20} /> },
    { name: 'Portraits', slug: 'portraits', icon: <Users size={20} /> },
    { name: 'Nature', slug: 'nature', icon: <TreePine size={20} /> },
    { name: 'Street', slug: 'street', icon: <Building2 size={20} /> },
    { name: 'Intimate', slug: 'intimate', icon: <Lock size={20} />, locked: true },
];

export function ExpandingMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Menu Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-white cursor-pointer"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="menu"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Menu size={24} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Menu Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu Content */}
                        <motion.nav
                            initial={{ opacity: 0, x: 100, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-24 right-6 z-50 w-80 bg-white/[0.05] backdrop-blur-2xl border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-3">
                                {categories.map((category, index) => (
                                    <motion.div
                                        key={category.slug}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={category.locked ? '/intimate' : `/category/${category.slug}`}
                                            onClick={() => setIsOpen(false)}
                                            className={`
                        flex items-center gap-5 px-5 py-4 rounded-xl
                        transition-all duration-300 group
                        ${category.locked
                                                    ? 'text-[#ff00aa] hover:bg-[#ff00aa]/10'
                                                    : 'text-white hover:bg-white/10'
                                                }
                      `}
                                        >
                                            <span className={`
                        ${category.locked
                                                    ? 'text-[#ff00aa]'
                                                    : 'text-[#00f0ff] group-hover:text-white'
                                                }
                        transition-colors
                      `}>
                                                {category.icon}
                                            </span>
                                            <span className="font-medium tracking-wide text-lg">{category.name}</span>
                                            {category.locked && (
                                                <span className="ml-auto text-xs text-[#ff00aa]/60 tracking-wider font-light uppercase border border-[#ff00aa]/20 px-2 py-1 rounded">
                                                    Private
                                                </span>
                                            )}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Admin Link */}
                            <div className="border-t border-white/[0.05] p-3">
                                <Link
                                    href="/admin"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-5 px-5 py-4 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <span className="text-sm tracking-widest uppercase">Admin Portal</span>
                                </Link>
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
