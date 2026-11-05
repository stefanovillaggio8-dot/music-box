# Music Box Android APK

An installable Android app that opens the live Music Box website in a full-screen WebView. Download on Android without USB from Actions → Build Music Box Android APK → latest successful run → MusicBox-Android-APK. Extract MusicBox-Android.apk from the ZIP and tap to install. If prompted, authorize installation from Files or your browser.

This workflow creates an Android debug-signed APK for personal testing. Rebuilding on another runner may change the debug signing certificate, so uninstalling and reinstalling could be necessary. Export any unsynchronized app-local data first.

Android WebView data is separate from Chrome/Safari. Internet is required for uncached audio; background playback, voice controls and WebAudio mixing need real-device testing. This is a web wrapper, not a native DJ audio engine.

APK files **do not install on iPhone**. On iPhone, open the website in Safari and choose Share → Add to Home Screen, which requires no cable.
