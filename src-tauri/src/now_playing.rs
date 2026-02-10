use block2::RcBlock;
use objc2::rc::Retained;
use objc2::{
    declare_class, msg_send, msg_send_id, mutability,
    runtime::{AnyObject, ProtocolObject, Sel},
    ClassType, DeclaredClass,
};
use objc2_foundation::{
    NSDictionary, NSNotification, NSNotificationCenter, NSObject, NSObjectProtocol, NSString,
};
use serde_json::json;
use std::ffi::c_void;
use std::ptr;
use std::sync::OnceLock;
use tauri::{AppHandle, Emitter};

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

// Link against MediaRemote framework
#[link(name = "MediaRemote", kind = "framework")]
extern "C" {
    fn MRMediaRemoteGetNowPlayingInfo(
        queue: *mut c_void,
        callback: extern "C" fn(*mut c_void), // This signature is placeholder
    );
    fn MRMediaRemoteRegisterForNowPlayingNotifications(queue: *mut c_void);
}

// Correct signature for the block: receives a dictionary
type MRGetNowPlayingInfoCallback = dyn Fn(*mut NSDictionary<NSString, AnyObject>);

declare_class!(
    pub struct NowPlayingObserver;

    unsafe impl ClassType for NowPlayingObserver {
        type Super = NSObject;
        type Mutability = mutability::Immutable;
        const NAME: &'static str = "NowPlayingObserver";
    }

    impl DeclaredClass for NowPlayingObserver {}

    unsafe impl NowPlayingObserver {
        #[method(init)]
        fn init(&mut self) -> Option<&mut Self> {
            let this: Option<&mut Self> = unsafe { msg_send![super(self), init] };
            this
        }

        #[method(nowPlayingInfoDidChange:)]
        fn now_playing_info_did_change(&self, _notification: &NSNotification) {
            let Some(app_handle) = APP_HANDLE.get() else { return };
            let app_handle = app_handle.clone();
            
            let block = RcBlock::new(move |info: *mut NSDictionary<NSString, AnyObject>| {
                if info.is_null() {
                    return;
                }
                
                let info = unsafe { &*info };
                let mut output = serde_json::Map::new();
                
                let get_str = |key: &str| -> Option<String> {
                    let key_ns = NSString::from_str(key);
                    let val = info.objectForKey(&key_ns)?;
                    // Use description via msg_send! as AnyObject might not expose it directly in 0.5.2 bindings
                    let desc: Retained<NSString> = unsafe { msg_send![val, description] };
                    Some(desc.to_string())
                };

                if let Some(title) = get_str("kMRMediaRemoteNowPlayingInfoTitle") {
                    output.insert("title".to_string(), json!(title));
                }
                if let Some(artist) = get_str("kMRMediaRemoteNowPlayingInfoArtist") {
                    output.insert("artist".to_string(), json!(artist));
                }
                if let Some(album) = get_str("kMRMediaRemoteNowPlayingInfoAlbum") {
                     output.insert("album".to_string(), json!(album));
                }
                
                 if let Some(duration) = get_str("kMRMediaRemoteNowPlayingInfoDuration") {
                     if let Ok(d) = duration.parse::<f64>() {
                         output.insert("duration".to_string(), json!(d));
                     }
                }
                
                if let Some(elapsed) = get_str("kMRMediaRemoteNowPlayingInfoElapsedTime") {
                     if let Ok(e) = elapsed.parse::<f64>() {
                         output.insert("elapsedTime".to_string(), json!(e));
                     }
                }

                if let Some(rate) = get_str("kMRMediaRemoteNowPlayingInfoPlaybackRate") {
                    let is_playing = rate.parse::<f64>().unwrap_or(0.0) > 0.0;
                    output.insert("isPlaying".to_string(), json!(is_playing));
                }
                
                let _ = app_handle.emit("now-playing-update", json!(output));
            });

            unsafe {
                let block_ptr = &*block as *const _ as *mut c_void;
                 MRMediaRemoteGetNowPlayingInfo(
                    ptr::null_mut(), 
                    std::mem::transmute(block_ptr) 
                );
            }
        }
    }
);

pub fn init(app: &AppHandle) {
    // Store handle globally
    let _ = APP_HANDLE.set(app.clone());

    unsafe {
        MRMediaRemoteRegisterForNowPlayingNotifications(ptr::null_mut());
        
        // Init observer
        let observer: Retained<NowPlayingObserver> = msg_send_id![NowPlayingObserver::alloc(), init];
        
        // Using generic AnyObject for notification name to avoid import issues if NSString not perfectly aligned
        let name = NSString::from_str("kMRMediaRemoteNowPlayingInfoDidChangeNotification");
        
        let center = NSNotificationCenter::defaultCenter();
        center.addObserver_selector_name_object(
            &observer,
            Sel::register("nowPlayingInfoDidChange:"),
            Some(&name),
            None
        );
        
        // Trigger initial fetch by sending message to self
        // Creating a dummy notification
        let notif = NSNotification::notificationWithName_object(&name, None);
        let _: () = msg_send![&observer, nowPlayingInfoDidChange: &*notif];
        
        std::mem::forget(observer);
    }
}
