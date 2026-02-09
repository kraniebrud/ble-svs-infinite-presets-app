import "./index.css";

// import { connect, delay } from "./svs/controller";
import type { Connected } from "./svs/controller";
import * as storage from "./svs/storage";

import { useEffect, useState } from "react";

import Connect from "./components/Connect";
import Controls from "./components/Controls";
import NowPlaying from "./components/NowPlaying";
import PresetManager from "./components/PresetManager";
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

  const nowPlaying = useNowPlaying();

  // Update active preset
  useEffect(() => {
    if (nowPlaying) {
      const { active } = storage.getPresetFromPlaying(nowPlaying);
      setActivePreset(active);
    } else {
      setActivePreset(null);
    }
  }, [nowPlaying]);

  const handleSavePreset = (type: 'TRACK' | 'ARTIST' | 'RELEASE') => {
    if (!nowPlaying) return;
    const currentControls = { volume, phase };
    storage.setPresetFromPlaying({
      type,
      playing: nowPlaying,
      controls: currentControls
    });
    // Force refresh active preset
    const { active } = storage.getPresetFromPlaying(nowPlaying);
    setActivePreset(active);
  }

  return (
    <div className="app" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', background: '#222', borderRight: '1px solid #444', display: 'flex', flexDirection: 'column' }}>
        <LoadablePresetManager
          currentControls={{ volume, phase }}
          onLoad={(controls) => {
            setVolume(controls.volume);
            setPhase(controls.phase);
          }}
        />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 20, gap: 20 }}>
        <NowPlaying
          nowPlaying={nowPlaying}
          activePreset={activePreset}
        />
        <PresetManager
          nowPlaying={nowPlaying}
          activePreset={activePreset}
          handleSetActivePreset={setActivePreset}
          onSavePreset={handleSavePreset}
        />
        {!connected ? (
          <Connect handleConnect={handleConnect} />
        ) : (
          <>
            <Controls
              connection={connected}
              volume={volume}
              setVolume={setVolume}
              phase={phase}
              setPhase={setPhase}
              activePreset={activePreset}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
