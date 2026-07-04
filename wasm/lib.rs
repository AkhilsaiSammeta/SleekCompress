mod compress;
mod formats;
mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn compress_image(
    data: &[u8],
    format: &str,
    quality: u8,
    width: Option<u32>,
    height: Option<u32>,
) -> Result<Vec<u8>, String> {
    // Set up console panic logging
    utils::set_panic_hook();

    compress::process_image(data, format, quality, width, height)
}
