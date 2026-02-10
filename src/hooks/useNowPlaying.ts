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
        let unlisten: (() => void) | undefined;

        import('@tauri-apps/api/event').then(({ listen }) => {
            listen<NowPlayingData>('now-playing-update', (event) => {
                setNowPlaying(event.payload);
            }).then((u) => {
                unlisten = u;
            });
        });

        return () => {
            if (unlisten) {
                unlisten();
            }
        };
    }, []);

    return nowPlaying;
};
