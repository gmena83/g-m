// Gemini AI integration for image descriptions
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const ATTENBOROUGH_PROMPT = `You are Sir David Attenborough narrating a photograph. 
Describe this image with poetic drama, scientific insight, subtle wit, and deep emotional resonance.
Your narration should captivate the audience as if you're revealing one of nature's most extraordinary moments.
Include sensory details that make the viewer feel present in the scene.
Keep it under 100 words but make every word count.
Speak directly as if narrating a documentary - no "I see" or "This image shows".`;

export async function generateImageDescription(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent([
            { text: ATTENBOROUGH_PROMPT },
            {
                inlineData: {
                    mimeType,
                    data: imageBase64,
                },
            },
        ]);

        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating description:', error);
        throw new Error('Failed to generate image description');
    }
}

export async function generateDescriptionFromUrl(imageUrl: string): Promise<string> {
    try {
        // Fetch the image and convert to base64
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';

        return generateImageDescription(base64, mimeType);
    } catch (error) {
        console.error('Error fetching image for description:', error);
        throw new Error('Failed to fetch image for description');
    }
}
