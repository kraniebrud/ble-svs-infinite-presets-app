import * as protocol from "./crc";

const SVS_DEVICE_NAME = "3KMC3144";
const SVS_SERVICE_UUID = "1fee6acf-a826-4e37-9635-4d8a01642c5d";
const SVS_CHAR_UUID = "6409d79d-cd28-479c-a639-92f9e1948b43";
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
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: SVS_DEVICE_NAME }],
            optionalServices: [SVS_SERVICE_UUID],
        });

        const gatt = await (device.gatt as BluetoothRemoteGATTServer).connect();
        const service = await gatt.getPrimaryService(SVS_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(SVS_CHAR_UUID);

        console.log("🚀 Success! Connected to SVS.");

        // TODO (maybe!)
        // await characteristic.startNotifications();
        // characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        //     const value = event.target.value;
        //     const uint8 = new Uint8Array(value.buffer);
        //     console.log('Sub Response (Hex):', Array.from(uint8).map(b => b.toString(16).padStart(2, '0')).join(' '));
        // });

        return { characteristic };
    } catch (err) {
        console.error("Connection failed: ", err);
    }
}

export default (props: { characteristic: BluetoothRemoteGATTCharacteristic }) => {
    const { characteristic: char } = props;
    const withQueue = createQueue();

    // Internal raw sender
    const sendFrame = async (frame: Uint8Array) => {
        await char.writeValueWithResponse(frame as unknown as BufferSource);
        // Small delay to let the Sub's flash memory finish writing
        await new Promise(res => setTimeout(res, 100));
    };

    const setVolume = withQueue(async (volume: number) => {
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

    const setPhase = withQueue(async (degrees: number) => {
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

    return { setVolume, setPhase };
}

export type Connected = Awaited<ReturnType<typeof connect>>;