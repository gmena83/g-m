'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload,
    LogOut,
    Camera,
    Users,
    TreePine,
    Building2,
    Lock,
    Loader2,
    Sparkles,
    Check,
    X,
    Image as ImageIcon,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { auth, storage, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const categories = [
    { id: 'events', name: 'Events', icon: <Camera size={18} /> },
    { id: 'portraits', name: 'Portraits', icon: <Users size={18} /> },
    { id: 'nature', name: 'Nature', icon: <TreePine size={18} /> },
    { id: 'street', name: 'Street', icon: <Building2 size={18} /> },
    { id: 'intimate', name: 'Intimate', icon: <Lock size={18} /> },
];

export default function AdminDashboardPage() {
    const router = useRouter();
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

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Create unique filename
            const timestamp = Date.now();
            const filename = `${selectedCategory}/${timestamp}-${selectedFile.name}`;
            const storageRef = ref(storage, `gallery/${filename}`);

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
                    await addDoc(collection(db, 'images'), {
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
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1] transition-all"
                >
                    <LogOut size={18} />
                    Sign Out
                </motion.button>
            </motion.header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`
                        flex flex-col items-center gap-1 p-3 rounded-xl border transition-all
                        ${selectedCategory === cat.id
                                                    ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                                                    : 'border-white/[0.1] text-white/40 hover:border-white/[0.3] hover:text-white'
                                                }
                      `}
                                        >
                                            {cat.icon}
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
        </div>
    );
}
