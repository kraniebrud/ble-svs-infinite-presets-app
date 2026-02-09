import { useState, useEffect } from 'react';

export interface NowPlayingData {
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    elapsedTime?: number;
    isPlaying?: boolean;
    artwork?: string; // base64 data URI
}

export const useNowPlaying = () => {
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);

    useEffect(() => {
        const electron = (window as any).electron;

        if (electron && electron.onNowPlayingUpdate) {
            electron.onNowPlayingUpdate((data: NowPlayingData) => {
                if (data && typeof data === 'object') {
                    setNowPlaying((prev) => {
                        return data;
                    });
                }
            });
        }

        return () => { };
    }, []);

    return nowPlaying;
};
