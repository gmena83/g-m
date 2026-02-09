'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceNarrationState {
    isPlaying: boolean;
    isPaused: boolean;
    isSupported: boolean;
    voices: SpeechSynthesisVoice[];
    selectedVoice: SpeechSynthesisVoice | null;
}

export function useVoiceNarration() {
    const [state, setState] = useState<VoiceNarrationState>({
        isPlaying: false,
        isPaused: false,
        isSupported: false,
        voices: [],
        selectedVoice: null,
    });

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            return;
        }

        setState((prev) => ({ ...prev, isSupported: true }));

        const loadVoices = () => {
            const availableVoices = speechSynthesis.getVoices();

            // Prefer British English voices for the Attenborough effect
            const preferredVoice = availableVoices.find(
                (v) => v.lang === 'en-GB' && (v.name.includes('Male') || v.name.includes('Daniel'))
            ) || availableVoices.find(
                (v) => v.lang.startsWith('en-')
            ) || availableVoices[0];

            setState((prev) => ({
                ...prev,
                voices: availableVoices,
                selectedVoice: preferredVoice || null,
            }));
        };

        loadVoices();
        speechSynthesis.addEventListener('voiceschanged', loadVoices);

        return () => {
            speechSynthesis.removeEventListener('voiceschanged', loadVoices);
            speechSynthesis.cancel();
        };
    }, []);

    const speak = useCallback((text: string, rate: number = 0.85) => {
        if (!state.isSupported || !text) return;

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        if (state.selectedVoice) {
            utterance.voice = state.selectedVoice;
        }

        // Slower, more dramatic delivery like Attenborough
        utterance.rate = rate;
        utterance.pitch = 0.95;
        utterance.volume = 1;

        utterance.onstart = () => {
            setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
        };

        utterance.onend = () => {
            setState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
        };

        utterance.onerror = () => {
            setState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
    }, [state.isSupported, state.selectedVoice]);

    const pause = useCallback(() => {
        if (!state.isSupported) return;
        speechSynthesis.pause();
        setState((prev) => ({ ...prev, isPaused: true }));
    }, [state.isSupported]);

    const resume = useCallback(() => {
        if (!state.isSupported) return;
        speechSynthesis.resume();
        setState((prev) => ({ ...prev, isPaused: false }));
    }, [state.isSupported]);

    const stop = useCallback(() => {
        if (!state.isSupported) return;
        speechSynthesis.cancel();
        setState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
    }, [state.isSupported]);

    const toggle = useCallback((text: string) => {
        if (state.isPlaying && !state.isPaused) {
            pause();
        } else if (state.isPaused) {
            resume();
        } else {
            speak(text);
        }
    }, [state.isPlaying, state.isPaused, pause, resume, speak]);

    return {
        ...state,
        speak,
        pause,
        resume,
        stop,
        toggle,
    };
}
