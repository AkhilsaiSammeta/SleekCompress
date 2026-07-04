use std::sync::Once;

static INIT: Once = Once::new();

/// Sets up a panic hook to redirect panic details to `console.error` in browser.
/// Uses `std::sync::Once` to guarantee it is only initialized once.
pub fn set_panic_hook() {
    INIT.call_once(|| {
        console_error_panic_hook::set_once();
    });
}
