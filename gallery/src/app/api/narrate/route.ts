import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { text, voiceId } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        // Default to a deep, slow voice if not provided (using a placeholder ID or a known good default)
        // '21m00Tcm4TlvDq8ikWAM' is Rachel (default), let's look for a deeper one or use a specific ID if known.
        // For now, allow override or default to 'ErXwobaYiN019PkySvjV' (Antoni - often good for narration)
        const VOICE_ID = voiceId || 'jvcMcno3QtjOzGtfpjoI'; // User selected voice (Eric?)

        if (!ELEVENLABS_API_KEY) {
            console.error('ELEVENLABS_API_KEY is not defined');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                    style: 0.5, // Attempt to be more expressive/artistic
                    use_speaker_boost: true
                }
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('ElevenLabs API Error:', error);
            return NextResponse.json({ error: 'Error generating audio' }, { status: response.status });
        }

        // Return audio stream
        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            },
        });

    } catch (error) {
        console.error('Narrate API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
