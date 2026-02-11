import { NextResponse } from 'next/server';

const RESEND_API_KEY = 're_GvnN5n47_E3ZzVe2FuGz4PVmNFgsxVTay';
const TO_EMAIL = 'gonzalomena@gmail.com';

export async function POST(request: Request) {
    try {
        const { name, email, message } = await request.json();

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'G&M Photography <onboarding@resend.dev>',
                to: [TO_EMAIL],
                subject: `New Contact Form: ${name}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">New Contact Form Submission</h2>
                        <hr style="border: 1px solid #eee;" />
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; white-space: pre-wrap;">
                            ${message}
                        </div>
                        <hr style="border: 1px solid #eee; margin-top: 24px;" />
                        <p style="color: #999; font-size: 12px;">
                            Sent from G&M Photography contact form
                        </p>
                    </div>
                `,
                reply_to: email,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Resend API error:', errorData);
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
