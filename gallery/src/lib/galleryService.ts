import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface ImageData {
    id: string;
    url: string;
    thumbnailUrl?: string;
    category: string;
    description?: string;
    descriptionEs?: string;
    createdAt: Date; // Firestore Timestamp converted to Date
}

export const getAllImages = async (): Promise<ImageData[]> => {
    if (!db) return [];

    try {
        const q = query(
            collection(db, 'images'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as ImageData[];
    } catch (error) {
        console.error("Error fetching all images:", error);
        return [];
    }
};

export const getImagesByCategory = async (category: string): Promise<ImageData[]> => {
    if (!db) return [];

    try {
        // Note: Composite index might be needed for category + createdAt
        // If it fails, check console for index creation link
        const q = query(
            collection(db, 'images'),
            where('category', '==', category),
            // orderBy('createdAt', 'desc') // Commented out to avoid index issues initially
        );

        const snapshot = await getDocs(q);
        const images = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as ImageData[];

        // Manual sort in memory if needed, or rely on index later
        return images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error(`Error fetching images for category ${category}:`, error);
        return [];
    }
};

export const getFeaturedImages = async (): Promise<ImageData[]> => {
    if (!db) return [];

    try {
        const q = query(
            collection(db, 'images'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as ImageData[];
    } catch (error) {
        console.error("Error fetching featured images:", error);
        return [];
    }
};
