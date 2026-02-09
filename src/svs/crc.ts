/**
 * Handles CRC-16 calculations
 * - pre-computed array (usually 256 entries) used to speed up Cyclic Redundancy Check (CRC-16) calculations
 */
export const crc16Table = new Uint16Array(256).map((_, i) => {
    let c = i << 8;
    for (let j = 0; j < 8; j++) {
        c = (c & 0x8000) ? ((c << 1) ^ 0x1021) : (c << 1);
    }
    return c & 0xffff;
});

/**
 * Handles CRC-16 calculations
 * - Cyclic Redundancy Check (CRC-16) calculations
 */
export const crc16hqx = (data: Uint8Array): number => {
    let crc = 0;
    for (const byte of data) {
        const tableIndex = ((crc >> 8) ^ byte) & 0xff;
        crc = ((crc << 8) & 0xffff) ^ crc16Table[tableIndex]!;
    }
    return crc;
};
