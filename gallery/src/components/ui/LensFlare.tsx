'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

export function LensFlare() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0, 1, 0]);
    const scale = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.5, 1.2, 0.5]);
    const x = useTransform(scrollYProgress, [0.2, 0.5, 0.8], ['-30%', '0%', '30%']);

    useEffect(() => {
        const unsubscribe = opacity.on('change', (v) => {
            setIsVisible(v > 0.05);
        });
        return () => unsubscribe();
    }, [opacity]);

    return (
        <div ref={ref} className="relative h-32 overflow-hidden pointer-events-none" aria-hidden="true">
            {isVisible && (
                <motion.div
                    style={{ opacity, scale, x }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {/* Main flare */}
                    <div className="absolute w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.25)_0%,rgba(0,240,255,0.08)_30%,transparent_70%)] blur-sm" />

                    {/* Secondary warm glow */}
                    <motion.div
                        style={{
                            x: useTransform(scrollYProgress, [0.3, 0.7], ['20%', '-20%']),
                        }}
                        className="absolute w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(255,200,100,0.15)_0%,transparent_60%)] blur-md"
                    />

                    {/* Horizontal streak */}
                    <div className="absolute w-[500px] h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff]/20 to-transparent" />

                    {/* Small secondary flares */}
                    <motion.div
                        style={{
                            x: useTransform(scrollYProgress, [0.3, 0.7], ['-40px', '60px']),
                            y: useTransform(scrollYProgress, [0.3, 0.7], ['10px', '-10px']),
                        }}
                        className="absolute w-8 h-8 rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.3)_0%,transparent_70%)]"
                    />
                    <motion.div
                        style={{
                            x: useTransform(scrollYProgress, [0.3, 0.7], ['80px', '-30px']),
                            y: useTransform(scrollYProgress, [0.3, 0.7], ['-15px', '5px']),
                        }}
                        className="absolute w-5 h-5 rounded-full bg-[radial-gradient(circle,rgba(255,0,170,0.2)_0%,transparent_70%)]"
                    />
                </motion.div>
            )}
        </div>
    );
}
