'use client';

import React, { useState, useEffect } from 'react';

// Add interfaces for Node and Branch from the API
interface Node {
  uuid: string;
  branchId: string;
  timeStamp: string;
  content: string;
  isUpdating: boolean;
}

interface Branch {
  parentBranchId: string;
  branchId: string;
  branchStart: string;
  branchEnd: string;
  branchName: string;
  branchSummary: string;
}

interface DevToolsProps {
  nodes: Node[];
  branches: Branch[];
  loading: boolean;
}

export default function DevTools({ nodes, branches, loading }: DevToolsProps) {
  const [devToolsVisible, setDevToolsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'nodes' | 'branches'>('tree');
  const [showAddForm, setShowAddForm] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);

  // Global keybinding Ctrl+/ to toggle debug panels
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setDevToolsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const refreshAllData = async () => {
    // Force re-render by triggering a window reload or emit an event
    window.location.reload();
  };

  const handleTestSub = async () => {
    try {
      const response = await fetch('/api/tree/test-subscription');
      const data = await response.json();
      console.log('Subscription test response:', data);
    } catch (error) {
      console.error('Subscription test error:', error);
    }
  };

  const handleClear = async () => {
    try {
      await fetch('/api/tree/clear', { method: 'POST' });
    } catch (e) {
      console.error('clear error', e);
    }
  };

  // Helper functions for the dev panels
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMainBranch = (branch: Branch) => {
    return branch.branchId === 'root' && branch.branchName === 'Main';
  };

  const getNodesForBranch = (branchId: string) => {
    return nodes.filter(node => node.branchId === branchId);
  };

  // UpdateForm component for adding Nodes or Branches
  interface UpdateFormProps {
    branches: Branch[];
    onSuccess: () => void;
  }

  const UpdateForm: React.FC<UpdateFormProps> = ({ branches, onSuccess }) => {
    const [itemType, setItemType] = useState<'node' | 'branch'>('node');

    // Shared helpers
    const isoNowLocal = () => {
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISO = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
      return localISO;
    };

    // Node fields
    const [branchId, setBranchId] = useState<string>(branches[0]?.branchId || 'root');
    const [content, setContent] = useState('');
    const [timeStamp, setTimeStamp] = useState(isoNowLocal());

    // Branch fields
    const [parentBranchId, setParentBranchId] = useState<string>('root');
    const [branchName, setBranchName] = useState('');
    const [branchSummary, setBranchSummary] = useState('');
    const [branchStart, setBranchStart] = useState(isoNowLocal());
    const [branchEnd, setBranchEnd] = useState<string>('');

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async () => {
      setLoadingSubmit(true);
      setErrorMsg(null);
      try {
        const payload: any = { type: itemType };
        if (itemType === 'node') {
          payload.branchId = branchId;
          payload.content = content;
          payload.timeStamp = new Date(timeStamp).toISOString();
        } else {
          payload.parentBranchId = parentBranchId;
          payload.branchName = branchName;
          payload.branchSummary = branchSummary;
          payload.branchStart = new Date(branchStart).toISOString();
          if (branchEnd) {
            payload.branchEnd = new Date(branchEnd).toISOString();
          }
        }

        const res = await fetch('/api/tree/test-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');

        onSuccess();
      } catch (err: any) {
        setErrorMsg(err.message || 'Unknown error');
      } finally {
        setLoadingSubmit(false);
      }
    };

    return (
      <div className="space-y-4">
        {/* Type selector */}
        <div>
          <label className="font-medium mr-4">Add:</label>
          <label className="mr-3">
            <input type="radio" name="type" value="node" checked={itemType==='node'} onChange={() => setItemType('node')} /> Node
          </label>
          <label>
            <input type="radio" name="type" value="branch" checked={itemType==='branch'} onChange={() => setItemType('branch')} /> Branch
          </label>
        </div>

        {/* Node form */}
        {itemType === 'node' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <select value={branchId} onChange={e=>setBranchId(e.target.value)} className="border p-2 w-full rounded">
                {branches.map(b=> (
                  <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timestamp</label>
              <input type="datetime-local" value={timeStamp} onChange={e=>setTimeStamp(e.target.value)} className="border p-2 w-full rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea value={content} onChange={e=>setContent(e.target.value)} className="border p-2 w-full rounded" rows={3} />
            </div>
          </div>
        )}

        {/* Branch form */}
        {itemType === 'branch' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Parent Branch</label>
              <select value={parentBranchId} onChange={e=>setParentBranchId(e.target.value)} className="border p-2 w-full rounded">
                <option value="root">Main (root)</option>
                {branches.map(b=> (
                  <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Branch Name</label>
              <input type="text" value={branchName} onChange={e=>setBranchName(e.target.value)} className="border p-2 w-full rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Branch Summary</label>
              <textarea value={branchSummary} onChange={e=>setBranchSummary(e.target.value)} className="border p-2 w-full rounded" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="datetime-local" value={branchStart} onChange={e=>setBranchStart(e.target.value)} className="border p-2 w-full rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date (optional)</label>
              <input type="datetime-local" value={branchEnd} onChange={e=>setBranchEnd(e.target.value)} className="border p-2 w-full rounded" />
            </div>
          </div>
        )}

        {/* Bulk import */}
        <div className="pt-4 border-t">
          <label className="block text-sm font-medium mb-1">Import JSON</label>
          <input type="file" accept="application/json" onChange={async e=>{
            const file=e.target.files?.[0];
            if(!file) return;
            setLoadingSubmit(true);
            try{
              const text=await file.text();
              const payload=JSON.parse(text);
              const res=await fetch('/api/tree/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
              const data=await res.json();
              if(!data.success) throw new Error(data.error||'Import failed');
              onSuccess();
            }catch(err:any){setErrorMsg(err.message||'Import error');}
            finally{setLoadingSubmit(false); e.target.value='';}
          }} className="border p-2 w-full rounded bg-white" />
        </div>

        {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}

        <button
          onClick={handleSubmit}
          disabled={loadingSubmit}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingSubmit ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    );
  };

  if (!devToolsVisible) return null;

  return (
    <>
      {/* View Mode Toggle Panel (Top-Right) */}
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'tree' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('nodes')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'nodes' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nodes
            </button>
            <button
              onClick={() => setViewMode('branches')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'branches' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Branches
            </button>
            <button
              onClick={refreshAllData}
              disabled={loading}
              className="px-3 py-1 rounded text-sm font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1 rounded text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Item
            </button>
            <button
              onClick={handleTestSub}
              className="px-3 py-1 rounded text-sm font-medium transition-colors bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Test Sub
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1 rounded text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Clear
            </button>
          </div>

          {showAddForm && (
            <div className="mt-3 pt-3 border-t text-gray-800">
              <div className="flex justify-end mb-1">
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAddForm(false)}
                >
                  ✕
                </button>
              </div>
              <UpdateForm
                branches={branches}
                onSuccess={() => {
                  setShowAddForm(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Data Display Panel (Top-Left) */}
      <div className="absolute top-4 left-4 z-40 max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            {viewMode === 'tree' && 'Tree Overview'}
            {viewMode === 'nodes' && 'All Nodes'}
            {viewMode === 'branches' && 'All Branches'}
          </h3>

          {devError && (
            <div className="text-red-600 text-sm mb-3">{devError}</div>
          )}

          {viewMode === 'tree' && (
            <div>
              {loading ? (
                <div className="text-gray-500">Loading tree...</div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Total Nodes:</span> {nodes.length}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Total Branches:</span> {branches.length}
                  </div>
                  
                  {/* Branch Info */}
                  {branches.length > 0 && (
                    <div className="border-t pt-2">
                      <div className="text-sm font-medium text-gray-900 mb-2">Branches:</div>
                      <div className="space-y-2">
                        {branches.map((branch) => {
                          const isMain = isMainBranch(branch);
                          const nodeCount = getNodesForBranch(branch.branchId).length;
                          
                          return (
                            <div 
                              key={branch.branchId}
                              className={`text-xs p-2 rounded ${
                                isMain 
                                  ? 'bg-purple-100 border border-purple-200' 
                                  : 'bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-medium ${isMain ? 'text-purple-800' : 'text-gray-700'}`}>
                                  {branch.branchName}
                                  {isMain && (
                                    <span className="ml-1 text-purple-600">(Main)</span>
                                  )}
                                </span>
                                <span className="text-gray-500">{nodeCount} nodes</span>
                              </div>
                              {branch.branchSummary && (
                                <div className="text-gray-600 mt-1">
                                  {branch.branchSummary}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {viewMode === 'nodes' && (
            <div>
              {loading ? (
                <div className="text-gray-500">Loading nodes...</div>
              ) : nodes.length > 0 ? (
                <div className="space-y-3">
                  {nodes.map((node) => (
                    <div key={node.uuid} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded-r">
                      <div className="text-sm font-medium text-gray-800">
                        {node.content.substring(0, 50)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(node.timeStamp)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Branch: {node.branchId.slice(0, 8)}...
                        {node.isUpdating && (
                          <span className="ml-2 text-orange-600">• Updating</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No nodes available</div>
              )}
            </div>
          )}

          {viewMode === 'branches' && (
            <div>
              {loading ? (
                <div className="text-gray-500">Loading branches...</div>
              ) : branches.length > 0 ? (
                <div className="space-y-3">
                  {branches.map((branch) => {
                    const isMain = isMainBranch(branch);
                    const nodeCount = getNodesForBranch(branch.branchId).length;
                    
                    return (
                      <div 
                        key={branch.branchId} 
                        className={`border-l-4 pl-3 py-2 rounded-r ${
                          isMain 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-green-500 bg-green-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-800">
                            {branch.branchName}
                            {isMain && (
                              <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                                MAIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {nodeCount} node{nodeCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {branch.branchSummary}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Started: {formatDate(branch.branchStart)}
                        </div>
                        {branch.branchEnd && (
                          <div className="text-xs text-gray-500">
                            Ended: {formatDate(branch.branchEnd)}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {branch.branchId === 'root' ? 'root' : branch.branchId.slice(0, 8) + '...'}
                          {branch.parentBranchId && branch.parentBranchId !== '' && (
                            <span className="ml-2">
                              Parent: {branch.parentBranchId === 'root' ? 'root' : branch.parentBranchId.slice(0, 8) + '...'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500">No branches available</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 