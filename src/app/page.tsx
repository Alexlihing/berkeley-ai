'use client';

import { useState, useEffect } from 'react';
import { LifeTreeNode, TreeStats } from '@/types/tree';

export default function Home() {
  const [tree, setTree] = useState<LifeTreeNode | null>(null);
  const [stats, setStats] = useState<TreeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTreeData();
  }, []);

  const loadTreeData = async () => {
    try {
      setLoading(true);
      const [treeResponse, statsResponse] = await Promise.all([
        fetch('/api/tree'),
        fetch('/api/tree?action=stats')
      ]);
      
      const treeData = await treeResponse.json();
      const statsData = await statsResponse.json();
      
      setTree(treeData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading tree data:', error);
      setMessage('Error loading tree data');
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tree/sample', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setMessage(result.message);
        await loadTreeData(); // Reload the data
      } else {
        setMessage('Failed to generate sample data');
      }
    } catch (error) {
      console.error('Error generating sample data:', error);
      setMessage('Error generating sample data');
    } finally {
      setLoading(false);
    }
  };

  const setupVapiAssistant = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vapi/setup', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`Vapi Assistant created: ${result.assistant.name} (ID: ${result.assistant.id})`);
      } else {
        setMessage(`Failed to create Vapi Assistant: ${result.error}`);
      }
    } catch (error) {
      console.error('Error setting up Vapi assistant:', error);
      setMessage('Error setting up Vapi assistant');
    } finally {
      setLoading(false);
    }
  };

  const renderTreeNode = (node: LifeTreeNode, depth = 0) => {
    const indent = '  '.repeat(depth);
    const importanceColor = {
      low: 'text-gray-500',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    }[node.importance];

    return (
      <div key={node.id} className="mb-2">
        <div className={`${indent} ${importanceColor} font-medium`}>
          📍 {node.title} ({node.type})
        </div>
        <div className={`${indent} text-sm text-gray-600 ml-4`}>
          {node.description}
        </div>
        {node.date && (
          <div className={`${indent} text-xs text-gray-500 ml-4`}>
            📅 {new Date(node.date).toLocaleDateString()}
          </div>
        )}
        {node.location && (
          <div className={`${indent} text-xs text-gray-500 ml-4`}>
            📍 {node.location}
          </div>
        )}
        {node.tags && node.tags.length > 0 && (
          <div className={`${indent} text-xs text-gray-500 ml-4`}>
            🏷️ {node.tags.join(', ')}
          </div>
        )}
        {node.children.map(child => renderTreeNode(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your life tree...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌳 Life Tree Journal
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Voice-controlled life story management powered by Vapi
          </p>
          
          {message && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={generateSampleData}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              🌱 Generate Sample Data
            </button>
            <button
              onClick={setupVapiAssistant}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              🎤 Setup Vapi Assistant
            </button>
            <button
              onClick={loadTreeData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Entries</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalNodes}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">High Importance</h3>
              <p className="text-3xl font-bold text-orange-600">
                {(stats.byImportance.high || 0) + (stats.byImportance.critical || 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">People</h3>
              <p className="text-3xl font-bold text-green-600">{stats.byType.person || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Places</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.byType.place || 0}</p>
            </div>
          </div>
        )}

        {/* Tree Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tree Structure */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🌳 Life Tree Structure</h2>
            <div className="max-h-96 overflow-y-auto">
              {tree ? (
                <div className="font-mono text-sm">
                  {renderTreeNode(tree)}
                </div>
              ) : (
                <p className="text-gray-500">No tree data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Recent Activity</h2>
            <div className="max-h-96 overflow-y-auto">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((node) => (
                    <div key={node.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="font-medium text-gray-800">{node.title}</div>
                      <div className="text-sm text-gray-600">{node.type}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(node.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* API Endpoints Info */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔗 API Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Tree Management:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>GET /api/tree - Get entire tree</li>
                <li>POST /api/tree - Add new node</li>
                <li>PUT /api/tree - Update node</li>
                <li>DELETE /api/tree?nodeId=... - Delete node</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Analytics & Search:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>GET /api/tree?action=stats - Get statistics</li>
                <li>GET /api/tree?action=analytics - Get analytics</li>
                <li>GET /api/tree?action=timeline - Get timeline</li>
                <li>GET /api/tree?action=search&... - Search nodes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vapi Integration Info */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎤 Vapi Voice Integration</h2>
          <p className="text-gray-700 mb-4">
            This application integrates with Vapi to provide voice-controlled life journaling. 
            The voice agent can help you add experiences, people, places, and goals to your life tree 
            through natural conversation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Voice Commands:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>&ldquo;Add a new experience about...&rdquo;</li>
                <li>&ldquo;Tell me about someone important...&rdquo;</li>
                <li>&ldquo;Document a place that matters...&rdquo;</li>
                <li>&ldquo;What are my recent entries?&rdquo;</li>
                <li>&ldquo;Show me my life statistics&rdquo;</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Webhook Endpoint:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>POST /api/webhook/vapi - Vapi webhook</li>
                <li>POST /api/vapi/setup - Setup assistant</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
