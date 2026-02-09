import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ATTENBOROUGH_PROMPT = `You are Sir David Attenborough narrating a photograph. 
Describe this image with poetic drama, scientific insight, subtle wit, and deep emotional resonance.
Your narration should captivate the audience as if you're revealing one of nature's most extraordinary moments.
Include sensory details that make the viewer feel present in the scene.
Keep it under 100 words but make every word count.
Speak directly as if narrating a documentary - no "I see" or "This image shows".`;

export async function POST(request: NextRequest) {
    try {
        const { imageBase64, mimeType } = await request.json();

        if (!imageBase64) {
            return NextResponse.json(
                { error: 'Image data is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API key not configured' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent([
            { text: ATTENBOROUGH_PROMPT },
            {
                inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: imageBase64,
                },
            },
        ]);

        const response = await result.response;
        const description = response.text();

        return NextResponse.json({ description });
    } catch (error) {
        console.error('Error generating description:', error);
        return NextResponse.json(
            { error: 'Failed to generate description' },
            { status: 500 }
        );
    }
}
