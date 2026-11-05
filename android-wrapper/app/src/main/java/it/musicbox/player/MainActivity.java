package it.musicbox.player;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public final class MainActivity extends Activity {
  private static final String HOME = "https://stefanovillaggio8-dot.github.io/music-box/";
  private static final int PICK = 420, MICROPHONE = 421;
  private WebView webView;
  private ValueCallback<Uri[]> pendingFiles;
  private PermissionRequest pendingMicrophone;

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().setStatusBarColor(Color.rgb(15,15,20));
    getWindow().setNavigationBarColor(Color.rgb(15,15,20));
    webView = new WebView(this);
    webView.setBackgroundColor(Color.rgb(15,15,20));
    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setMediaPlaybackRequiresUserGesture(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(true);
    webView.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        return navigate(request.getUrl());
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return navigate(Uri.parse(url));
      }
    });
    webView.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView view,
          ValueCallback<Uri[]> callback, FileChooserParams params) {
        if (pendingFiles != null) pendingFiles.onReceiveValue(null);
        pendingFiles = callback;
        try {
          startActivityForResult(params.createIntent(), PICK);
          return true;
        } catch (Exception error) {
          pendingFiles = null;
          callback.onReceiveValue(null);
          return false;
        }
      }
      @Override public void onPermissionRequest(PermissionRequest request) {
        runOnUiThread(() -> {
          boolean trusted = request.getOrigin()!=null &&
              request.getOrigin().toString().startsWith(HOME);
          boolean microphone = request.getResources().length==1 &&
              PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(request.getResources()[0]);
          if (!trusted || !microphone) { request.deny(); return; }
          if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)
            request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
          else {
            pendingMicrophone=request;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},MICROPHONE);
          }
        });
      }
      @Override public void onPermissionRequestCanceled(PermissionRequest request) {
        if (pendingMicrophone==request) pendingMicrophone=null;
      }
    });
    webView.setDownloadListener((url,agent,disposition,mime,length)->{
      try { if(url.startsWith("https://")) startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url))); }
      catch(Exception ignored) {}
    });
    setContentView(webView);
    if(state==null||webView.restoreState(state)==null) webView.loadUrl(HOME);
  }
  private boolean navigate(Uri uri) {
    String scheme=uri.getScheme();
    // HTTPS OAuth callbacks stay in the WebView, preserving the login state.
    if("https".equalsIgnoreCase(scheme)||"about".equalsIgnoreCase(scheme)) return false;
    if("mailto".equalsIgnoreCase(scheme)||"tel".equalsIgnoreCase(scheme))
      try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); } catch(Exception ignored) {}
    return true;
  }
  @Override protected void onActivityResult(int code,int result,Intent data) {
    super.onActivityResult(code,result,data);
    if(code==PICK&&pendingFiles!=null) {
      pendingFiles.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));
      pendingFiles=null;
    }
  }
  @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] grants) {
    super.onRequestPermissionsResult(code,permissions,grants);
    if(code==MICROPHONE&&pendingMicrophone!=null) {
      PermissionRequest request=pendingMicrophone;pendingMicrophone=null;
      if(grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED)
        request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
      else request.deny();
    }
  }
  @Override protected void onSaveInstanceState(Bundle state) {
    if(webView!=null)webView.saveState(state);
    super.onSaveInstanceState(state);
  }
  @Override public void onBackPressed() {
    if(webView!=null&&webView.canGoBack())webView.goBack();
    else super.onBackPressed();
  }
  @Override protected void onDestroy() {
    if(webView!=null){webView.destroy();webView=null;}
    super.onDestroy();
  }
}
