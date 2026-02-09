import { useState, useEffect } from "react";
import * as storage from "../svs/storage";

type Props = {
    currentControls: { volume: number, phase: number };
    onLoad: (controls: { volume: number, phase: number }) => void;
}

export default ({ currentControls, onLoad }: Props) => {
    const [templates, setTemplates] = useState<string[]>([]);
    const [saveName, setSaveName] = useState("");
    const [filterText, setFilterText] = useState("");

    const refreshTemplates = () => {
        setTemplates(storage.getAllTemplates());
    };

    useEffect(() => {
        refreshTemplates();
    }, []);

    const handleSave = () => {
        if (!saveName.trim()) return;
        storage.saveTemplate(saveName, currentControls);
        setSaveName("");
        refreshTemplates();
    };

    const handleLoad = (name: string) => {
        const controls = storage.getTemplate(name);
        if (controls) {
            onLoad(controls);
        }
    };

    const handleDelete = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Delete template "${name}"?`)) {
            storage.deleteTemplate(name);
            refreshTemplates();
        }
    };

    const filteredTemplates = templates.filter(t => t.toLowerCase().includes(filterText.toLowerCase()));

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: 10,
            boxSizing: 'border-box'
        }}>
            <h3 style={{ margin: 0, fontSize: '1em', color: '#ccc' }}>Templates</h3>

            {/* Filter Input */}
            <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter templates..."
                style={{
                    background: '#333',
                    border: '1px solid #555',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '0.9em',
                    width: '100%',
                    boxSizing: 'border-box'
                }}
            />

            <div style={{ borderTop: '1px solid #444' }}></div>

            {/* Template List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredTemplates.length === 0 ? (
                    <div style={{ padding: 5, color: '#888', fontStyle: 'italic', fontSize: '0.9em' }}>
                        {filterText ? 'No matching templates' : 'No templates saved'}
                    </div>
                ) : (
                    filteredTemplates.map(name => (
                        <div
                            key={name}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 8px',
                                background: '#333',
                                borderRadius: 4,
                                cursor: 'pointer',
                            }}
                            onClick={() => handleLoad(name)}
                            className="template-item"
                        >
                            <span style={{ fontSize: '0.9em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                            <button
                                onClick={(e) => handleDelete(name, e)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ff6b6b',
                                    cursor: 'pointer',
                                    fontSize: '1em',
                                    padding: '0 5px'
                                }}
                                title="Delete"
                            >
                                ×
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div style={{ borderTop: '1px solid #444' }}></div>

            {/* Save New Template */}
            <div style={{ display: 'flex', gap: 5 }}>
                <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="New Template Name"
                    style={{
                        flex: 1,
                        background: '#333',
                        border: '1px solid #555',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.9em',
                        minWidth: 0
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                    }}
                />
                <button
                    onClick={handleSave}
                    disabled={!saveName.trim()}
                    style={{
                        background: '#444',
                        border: 'none',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 4,
                        cursor: saveName.trim() ? 'pointer' : 'default',
                        opacity: saveName.trim() ? 1 : 0.5
                    }}
                >
                    Save
                </button>
            </div>
        </div>
    );
};
