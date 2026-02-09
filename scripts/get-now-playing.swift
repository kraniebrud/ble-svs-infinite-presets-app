import Foundation
import Darwin

typealias MRMediaRemoteGetNowPlayingInfoFunction = @convention(c) (DispatchQueue, @escaping ([String: Any]) -> Void) -> Void

let frameworkPath = "/System/Library/PrivateFrameworks/MediaRemote.framework/MediaRemote"
guard let handle = dlopen(frameworkPath, RTLD_LAZY) else {
    print("{\"error\": \"Failed to load MediaRemote framework\"}")
    exit(1)
}

guard let sym = dlsym(handle, "MRMediaRemoteGetNowPlayingInfo") else {
    print("{\"error\": \"Failed to find MRMediaRemoteGetNowPlayingInfo symbol\"}")
    exit(1)
}

let MRMediaRemoteGetNowPlayingInfo = unsafeBitCast(sym, to: MRMediaRemoteGetNowPlayingInfoFunction.self)
let semaphore = DispatchSemaphore(value: 0)

MRMediaRemoteGetNowPlayingInfo(DispatchQueue.global()) { info in
    var output: [String: Any] = [:]
    
    // keys identified from debug output
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
    
    // Handle Artwork
    if let artworkData = info["kMRMediaRemoteNowPlayingInfoArtworkData"] as? Data {
        let base64 = artworkData.base64EncodedString()
        let mime = info["kMRMediaRemoteNowPlayingInfoArtworkMIMEType"] as? String ?? "image/jpeg"
        output["artwork"] = "data:\(mime);base64,\(base64)"
    }
    
    do {
        let jsonData = try JSONSerialization.data(withJSONObject: output, options: [])
        if let jsonString = String(data: jsonData, encoding: .utf8) {
            print(jsonString)
        }
    } catch {
        print("{\"error\": \"Serialization error\"}")
    }
    
    semaphore.signal()
}

_ = semaphore.wait(timeout: .now() + 2.0)
