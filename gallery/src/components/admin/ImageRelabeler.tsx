'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Filter, Sparkles } from 'lucide-react';
import { getAllImages, ImageData } from '@/lib/galleryService';
import { updateImageCategory, Category } from '@/lib/categoryService';

interface ImageRelabelerProps {
    categories: Category[];
}

export function ImageRelabeler({ categories }: ImageRelabelerProps) {
    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState<string>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // New State for Editing
    const [editingImage, setEditingImage] = useState<ImageData | null>(null);
    const [editForm, setEditForm] = useState({ description: '', descriptionEs: '' });
    const [isTranslating, setIsTranslating] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchImages = async () => {
        setLoading(true);
        const data = await getAllImages();
        setImages(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleCategoryChange = async (imageId: string, newCategory: string) => {
        setUpdatingId(imageId);
        const success = await updateImageCategory(imageId, newCategory);
        if (success) {
            setImages((prev) =>
                prev.map((img) =>
                    img.id === imageId ? { ...img, category: newCategory } : img
                )
            );
        }
        setUpdatingId(null);
    };

    // New Handlers
    const handleEditClick = (img: ImageData) => {
        setEditingImage(img);
        setEditForm({
            description: img.description || '',
            descriptionEs: img.descriptionEs || ''
        });
    };

    const handleTranslate = async () => {
        if (!editForm.description) return;
        setIsTranslating(true);
        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: editForm.description, targetLanguage: 'Spanish' })
            });
            const data = await res.json();
            if (data.translatedText) {
                setEditForm(prev => ({ ...prev, descriptionEs: data.translatedText }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleGenerateAttenborough = async () => {
        if (!editingImage) return;
        setIsGenerating(true);
        try {
            // Fetch image from URL
            const res = await fetch(editingImage.url);
            const blob = await res.blob();
            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result?.toString().split(',')[1];
                if (!base64data) return;

                const response = await fetch('/api/generate-description', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: base64data,
                        mimeType: blob.type || 'image/jpeg',
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setEditForm(prev => ({
                        ...prev,
                        description: !prev.description ? (data.description || '') : prev.description,
                        descriptionEs: !prev.descriptionEs ? (data.descriptionEs || '') : prev.descriptionEs
                    }));
                }
                setIsGenerating(false);
            };
        } catch (error) {
            console.error('Error generating:', error);
            setIsGenerating(false);
        }
    };

    const handleSaveDetails = async () => {
        if (!editingImage) return;
        setIsSaving(true);
        try {
            // Update in Firestore
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            if (db) {
                await updateDoc(doc(db, 'images', editingImage.id), {
                    description: editForm.description,
                    descriptionEs: editForm.descriptionEs
                });

                // Update local state
                setImages(prev => prev.map(img =>
                    img.id === editingImage.id
                        ? { ...img, description: editForm.description, descriptionEs: editForm.descriptionEs }
                        : img
                ));
                setEditingImage(null);
            }
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsSaving(false);
        }
    };


    const filtered = filterCat === 'all'
        ? images
        : images.filter((img) => img.category === filterCat);

    const getCategoryColor = (slug: string): string => {
        const colors: Record<string, string> = {
            events: '#00f0ff',
            portraits: '#a78bfa',
            nature: '#34d399',
            street: '#fbbf24',
            artistic: '#ff00aa',
        };
        return colors[slug] || '#00f0ff';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#00f0ff] animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Filter Bar */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Filter size={14} className="text-white/40" />
                <button
                    onClick={() => setFilterCat('all')}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${filterCat === 'all'
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-white/40 hover:text-white/60'
                        }`}
                >
                    All ({images.length})
                </button>
                {categories.map((cat) => {
                    const count = images.filter((i) => i.category === cat.slug).length;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setFilterCat(cat.slug)}
                            className={`px-3 py-1 rounded-full text-xs transition-all ${filterCat === cat.slug
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            {cat.name} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Thumbnail Grid */}
            {filtered.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">
                    No images found{filterCat !== 'all' ? ` in "${filterCat}"` : ''}
                </p>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {filtered.map((img) => (
                        <motion.div
                            key={img.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative cursor-pointer"
                            onClick={() => handleEditClick(img)}
                        >
                            <div
                                className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all group-hover:border-white/50"
                                style={{
                                    borderColor: getCategoryColor(img.category) + '40',
                                }}
                            >
                                <Image
                                    src={img.thumbnailUrl || img.url}
                                    alt={img.description || 'Gallery image'}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 12vw"
                                />

                                {/* Icons for status */}
                                <div className="absolute top-1 right-1 flex gap-1">
                                    {img.descriptionEs && <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" title="Has Spanish" />}
                                    {!img.description && <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm" title="Missing Description" />}
                                </div>

                                {/* Loading overlay */}
                                {updatingId === img.id && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Loader2 size={16} className="animate-spin text-[#00f0ff]" />
                                    </div>
                                )}
                            </div>

                            {/* Category Dropdown */}
                            <div onClick={(e) => e.stopPropagation()}>
                                <select
                                    value={img.category}
                                    onChange={(e) => handleCategoryChange(img.id, e.target.value)}
                                    disabled={updatingId === img.id}
                                    aria-label="Change category"
                                    className="w-full mt-1 bg-white/[0.05] border border-white/[0.1] rounded-md px-1.5 py-1 text-[10px] text-white/70 focus:outline-none focus:border-[#00f0ff]/50 cursor-pointer disabled:opacity-50 appearance-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 4px center',
                                    }}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.slug} style={{ backgroundColor: '#0a0a0f', color: '#ffffff' }}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* EDIT MODAL */}
            {editingImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEditingImage(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1a1a20] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Image Preview Side */}
                        <div className="w-full md:w-1/3 bg-black/50 relative min-h-[300px] md:min-h-full">
                            <Image
                                src={editingImage.url}
                                alt="Editing"
                                fill
                                className="object-contain p-4"
                            />
                        </div>

                        {/* Form Side */}
                        <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                            <h3 className="text-xl text-white font-light mb-6">Edit Image Details</h3>

                            <button
                                onClick={handleGenerateAttenborough}
                                disabled={isGenerating}
                                className="w-full mb-6 py-3 rounded-xl bg-gradient-to-r from-[#ff00aa] to-[#00f0ff] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Channeling Sir David...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        Generate Attenborough Description
                                    </>
                                )}
                            </button>

                            <div className="space-y-6 flex-1">
                                {/* English */}
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-[#00f0ff] mb-2 block">English Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-white/90 text-sm focus:border-[#00f0ff]/50 focus:outline-none resize-none"
                                        placeholder="Enter English description..."
                                    />
                                </div>

                                {/* Divider with Action */}
                                <div className="flex items-center justify-center">
                                    <button
                                        onClick={handleTranslate}
                                        disabled={isTranslating || !editForm.description}
                                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/60 hover:text-[#00f0ff] transition-all disabled:opacity-30"
                                    >
                                        {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <div className="flex gap-1"><span>🇺🇸</span> <span>⬇️</span> <span>🇪🇸</span></div>}
                                        Auto-Translate to Spanish
                                    </button>
                                </div>

                                {/* Spanish */}
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-[#ff00aa] mb-2 block">Spanish Description</label>
                                    <textarea
                                        value={editForm.descriptionEs}
                                        onChange={e => setEditForm(prev => ({ ...prev, descriptionEs: e.target.value }))}
                                        className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-white/90 text-sm focus:border-[#ff00aa]/50 focus:outline-none resize-none"
                                        placeholder="Descripción en español..."
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => setEditingImage(null)}
                                    className="px-4 py-2 rounded-lg text-white/50 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveDetails}
                                    disabled={isSaving}
                                    className="px-6 py-2 rounded-lg bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
