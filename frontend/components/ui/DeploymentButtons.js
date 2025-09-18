import { useState, useEffect } from 'react';

export default function DeploymentButtons({ apiUrl }) {
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');

  const loadTags = async () => {
    try {
      const response = await fetch(`${apiUrl}/deploy/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (result.success) {
        setTags(result.tags || []);
        if (result.tags.length > 0 && !selectedTag) {
          setSelectedTag(result.tags[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const callApi = async (endpoint, body = {}, type = '') => {
    setLoading(type);
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/deploy/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: Object.keys(body).length ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();

      if (result.success) {
        setMessage(`${endpoint} successful! ${result.message || ''}`);
        if (endpoint === 'publish') {
          await loadTags();
        }
      } else {
        setMessage(`${endpoint} failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`${endpoint} failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>🚀 Site Deployment</h2>

      <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => callApi('preview', {}, 'preview')}
          disabled={!!loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading === 'preview' ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading === 'preview' ? 'Publishing...' : '📋 Preview'}
        </button>

        <button
          onClick={() => callApi('publish', {}, 'publish')}
          disabled={!!loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading === 'publish' ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading === 'publish' ? 'Publishing...' : '🚀 Publish'}
        </button>

        <button
          onClick={() => callApi('rollback', {}, 'rollback-latest')}
          disabled={!!loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading === 'rollback-latest' ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading === 'rollback-latest' ? 'Rolling back...' : '↩️ Rollback (last)'}
        </button>
      </div>

      {tags.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>📜 All versions:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tags.map((tag) => (
              <li
                key={tag}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  padding: '6px 10px',
                  backgroundColor: '#f1f3f5',
                  borderRadius: 4,
                }}
              >
                <span>{tag}</span>
                <button
                  onClick={() => callApi('rollback', { tag }, `rollback-inline-${tag}`)}
                  disabled={!!loading}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: loading === `rollback-inline-${tag}` ? '#ccc' : '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: !loading ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading === `rollback-inline-${tag}` ? 'Rolling...' : 'Rollback'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <div
          style={{
            padding: 10,
            backgroundColor: message.includes('failed') ? '#f8d7da' : '#d4edda',
            color: message.includes('failed') ? '#721c24' : '#155724',
            border: `1px solid ${message.includes('failed') ? '#f5c6cb' : '#c3e6cb'}`,
            borderRadius: 5,
            marginTop: 10,
          }}
        >
          {message}
        </div>
      )}

      {loading && (
        <div style={{ marginTop: 10, color: '#666' }}>
          Processing <b>{loading}</b>... Please wait.
        </div>
      )}

      {tags.length === 0 && !loading && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7',
            borderRadius: 5,
          }}
        >
          No version tags found. Publish first to create versions.
        </div>
      )}
    </div>
  );
}
