import { useState, useRef, useEffect } from "react";
import * as storage from "../svs/storage";

type Props = {
    nowPlaying: { title?: string, artist?: string, album?: string, genre?: string } | null;
    activePreset: ReturnType<typeof storage.getPresetFromPlaying>['active'] | null;
    handleSetActivePreset: (preset: ReturnType<typeof storage.getPresetFromPlaying>['active']) => void;
    onSavePreset: (type: 'TRACK' | 'ARTIST' | 'RELEASE') => void;
}

export default ({ nowPlaying, activePreset, handleSetActivePreset, onSavePreset }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    // Track local selection only for the purpose of the Save button?
    // Actually, let's make the list items actionable immediately or selectable.
    // The user wants to see "Saved" status (checkmark).

    // To match previous behavior: Select Type -> Click Save.
    // We need state for "What is currently selected in the dropdown to be saved".

    // Default selection: active preset type OR 'TRACK' if nothing active? 
    // Or just 'TRACK' default. User logic was: "Save as..." placeholder.

    const getInitialType = (): 'TRACK' | 'ARTIST' | 'RELEASE' | '' => {
        if (activePreset?.type === 'TRACK' || activePreset?.type === 'ARTIST' || activePreset?.type === 'RELEASE') {
            return activePreset.type;
        }
        return 'TRACK'; // Default to Track if nothing active, so user can easily save track
    };

    const [selectedType, setSelectedType] = useState<'TRACK' | 'ARTIST' | 'RELEASE' | ''>(getInitialType());

    const setInitialSelectedType = () => {
        const initial = getInitialType();
        if (initial) {
            setSelectedType(initial)
        };
    };

    // Sync if active preset changes
    useEffect(() => {
        setInitialSelectedType();
    }, [activePreset]);

    // Close on outside click
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (nowPlaying && confirm(`Clear the preset?`)) {
            storage.deletePresetsFromPlaying(nowPlaying);
            handleSetActivePreset(storage.getPresetFromPlaying(nowPlaying).active);
        }
    };

    if (!nowPlaying) return null;

    const options = [
        { label: 'Track', value: 'TRACK', text: nowPlaying.title, disabled: !nowPlaying.title },
        { label: 'Artist', value: 'ARTIST', text: nowPlaying.artist, disabled: !nowPlaying.artist },
        { label: 'Album', value: 'RELEASE', text: nowPlaying.album, disabled: !nowPlaying.album },
    ] as const;

    const selectedOption = options.find(o => o.value === selectedType);

    const isActivePresetHome = activePreset?.type === 'HOME';

    return (
        <div style={{
            background: 'rgba(0,0,0,0.8)',
            padding: 10,
            borderRadius: 8,
            color: 'white',
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
        }}>
            <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8em', padding: '2px 10px' }}>Presets</label>
                </div>
                <div style={{ flex: 1 }}>
                    <button
                        disabled={!activePreset || isActivePresetHome}
                        style={{
                            fontSize: '0.66em',
                            padding: '2px 10px',
                            userSelect: 'none',
                            border: '0px',
                            color: '#5b5b5bff',
                            backgroundColor: 'transparent',
                        }}
                        onClick={handleClear}
                    >
                        Clear
                    </button>
                </div>
            </div>


            <div style={{ display: 'flex', gap: 10 }} ref={containerRef}>
                {/* Custom Dropdown Trigger */}
                <div
                    style={{
                        flex: 1,
                        position: 'relative',
                        background: '#333',
                        borderRadius: 4,
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                            {selectedOption ? (
                                <>
                                    <span style={{ opacity: 0.7 }}>{selectedOption.label}:</span> {selectedOption.text || 'N/A'}
                                </>
                            ) : 'Select type...'}
                        </span>
                        <span>▼</span>
                    </div>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#222',
                            border: '1px solid #444',
                            borderRadius: 4,
                            marginTop: 4,
                            zIndex: 100,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            overflow: 'hidden'
                        }}>
                            {options.map((opt) => {
                                const isSaved = activePreset?.type === opt.value;
                                const isSelected = selectedType === opt.value;

                                return (
                                    <div
                                        key={opt.value}
                                        style={{
                                            padding: '8px 10px',
                                            background: isSelected ? '#444' : 'transparent',
                                            opacity: opt.disabled ? 0.5 : 1,
                                            cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        onClick={(e) => {
                                            if (opt.disabled) return;
                                            e.stopPropagation();
                                            setSelectedType(opt.value);
                                            setIsOpen(false);
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!opt.disabled) e.currentTarget.style.background = '#555';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!opt.disabled) e.currentTarget.style.background = isSelected ? '#444' : 'transparent';
                                        }}
                                    >
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 'bold', color: '#aaa', minWidth: 50, display: 'inline-block' }}>{opt.label}</span>
                                            <span>{opt.text || 'N/A'}</span>
                                        </div>
                                        {isSaved && (
                                            <div style={{ marginLeft: 10, color: '#4caf50' }}>✔</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <button
                    style={{ fontSize: '0.8em', padding: '2px 10px' }}
                    disabled={!selectedType || (selectedType === 'TRACK' && !nowPlaying.title)}
                    onClick={() => {
                        if (selectedType) {
                            onSavePreset(selectedType);
                            setIsOpen(false);
                        }
                    }}
                >
                    Save
                </button>
            </div>
        </div>
    );
}
