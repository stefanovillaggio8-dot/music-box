import UIKit
import WebKit
import AVFoundation
import MediaPlayer

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.allowAirPlay, .allowBluetoothA2DP])
            try session.setActive(true)
        } catch {
            NSLog("Music Box: impossibile attivare la sessione audio: %@", error.localizedDescription)
        }

        let appWindow = UIWindow(frame: UIScreen.main.bounds)
        appWindow.rootViewController = MusicBoxViewController()
        appWindow.makeKeyAndVisible()
        window = appWindow

        application.beginReceivingRemoteControlEvents()
        return true
    }
}

final class MusicBoxViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {
    private var webView: WKWebView!
    private var hasReceivedPlayerState = false

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 15 / 255, green: 15 / 255, blue: 20 / 255, alpha: 1)

        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.userContentController.add(self, name: "musicBox")

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.backgroundColor = view.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        webView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        configureRemoteCommands()

        guard let url = URL(string: "https://stefanovillaggio8-dot.github.io/music-box/") else { return }
        webView.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let state = message.body as? [String: Any],
              state["type"] as? String == "state" else { return }

        hasReceivedPlayerState = true
        DispatchQueue.main.async { [weak self] in
            self?.updateNowPlaying(with: state)
        }
    }

    private func updateNowPlaying(with state: [String: Any]) {
        let title = (state["title"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let artist = (state["artist"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let album = (state["album"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let playing = state["playing"] as? Bool ?? false
        let currentTime = max(0, state["currentTime"] as? Double ?? 0)
        let duration = max(0, state["duration"] as? Double ?? 0)

        var info: [String: Any] = [
            MPMediaItemPropertyTitle: (title?.isEmpty == false ? title! : "Music Box"),
            MPMediaItemPropertyArtist: (artist?.isEmpty == false ? artist! : "La mia musica"),
            MPMediaItemPropertyAlbumTitle: (album?.isEmpty == false ? album! : "Music Box"),
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime,
            MPNowPlayingInfoPropertyPlaybackRate: playing ? 1.0 : 0.0,
            MPNowPlayingInfoPropertyDefaultPlaybackRate: 1.0
        ]
        if duration > 0 {
            info[MPMediaItemPropertyPlaybackDuration] = duration
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func configureRemoteCommands() {
        let center = MPRemoteCommandCenter.shared()

        center.playCommand.isEnabled = true
        center.playCommand.addTarget { [weak self] _ in
            self?.sendControl("play")
            return .success
        }

        center.pauseCommand.isEnabled = true
        center.pauseCommand.addTarget { [weak self] _ in
            self?.sendControl("pause")
            return .success
        }

        center.togglePlayPauseCommand.isEnabled = true
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.sendControl("toggle")
            return .success
        }

        center.nextTrackCommand.isEnabled = true
        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.sendControl("next")
            return .success
        }

        center.previousTrackCommand.isEnabled = true
        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.sendControl("previous")
            return .success
        }

        center.changePlaybackPositionCommand.isEnabled = true
        center.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let positionEvent = event as? MPChangePlaybackPositionCommandEvent else {
                return .commandFailed
            }
            self?.sendControl("seek", values: ["time": positionEvent.positionTime])
            return .success
        }

        center.stopCommand.isEnabled = true
        center.stopCommand.addTarget { [weak self] _ in
            self?.sendControl("pause")
            return .success
        }
    }

    private func sendControl(_ action: String, values: [String: Any] = [:]) {
        var detail = values
        detail["action"] = action
        guard let data = try? JSONSerialization.data(withJSONObject: detail, options: [.fragmentsAllowed]),
              let json = String(data: data, encoding: .utf8) else { return }

        let script = "window.dispatchEvent(new CustomEvent('musicbox-native-control', { detail: \(json) }));"
        DispatchQueue.main.async { [weak self] in
            guard let self, self.webView.isLoading == false else { return }
            self.webView.evaluateJavaScript(script, completionHandler: nil)
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // La pagina invia titolo e stato appena inizializza il suo lettore.
        // Questo controllo rende visibile subito la schermata multimediale quando è pronta.
        webView.evaluateJavaScript("if (typeof window.__musicBoxNativeReady === 'function') window.__musicBoxNativeReady();", completionHandler: nil)
    }
}
