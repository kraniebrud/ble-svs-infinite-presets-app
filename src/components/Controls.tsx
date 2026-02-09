import { useEffect } from "react";

import controller from "../svs/controller";
import type { Connected } from "../svs/controller";

import * as storage from "../svs/storage";

export const delay = (ms: number = 200) => new Promise(res => setTimeout(res, ms));

type Props = {
    connection: NonNullable<Connected>;
    volume: number;
    setVolume: (v: number) => void;
    phase: number;
    setPhase: (p: number) => void;
    activePreset: ReturnType<typeof storage.getPresetFromPlaying>['active'] | null;
}

export default ({ connection, volume, setVolume, phase, setPhase, activePreset }: Props) => {
    // Volume
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log("Sending to controller:", volume);
            controller({ characteristic: connection.characteristic }).setVolume(volume);
        }, 500);

        return () => clearTimeout(timer);
    }, [volume]);

    // Phase
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log("Sending to controller:", phase);
            controller({ characteristic: connection.characteristic }).setPhase(phase);
        }, 500);

        return () => clearTimeout(timer);
    }, [phase]);

    // Auto-update controls when active preset changes
    useEffect(() => {
        if (activePreset && activePreset.item) {
            const { volume, phase } = activePreset.item.controls;
            setVolume(volume);
            setPhase(phase);
        }
    }, [activePreset]);

    return (
        <div>
            <div id="controls-container">
                <div className="control-row">
                    <div className="header">
                        <label>Volume</label>
                        <div className="value">
                            <input
                                type="number"
                                min="-60"
                                max="0"
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="field">
                        <input
                            type="range"
                            min="-60"
                            max="0"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="control-row">
                    <div className="header">
                        <label>Phase</label>
                        <div className="value">
                            <input
                                type="number"
                                min="0"
                                max="180"
                                value={phase}
                                onChange={(e) => setPhase(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="field">
                        <input
                            type="range"
                            min="0"
                            max="180"
                            value={phase}
                            onChange={(e) => setPhase(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}