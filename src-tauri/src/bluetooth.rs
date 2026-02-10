use btleplug::api::{Central, Manager as _, Peripheral as _, ScanFilter, WriteType};
use btleplug::platform::{Manager, Peripheral};
use std::time::Duration;
use tauri::{State, Manager as _};
use std::sync::Mutex;
use uuid::Uuid;

const SVS_DEVICE_NAME: &str = "3KMC3144";
const SVS_SERVICE_UUID: &str = "1fee6acf-a826-4e37-9635-4d8a01642c5d";
const SVS_CHAR_UUID: &str = "6409d79d-cd28-479c-a639-92f9e1948b43";

pub struct BluetoothState {
    device: Mutex<Option<Peripheral>>,
}

impl BluetoothState {
    pub fn new() -> Self {
        Self {
            device: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub async fn ble_scan(state: State<'_, BluetoothState>) -> Result<String, String> {
    let manager = Manager::new().await.map_err(|e| e.to_string())?;
    let adapters = manager.adapters().await.map_err(|e| e.to_string())?;
    let central = adapters.into_iter().nth(0).ok_or("No Bluetooth adapter found")?;

    central.start_scan(ScanFilter::default()).await.map_err(|e| e.to_string())?;
    
    // Scan for a bit
    tokio::time::sleep(Duration::from_secs(4)).await;

    let peripherals = central.peripherals().await.map_err(|e| e.to_string())?;
    
    for p in peripherals {
        let properties = p.properties().await.map_err(|e| e.to_string())?;
        if let Some(props) = properties {
            if let Some(name) = props.local_name {
                if name == SVS_DEVICE_NAME {
                    // Stop scan
                    let _ = central.stop_scan().await;
                    
                    // Connect
                    p.connect().await.map_err(|e| e.to_string())?;
                    p.discover_services().await.map_err(|e| e.to_string())?;
                    
                    // Store device
                    let mut device_lock = state.device.lock().map_err(|_| "Failed to lock device state")?;
                    *device_lock = Some(p);
                    
                    return Ok("Connected".to_string());
                }
            }
        }
    }

    Err("Device not found".to_string())
}

#[tauri::command]
pub async fn ble_write(state: State<'_, BluetoothState>, payload: Vec<u8>) -> Result<(), String> {
    let device = {
        let device_lock = state.device.lock().map_err(|_| "Failed to lock device state")?;
        device_lock.clone().ok_or("Not connected".to_string())?
    };
    
    let chars = device.characteristics();
    let cmd_char = chars.iter().find(|c| c.uuid == Uuid::parse_str(SVS_CHAR_UUID).unwrap())
        .ok_or("Characteristic not found")?;
        
    device.write(cmd_char, &payload, WriteType::WithResponse).await.map_err(|e| e.to_string())?;
    Ok(())
}
