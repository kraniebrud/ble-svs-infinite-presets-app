import * as React from "react";
import * as Slider from "@radix-ui/react-slider";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Volume2, Activity } from "lucide-react";

type Props = {
    connection: boolean;
    volume: number;
    setVolume: (v: number) => void;
    phase: number;
    setPhase: (v: number) => void;
    activePreset: any;
}

const ControlSlider = ({ value, onValueChange, min, max, label, icon: Icon }: any) => (
    <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center text-secondary text-sm">
            <div className="flex items-center gap-2">
                <Icon size={16} />
                <span>{label}</span>
            </div>
            <span className="font-mono">{value}</span>
        </div>
        <Slider.Root
            className="SliderRoot"
            defaultValue={[value]}
            value={[value]}
            onValueChange={(vals) => onValueChange(vals[0])}
            min={min}
            max={max}
            step={1}
        >
            <Slider.Track className="SliderTrack">
                <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" aria-label={label} />
        </Slider.Root>
    </div>
);

export default ({ connection, volume, setVolume, phase, setPhase, activePreset }: Props) => {
    return (
        <div className="flex flex-col gap-6 w-full">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Controls</h3>
            <ControlSlider
                label="Volume"
                icon={Volume2}
                value={volume}
                onValueChange={setVolume}
                min={-60}
                max={0}
            />
            <ControlSlider
                label="Phase"
                icon={Activity}
                value={phase}
                onValueChange={setPhase}
                min={-180}
                max={180}
            />

            <div className="flex justify-between items-center bg-surface-hover p-2 rounded mt-2">
                <span className="text-secondary text-sm">Status</span>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connection ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">{connection ? 'Connected' : 'Disconnected'}</span>
                </div>
            </div>
        </div>
    );
}