import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'no_internet.dart';

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  static const String _homeUrl = 'https://dropxcult.shop';
  
  late WebViewController _controller;
  bool _isLoading = true;
  bool _isOffline = false;
  int _loadingProgress = 0;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  @override
  void initState() {
    super.initState();
    _initConnectivity();
    _initWebView();
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    super.dispose();
  }

  Future<void> _initConnectivity() async {
    // Check initial connectivity
    final result = await Connectivity().checkConnectivity();
    _updateConnectionStatus(result);
    
    // Listen for connectivity changes
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(_updateConnectionStatus);
  }

  void _updateConnectionStatus(List<ConnectivityResult> result) {
    final isConnected = result.isNotEmpty && !result.contains(ConnectivityResult.none);
    
    if (mounted) {
      setState(() {
        _isOffline = !isConnected;
      });
      
      // If we just came back online, reload the page
      if (isConnected && _isOffline) {
        _controller.reload();
      }
    }
  }

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0D0D0D))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() {
                _loadingProgress = progress;
                _isLoading = progress < 100;
              });
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
              });
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
            // Inject CSS for smoother scrolling
            _controller.runJavaScript('''
              document.body.style.overscrollBehavior = 'none';
              document.documentElement.style.scrollBehavior = 'smooth';
            ''');
          },
          onWebResourceError: (WebResourceError error) {
            if (error.errorType == WebResourceErrorType.hostLookup ||
                error.errorType == WebResourceErrorType.connect) {
              if (mounted) {
                setState(() {
                  _isOffline = true;
                });
              }
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            // Block external links that should open in browser
            // Allow all navigation within the app
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(_homeUrl));
  }

  Future<void> _onRefresh() async {
    // Check connectivity before refreshing
    final result = await Connectivity().checkConnectivity();
    final isConnected = result.isNotEmpty && !result.contains(ConnectivityResult.none);
    
    if (isConnected) {
      await _controller.reload();
      // Wait a bit for the page to start loading
      await Future.delayed(const Duration(milliseconds: 500));
    } else {
      if (mounted) {
        setState(() {
          _isOffline = true;
        });
      }
    }
  }

  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false;
    }
    
    // Check if still mounted before showing dialog
    if (!mounted) return false;
    
    // Show exit confirmation
    final shouldExit = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text(
          'Exit App?',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Are you sure you want to exit DropX Cult?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFFE91E63),
            ),
            child: const Text('Exit'),
          ),
        ],
      ),
    );
    
    if (shouldExit == true) {
      SystemNavigator.pop();
    }
    return false;
  }

  void _retryConnection() async {
    final result = await Connectivity().checkConnectivity();
    final isConnected = result.isNotEmpty && !result.contains(ConnectivityResult.none);
    
    if (isConnected) {
      setState(() {
        _isOffline = false;
        _isLoading = true;
      });
      _controller.reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isOffline) {
      return NoInternetScreen(onRetry: _retryConnection);
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (!didPop) {
          await _onWillPop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0D0D0D),
        body: SafeArea(
          child: Stack(
            children: [
              // WebView
              RefreshIndicator(
                onRefresh: _onRefresh,
                color: const Color(0xFFE91E63),
                backgroundColor: const Color(0xFF1A1A1A),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: SizedBox(
                    height: MediaQuery.of(context).size.height - 
                            MediaQuery.of(context).padding.top,
                    child: WebViewWidget(controller: _controller),
                  ),
                ),
              ),
              
              // Loading indicator overlay
              if (_isLoading)
                Container(
                  color: const Color(0xFF0D0D0D),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // App logo placeholder
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFE91E63), Color(0xFF9C27B0)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFE91E63).withAlpha(102),
                                blurRadius: 20,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Text(
                              'DX',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'DropX Cult',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 32),
                        // Progress indicator
                        SizedBox(
                          width: 200,
                          child: Column(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: LinearProgressIndicator(
                                  value: _loadingProgress / 100,
                                  backgroundColor: const Color(0xFF2A2A2A),
                                  valueColor: const AlwaysStoppedAnimation<Color>(
                                    Color(0xFFE91E63),
                                  ),
                                  minHeight: 6,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Loading... $_loadingProgress%',
                                style: TextStyle(
                                  color: Colors.white.withAlpha(153),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
