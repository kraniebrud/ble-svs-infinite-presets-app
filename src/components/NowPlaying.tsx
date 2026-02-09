import { Save, Check, X, Disc, User, Music } from "lucide-react";
import * as storage from "../svs/storage";

type Props = {
    nowPlaying: { title?: string, artist?: string, album?: string, genre?: string } | null;
    activePreset: ReturnType<typeof storage.getPresetFromPlaying>['active'] | null;
    onSavePreset: (type: 'TRACK' | 'ARTIST' | 'RELEASE') => void;
    onClearPreset: () => void;
}

const PresetRow = ({
    label,
    value,
    type,
    activePreset,
    onSave,
    icon: Icon
}: {
    label: string,
    value?: string,
    type: string,
    activePreset: any,
    onSave: () => void,
    icon: any
}) => {
    const isActive = activePreset?.type === type;
    const isDisabled = !value;

    return (
        <div className={`flex items-center justify-between p-3 rounded ${isActive ? 'bg-accent/10 border border-accent/20' : 'bg-surface hover:bg-surface-hover'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-full ${isActive ? 'bg-accent text-white' : 'bg-mauve-4 text-secondary'}`}>
                    <Icon size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">{label}</span>
                    <span className="text-sm truncate font-medium" title={value}>{value || 'Unknown'}</span>
                </div>
            </div>

            <div className="flex gap-2">
                {isActive && (
                    <div className="flex items-center gap-1 text-accent text-xs font-bold px-2 py-1 bg-accent/10 rounded">
                        <Check size={12} />
                        ACTIVE
                    </div>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
                    disabled={isDisabled}
                    className={`p-2 rounded hover:bg-mauve-5 transition-colors ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'text-secondary hover:text-primary'}`}
                    title={`Save ${label} Preset`}
                >
                    <Save size={16} />
                </button>
            </div>
        </div>
    );
};

export default ({ nowPlaying, activePreset, onSavePreset, onClearPreset }: Props) => {
    if (!nowPlaying) {
        return (
            <div className="card flex flex-col items-center justify-center p-8 text-secondary gap-2">
                <Music size={32} className="opacity-50" />
                <span>No music playing</span>
            </div>
        );
    }

    const isActiveHome = activePreset?.type === 'HOME';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Now Playing</h3>
                {!isActiveHome && activePreset && (
                    <button
                        onClick={onClearPreset}
                        className="text-xs text-danger border border-danger/20 hover:bg-danger/10 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                        <X size={12} /> Clear Preset
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <PresetRow
                    label="Track"
                    value={nowPlaying.title}
                    type="TRACK"
                    activePreset={activePreset}
                    onSave={() => onSavePreset('TRACK')}
                    icon={Music}
                />
                <PresetRow
                    label="Artist"
                    value={nowPlaying.artist}
                    type="ARTIST"
                    activePreset={activePreset}
                    onSave={() => onSavePreset('ARTIST')}
                    icon={User}
                />
                <PresetRow
                    label="Release"
                    value={nowPlaying.album}
                    type="RELEASE"
                    activePreset={activePreset}
                    onSave={() => onSavePreset('RELEASE')}
                    icon={Disc}
                />
            </div>

            {nowPlaying.genre && (
                <div className="flex justify-end">
                    <span className="text-xs text-secondary bg-surface px-2 py-1 rounded border border-border">
                        Genre: {nowPlaying.genre}
                    </span>
                </div>
            )}
        </div>
    );
}
