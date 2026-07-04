use image::{DynamicImage, ImageEncoder};
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::PngEncoder;
use std::io::Write;

pub enum ImageFormat {
    Jpeg,
    Png,
    Webp,
}

impl ImageFormat {
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "jpeg" | "jpg" => Ok(ImageFormat::Jpeg),
            "png" => Ok(ImageFormat::Png),
            "webp" => Ok(ImageFormat::Webp),
            _ => Err(format!("Unsupported output format: {}", s)),
        }
    }
}

/// Encodes a `DynamicImage` into the specified format with a quality parameter.
pub fn encode_image<W: Write>(
    img: &DynamicImage,
    mut writer: W,
    format: ImageFormat,
    quality: u8,
) -> Result<(), String> {
    let color = img.color();
    let width = img.width();
    let height = img.height();
    let bytes = img.as_bytes();

    match format {
        ImageFormat::Jpeg => {
            // Clamp quality between 1 and 100
            let q = quality.clamp(1, 100);
            let encoder = JpegEncoder::new_with_quality(writer, q);
            
            // Jpeg does not support transparency (alpha). Convert to RGB8 if alpha channel is present.
            let rgb_img;
            let (pixels, color_type) = if color.has_alpha() {
                rgb_img = img.to_rgb8();
                (rgb_img.as_raw().as_slice(), image::ColorType::Rgb8)
            } else {
                (bytes, color)
            };

            encoder.write_image(pixels, width, height, color_type.into())
                .map_err(|e| format!("Failed to encode JPEG: {}", e))
        }
        ImageFormat::Png => {
            // Standard PNG encoding
            let encoder = PngEncoder::new(writer);
            encoder.write_image(bytes, width, height, color.into())
                .map_err(|e| format!("Failed to encode PNG: {}", e))
        }
        ImageFormat::Webp => {
            use zenwebp::{EncodeRequest, LossyConfig, PixelLayout};

            // Clamp quality between 0.0 and 100.0
            let q = (quality as f32).clamp(0.0, 100.0);
            let config = LossyConfig::new().with_quality(q);

            let layout;
            let owned_rgba;
            let pixels = match color {
                image::ColorType::Rgba8 => {
                    layout = PixelLayout::Rgba8;
                    bytes
                }
                image::ColorType::Rgb8 => {
                    layout = PixelLayout::Rgb8;
                    bytes
                }
                _ => {
                    layout = PixelLayout::Rgba8;
                    owned_rgba = img.to_rgba8();
                    owned_rgba.as_raw()
                }
            };

            let encoded = EncodeRequest::lossy(&config, pixels, layout, width, height)
                .encode()
                .map_err(|e| format!("WebP encoding failed: {:?}", e))?;

            writer.write_all(&encoded)
                .map_err(|e| format!("Failed to write WebP output: {}", e))
        }
    }
}
