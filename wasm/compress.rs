use image::DynamicImage;
use std::io::Cursor;
use crate::formats::{ImageFormat, encode_image};

/// Decodes, resizes, and compresses the image bytes into the output format.
pub fn process_image(
    data: &[u8],
    format_str: &str,
    quality: u8,
    width: Option<u32>,
    height: Option<u32>,
) -> Result<Vec<u8>, String> {
    // 1. Parse Output Format
    let target_format = ImageFormat::from_str(format_str)?;

    // 2. Decode original image bytes from memory
    let img = image::load_from_memory(data)
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    // 3. Resize if target dimensions are requested
    let processed_img = resize_image(img, width, height);

    // 4. Encode to the target format into a memory buffer (Cursor)
    let mut output_buffer = Cursor::new(Vec::new());
    encode_image(&processed_img, &mut output_buffer, target_format, quality)?;

    Ok(output_buffer.into_inner())
}

/// Resizes the image keeping aspect ratio if either width or height is provided.
fn resize_image(
    img: DynamicImage,
    width: Option<u32>,
    height: Option<u32>,
) -> DynamicImage {
    let orig_width = img.width();
    let orig_height = img.height();

    let (target_width, target_height) = match (width, height) {
        (Some(w), Some(h)) => {
            // Fit within bounds preserving aspect ratio
            let ratio_w = w as f64 / orig_width as f64;
            let ratio_h = h as f64 / orig_height as f64;
            let ratio = ratio_w.min(ratio_h);
            (
                (orig_width as f64 * ratio).round() as u32,
                (orig_height as f64 * ratio).round() as u32,
            )
        }
        (Some(w), None) => {
            let ratio = w as f64 / orig_width as f64;
            (w, (orig_height as f64 * ratio).round() as u32)
        }
        (None, Some(h)) => {
            let ratio = h as f64 / orig_height as f64;
            ((orig_width as f64 * ratio).round() as u32, h)
        }
        (None, None) => return img,
    };

    // Ensure we do not scale down to 0
    let target_width = target_width.max(1);
    let target_height = target_height.max(1);

    // Use CatmullRom for optimal speed and visual quality
    img.resize_exact(target_width, target_height, image::imageops::FilterType::CatmullRom)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resize_image_aspect_ratio() {
        // Create a 100x200 pixel image
        let img = DynamicImage::new_rgba8(100, 200);

        // Resize with width=50, keeping aspect ratio (height should become 100)
        let resized = resize_image(img.clone(), Some(50), None);
        assert_eq!(resized.width(), 50);
        assert_eq!(resized.height(), 100);

        // Resize with height=100, keeping aspect ratio (width should become 50)
        let resized_h = resize_image(img.clone(), None, Some(100));
        assert_eq!(resized_h.width(), 50);
        assert_eq!(resized_h.height(), 100);

        // Resize with width=50, height=50, fit inside bounds preserving aspect ratio (should become 25x50)
        let resized_both = resize_image(img, Some(50), Some(50));
        assert_eq!(resized_both.width(), 25);
        assert_eq!(resized_both.height(), 50);
    }
}

