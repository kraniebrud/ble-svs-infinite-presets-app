import { useState } from "react";
import { connect, delay } from "../svs/controller";
import type { Connected } from "../svs/controller";

export const useSVSConnection = () => {
    const [connected, setConnected] = useState<Connected>();

    const handleConnect = async () => {
        const connected = await connect();
        await delay(); // dont fuck with Zohan
        setConnected(connected);
    }

    return {
        connected,
        handleConnect
    };
}
