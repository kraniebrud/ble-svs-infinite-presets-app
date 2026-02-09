import * as storage from "../svs/storage";

type Props = {
    nowPlaying: { title?: string, artist?: string, album?: string, genre?: string, artwork?: string } | null;
    activePreset: ReturnType<typeof storage.getPresetFromPlaying>['active'] | null;
}

export default ({ nowPlaying, activePreset }: Props) => {
    if (!nowPlaying) return null;

    return (
        <div id="now-playing" style={{
            background: 'rgba(0,0,0,0.8)',
            padding: 10,
            borderRadius: 8,
            color: 'white',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'left' }}>
                {nowPlaying.artwork && (
                    <img src={nowPlaying.artwork} style={{ width: 50, height: 50, marginRight: 10, borderRadius: 4 }} />
                )}
                <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {nowPlaying.title || 'Unknown Title'}
                        {activePreset?.type === "TRACK" && ' *'}
                    </div>
                    {nowPlaying.album && (
                        <div style={{ fontSize: '0.8em', opacity: 0.6 }}>
                            {nowPlaying.album}
                            {activePreset?.type === "RELEASE" && ' *'}
                        </div>
                    )}
                    <div style={{ fontSize: '0.9em', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {nowPlaying.artist || 'Unknown Artist'}
                        {activePreset?.type === "ARTIST" && ' *'}
                    </div>
                </div>
            </div>


        </div>
    );
}
