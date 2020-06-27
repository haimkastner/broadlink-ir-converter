/**
 * Convert string of an Hex number to a decimal number 
 * @param hex The hex value
 * @returns The value as decimal number
 */
function toDecimal(hex: string): number {
    return parseInt(hex, 16);
}

/**
 * Convert a decimal number to an Hex string
 * @param decimal The decimal value
 * @returns The value as Hex string
 */
function toHex(decimal: number): string {
    return decimal.toString(16);
}

/**
 * Split an Hex commands string to the first byte (2 hex chars) and the rest of the commands
 * For example '1a2b3c4d' to ['1a', '2b3c4d']
 * @param hexCommand The full hex commands string
 * @returns The separated commands
 */
function readNextByte(hexCommand: string): string[] {
    return [hexCommand.slice(0, 2), hexCommand.slice(2)];
}

/**
 * Convert big endian bytes to little endian bytes (2 bytes only).
 * For example for the value '0x1234' in big-endian it's '1234' and convert it 
 * to be '3412' as it represents in little-endian
 * @param bytes The big-endian double bytes
 * @returns The little-endian double bytes 
 */
function bigEndianToBigLittleDoubleHexByte(bytes: string): string {
    return `${bytes.slice(2)}${bytes.slice(0, 2)}`;
}

/**
 * Pad a hex to fill a byte.
 * For example, the value 'a' to '0a'; 
 * @param byte The byte value.
 * @returns The byte padded
 */
function padHexToByte(byte: string): string {
    return byte.padStart(2, '0');
}

/**
 * Pad a hex to fill a double byte.
 * For example, the value 'a3' to '00a3'; 
 * @param bytes The double byte value.
 * @returns The bytes padded
 */
function padHexToDoubleByte(bytes: string): string {
    return bytes.padStart(4, '0');
}

/**
 * Convert a broadlink RF/IR Hex command to array of pules.
 * The pules array can used in several appliance.
 * For example in the Tasmota console it can be used like the following command
 * `IrSend <frequency> ... The pules array .....`
 * For more info see https://tasmota.github.io/docs/IRSend-RAW-Encoding/
 * @param broadlinkHexCommand The broadlink RF command to convert
 * @returns The pules array (first element is the frequency)
 */
export function broadlinkToPulesArray(broadlinkHexCommand: string): number[] {
    // The final pules array
    const pulesArray = [];

    // Read the first byte, represents the frequency
    let [currentByte, hexCommand] = readNextByte(broadlinkHexCommand);

    // Whenever the command is for IR or not
    let isIr = false;
    // If its IR (0x26 == 38)
    if (currentByte === '26') {
        // Mark the IR flag and set the 0 to the pules frequency
        isIr = true;
        pulesArray.push(0);
    } else {
        // Add the frequency to the top of the array
        pulesArray.push(toDecimal(currentByte));
    }

    // Read the 'repeat byte' (and ignore it)
    [currentByte, hexCommand] = readNextByte(hexCommand);

    // Read the length bytes (ignore them too)
    [currentByte, hexCommand] = readNextByte(hexCommand);
    [currentByte, hexCommand] = readNextByte(hexCommand);

    // Run on all the bytes
    while (true) {

        // Read the next byte
        [currentByte, hexCommand] = readNextByte(hexCommand);

        // If its '00' it means the next hex pules value was larger then one byte
        // So the broadlink mark by '00' byte that the next byte belong his following byte
        // For example the 0x123 value will be in shown as '00' '01' '23'
        // so we need to skip the '00' flag and combine the next tow bytes to one hex value 
        if (currentByte === '00') {
            // Read the first byte
            [currentByte, hexCommand] = readNextByte(hexCommand);
            const higherByte = currentByte;
            // Read the second byte
            [currentByte, hexCommand] = readNextByte(hexCommand);
            const lowerByte = currentByte;
            // Combine the two bytes (big-endian)
            currentByte = `${higherByte}${lowerByte}`;
        }
        // Convert the hex value to a decimal number
        const pulsFactor = toDecimal(currentByte);
        // Get the pulse lengths (revers the formula: µs * 2^-15)
        const puls = pulsFactor / 269 * 8192;
        // Flat the pules number
        const flatPuls = Math.floor(puls);
        // Add the number to the pules array
        pulesArray.push(flatPuls);
        // If the all command converted, or in IR the end flag shown, break the loop  
        if (!hexCommand || (isIr && hexCommand.toLowerCase().startsWith('000d05'))) {
            break;
        }
    }
    // Return the pules array 
    return pulesArray;
}

/**
 * Convert a pules array to the broadlink RF/IR commands Hex format.
 * You can see the pules array in the Tasmota console, while arrived
 * "IRReceived", the value of the RawData property (add '0' in the top of the array for IR frequency).  
 * @param pulesArray The pules array
 * @returns A boarding format IR/RF command
 */
export function pulesArrayToBroadlink(pulesArray: number[]): string {
    // clone a copy of the array
    pulesArray = [...pulesArray]
    // The boarding final command
    let broadlinkHexCommand = '';

    // Get the frequency of the command
    const frequency = pulesArray.shift() as number;

    // whenever its a IR command
    let isIr = false;
    // If the frequency is default or 38/IR frequency
    if (frequency === 0 || frequency === 38) {
        isIr = true;
        broadlinkHexCommand += toHex(38);
    } else {
        broadlinkHexCommand += toHex(frequency);
    }

    // The amount of pules
    const length = pulesArray.length;

    // Add don't repeat byte flag
    broadlinkHexCommand += '00';

    // Get the length as hex value, (add 6 for the additional const broadlink command header)
    const hexLength = toHex(length + 6);
    // Pad the hex value to fill 2 bytes (for example for '2a' pad to '002a')
    const hexLengthByte = padHexToDoubleByte(hexLength)
    // Convert the hex bytes to little endian (for example from '002a' to '2a00')
    const littleEndianLengthByte = bigEndianToBigLittleDoubleHexByte(hexLengthByte);

    // Add the length bytes to the broadlink command
    broadlinkHexCommand += littleEndianLengthByte;

    // Now convert all the pules
    for (const pulesItem of pulesArray) {
        // Calculate the pules length (µs * 2^-15 formula)
        const puls = pulesItem * 269 / 8192;
        // Flat the pules (from xx.xx to xx)
        const flatPuls = Math.floor(puls);
        // Convert the pules to hex
        const hexPuls = toHex(flatPuls);
        // the pules as broadlink hex
        let hexCommand = '';
        // If the hex can stored in one byte
        if (hexPuls.length <= 2) {
            // Pad the byte if needed (from 0x1 to '01')
            hexCommand = padHexToByte(hexPuls);
        } else {
            // Else if it can't stored in one byte, pad it to double byte
            // and add the '00' flag (this flag mark that the next value is two bytes and not only one) 
            hexCommand = `00${padHexToDoubleByte(hexPuls)}`;
        }

        // Add the command to the final broadlink command
        broadlinkHexCommand += hexCommand;

    }
    // Return the final command, and add the IR command ends flag (for IR only)
    return broadlinkHexCommand + (isIr ? '000d05000000000000' : '');
}
