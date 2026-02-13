import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { text, targetLanguage = 'Spanish' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Translate the following art/photography description into ${targetLanguage}. Keep the tone artistic, professional, and evocative. Do not add explanations, just return the translated text.\n\nText: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const translatedText = response.text().trim();

        return NextResponse.json({ translatedText });

    } catch (error: any) {
        console.error('Translation error:', error);
        return NextResponse.json({
            error: 'Failed to translate',
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
