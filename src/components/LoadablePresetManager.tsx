import { useState, useEffect } from "react";
import * as storage from "../svs/storage";
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Trash2, Search, Plus, Home, Crosshair } from "lucide-react";

type Props = {
    currentControls: { volume: number, phase: number };
    onLoad: (controls: { volume: number, phase: number }) => void;
    selectedTarget: string | null;
    onSelectTarget: (name: string | null) => void;
}

export default ({ currentControls, onLoad, selectedTarget, onSelectTarget }: Props) => {
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
        // When loading, we also set it as target?
        // User said: "if a preset from presetmanage is not available it will fallback to a selected targetm if selected target then home."
        // And "if a preset from presetmanage is not available it will fallback to a selected target"
        // And "Home is default not allowed to delete" -> Home is just a base target?
        // Let's assume clicking a template sets it as the TARGET and LOADS it.
        onSelectTarget(name);

        const controls = storage.getTemplate(name);
        if (controls) {
            onLoad(controls);
        }
    };

    const handleLoadHome = () => {
        onSelectTarget(null); // Null target means fallback to Home
        const home = storage.getHome();
        onLoad(home.controls);
    }

    const handleDelete = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Delete template "${name}"?`)) {
            storage.deleteTemplate(name);
            refreshTemplates();
            if (selectedTarget === name) {
                onSelectTarget(null);
            }
        }
    };

    const filteredTemplates = templates.filter(t => t.toLowerCase().includes(filterText.toLowerCase()));

    return (
        <Tooltip.Provider>
            <div className="sidebar h-full p-4 gap-4 box-border">
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Templates</h3>

                {/* Filter Input */}
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                        type="text"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Filter templates..."
                        className="pl-8"
                    />
                </div>

                <div className="h-px bg-mauve-6 w-full my-2"></div>

                {/* Template List */}
                <ScrollArea.Root className="ScrollAreaRoot flex-1 bg-transparent">
                    <ScrollArea.Viewport className="ScrollAreaViewport">
                        <div className="flex flex-col gap-2">
                            {/* HOME Item */}
                            <div
                                className={`flex justify-between items-center p-2 rounded cursor-pointer group transition-colors ${!selectedTarget ? 'bg-accent/20 border border-accent/50' : 'hover:bg-surface-hover'}`}
                                onClick={handleLoadHome}
                            >
                                <div className="flex items-center gap-2">
                                    {!selectedTarget && <Crosshair size={16} style={{ color: '#39ff14' }} />}
                                    <span className="text-sm">Home</span>
                                </div>
                                <Tooltip.Root delayDuration={0}>
                                    <Tooltip.Trigger asChild>
                                        <span className="cursor-not-allowed opacity-20 hover:opacity-100 transition-opacity">
                                            <button disabled className="p-1 text-secondary bg-transparent border-none pointer-events-none">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </span>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content className="bg-mauve-12 text-mauve-1 text-xs px-2 py-1 rounded shadow-md z-50 mb-1" sideOffset={5}>
                                            Cannot delete Home preset
                                            <Tooltip.Arrow className="fill-mauve-12" />
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            </div>

                            {filteredTemplates.length === 0 ? (
                                <div className="text-center text-secondary text-sm italic py-4">
                                    {filterText ? 'No matching templates' : 'No templates saved'}
                                </div>
                            ) : (
                                filteredTemplates.map(name => {
                                    const isTarget = selectedTarget === name;
                                    return (
                                        <div
                                            key={name}
                                            className={`flex justify-between items-center p-2 rounded cursor-pointer group transition-colors ${isTarget ? 'bg-accent/20 border border-accent/50' : 'hover:bg-surface-hover'}`}
                                            onClick={() => handleLoad(name)}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {isTarget && <Crosshair size={16} style={{ color: '#39ff14' }} className="shrink-0" />}
                                                <span className="text-sm truncate">{name}</span>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(name, e)}
                                                className="p-1 text-danger opacity-0 group-hover:opacity-100 transition-opacity bg-transparent hover:bg-mauve-4 border-none"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar className="ScrollAreaScrollbar" orientation="vertical">
                        <ScrollArea.Thumb className="ScrollAreaThumb" />
                    </ScrollArea.Scrollbar>
                </ScrollArea.Root>

                <div className="h-px bg-mauve-6 w-full my-2"></div>

                {/* Save New Template */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="New Template Name"
                        className="flex-1"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                        }}
                    />
                    <button
                        onClick={handleSave}
                        disabled={!saveName.trim()}
                        className="flex items-center justify-center p-2"
                        title="Save Template"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Tooltip.Provider>
    );
};
