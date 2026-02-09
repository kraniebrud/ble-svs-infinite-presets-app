import Foundation
import Darwin

// Define C function types
typealias MRMediaRemoteRegisterForNowPlayingNotificationsFunction = @convention(c) (DispatchQueue) -> Void
typealias MRMediaRemoteGetNowPlayingInfoFunction = @convention(c) (DispatchQueue, @escaping ([String: Any]) -> Void) -> Void

// Load Framework
let frameworkPath = "/System/Library/PrivateFrameworks/MediaRemote.framework/MediaRemote"
guard let handle = dlopen(frameworkPath, RTLD_LAZY) else {
    print("{\"error\": \"Failed to load MediaRemote framework\"}")
    exit(1)
}

// Load Symbols
guard let symRegister = dlsym(handle, "MRMediaRemoteRegisterForNowPlayingNotifications"),
      let symGetInfo = dlsym(handle, "MRMediaRemoteGetNowPlayingInfo") else {
    print("{\"error\": \"Failed to find MediaRemote symbols\"}")
    exit(1)
}

let MRMediaRemoteRegisterForNowPlayingNotifications = unsafeBitCast(symRegister, to: MRMediaRemoteRegisterForNowPlayingNotificationsFunction.self)
let MRMediaRemoteGetNowPlayingInfo = unsafeBitCast(symGetInfo, to: MRMediaRemoteGetNowPlayingInfoFunction.self)

// Function to fetch and print info
func fetchAndPrintNowPlaying() {
    MRMediaRemoteGetNowPlayingInfo(DispatchQueue.global()) { info in
        var output: [String: Any] = [:]
        
        if let val = info["kMRMediaRemoteNowPlayingInfoTitle"] as? String { output["title"] = val }
        if let val = info["kMRMediaRemoteNowPlayingInfoArtist"] as? String { output["artist"] = val }
        if let val = info["kMRMediaRemoteNowPlayingInfoAlbum"] as? String { output["album"] = val }
        if let val = info["kMRMediaRemoteNowPlayingInfoDuration"] as? Double { output["duration"] = val }
        if let val = info["kMRMediaRemoteNowPlayingInfoElapsedTime"] as? Double { output["elapsedTime"] = val }
        
        if let rate = info["kMRMediaRemoteNowPlayingInfoPlaybackRate"] as? Double {
            output["isPlaying"] = rate > 0
        } else if let rate = info["kMRMediaRemoteNowPlayingInfoPlaybackRate"] as? Int {
            output["isPlaying"] = rate > 0
        }
        
        if let artworkData = info["kMRMediaRemoteNowPlayingInfoArtworkData"] as? Data {
            let base64 = artworkData.base64EncodedString()
            let mime = info["kMRMediaRemoteNowPlayingInfoArtworkMIMEType"] as? String ?? "image/jpeg"
            output["artwork"] = "data:\(mime);base64,\(base64)"
        }
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: output, options: [])
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print(jsonString)
                fflush(stdout) // Ensure output is flushed immediately
            }
        } catch {
            // ignore error
        }
    }
}

// Register for notifications
MRMediaRemoteRegisterForNowPlayingNotifications(DispatchQueue.global())

// Observe Notification
NotificationCenter.default.addObserver(forName: NSNotification.Name("kMRMediaRemoteNowPlayingInfoDidChangeNotification"), object: nil, queue: nil) { _ in
    fetchAndPrintNowPlaying()
}

// Initial fetch
fetchAndPrintNowPlaying()

// Run Loop to keep process alive
RunLoop.main.run()
