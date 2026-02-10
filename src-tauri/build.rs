fn main() {
    println!("cargo:rustc-link-lib=framework=MediaRemote");
    tauri_build::build()
}
