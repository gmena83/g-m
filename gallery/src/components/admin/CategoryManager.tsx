'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
    Plus,
    Trash2,
    GripVertical,
    Lock,
    Unlock,
    Loader2,
    Save,
    Camera,
    Users,
    TreePine,
    Building2,
    Heart,
    Star,
    Palette,
    Landmark,
    Mountain,
    Music,
    Gamepad2,
    Utensils,
    Plane,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
    Category,
    addCategory,
    updateCategory,
    deleteCategory,
} from '@/lib/categoryService';

const ICON_OPTIONS = [
    { name: 'Camera', icon: <Camera size={16} /> },
    { name: 'Users', icon: <Users size={16} /> },
    { name: 'TreePine', icon: <TreePine size={16} /> },
    { name: 'Building2', icon: <Building2 size={16} /> },
    { name: 'Lock', icon: <Lock size={16} /> },
    { name: 'Heart', icon: <Heart size={16} /> },
    { name: 'Star', icon: <Star size={16} /> },
    { name: 'Palette', icon: <Palette size={16} /> },
    { name: 'Landmark', icon: <Landmark size={16} /> },
    { name: 'Mountain', icon: <Mountain size={16} /> },
    { name: 'Music', icon: <Music size={16} /> },
    { name: 'Gamepad2', icon: <Gamepad2 size={16} /> },
    { name: 'Utensils', icon: <Utensils size={16} /> },
    { name: 'Plane', icon: <Plane size={16} /> },
];

export function getIconByName(name: string) {
    const found = ICON_OPTIONS.find((i) => i.name === name);
    return found?.icon || <Camera size={16} />;
}

interface CategoryManagerProps {
    categories: Category[];
    onRefresh: () => void;
}

export function CategoryManager({ categories, onRefresh }: CategoryManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState('Camera');
    const [newProtected, setNewProtected] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!newName.trim()) return;

        setSaving(true);
        const slug = newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const maxOrder = categories.reduce((max, c) => Math.max(max, c.order), 0);

        const result = await addCategory({
            name: newName.trim(),
            slug,
            icon: newIcon,
            order: maxOrder + 1,
            isProtected: newProtected,
        });

        if (result) {
            setNewName('');
            setNewIcon('Camera');
            setNewProtected(false);
            setIsAdding(false);
            onRefresh();
        }
        setSaving(false);
    };

    const handleDelete = async (cat: Category) => {
        if (!confirm(`Delete category "${cat.name}"? Images in this category will keep their label but won't appear in any gallery until relabeled.`)) return;

        setDeletingId(cat.id);
        await deleteCategory(cat.id);
        onRefresh();
        setDeletingId(null);
    };

    const handleToggleProtected = async (cat: Category) => {
        await updateCategory(cat.id, { isProtected: !cat.isProtected });
        onRefresh();
    };

    return (
        <div>
            {/* Category List */}
            <div className="space-y-2 mb-4">
                {categories.map((cat, index) => (
                    <motion.div
                        key={cat.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all group"
                    >
                        <GripVertical size={14} className="text-white/20 cursor-grab" />

                        <span className="text-white/60">{getIconByName(cat.icon)}</span>

                        <span className="text-sm text-white/80 flex-1 font-medium">{cat.name}</span>

                        <span className="text-[10px] text-white/30 font-mono">/{cat.slug}</span>

                        <button
                            onClick={() => handleToggleProtected(cat)}
                            className={`p-1.5 rounded-lg transition-all ${cat.isProtected
                                ? 'text-[#ff00aa] bg-[#ff00aa]/10'
                                : 'text-white/20 hover:text-white/40'
                                }`}
                            title={cat.isProtected ? 'Password protected' : 'Public'}
                        >
                            {cat.isProtected ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>

                        <button
                            onClick={() => handleDelete(cat)}
                            disabled={deletingId === cat.id}
                            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            title="Delete category"
                        >
                            {deletingId === cat.id ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Trash2 size={14} />
                            )}
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Add Category */}
            <AnimatePresence>
                {isAdding ? (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <GlassCard intensity="light" className="p-4 space-y-3">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Category name"
                                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff]/50"
                                autoFocus
                            />

                            {/* Icon Picker */}
                            <div>
                                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">Icon</label>
                                <div className="flex flex-wrap gap-1">
                                    {ICON_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.name}
                                            onClick={() => setNewIcon(opt.name)}
                                            className={`p-2 rounded-lg border transition-all ${newIcon === opt.name
                                                ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                                                : 'border-white/[0.05] text-white/30 hover:text-white/50'
                                                }`}
                                            title={opt.name}
                                        >
                                            {opt.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Protected Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newProtected}
                                    onChange={(e) => setNewProtected(e.target.checked)}
                                    className="accent-[#ff00aa]"
                                />
                                <span className="text-xs text-white/50">Password protected</span>
                            </label>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAdd}
                                    disabled={!newName.trim() || saving}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] text-sm font-medium hover:bg-[#00f0ff]/20 transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 rounded-lg text-white/40 text-sm hover:text-white/60 hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsAdding(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/[0.1] text-white/40 hover:text-white/60 hover:border-white/[0.2] hover:bg-white/[0.02] transition-all cursor-pointer"
                    >
                        <Plus size={16} />
                        <span className="text-sm">Add Category</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
