import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:trust_issues_mob/services/community_service.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'dart:developer' as developer;

class CommunityPage extends StatefulWidget {
  const CommunityPage({super.key});

  @override
  State<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends State<CommunityPage> {
  final CommunityService _communityService = CommunityService();
  final String _currentUid = FirebaseAuth.instance.currentUser?.uid ?? '';
  
  bool _isLoading = true;
  String? _errorMsg;

  static const Color _bg = Color(0xFF0A0A0F);
  static const Color _violet = Color(0xFFA78BFA);
  static const Color _crimson = Color(0xFFFF4D4D);
  static const Color _surface = Color(0xFF161621);
  static const Color _amber = Color(0xFFFFA500);

  final WebViewController _webViewController = WebViewController()
    ..setJavaScriptMode(JavaScriptMode.unrestricted)
    ..setBackgroundColor(_bg);

  @override
  void initState() {
    super.initState();
    _fetchAndBuildGraph();
  }

  Future<void> _fetchAndBuildGraph() async {
    setState(() { _isLoading = true; _errorMsg = null; });
    try {
      final data = await _communityService.fetchGraphData(uid: _currentUid);
      final graphPayload = (data as Map<String, dynamic>?)?['data'];

      if (graphPayload != null && graphPayload['nodes'] != null) {
        _injectGraphData(graphPayload);
      } else {
         _errorMsg = "No graph data available.";
      }
    } catch (e) {
      developer.log('Graph Error', error: e, name: 'CommunityPage');
      _errorMsg = e.toString();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _injectGraphData(Map<String, dynamic> data) {
    final nodes = data['nodes'] as List<dynamic>? ?? [];
    final links = data['links'] as List<dynamic>? ?? [];

    List<Map<String, dynamic>> visNodes = [];
    for (var n in nodes) {
      final labelType = n['label'] ?? '';
      final props = n['properties'] ?? {};
      final isCurrentUser = props['uid'] == _currentUid;
      
      String displayLabel = '';
      String group = labelType;

      if (labelType == 'User') {
        displayLabel = props['username'] ?? 'User';
        if (isCurrentUser) group = 'CurrentUser';
      } else if (labelType == 'Threat') {
        displayLabel = props['type'] ?? 'Threat';
      } else if (labelType == 'Sender') {
        displayLabel = props['contact'] ?? 'Sender';
      }

      visNodes.add({
        'id': n['id'],
        'label': displayLabel,
        'group': group,
      });
    }

    List<Map<String, dynamic>> visEdges = [];
    for (var l in links) {
      visEdges.add({
        'from': l['source'],
        'to': l['target'],
      });
    }

    final htmlString = _generateHtml(jsonEncode(visNodes), jsonEncode(visEdges));
    _webViewController.loadHtmlString(htmlString);
  }

  String _generateHtml(String nodesJson, String edgesJson) {
    return '''
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
      <style>
        body, html { 
          margin: 0; padding: 0; width: 100%; height: 100%; 
          background-color: #0A0A0F; 
          /* 🏁 Grid Background */
          background-image: 
            linear-gradient(rgba(167, 139, 250, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167, 139, 250, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          overflow: hidden; 
        }
        #mynetwork { width: 100vw; height: 100vh; }
        .vis-network { outline: none; }
      </style>
    </head>
    <body>
      <div id="mynetwork"></div>
      <script type="text/javascript">
        var nodes = new vis.DataSet($nodesJson);
        var edges = new vis.DataSet($edgesJson);
        var container = document.getElementById('mynetwork');
        var data = { nodes: nodes, edges: edges };
        
        var options = {
          physics: {
            forceAtlas2Based: { gravitationalConstant: -100, centralGravity: 0.01, springLength: 120, springConstant: 0.08 },
            solver: 'forceAtlas2Based',
            stabilization: { iterations: 100 }
          },
          nodes: {
            shape: 'dot',
            size: 20,
            font: { color: '#ffffff', size: 14, face: 'monospace' },
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10 }
          },
          edges: {
            width: 1.5,
            color: { color: 'rgba(255, 255, 255, 0.15)', highlight: '#A78BFA' },
            smooth: { type: 'curvedCW', roundness: 0.2 }
          },
          groups: {
            CurrentUser: {
              color: { background: '#A78BFA', border: '#ffffff' },
              font: { color: '#ffffff', size: 16, bold: true },
              size: 25
            },
            User: {
              color: { background: '#161621', border: '#A78BFA' }
            },
            Threat: {
              color: { background: '#161621', border: '#FF4D4D' },
              shape: 'diamond'
            },
            Sender: {
              color: { background: '#161621', border: '#FFA500' },
              shape: 'square'
            }
          },
          interaction: { dragNodes: true, zoomView: true, dragView: true }
        };
        var network = new vis.Network(container, data, options);
      </script>
    </body>
    </html>
    ''';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        title: const Text('COMMUNITY GRAPH', style: TextStyle(letterSpacing: 1.5, fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh, color: _violet), onPressed: _fetchAndBuildGraph)
        ],
      ),
      body: Stack(
        children: [
          _buildBody(),
          // 🏆 Floating Legend
          if (!_isLoading && _errorMsg == null) Positioned(
            bottom: 30,
            left: 20,
            child: _buildLegend(),
          ),
        ],
      ),
    );
  }

  Widget _buildLegend() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _surface.withOpacity(0.8),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _legendItem(_violet, "You / Node", Icons.person, isSquare: false),
          const SizedBox(height: 10),
          _legendItem(_violet.withOpacity(0.5), "Peer User", Icons.group_outlined, isSquare: false),
          const SizedBox(height: 10),
          _legendItem(_crimson, "Threat Node", Icons.warning_amber_rounded, isSquare: false),
          const SizedBox(height: 10),
          _legendItem(_amber, "Sender Source", Icons.cell_tower, isSquare: true),
        ],
      ),
    );
  }

  Widget _legendItem(Color color, String label, IconData icon, {required bool isSquare}) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: isSquare ? BoxShape.rectangle : BoxShape.circle,
            borderRadius: isSquare ? BorderRadius.circular(2) : null,
          ),
        ),
        const SizedBox(width: 12),
        Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: _violet));
    }

    if (_errorMsg != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 48, color: _crimson),
              const SizedBox(height: 16),
              const Text('BACKEND OFFLINE', style: TextStyle(color: _crimson, fontWeight: FontWeight.bold, letterSpacing: 2)),
              const SizedBox(height: 8),
              Text(_errorMsg!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white54, fontSize: 12)),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _fetchAndBuildGraph,
                style: ElevatedButton.styleFrom(backgroundColor: _surface),
                child: const Text('RETRY'),
              )
            ],
          ),
        ),
      );
    }

    return WebViewWidget(controller: _webViewController);
  }
}