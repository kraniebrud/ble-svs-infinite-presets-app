import * as protocol from "./crc";
import { invoke } from "@tauri-apps/api/core";

const PREAMBLE = 0xAA;

export const delay = (ms: number = 200) => new Promise(res => setTimeout(res, ms));

/**
 * Wraps an async function so that calls are executed sequentially.
 */
const createQueue = () => {
    let promiseChain = Promise.resolve();

    return <T extends (...args: any[]) => Promise<any>>(fn: T) => {
        return (...args: Parameters<T>): Promise<ReturnType<T>> => {
            const result = promiseChain.then(() => fn(...args));
            promiseChain = result.catch(() => { }); // Continue chain even on error
            return result;
        };
    };
};

export const connect = async () => {
    try {
        console.log("Starting BLE scan and connect...");
        const result = await invoke<string>("ble_scan");
        console.log("BLE Scan Result:", result);

        if (result === "Connected") {
            console.log("🚀 Success! Connected to SVS.");
            return { connected: true };
        }

        return undefined;
    } catch (err) {
        console.error("Connection failed: ", err);
        return undefined;
    }
}

// Internal raw sender
const sendFrame = async (frame: Uint8Array) => {
    try {
        await invoke("ble_write", { payload: Array.from(frame) });
        // Small delay to let the Sub's flash memory finish writing
        await new Promise(res => setTimeout(res, 100));
    } catch (e) {
        console.error("Failed to write to BLE:", e);
    }
};

const withQueue = createQueue();

export const setVolume = withQueue(async (volume: number) => {
    const MEMWRITE = [0xF0, 0x1F];
    const VOLUME_ID = 4;
    const VOLUME_OFFSET = 0x2C;
    const N_BYTES = 2;

    let elevatedVolume = Math.floor(volume * 10);
    const dataBytes = [elevatedVolume & 0xFF, (elevatedVolume >> 8) & 0xFF];

    const payload = [VOLUME_ID, 0, 0, 0, VOLUME_OFFSET, 0, N_BYTES, 0, ...dataBytes];
    const frameLength = payload.length + 7;
    const header = [PREAMBLE, ...MEMWRITE, frameLength & 0xFF, (frameLength >> 8) & 0xFF];

    const frame = new Uint8Array([...header, ...payload]);
    const finalFrame = new Uint8Array([...frame, protocol.crc16hqx(frame) & 0xFF, (protocol.crc16hqx(frame) >> 8) & 0xFF]);

    await sendFrame(finalFrame);
    console.log('Volume updated to:', volume);
});

export const setPhase = withQueue(async (degrees: number) => {
    const MEMWRITE = [0xF0, 0x1F];
    const PHASE_ID = 4;
    const PHASE_OFFSET = 0x2E;
    const N_BYTES = 2;

    let elevatedPhase = Math.floor(degrees * 10);
    const dataBytes = [elevatedPhase & 0xFF, (elevatedPhase >> 8) & 0xFF];

    const payload = [PHASE_ID, 0, 0, 0, PHASE_OFFSET, 0, N_BYTES, 0, ...dataBytes];
    const frameLength = payload.length + 7;
    const header = [PREAMBLE, ...MEMWRITE, frameLength & 0xFF, (frameLength >> 8) & 0xFF];

    const frame = new Uint8Array([...header, ...payload]);
    const finalFrame = new Uint8Array([...frame, protocol.crc16hqx(frame) & 0xFF, (protocol.crc16hqx(frame) >> 8) & 0xFF]);

    await sendFrame(finalFrame);
    console.log(`Phase updated to: ${degrees}`);
});

export type Connected = Awaited<ReturnType<typeof connect>>;