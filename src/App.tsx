import "./index.css";

// import { connect, delay } from "./svs/controller";
import type { Connected } from "./svs/controller";
import * as storage from "./svs/storage";

import { useEffect, useState } from "react";

import Connect from "./components/Connect";
import Controls from "./components/Controls";
import NowPlaying from "./components/NowPlaying";
import LoadablePresetManager from "./components/LoadablePresetManager";

import { useNowPlaying } from "./hooks/useNowPlaying";
import { useSVSConnection } from "./hooks/useSVSConnection";

export const App = () => {
  const { connected, handleConnect } = useSVSConnection();
  const [activePreset, setActivePreset] = useState<ReturnType<typeof storage.getPresetFromPlaying>['active'] | null>(null);

  // Lifted state from Controls
  const home = storage.getHome();
  const [volume, setVolume] = useState<number>(home.controls.volume);
  const [phase, setPhase] = useState<number>(home.controls.phase);

  const [selectedTarget, setSelectedTarget] = useState<string | null>(storage.getSelectedTarget());

  const nowPlaying = useNowPlaying();

  // Update active preset
  useEffect(() => {
    if (nowPlaying) {
      const { active } = storage.getPresetFromPlaying(nowPlaying, selectedTarget);
      setActivePreset(active);
    } else {
      setActivePreset(null);
    }
  }, [nowPlaying, selectedTarget]);

  const handleSavePreset = (type: 'TRACK' | 'ARTIST' | 'RELEASE') => {
    if (!nowPlaying) return;
    const currentControls = { volume, phase };
    storage.setPresetFromPlaying({
      type,
      playing: nowPlaying,
      controls: currentControls
    });
    // Force refresh active preset
    const { active } = storage.getPresetFromPlaying(nowPlaying, selectedTarget);
    setActivePreset(active);
  }

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (e: { matches: boolean }) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    applyTheme(query); // Initial
    query.addEventListener('change', applyTheme);
    return () => query.removeEventListener('change', applyTheme);
  }, []);

  const handleClearPreset = () => {
    if (nowPlaying) {
      if (confirm(`Clear the preset?`)) {
        storage.deletePresetsFromPlaying(nowPlaying);
        setActivePreset(storage.getPresetFromPlaying(nowPlaying, selectedTarget).active);
      }
    }
  };

  const handleSelectTarget = (target: string | null) => {
    storage.setSelectedTarget(target);
    setSelectedTarget(target);
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-background text-primary">
      {/* Sidebar */}
      <div className="sidebar">
        <LoadablePresetManager
          currentControls={{ volume, phase }}
          onLoad={(controls) => {
            setVolume(controls.volume);
            setPhase(controls.phase);
          }}
          selectedTarget={selectedTarget}
          onSelectTarget={handleSelectTarget}
        />
      </div>

      {/* Main Content */}
      <div className="main-content h-full flex flex-col p-5 overflow-y-auto">
        <NowPlaying
          nowPlaying={nowPlaying}
          activePreset={activePreset}
          onSavePreset={handleSavePreset}
          onClearPreset={handleClearPreset}
        />

        <div className="mt-auto pt-5">
          {!connected ? (
            <Connect handleConnect={handleConnect} />
          ) : (
            <div className="card">
              <Controls
                connection={!!connected}
                volume={volume}
                setVolume={setVolume}
                phase={phase}
                setPhase={setPhase}
                activePreset={activePreset}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
