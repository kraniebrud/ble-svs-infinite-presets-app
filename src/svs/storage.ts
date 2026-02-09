const ls = window.localStorage;

const BASE = "PRESET:MUSIC";
const TYPES = {
    HOME: "HOME",
    GENRE: "GENRE",
    ARTIST: "ARTIST",
    RELEASE: "RELEASE",
    TRACK: "TRACK",
    TEMPLATE: "TEMPLATE",
    TARGET: "TARGET"
} as const;

type CONTROLS = { volume: number; phase: number };
type ITEM = { title: string; controls: CONTROLS };
type PLAYING = { title?: string; artist?: string; album?: string; genre?: string };

const KEY_BUILDERS: Record<string, (p: Partial<PLAYING>) => string | null> = {
    [TYPES.HOME]: (p) => `${BASE}<HOME>`,
    [TYPES.GENRE]: (p) => p.genre ? `${BASE}<GENRE><${p.genre}>` : null,
    [TYPES.ARTIST]: (p) => `${BASE}<ARTIST><${p.artist}>`,
    [TYPES.RELEASE]: (p) => p.album ? `${BASE}<RELEASE><${p.artist}><${p.album ?? ""}>` : null,
    [TYPES.TRACK]: (p) => `${BASE}<TRACK><${p.artist}><${p.album ?? ""}><${p.title}>`,
};

const selectKeyFromKeyBuilders = (type: keyof typeof TYPES, playing: Partial<PLAYING>) => {
    const keyBuilder = KEY_BUILDERS[type];
    if (!keyBuilder) {
        // TARGET and TEMPLATE don't have standard key builders based on playing info
        return null;
    }
    return keyBuilder(playing);
}

const storage = {
    get: (key: string | null): ITEM | null => {
        if (!key) {
            return null;
        }
        const val = ls.getItem(key);
        return val ? JSON.parse(val) : null;
    },
    set: (key: string, item: ITEM) => {
        console.log("Setting key:", key);
        console.log("Setting item:", item);
        ls.setItem(key, JSON.stringify(item))
    },
    remove: (key: string) => {
        ls.removeItem(key);
    }
};

const DEFAULT_CONTROLS: CONTROLS = { volume: -29, phase: 77 };

const initStorage = () => {
    const homeKey = KEY_BUILDERS[TYPES.HOME]({});
    if (homeKey && !storage.get(homeKey)) {
        storage.set(homeKey, { title: "Home", controls: DEFAULT_CONTROLS });
    }
};
initStorage();

export const getHome = () => storage.get(KEY_BUILDERS[TYPES.HOME]({})!)!;

/* SELECTED TARGET MANAGEMENT */
const SELECTED_TARGET_KEY = `${BASE}<SELECTED_TARGET>`;

export const setSelectedTarget = (name: string | null) => {
    if (name) {
        ls.setItem(SELECTED_TARGET_KEY, name);
    } else {
        ls.removeItem(SELECTED_TARGET_KEY);
    }
}

export const getSelectedTarget = (): string | null => {
    return ls.getItem(SELECTED_TARGET_KEY);
}

/* TEMPLATES (Loadable Presets) */

const TEMPLATE_PREFIX = `${BASE}<TEMPLATE>`;

const getTemplateKey = (name: string) => `${TEMPLATE_PREFIX}<${name}>`;

export const saveTemplate = (name: string, controls: CONTROLS) => {
    if (!name) throw new Error("Template name is required");
    const key = getTemplateKey(name);
    storage.set(key, { title: name, controls });
};

export const getTemplate = (name: string): CONTROLS | null => {
    const key = getTemplateKey(name);
    const item = storage.get(key);
    return item ? item.controls : null;
};

export const deleteTemplate = (name: string) => {
    const key = getTemplateKey(name);
    storage.remove(key);
};

export const getAllTemplates = (): string[] => {
    const templates: string[] = [];
    for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        if (key && key.startsWith(TEMPLATE_PREFIX)) {
            const parts = key.split('<');
            // parts[0] = PRESET:MUSIC
            // parts[1] = TEMPLATE>
            // parts[2] = Name>
            const nameWithBracket = parts[2];
            if (nameWithBracket) {
                const name = nameWithBracket.substring(0, nameWithBracket.length - 1);
                templates.push(name);
            }
        }
    }
    return templates;
};

export const getPresetFromPlaying = (playing?: PLAYING, selectedTargetName?: string | null) => {
    const homeKey = KEY_BUILDERS[TYPES.HOME]({});
    const homeItem = getHome(); // Fallback to Home if nothing else

    if (!playing) {
        // Even if not playing, if there is a selected target, maybe we should return it?
        // But usually "Preset from Playing" implies we need context.
        // If not playing, usually we default to Home.
        // Let's stick to Home if not playing for now unless requirements change.
        return { active: { type: TYPES.HOME, key: homeKey, item: homeItem }, chain: [] };
    }

    // Hierarchy: TRACK > RELEASE > ARTIST > GENRE > TARGET > HOME
    const hierarchy = [TYPES.TRACK, TYPES.RELEASE, TYPES.ARTIST, TYPES.GENRE];

    const chain = hierarchy.map(type => {
        const key = selectKeyFromKeyBuilders(type, playing);
        const item = storage.get(key);
        return { type, key, item };
    });

    let active = chain.find(c => c.key && c.item);

    if (!active) {
        // Try Target
        if (selectedTargetName) {
            const templateControls = getTemplate(selectedTargetName);
            if (templateControls) {
                active = {
                    type: TYPES.TARGET,
                    key: getTemplateKey(selectedTargetName),
                    item: { title: selectedTargetName, controls: templateControls }
                };
            }
        }
    }

    if (!active) {
        // Fallback to Home
        active = { type: TYPES.HOME, key: homeKey, item: homeItem };
    }

    return { active, chain };
};

export const setPresetFromPlaying = (preset: { type: keyof typeof TYPES, playing: PLAYING, controls: CONTROLS }) => {
    const key = selectKeyFromKeyBuilders(preset.type, preset.playing);

    if (!key) {
        throw new Error(`Could not generate key for type: ${preset.type}`);
    }

    let removeKeys: (string | null)[] = [];
    if (preset.type === 'RELEASE') {
        removeKeys = [
            selectKeyFromKeyBuilders(TYPES.TRACK, preset.playing),
        ]
    }
    if (preset.type === 'ARTIST') {
        removeKeys = [
            selectKeyFromKeyBuilders(TYPES.TRACK, preset.playing),
            selectKeyFromKeyBuilders(TYPES.RELEASE, preset.playing),
        ]
    }

    removeKeys.forEach(removeKey => removeKey && storage.remove(removeKey));

    storage.set(key, {
        title: key,
        controls: preset.controls,
    });
};

export const deletePresetsFromPlaying = (playing: PLAYING) => {
    const hierarchy = [TYPES.TRACK, TYPES.RELEASE, TYPES.ARTIST, TYPES.GENRE];

    hierarchy.forEach(type => {
        const key = selectKeyFromKeyBuilders(type, playing);
        if (key) {
            storage.remove(key);
        }
    });
};