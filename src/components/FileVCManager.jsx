import React, { useState } from 'react';
import { Upload, Eye, Shield, FileText, Copy, Check, AlertCircle } from 'lucide-react';

export default function FileVCManager() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadResult, setUploadResult] = useState(null);
  const [viewCid, setViewCid] = useState('');
  const [viewResult, setViewResult] = useState(null);
  const [vcInput, setVcInput] = useState('');
  const [vcResult, setVcResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    issuerDid: 'did:nda:testnet:0xd012ef45a753535bf3774cef3a4884115c69b9bf',
    accessLevel: 'private',
    ownerDid: 'did:nda:testnet:0xfb2ea60a8c629fb0bb392479c7801a772bf8c9f9'
  });

  // VC creation form state
  const [vcForm, setVcForm] = useState({
    cid: '',
    ownerDid: 'did:nda:testnet:0xfb2ea60a8c629fb0bb392479c7801a772bf8c9f9',
    viewerDid: 'did:nda:testnet:0xd012ef45a753535bf3774cef3a4884115c69b9bf',
    issuerDid: 'did:nda:testnet:0xfb2ea60a8c629fb0bb392479c7801a772bf8c9f9'
  });

  // View file form state
  const [viewForm, setViewForm] = useState({
    issuerDid: 'did:nda:testnet:0xfb2ea60a8c629fb0bb392479c7801a772bf8c9f9'
  });

  // View with VC form state
  const [viewVcForm, setViewVcForm] = useState({
    cid: '',
    jwtToken: '',
    holderDid: 'did:nda:testnet:0xd012ef45a753535bf3774cef3a4884115c69b9bf'
  });

  const handleFileUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      //get file from uploadForm
      const file = uploadForm.file;
      if (!file) {
        throw new Error('Please select a file to upload');
      }
      formData.append('data', file);
      formData.append('access_level', uploadForm.accessLevel);
      formData.append('owner_did', uploadForm.ownerDid);
      formData.append('encrypt_type', 'ecdh-es');
      
      const response = await fetch('https://fmanager-dev.pila.vn/api/v1/issuer/files/upload', {
        method: 'POST',
        headers: {
          'x-issuer-did': uploadForm.issuerDid
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      setUploadResult(data);
    } catch (err) {
      console.error('Upload error:', err);
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to the server. Please check if the API server is running and accessible.');
      } else {
        setError(`Upload failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://fmanager-dev.pila.vn/api/v1/issuer/files/${viewCid}`, {
        headers: {
          'accept': 'application/octet-stream',
          'x-issuer-did': viewForm.issuerDid
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Permission denied');
        }
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      setViewResult({ url, type: blob.type, filename });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVC = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!vcForm.cid.trim()) {
        throw new Error('Please enter a CID');
      }
      if (!vcForm.ownerDid.trim()) {
        throw new Error('Please enter an Owner DID');
      }
      if (!vcForm.viewerDid.trim()) {
        throw new Error('Please enter a Viewer DID');
      }

      const requestData = {
        cid: vcForm.cid.trim(),
        holder: vcForm.viewerDid.trim()
      };

      const response = await fetch('https://fmanager-dev.pila.vn/api/v1/files/accessible-vc', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'x-issuer-did': vcForm.issuerDid
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`VC creation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      setVcResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewByVC = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!viewVcForm.cid.trim()) {
        throw new Error('Please enter a CID');
      }

      let fileResponse;

      // If JWT token is provided, create presentation first
      if (viewVcForm.jwtToken.trim()) {
        // First, create presentation with the JWT
        const presentationData = {
          holder: viewVcForm.holderDid,
          types: ["VerifiablePresentation"],
          verifiableCredential: [viewVcForm.jwtToken.trim()]
        };

        const presentationResponse = await fetch('https://auth-dev.pila.vn/api/v2/presentations', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'x-api-key': 'CyPsgCuJMo7yP6i6bejrwxFWULokdQBpJLANgsWvcBgS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(presentationData)
        });


        if (!presentationResponse.ok) {
          const errorText = await presentationResponse.text();
          throw new Error(`Presentation failed: ${presentationResponse.status} ${presentationResponse.statusText} - ${errorText}`);
        }
        
        const presentationResult = await presentationResponse.json();

        // Extract the data field from presentation response for Authorization
        const authData = presentationResult.data;
        if (!authData) {
          throw new Error('No data field found in presentation response');
        }

        // Then, use the presentation to view the file with Authorization header
        fileResponse = await fetch(`https://fmanager-dev.pila.vn/api/v1/viewer/files/${viewVcForm.cid.trim()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/octet-stream',
            'Authorization': authData
          },
        });
      } else {
        // If no JWT, just call view file directly
        fileResponse = await fetch(`https://fmanager-dev.pila.vn/api/v1/viewer/files/${viewVcForm.cid.trim()}`, {
          method: 'GET',
          headers: {
            'accept': 'application/octet-stream'
          },
        });
      }

      if (!fileResponse.ok) {
        if (fileResponse.status === 401) {
          throw new Error('Permission denied');
        }
        const errorText = await fileResponse.text();
        throw new Error(`File access failed: ${fileResponse.status} ${fileResponse.statusText} - ${errorText}`);
      }
      
    const blob = await fileResponse.blob();
    const url = URL.createObjectURL(blob);
    
    // Extract filename from Content-Disposition header
    const contentDisposition = fileResponse.headers.get('Content-Disposition');
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    setViewResult({ 
      url, 
      type: blob.type, 
      filename,
      fromVC: !!viewVcForm.jwtToken.trim(),
      presentation: viewVcForm.jwtToken.trim() ? {} : null,
      vcJwt: viewVcForm.jwtToken.trim() || null,
      cid: viewVcForm.cid.trim()
    });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    const textToCopy = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'upload', label: 'Issuer Upload File', icon: Upload },
    { id: 'view', label: 'Owner View File', icon: Eye },
    { id: 'createvc', label: 'Create VC-accessible', icon: Shield },
    { id: 'viewvc', label: 'View with VC', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-3/4 h-full mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">IPFS storage manager demo</h1>
            <p className="text-blue-100">Secure file management</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setError(null);
                  setViewResult(null);
                }}
                className={`flex-1 px-4 py-4 flex items-center justify-center gap-2 font-medium transition-all ${
                  activeTab === id
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuer DID
                  </label>
                  <input
                    type="text"
                    value={uploadForm.issuerDid}
                    onChange={(e) => setUploadForm({...uploadForm, issuerDid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Level
                  </label>
                  <select
                    value={uploadForm.accessLevel}
                    onChange={(e) => setUploadForm({...uploadForm, accessLevel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner DID
                  </label>
                  <input
                    type="text"
                    value={uploadForm.ownerDid}
                    onChange={(e) => setUploadForm({...uploadForm, ownerDid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? 'Uploading...' : (
                    <>
                      <Upload size={20} />
                      Upload File
                    </>
                  )}
                </button>

                {uploadResult && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2">Upload Successful!</h3>
                    <pre className="text-sm bg-white p-3 rounded overflow-x-auto">
                      {JSON.stringify(uploadResult, null, 2)}
                    </pre>
                  </div>
                )}
              </form>
            )}

            {/* View File Tab */}
            {activeTab === 'view' && (
              <form onSubmit={handleViewFile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File CID
                  </label>
                  <input
                    type="text"
                    value={viewCid}
                    onChange={(e) => setViewCid(e.target.value)}
                    placeholder="QmT3jt7DfWp4AYk4CXmq5Kt98F4YUJGcY1FLGD2XJ5CJrw"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuer DID
                  </label>
                  <input
                    type="text"
                    value={viewForm.issuerDid}
                    onChange={(e) => setViewForm({...viewForm, issuerDid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? 'Loading...' : (
                    <>
                      <Eye size={20} />
                      View File
                    </>
                  )}
                </button>

                {viewResult && !viewResult.fromVC && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">File Retrieved</h3>
                    {viewResult.type.startsWith('image/') ? (
                      <img src={viewResult.url} alt="Retrieved file" className="max-w-full rounded" />
                    ) : (
                      <a
                        href={viewResult.url}
                        download={viewResult.filename || 'download'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Download File
                      </a>
                    )}
                  </div>
                )}
              </form>
            )}

            {/* Create VC Tab */}
            {activeTab === 'createvc' && (
              <form onSubmit={handleCreateVC} className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Create a Verifiable Credential for file access. Enter the CID and DIDs manually.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File CID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={vcForm.cid}
                      onChange={(e) => setVcForm({...vcForm, cid: e.target.value})}
                      placeholder="QmT3jt7DfWp4AYk4CXmq5Kt98F4YUJGcY1FLGD2XJ5CJrw"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      required
                    />
                    {uploadResult?.cid && (
                      <button
                        type="button"
                        onClick={() => setVcForm({...vcForm, cid: uploadResult.cid})}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        Use Uploaded
                      </button>
                    )}
                  </div>
                  {uploadResult?.cid && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last uploaded file CID: {uploadResult.cid}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner DID
                  </label>
                  <input
                    type="text"
                    value={vcForm.ownerDid}
                    onChange={(e) => setVcForm({...vcForm, ownerDid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Viewer DID (Holder)
                  </label>
                  <input
                    type="text"
                    value={vcForm.viewerDid}
                    onChange={(e) => setVcForm({...vcForm, viewerDid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuer DID
                  </label>
                  <input
                    type="text"
                    value={vcForm.issuerDid}
                    onChange={(e) => setVcForm({...vcForm, issuerDid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating...' : (
                    <>
                      <Shield size={20} />
                      Create VC Access
                    </>
                  )}
                </button>

                {vcResult && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-green-800">Verifiable Credential Created</h3>
                      <button
                        onClick={() => copyToClipboard(vcResult.vc_jwt)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">VC JWT:</label>
                        <textarea
                          value={vcResult.vc_jwt || ''}
                          readOnly
                          className="w-full px-3 py-2 bg-white border border-green-300 rounded text-xs font-mono"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">Full Response:</label>
                        <pre className="text-xs bg-white p-3 rounded overflow-x-auto border border-green-300">
                          {JSON.stringify(vcResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* View by VC Tab */}
            {activeTab === 'viewvc' && (
              <form onSubmit={handleViewByVC} className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    View a file using a Verifiable Credential. Enter the CID and JWT token.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File CID
                  </label>
                  <input
                    type="text"
                    value={viewVcForm.cid}
                    onChange={(e) => setViewVcForm({...viewVcForm, cid: e.target.value})}
                    placeholder="QmT3jt7DfWp4AYk4CXmq5Kt98F4YUJGcY1FLGD2XJ5CJrw"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JWT Token
                  </label>
                  <div className="space-y-2">
                    <textarea
                      value={viewVcForm.jwtToken}
                      onChange={(e) => setViewVcForm({...viewVcForm, jwtToken: e.target.value})}
                      placeholder="eyJhbGciOiJFUzI1NksiLCJraWQiOiJkaWQ6bmRhOnRlc3RuZXQ6MHhmYjJlYTYwYThjNjI5ZmIwYmIzOTI0NzljNzgwMWE3NzJiZjhjOWY5I2tleS0xIiwidHlwIjoiSldUIn0..."
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                    {vcResult?.vc_jwt && (
                      <button
                        type="button"
                        onClick={() => setViewVcForm({...viewVcForm, jwtToken: vcResult.vc_jwt})}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                      >
                        Use Created VC JWT
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Paste the JWT token from the Create VC tab result (optional)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Holder DID
                  </label>
                  <input
                    type="text"
                    value={viewVcForm.holderDid}
                    onChange={(e) => setViewVcForm({...viewVcForm, holderDid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? 'Loading...' : (
                    <>
                      <FileText size={20} />
                      View File with VC
                    </>
                  )}
                </button>

                {viewResult && activeTab === 'viewvc' && (
                  <div className="mt-4 space-y-4">
                    {/* File Display */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-3">File Retrieved Successfully</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">File CID:</label>
                          <code className="text-sm bg-white p-2 rounded border border-green-300 font-mono">
                            {viewResult.cid}
                          </code>
                        </div>
                        {viewResult.type.startsWith('image/') ? (
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Image Preview:</label>
                            <img src={viewResult.url} alt="Retrieved file" className="max-w-full rounded border border-green-300" />
                          </div>
                        ) : (
                          <div>
                            <a
                              href={viewResult.url}
                              download={viewResult.filename || 'download'}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Download File
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Presentation Data - Only show if using VC */}
                    {viewResult.fromVC && viewResult.presentation && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-3">Presentation Data</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Presentation Response:</label>
                            <pre className="text-xs bg-white p-3 rounded overflow-x-auto border border-blue-300 max-h-40">
                              {JSON.stringify(viewResult.presentation, null, 2)}
                            </pre>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => copyToClipboard(viewResult.presentation)}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                            >
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                              {copied ? 'Copied!' : 'Copy Presentation'}
                            </button>
                            <button
                              onClick={() => copyToClipboard(viewResult.vcJwt)}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                            >
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                              {copied ? 'Copied!' : 'Copy JWT'}
                            </button>
                            <button
                              onClick={() => copyToClipboard(viewResult.cid)}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                            >
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                              {copied ? 'Copied!' : 'Copy CID'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
