import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "G&M Photography | Visual Stories",
  description: "Experience photography like never before. An immersive gallery by G&M Photography.",
  keywords: ["photography", "gallery", "events", "portraits", "nature", "street photography"],
  authors: [{ name: "G&M Photography" }],
  openGraph: {
    title: "G&M Photography",
    description: "Experience photography like never before",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {/* Particle Background */}
        <div className="particles-bg" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 15}s`,
              }}
            />
          ))}
        </div>

        {/* Light Trails */}
        <div className="light-trail" style={{ top: '30%', animationDelay: '0s' }} aria-hidden="true" />
        <div className="light-trail" style={{ top: '60%', animationDelay: '4s' }} aria-hidden="true" />

        {children}
      </body>
    </html>
  );
}
