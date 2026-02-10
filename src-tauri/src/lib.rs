use tauri::{Emitter, Manager};


mod bluetooth;
mod now_playing;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(bluetooth::BluetoothState::new())
        .invoke_handler(tauri::generate_handler![
            bluetooth::ble_scan,
            bluetooth::ble_write
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize Now Playing watcher
            now_playing::init(app.handle());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
