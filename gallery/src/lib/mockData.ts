// Mock data for development - using Unsplash placeholder images
// In production, these will be replaced with Firestore data from Firebase Storage

export interface ImageData {
    id: string;
    url: string;
    thumbnailUrl?: string;
    category: 'events' | 'portraits' | 'nature' | 'street' | 'intimate';
    description?: string;
    createdAt: Date;
}

// Using high-quality Unsplash images for development
export const mockImages: ImageData[] = [
    // Events
    {
        id: 'evt-1',
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
        category: 'events',
        description: 'A moment suspended in celebration. The air thick with joy as confetti dances through golden light, each piece a tiny messenger of human happiness.',
        createdAt: new Date('2024-01-15'),
    },
    {
        id: 'evt-2',
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
        category: 'events',
        description: 'The dance floor becomes a stage where ordinary beings transform into extraordinary performers, their movements painting stories in the evening air.',
        createdAt: new Date('2024-01-20'),
    },
    // Portraits
    {
        id: 'prt-1',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
        category: 'portraits',
        description: 'In those eyes, we witness the accumulation of a lifetime. Every crease a chapter, every glance a story waiting to be told.',
        createdAt: new Date('2024-02-01'),
    },
    {
        id: 'prt-2',
        url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
        category: 'portraits',
        description: 'The human face, a remarkable canvas upon which nature has painted emotions invisible to all but the most patient observer.',
        createdAt: new Date('2024-02-05'),
    },
    // Nature
    {
        id: 'nat-1',
        url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
        category: 'nature',
        description: 'Here, in this forgotten corner of our world, life persists with remarkable tenacity. A single dewdrop contains the reflection of an entire universe.',
        createdAt: new Date('2024-02-10'),
    },
    {
        id: 'nat-2',
        url: 'https://images.unsplash.com/photo-1518173946687-a4c036bc5fb2?w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c036bc5fb2?w=600&q=80',
        category: 'nature',
        description: 'The forest exhales. Mist rises like the breath of ancient giants, cloaking the landscape in mystery and wonder.',
        createdAt: new Date('2024-02-15'),
    },
    // Street
    {
        id: 'str-1',
        url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80',
        category: 'street',
        description: 'The urban jungle breathes differently. Here, concrete canyons channel rivers of humanity, each soul a universe unto themselves.',
        createdAt: new Date('2024-02-20'),
    },
    {
        id: 'str-2',
        url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80',
        category: 'street',
        description: 'In the spaces between the chaos, moments of unexpected poetry emerge. A gesture, a shadow, a fleeting connection.',
        createdAt: new Date('2024-02-25'),
    },
];

export const featuredImages = mockImages.slice(0, 4);

export const getImagesByCategory = (category: string): ImageData[] => {
    return mockImages.filter(img => img.category === category);
};

export const getImageById = (id: string): ImageData | undefined => {
    return mockImages.find(img => img.id === id);
};
