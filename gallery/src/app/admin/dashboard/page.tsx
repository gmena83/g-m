'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';

import {
    Upload,
    LogOut,
    Loader2,
    Sparkles,
    Check,
    X,
    Image as ImageIcon,
    RefreshCw,
    Home,
    Grid3X3,
    FolderCog,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { auth, storage, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Category } from '@/lib/categoryService';
import { useCategories } from '@/hooks/useCategories';
import { seedDefaultCategories } from '@/lib/categoryService';
import { getIconByName } from '@/components/admin/CategoryManager';
import { ImageRelabeler } from '@/components/admin/ImageRelabeler';
import { CategoryManager } from '@/components/admin/CategoryManager';

interface UncategorizedImage {
    id: string;
    url: string;
    description?: string;
    category?: string;
    [key: string]: unknown;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { categories, loading: categoriesLoading, refresh: refreshCategories } = useCategories();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('events');
    const [description, setDescription] = useState('');
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStats, setSyncStats] = useState<{ added: number; total: number } | null>(null);
    const [activeTab, setActiveTab] = useState<'upload' | 'relabel' | 'categories'>('upload');

    // Seed default categories on first load if needed
    useEffect(() => {
        if (isAuthenticated && !categoriesLoading && categories.length === 0) {
            seedDefaultCategories().then(() => refreshCategories());
        }
    }, [isAuthenticated, categoriesLoading, categories.length, refreshCategories]);

    useEffect(() => {
        if (!auth) {
            router.push('/admin');
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
            } else {
                router.push('/admin');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setDescription('');
            setUploadSuccess(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setDescription('');
            setUploadSuccess(false);
        }
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // Helper to resize image for AI analysis (prevents payload too large errors)
    const resizeImageForAI = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 800; // Sufficient for AI description

                    if (width > height && width > maxDim) {
                        height = height * (maxDim / width);
                        width = maxDim;
                    } else if (height > maxDim) {
                        width = width * (maxDim / height);
                        height = maxDim;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]); // Always use JPEG for AI to save space
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const generateDescription = async () => {
        if (!selectedFile) return;

        setIsGeneratingDescription(true);
        try {
            // Resize image for AI to avoid API limits (original file is still uploaded)
            const base64 = await resizeImageForAI(selectedFile);

            // Call our API route to generate description
            const response = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: base64,
                    mimeType: 'image/jpeg', // We converted to JPEG in resize
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setDescription(data.description);
            } else {
                console.error('Failed to generate description');
            }
            setIsGeneratingDescription(false);
        } catch (error) {
            console.error('Error generating description:', error);
            setIsGeneratingDescription(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !description) return;

        // Capture non-null references for use in callbacks
        const currentStorage = storage;
        const currentDb = db;

        if (!currentStorage || !currentDb) {
            console.error('Firebase services not initialized');
            setIsUploading(false);
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Create unique filename
            const timestamp = Date.now();
            const filename = `${selectedCategory}/${timestamp}-${selectedFile.name}`;
            const storageRef = ref(currentStorage, `gallery/${filename}`);

            // Upload with progress tracking
            const uploadTask = uploadBytesResumable(storageRef, selectedFile);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error('Upload error:', error);
                    setIsUploading(false);
                },
                async () => {
                    // Get download URL
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

                    // Save metadata to Firestore
                    await addDoc(collection(currentDb, 'images'), {
                        url: downloadUrl,
                        category: selectedCategory,
                        description,
                        filename: selectedFile.name,
                        size: selectedFile.size,
                        createdAt: serverTimestamp(),
                    });

                    setIsUploading(false);
                    setUploadSuccess(true);

                    // Reset after success
                    setTimeout(() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setDescription('');
                        setUploadSuccess(false);
                    }, 3000);
                }
            );
        } catch (error) {
            console.error('Error during upload:', error);
            setIsUploading(false);
        }
    };



    // State for review workflow
    const [uncategorizedImages, setUncategorizedImages] = useState<UncategorizedImage[]>([]);

    // Fetch uncategorized images
    const fetchUncategorized = useCallback(async () => {
        if (!db) return;
        const q = query(
            collection(db, 'images'),
            where('category', '==', 'uncategorized'),
            // orderBy('createdAt', 'desc') // Requires index, skip for now or handle in memory
        );
        const snapshot = await getDocs(q);
        const images = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UncategorizedImage));
        setUncategorizedImages(images);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUncategorized();
        }
    }, [isAuthenticated, fetchUncategorized]);

    // New function to sync existing Storage files to Firestore
    const handleSyncStorage = async () => {
        if (!confirm('This will scan Storage and add missing files to the Gallery. Continue?')) return;

        if (!storage || !db) {
            console.error('Firebase services not initialized');
            return;
        }

        setIsSyncing(true);
        setSyncStats(null);
        let addedCount = 0;
        let totalCount = 0;

        try {
            const galleryRef = ref(storage, 'gallery');
            const res = await listAll(galleryRef);
            const rootRef = ref(storage, '');
            const resRoot = await listAll(rootRef);

            const allItems = [...res.items, ...resRoot.items];
            totalCount = allItems.length;

            for (const itemRef of allItems) {
                try {
                    const url = await getDownloadURL(itemRef);

                    // Check if exists in Firestore
                    const q = query(collection(db, 'images'), where('url', '==', url));
                    const querySnapshot = await getDocs(q);

                    if (querySnapshot.empty) {
                        // Add to Firestore as UNCATEGORIZED
                        await addDoc(collection(db, 'images'), {
                            url: url,
                            category: 'uncategorized',
                            description: '',
                            filename: itemRef.name,
                            size: 0,
                            createdAt: serverTimestamp(),
                            needsReview: true
                        });
                        addedCount++;
                    }
                } catch (err) {
                    console.error('Error syncing item:', itemRef.name, err);
                }
            }

            setSyncStats({ added: addedCount, total: totalCount });
            await fetchUncategorized(); // Refresh list

        } catch (err) {
            console.error('Sync failed:', err);
            alert('Sync failed. Check console.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSignOut = async () => {
        if (auth) {
            await signOut(auth);
        }
        router.push('/admin');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <Loader2 size={32} className="animate-spin text-[#00f0ff]" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-6">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-2xl font-light text-white">
                        <span className="text-[#00f0ff]">G&M</span> Admin
                    </h1>
                    <p className="text-sm text-white/40">Upload and manage your gallery</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1] transition-all"
                    >
                        <Home size={18} />
                        Homepage
                    </Link>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSyncStorage}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff00aa]/10 border border-[#ff00aa]/20 text-[#ff00aa] hover:bg-[#ff00aa]/20 transition-all disabled:opacity-50"
                    >
                        {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        Sync Storage
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1] transition-all"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </motion.button>
                </div>
            </motion.header>

            {syncStats && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400 text-center"
                >
                    Sync Complete! Added {syncStats.added} new images (Found {syncStats.total} total).
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Review Imports Section */}
                {uncategorizedImages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2"
                    >
                        <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2">
                            <span className="text-[#ff00aa]">Review Imports</span>
                            <span className="text-sm text-white/40 ml-2">
                                ({uncategorizedImages.length} uncategorized images)
                            </span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {uncategorizedImages.map((image) => (
                                <ReviewCard
                                    key={image.id}
                                    image={image}
                                    categories={categories}
                                    onUpdate={() => fetchUncategorized()}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Upload Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <GlassCard intensity="medium" glow="none" hover={false} className="p-6">
                        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Upload size={20} className="text-[#00f0ff]" />
                            Upload Image
                        </h2>

                        {/* Drop Zone */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${previewUrl
                                    ? 'border-[#00f0ff]/50 bg-[#00f0ff]/5'
                                    : 'border-white/[0.1] hover:border-white/[0.3] hover:bg-white/[0.02]'
                                }
              `}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />

                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-h-64 mx-auto rounded-lg object-contain"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                            setDescription('');
                                        }}
                                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon size={48} className="mx-auto mb-4 text-white/20" />
                                    <p className="text-white/60 mb-2">
                                        Drag and drop an image here
                                    </p>
                                    <p className="text-sm text-white/40">
                                        or click to browse
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Category Selection */}
                        {selectedFile && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6"
                            >
                                <label className="block text-sm text-white/60 mb-2">Category</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.slug)}
                                            className={`
                        flex flex-col items-center gap-1 p-3 rounded-xl border transition-all
                        ${selectedCategory === cat.slug
                                                    ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                                                    : 'border-white/[0.1] text-white/40 hover:border-white/[0.3] hover:text-white'
                                                }
                       `}
                                        >
                                            {getIconByName(cat.icon)}
                                            <span className="text-[10px]">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </GlassCard>
                </motion.div>

                {/* Description Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <GlassCard intensity="medium" glow="none" hover={false} className="p-6">
                        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Sparkles size={20} className="text-[#ff00aa]" />
                            AI Description
                        </h2>

                        {/* Generate Button */}
                        {selectedFile && !description && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={generateDescription}
                                disabled={isGeneratingDescription}
                                className="w-full mb-4 py-4 rounded-xl bg-gradient-to-r from-[#ff00aa] to-[#00f0ff] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isGeneratingDescription ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Channeling Sir David...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Generate Attenborough Description
                                    </>
                                )}
                            </motion.button>
                        )}

                        {/* Description Textarea */}
                        <div className="relative">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={selectedFile ? "Click the button above to generate an AI description, or write your own..." : "Select an image first..."}
                                disabled={!selectedFile}
                                className="w-full h-48 bg-white/[0.05] border border-white/[0.1] rounded-xl p-4 text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all disabled:opacity-50"
                            />
                            {description && (
                                <span className="absolute bottom-3 right-3 text-xs text-white/30">
                                    {description.length} chars
                                </span>
                            )}
                        </div>

                        {/* Upload Button */}
                        <AnimatePresence>
                            {selectedFile && description && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mt-4"
                                >
                                    {uploadSuccess ? (
                                        <div className="flex items-center justify-center gap-2 py-4 text-green-400">
                                            <Check size={20} />
                                            <span>Upload successful!</span>
                                        </div>
                                    ) : (
                                        <>
                                            {isUploading && (
                                                <div className="mb-2">
                                                    <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${uploadProgress}%` }}
                                                            className="h-full bg-gradient-to-r from-[#00f0ff] to-[#ff00aa]"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-white/40 mt-1 text-center">
                                                        {Math.round(uploadProgress)}%
                                                    </p>
                                                </div>
                                            )}
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleUpload}
                                                disabled={isUploading}
                                                className="w-full py-4 rounded-xl bg-[#00f0ff] text-[#0a0a0f] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_30px_rgba(0,240,255,0.3)]"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 size={18} className="animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={18} />
                                                        Upload to Gallery
                                                    </>
                                                )}
                                            </motion.button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-8 mb-4">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${activeTab === 'upload'
                        ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff]'
                        : 'bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white/60'
                        }`}
                >
                    <Upload size={16} />
                    Upload
                </button>
                <button
                    onClick={() => setActiveTab('relabel')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${activeTab === 'relabel'
                        ? 'bg-[#ff00aa]/10 border border-[#ff00aa]/20 text-[#ff00aa]'
                        : 'bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white/60'
                        }`}
                >
                    <Grid3X3 size={16} />
                    Relabel Images
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${activeTab === 'categories'
                        ? 'bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#a78bfa]'
                        : 'bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white/60'
                        }`}
                >
                    <FolderCog size={16} />
                    Manage Categories
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'relabel' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <GlassCard intensity="medium" glow="none" hover={false} className="p-6">
                        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Grid3X3 size={20} className="text-[#ff00aa]" />
                            Relabel Gallery Images
                        </h2>
                        <p className="text-sm text-white/40 mb-4">
                            Click any image&apos;s dropdown to quickly change its category.
                        </p>
                        <ImageRelabeler categories={categories} />
                    </GlassCard>
                </motion.div>
            )}

            {activeTab === 'categories' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl"
                >
                    <GlassCard intensity="medium" glow="none" hover={false} className="p-6">
                        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <FolderCog size={20} className="text-[#a78bfa]" />
                            Manage Categories
                        </h2>
                        <p className="text-sm text-white/40 mb-4">
                            Add, remove, or reorder gallery categories. Changes take effect immediately across the site.
                        </p>
                        <CategoryManager categories={categories} onRefresh={refreshCategories} />
                    </GlassCard>
                </motion.div>
            )}
        </div>
    );
}

// Sub-component for reviewing images
function ReviewCard({ image, categories, onUpdate }: { image: UncategorizedImage, categories: Category[], onUpdate: () => void }) {
    const [category, setCategory] = useState('events');
    const [description, setDescription] = useState(image.description || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Fetch image blob from URL
            const res = await fetch(image.url);
            const blob = await res.blob();
            const file = new File([blob], "temp.jpg", { type: "image/jpeg" });

            // Re-use helper logic 
            const resizeImageForAI = (file: File): Promise<string> => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;
                            const maxDim = 800;
                            if (width > height && width > maxDim) {
                                height = height * (maxDim / width);
                                width = maxDim;
                            } else if (height > maxDim) {
                                width = width * (maxDim / height);
                                height = maxDim;
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, width, height);
                            resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
                        };
                        img.src = e.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                });
            };

            const base64 = await resizeImageForAI(file);
            const response = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
            });

            if (response.ok) {
                const data = await response.json();
                setDescription(data.description);
            }
        } catch (error) {
            console.error('Error generating description:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Dynamic import to avoid SSR issues
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            if (!db) throw new Error('Firestore not initialized');

            await updateDoc(doc(db, 'images', image.id), {
                category,
                description,
                needsReview: false
            });
            onUpdate();
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this import? This removes it from the gallery database (file stays in storage).")) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            if (!db) throw new Error('Firestore not initialized');
            await deleteDoc(doc(db, 'images', image.id));
            onUpdate();
        } catch (e) { console.error(e) }
    };

    return (
        <GlassCard intensity="light" className="p-4 flex flex-col gap-4">
            <div className="relative h-48 rounded-lg overflow-hidden bg-black/20">
                <NextImage
                    src={image.url}
                    alt="Review"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-2 right-2">
                    <button
                        onClick={handleDelete}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-red-500/50 transition-colors"
                        aria-label="Delete image"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-1">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.slug)}
                        className={`p-2 rounded-lg border flex justify-center items-center transition-all ${category === cat.slug ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]' : 'border-white/10 text-white/30 hover:bg-white/5'}`}
                        title={cat.name}
                    >
                        {getIconByName(cat.icon)}
                    </button>
                ))}
            </div>

            <div className="relative">
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#00f0ff]/50 resize-none"
                />
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="absolute bottom-2 right-2 p-1.5 text-[#ff00aa] hover:bg-[#ff00aa]/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Generate AI Description"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
            </div>

            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-2 bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] rounded-lg hover:bg-[#00f0ff]/20 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Publish
            </button>
        </GlassCard>
    );
}
