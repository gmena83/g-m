import { db } from './firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore';

export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string; // lucide icon name, e.g. 'Camera', 'Users', 'TreePine', 'Building2', 'Lock'
    order: number;
    isProtected: boolean; // requires password (like Artistic)
    createdAt?: Date;
}

// ── Read ──

export const getCategories = async (): Promise<Category[]> => {
    if (!db) return [];

    try {
        const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || new Date(),
        })) as Category[];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

// ── Create ──

export const addCategory = async (
    category: Omit<Category, 'id' | 'createdAt'>
): Promise<string | null> => {
    if (!db) return null;

    try {
        const docRef = await addDoc(collection(db, 'categories'), {
            ...category,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding category:', error);
        return null;
    }
};

// ── Update ──

export const updateCategory = async (
    id: string,
    data: Partial<Omit<Category, 'id'>>
): Promise<boolean> => {
    if (!db) return false;

    try {
        await updateDoc(doc(db, 'categories', id), data);
        return true;
    } catch (error) {
        console.error('Error updating category:', error);
        return false;
    }
};

// ── Delete ──

export const deleteCategory = async (id: string): Promise<boolean> => {
    if (!db) return false;

    try {
        await deleteDoc(doc(db, 'categories', id));
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        return false;
    }
};

// ── Update image category ──

export const updateImageCategory = async (
    imageId: string,
    newCategory: string
): Promise<boolean> => {
    if (!db) return false;

    try {
        await updateDoc(doc(db, 'images', imageId), { category: newCategory });
        return true;
    } catch (error) {
        console.error('Error updating image category:', error);
        return false;
    }
};

// ── Seed defaults ──

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
    { name: 'Events', slug: 'events', icon: 'Camera', order: 0, isProtected: false },
    { name: 'Portraits', slug: 'portraits', icon: 'Users', order: 1, isProtected: false },
    { name: 'Nature', slug: 'nature', icon: 'TreePine', order: 2, isProtected: false },
    { name: 'Street', slug: 'street', icon: 'Building2', order: 3, isProtected: false },
    { name: 'Artistic', slug: 'artistic', icon: 'Lock', order: 4, isProtected: true },
];

export const seedDefaultCategories = async (): Promise<boolean> => {
    if (!db) return false;

    try {
        // Check if categories already exist
        const existing = await getDocs(collection(db, 'categories'));
        if (!existing.empty) {
            console.log('Categories already seeded, skipping.');
            return true;
        }

        for (const cat of DEFAULT_CATEGORIES) {
            await addDoc(collection(db, 'categories'), {
                ...cat,
                createdAt: serverTimestamp(),
            });
        }
        console.log('Default categories seeded successfully.');
        return true;
    } catch (error) {
        console.error('Error seeding categories:', error);
        return false;
    }
};
