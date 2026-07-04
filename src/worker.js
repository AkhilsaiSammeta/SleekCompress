import init, { compress_image } from '../pkg/wasm_image_compressor.js';

// Pre-initialize WASM module when worker starts up
const wasmReady = init();

self.onmessage = async (e) => {
    // Ensure WASM is fully initialized before processing messages
    await wasmReady;

    const { type, id, arrayBuffer, config } = e.data;

    if (type === 'COMPRESS') {
        try {
            const inputBytes = new Uint8Array(arrayBuffer);

            // Execute compression in Rust/WASM
            const compressed = compress_image(
                inputBytes,
                config.format,
                config.quality,
                config.width,
                config.height
            );

            // IMPORTANT: The Uint8Array returned by wasm-bindgen points to a slice 
            // inside WASM's linear memory. We cannot transfer this buffer directly 
            // because transferring it would detach the WASM linear memory.
            // We must copy it to a fresh, independent ArrayBuffer.
            const outputBuffer = new Uint8Array(compressed.length);
            outputBuffer.set(compressed);

            // Post back with transferable ArrayBuffer
            self.postMessage({
                type: 'COMPRESS_SUCCESS',
                id,
                arrayBuffer: outputBuffer.buffer,
                stats: {
                    originalSize: arrayBuffer.byteLength,
                    compressedSize: outputBuffer.byteLength,
                    format: config.format
                }
            }, [outputBuffer.buffer]);

        } catch (err) {
            self.postMessage({
                type: 'COMPRESS_ERROR',
                id,
                error: err.message || err.toString()
            });
        }
    }
};
