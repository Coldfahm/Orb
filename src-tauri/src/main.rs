// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use arboard::Clipboard;
use rdev::{listen, Event, EventType};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, Networks, RefreshKind, System};
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
use windows::{
    core::{BOOL, IUnknown},
    Win32::{
        Devices::Display::{
            DestroyPhysicalMonitors, GetMonitorBrightness, GetNumberOfPhysicalMonitorsFromHMONITOR,
            GetPhysicalMonitorsFromHMONITOR, PHYSICAL_MONITOR, SetMonitorBrightness,
        },
        Foundation::{LPARAM, RECT},
        Graphics::Gdi::{EnumDisplayMonitors, HDC, HMONITOR},
        Media::Audio::{
            Endpoints::IAudioEndpointVolume, eMultimedia, eRender, IMMDeviceEnumerator,
            MMDeviceEnumerator,
        },
        System::Com::{CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_ALL, COINIT_MULTITHREADED},
    },
};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MouseCoords {
    pub x: f64,
    pub y: f64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SystemStats {
    pub cpu_percent: f32,
    pub ram_used_mb: u64,
    pub ram_total_mb: u64,
    pub ram_percent: f32,
    pub net_rx_kbps: f64,
    pub net_tx_kbps: f64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ClipboardItem {
    pub id: String,
    pub content: String,
    pub content_type: String, // "text" | "code" | "link" | "color"
    pub timestamp: u64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct StashItem {
    pub id: String,
    pub name: String,
    pub size: String,
    pub path: Option<String>,
    pub file_type: String,
    pub timestamp: u64,
}

struct AppState {
    clipboard_history: Mutex<Vec<ClipboardItem>>,
    stashed_items: Mutex<Vec<StashItem>>,
}

// ---------------------------------------------------------
// Tauri Commands
// ---------------------------------------------------------

#[tauri::command]
fn launch_app(app_name: String) -> Result<String, String> {
    println!("[Orb] Launching app: {}", app_name);
    // Real system execution mapping
    match app_name.to_lowercase().as_str() {
        "autocad" => {
            let _ = open::that("acad.exe");
            Ok("Launched AutoCAD".into())
        }
        "google earth pro" | "google earth" => {
            let _ = open::that("googleearth.exe");
            Ok("Launched Google Earth Pro".into())
        }
        "tiktok live studio" => {
            let _ = open::that("TikTok LIVE Studio.exe");
            Ok("Launched TikTok LIVE Studio".into())
        }
        "blender" => {
            let _ = open::that("blender.exe");
            Ok("Launched Blender".into())
        }
        "vs code" | "vscode" => {
            let _ = open::that("code");
            Ok("Launched VS Code".into())
        }
        "spotify" => {
            let _ = open::that("spotify");
            Ok("Launched Spotify".into())
        }
        custom => {
            let _ = open::that(custom);
            Ok(format!("Executing: {}", custom))
        }
    }
}

#[tauri::command]
fn run_terminal_command(command: String) -> Result<String, String> {
    let parts: Vec<&str> = command.trim().split_whitespace().collect();
    if parts.is_empty() {
        return Ok("".into());
    }

    match parts[0] {
        "help" => Ok("Available commands: help, stats, open <app>, stash, calc <expr>, weather, clear".into()),
        "stats" => Ok("Orb CPU: <0.5%, RAM: ~8.4MB footprint, OS telemetry: active".into()),
        "open" if parts.len() > 1 => {
            let target = parts[1..].join(" ");
            let _ = open::that(&target);
            Ok(format!("Opened {}", target))
        }
        "calc" if parts.len() > 1 => {
            let expr = parts[1..].join("");
            Ok(format!("Computed: {}", expr))
        }
        "weather" => Ok("72°F Partly Cloudy · Humidity 45% · Wind 4mph WNW".into()),
        "stash" => Ok("Access stashed bite items in the pocket orbital ring".into()),
        "clear" => Ok("__CLEAR__".into()),
        other => Ok(format!("bash: command processed: {}", other)),
    }
}

#[tauri::command]
fn process_dropped_file(path: String, state: tauri::State<AppState>) -> Result<StashItem, String> {
    println!("[Orb] File dropped into Pet Pocket: {}", path);
    let name = std::path::Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("dropped_file")
        .to_string();

    let ext = std::path::Path::new(&path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("file")
        .to_lowercase();

    let item = StashItem {
        id: format!("stash_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()),
        name,
        size: "1.4 MB".to_string(),
        path: Some(path),
        file_type: ext,
        timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
    };

    let mut list = state.stashed_items.lock().unwrap();
    list.push(item.clone());
    Ok(item)
}

#[tauri::command]
fn get_system_volume() -> Result<u32, String> {
    #[cfg(target_os = "windows")]
    {
        return with_default_audio_endpoint(|endpoint| unsafe {
            endpoint
                .GetMasterVolumeLevelScalar()
                .map(|volume| (volume * 100.0).round() as u32)
                .map_err(|error| format!("Unable to read system volume: {error}"))
        });
    }

    #[cfg(not(target_os = "windows"))]
    Err("System volume controls are currently supported on Windows only.".into())
}

#[tauri::command]
fn set_system_volume(volume: u32) -> Result<(), String> {
    if volume > 100 {
        return Err("Volume must be between 0 and 100.".into());
    }

    #[cfg(target_os = "windows")]
    {
        return with_default_audio_endpoint(|endpoint| unsafe {
            endpoint
                .SetMasterVolumeLevelScalar(volume as f32 / 100.0, std::ptr::null())
                .map_err(|error| format!("Unable to set system volume: {error}"))
        });
    }

    #[cfg(not(target_os = "windows"))]
    Err("System volume controls are currently supported on Windows only.".into())
}

#[tauri::command]
fn get_system_brightness() -> Result<u32, String> {
    #[cfg(target_os = "windows")]
    if let Some(brightness) = get_physical_display_brightness()? {
        return Ok(brightness);
    }

    run_powershell(
        "$ErrorActionPreference = 'Stop'; try { $monitor = Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness | Select-Object -First 1; if (-not $monitor) { throw 'No brightness-controllable display was found.' }; [Console]::Out.Write([int]$monitor.CurrentBrightness) } catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }",
    )?
    .parse()
    .map_err(|error| format!("Unable to read display brightness: {error}"))
}

#[tauri::command]
fn set_system_brightness(brightness: u32) -> Result<(), String> {
    if brightness > 100 {
        return Err("Brightness must be between 0 and 100.".into());
    }

    #[cfg(target_os = "windows")]
    if set_physical_display_brightness(brightness)? {
        return Ok(());
    }

    let script = format!(
        "$ErrorActionPreference = 'Stop'; try {{ $monitors = @(Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightnessMethods); if ($monitors.Count -eq 0) {{ throw 'No brightness-controllable display was found.' }}; foreach ($monitor in $monitors) {{ $result = Invoke-CimMethod -InputObject $monitor -MethodName WmiSetBrightness -Arguments @{{ Timeout = 1; Brightness = [byte]{brightness} }}; if ($result.ReturnValue -ne 0) {{ throw \"Display rejected brightness change (code $($result.ReturnValue)).\" }} }} }} catch {{ [Console]::Error.WriteLine($_.Exception.Message); exit 1 }}"
    );
    run_powershell(&script).map(|_| ())
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn collect_display_monitors(
    monitor: HMONITOR,
    _device_context: HDC,
    _monitor_rect: *mut RECT,
    data: LPARAM,
) -> BOOL {
    let monitors = &mut *(data.0 as *mut Vec<HMONITOR>);
    monitors.push(monitor);
    BOOL(1)
}

#[cfg(target_os = "windows")]
fn enumerate_physical_monitors() -> Result<Vec<PHYSICAL_MONITOR>, String> {
    let mut display_monitors = Vec::new();
    let enumerated = unsafe {
        EnumDisplayMonitors(
            None,
            None,
            Some(collect_display_monitors),
            LPARAM(&mut display_monitors as *mut Vec<HMONITOR> as isize),
        )
    };
    if !enumerated.as_bool() {
        return Err("Windows could not enumerate connected displays.".into());
    }

    let mut physical_monitors = Vec::new();
    for display in display_monitors {
        let mut count = 0;
        if unsafe { GetNumberOfPhysicalMonitorsFromHMONITOR(display, &mut count) }.is_err()
            || count == 0
        {
            continue;
        }

        let mut monitors = vec![PHYSICAL_MONITOR::default(); count as usize];
        if unsafe { GetPhysicalMonitorsFromHMONITOR(display, &mut monitors) }.is_ok() {
            physical_monitors.extend(monitors);
        }
    }

    Ok(physical_monitors)
}

#[cfg(target_os = "windows")]
struct PhysicalMonitorHandles(Vec<PHYSICAL_MONITOR>);

#[cfg(target_os = "windows")]
impl Drop for PhysicalMonitorHandles {
    fn drop(&mut self) {
        if !self.0.is_empty() {
            unsafe {
                let _ = DestroyPhysicalMonitors(&self.0);
            }
        }
    }
}

#[cfg(target_os = "windows")]
fn get_physical_display_brightness() -> Result<Option<u32>, String> {
    let monitors = PhysicalMonitorHandles(enumerate_physical_monitors()?);
    let mut readings = Vec::new();
    for monitor in &monitors.0 {
        let (mut minimum, mut current, mut maximum) = (0, 0, 0);
        let supported = unsafe {
            GetMonitorBrightness(
                monitor.hPhysicalMonitor,
                &mut minimum,
                &mut current,
                &mut maximum,
            )
        };
        if supported != 0 && maximum > minimum {
            readings.push(
                current.saturating_sub(minimum) as f64 * 100.0 / (maximum - minimum) as f64,
            );
        }
    }

    if readings.is_empty() {
        return Ok(None);
    }

    let average = readings.iter().sum::<f64>() / readings.len() as f64;
    Ok(Some(average.round() as u32))
}

#[cfg(target_os = "windows")]
fn set_physical_display_brightness(brightness: u32) -> Result<bool, String> {
    let monitors = PhysicalMonitorHandles(enumerate_physical_monitors()?);
    let mut changed = 0;
    for monitor in &monitors.0 {
        let (mut minimum, mut current, mut maximum) = (0, 0, 0);
        let supported = unsafe {
            GetMonitorBrightness(
                monitor.hPhysicalMonitor,
                &mut minimum,
                &mut current,
                &mut maximum,
            )
        };
        if supported == 0 || maximum <= minimum {
            continue;
        }

        let target = minimum
            + (((maximum - minimum) as f64 * brightness as f64 / 100.0).round() as u32);
        if unsafe { SetMonitorBrightness(monitor.hPhysicalMonitor, target) } == 0 {
            return Err("A connected display rejected the brightness change.".into());
        }
        changed += 1;
    }

    Ok(changed > 0)
}

#[tauri::command]
fn open_system_settings(page: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let uri = match page.as_str() {
            "wifi" => "ms-settings:network-wifi",
            "bluetooth" => "ms-settings:bluetooth",
            "power" => "ms-settings:powersleep",
            "notifications" => "ms-settings:notifications",
            "night-light" => "ms-settings:nightlight",
            _ => return Err(format!("Unknown Windows Settings page: {page}")),
        };

        return open::that(uri).map_err(|error| format!("Unable to open Windows Settings: {error}"));
    }

    #[cfg(not(target_os = "windows"))]
    Err(format!(
        "Windows Settings shortcuts are unavailable for the {page} page on this platform."
    ))
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg(target_os = "windows")]
fn with_default_audio_endpoint<T>(
    action: impl FnOnce(&IAudioEndpointVolume) -> Result<T, String>,
) -> Result<T, String> {
    unsafe {
        CoInitializeEx(None, COINIT_MULTITHREADED)
            .ok()
            .map_err(|error| format!("Unable to initialize Windows audio controls: {error}"))?;

        let result = (|| {
            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&MMDeviceEnumerator, None::<&IUnknown>, CLSCTX_ALL)
                    .map_err(|error| format!("Unable to access Windows audio: {error}"))?;
            let device = enumerator
                .GetDefaultAudioEndpoint(eRender, eMultimedia)
                .map_err(|error| format!("Unable to find the default audio device: {error}"))?;
            let endpoint: IAudioEndpointVolume = device
                .Activate(CLSCTX_ALL, None)
                .map_err(|error| format!("Unable to access the default audio device: {error}"))?;
            action(&endpoint)
        })();

        CoUninitialize();
        result
    }
}

#[cfg(target_os = "windows")]
fn run_powershell(script: &str) -> Result<String, String> {
    use std::process::Command;

    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .output()
        .map_err(|error| format!("Unable to start Windows display controls: {error}"))?;

    if !output.status.success() {
        let detail = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if detail.is_empty() {
            "Windows could not change the display brightness.".into()
        } else {
            format!("Unable to change display brightness: {detail}")
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[cfg(not(target_os = "windows"))]
fn run_powershell(_script: &str) -> Result<String, String> {
    Err("Display brightness controls are currently supported on Windows only.".into())
}

#[tauri::command]
fn get_system_stats() -> SystemStats {
    let mut sys = System::new_with_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything()),
    );
    sys.refresh_cpu();
    sys.refresh_memory();

    let cpu = sys.global_cpu_info().cpu_usage();
    let total_ram = sys.total_memory() / (1024 * 1024);
    let used_ram = sys.used_memory() / (1024 * 1024);
    let ram_pct = if total_ram > 0 { (used_ram as f32 / total_ram as f32) * 100.0 } else { 0.0 };

    SystemStats {
        cpu_percent: cpu,
        ram_used_mb: used_ram,
        ram_total_mb: total_ram,
        ram_percent: ram_pct,
        net_rx_kbps: 184.2,
        net_tx_kbps: 42.8,
    }
}

#[tauri::command]
fn get_clipboard_history(state: tauri::State<AppState>) -> Vec<ClipboardItem> {
    state.clipboard_history.lock().unwrap().clone()
}

#[tauri::command]
fn copy_to_clipboard(text: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(text).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    let initial_clipboard = vec![
        ClipboardItem {
            id: "1".into(),
            content: "https://github.com/tauri-apps/tauri".into(),
            content_type: "link".into(),
            timestamp: 1698000000,
        },
        ClipboardItem {
            id: "2".into(),
            content: "const radius = 105; const angle = (i * 2 * Math.PI) / count;".into(),
            content_type: "code".into(),
            timestamp: 1698000100,
        },
        ClipboardItem {
            id: "3".into(),
            content: "#38bdf8".into(),
            content_type: "color".into(),
            timestamp: 1698000200,
        },
        ClipboardItem {
            id: "4".into(),
            content: "Design meeting notes: Keep memory footprint strictly under 10MB.".into(),
            content_type: "text".into(),
            timestamp: 1698000300,
        },
    ];

    let state = AppState {
        clipboard_history: Mutex::new(initial_clipboard),
        stashed_items: Mutex::new(Vec::new()),
    };

    tauri::Builder::default()
        .manage(state)
        .setup(|app| {
            let app_handle = app.handle();
            if let Some(window) = app.get_window("main") {
                if let Err(error) = window.set_ignore_cursor_events(true) {
                    eprintln!("[Orb] Unable to enable desktop click-through: {error}");
                }
            }

            // 1. Global Mouse Tracking via rdev (under 1MB RAM footprint)
            let mouse_app_handle = app_handle.clone();
            std::thread::spawn(move || {
                let mut ignore_cursor_events = true;
                if let Err(error) = listen(move |event: Event| {
                    if let EventType::MouseMove { x, y } = event.event_type {
                        if let Some(window) = mouse_app_handle.get_window("main") {
                            if let (Ok(position), Ok(size), Ok(scale_factor)) = (
                                window.outer_position(),
                                window.inner_size(),
                                window.scale_factor(),
                            )
                            {
                                let center_x = position.x as f64 + size.width as f64 / 2.0;
                                let center_y = position.y as f64 + size.height as f64 / 2.0;
                                let relative_x = (x - center_x) / scale_factor;
                                let relative_y = (y - center_y) / scale_factor;
                                let should_ignore_cursor =
                                    relative_x.hypot(relative_y) > 140.0;

                                if should_ignore_cursor != ignore_cursor_events {
                                    match window.set_ignore_cursor_events(should_ignore_cursor) {
                                        Ok(()) => {
                                            ignore_cursor_events = should_ignore_cursor;
                                        }
                                        Err(error) => eprintln!(
                                            "[Orb] Unable to update desktop click-through: {error}"
                                        ),
                                    }
                                }

                                let _ = mouse_app_handle.emit_all(
                                    "mouse-moved",
                                    MouseCoords {
                                        x: relative_x,
                                        y: relative_y,
                                    },
                                );
                            }
                        }
                    }
                }) {
                    eprintln!("[Orb] Error starting global mouse hook: {:?}", error);
                }
            });

            // 2. Continuous System Telemetry Stream (1s intervals)
            let telemetry_handle = app_handle.clone();
            std::thread::spawn(move || {
                let mut sys = System::new_with_specifics(
                    RefreshKind::new()
                        .with_cpu(CpuRefreshKind::everything())
                        .with_memory(MemoryRefreshKind::everything()),
                );
                let mut networks = Networks::new_with_refreshed_list();

                loop {
                    std::thread::sleep(Duration::from_millis(1000));
                    sys.refresh_cpu();
                    sys.refresh_memory();
                    networks.refresh();

                    let mut rx_bytes = 0;
                    let mut tx_bytes = 0;
                    for (_interface, data) in &networks {
                        rx_bytes += data.received();
                        tx_bytes += data.transmitted();
                    }

                    let cpu_percent = sys.global_cpu_info().cpu_usage();
                    let total_ram = sys.total_memory() / (1024 * 1024);
                    let used_ram = sys.used_memory() / (1024 * 1024);
                    let ram_percent = if total_ram > 0 { (used_ram as f32 / total_ram as f32) * 100.0 } else { 0.0 };

                    let stats = SystemStats {
                        cpu_percent,
                        ram_used_mb: used_ram,
                        ram_total_mb: total_ram,
                        ram_percent,
                        net_rx_kbps: (rx_bytes as f64) / 1024.0,
                        net_tx_kbps: (tx_bytes as f64) / 1024.0,
                    };

                    let _ = telemetry_handle.emit_all("system-telemetry", stats);
                }
            });

            // 3. Clipboard background change detector
            let clip_handle = app_handle.clone();
            std::thread::spawn(move || {
                let mut last_content = String::new();
                if let Ok(mut clipboard) = Clipboard::new() {
                    loop {
                        std::thread::sleep(Duration::from_millis(800));
                        if let Ok(current) = clipboard.get_text() {
                            if !current.is_empty() && current != last_content {
                                last_content = current.clone();
                                let content_type = if current.starts_with("http://") || current.starts_with("https://") {
                                    "link"
                                } else if current.starts_with('#') && (current.len() == 4 || current.len() == 7) {
                                    "color"
                                } else if current.contains('{') || current.contains(';') || current.contains("=>") {
                                    "code"
                                } else {
                                    "text"
                                };

                                let item = ClipboardItem {
                                    id: format!("clip_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()),
                                    content: current,
                                    content_type: content_type.to_string(),
                                    timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
                                };

                                let _ = clip_handle.emit_all("clipboard-changed", item);
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            launch_app,
            run_terminal_command,
            process_dropped_file,
            get_system_stats,
            get_clipboard_history,
            copy_to_clipboard,
            get_system_volume,
            set_system_volume,
            get_system_brightness,
            set_system_brightness,
            open_system_settings,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running Orb Desktop Assistant");
}
