import { Bluetooth } from "lucide-react";

type Props = {
    handleConnect: () => void;
}

export default ({ handleConnect }: Props) => {
    return (
        <div className="card flex flex-col items-center justify-center p-8 gap-4">
            <div className="p-4 bg-mauve-4 rounded-full">
                <Bluetooth size={48} className="text-accent" />
            </div>
            <h2 className="text-xl font-bold">Connect SVS</h2>
            <p className="text-secondary text-center max-w-xs">
                Connect to your SVS device to start controlling presets based on your music.
            </p>
            <button
                onClick={handleConnect}
                className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
            >
                Connect Device
            </button>
        </div>
    );
}