import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const WebSocketTest: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>('Initializing...');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('Fetching socket port...');
        setTestResults(prev => [...prev, '🔍 Attempting to fetch socket port from server...']);
        
        const response = await fetch('http://localhost:5000/api/socket-port');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const { port } = data;
        
        setTestResults(prev => [...prev, `✅ Socket port fetched successfully: ${port}`]);
        setStatus(`Connecting to WebSocket on port ${port}...`);
        
        const socketInstance = io(`http://localhost:${port}`, {
          transports: ['websocket'],
          timeout: 10000,
        });

        socketInstance.on('connect', () => {
          console.log('WebSocket connected successfully!');
          setConnected(true);
          setStatus('Connected to WebSocket server');
          setTestResults(prev => [...prev, '✅ WebSocket connection established']);
          
          // Test admin:getChats
          socketInstance.emit('admin:getChats', (error: Error | null, chats: unknown) => {
            if (error) {
              setTestResults(prev => [...prev, `❌ admin:getChats error: ${error.message || error}`]);
            } else {
              const chatArray = Array.isArray(chats) ? chats : [];
              setTestResults(prev => [...prev, `✅ admin:getChats successful: ${chatArray.length} chats found`]);
            }
          });
        });

        socketInstance.on('disconnect', () => {
          console.log('WebSocket disconnected');
          setConnected(false);
          setStatus('Disconnected from WebSocket server');
          setTestResults(prev => [...prev, '❌ WebSocket connection lost']);
        });

        socketInstance.on('connect_error', (err) => {
          console.error('WebSocket connection error:', err);
          setConnected(false);
          setStatus(`Connection error: ${err.message}`);
          setTestResults(prev => [...prev, `❌ Connection error: ${err.message}`]);
        });

        return () => socketInstance.close();
      } catch (err) {
        console.error('Failed to initialize socket:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setStatus(`Failed to initialize: ${errorMessage}`);
        setTestResults(prev => [...prev, `❌ Initialization failed: ${errorMessage}`]);
        
        // Try direct connection as fallback
        setTestResults(prev => [...prev, '🔄 Attempting direct connection to port 5001...']);
        try {
          const socketInstance = io('http://localhost:5001', {
            transports: ['websocket'],
            timeout: 10000,
          });

          socketInstance.on('connect', () => {
            console.log('Direct WebSocket connection successful!');
            setConnected(true);
            setStatus('Connected to WebSocket server (direct connection)');
            setTestResults(prev => [...prev, '✅ Direct WebSocket connection established']);
          });

          socketInstance.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnected(false);
            setStatus('Disconnected from WebSocket server');
            setTestResults(prev => [...prev, '❌ WebSocket connection lost']);
          });

          socketInstance.on('connect_error', (err) => {
            console.error('Direct WebSocket connection error:', err);
            setConnected(false);
            setStatus(`Direct connection error: ${err.message}`);
            setTestResults(prev => [...prev, `❌ Direct connection error: ${err.message}`]);
          });

          return () => socketInstance.close();
        } catch (directErr) {
          const directErrorMessage = directErr instanceof Error ? directErr.message : 'Unknown error';
          setTestResults(prev => [...prev, `❌ Direct connection also failed: ${directErrorMessage}`]);
        }
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WebSocket Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className={`w-3 h-3 rounded-full mr-3 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h2 className="text-xl font-semibold">Connection Status</h2>
          </div>
          <p className="text-gray-700">{status}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests completed yet...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Server Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>HTTP Server:</strong> http://localhost:5000
            </div>
            <div>
              <strong>WebSocket Server:</strong> http://localhost:5001
            </div>
            <div>
              <strong>Socket.IO Client:</strong> v4.8.1
            </div>
            <div>
              <strong>Transport:</strong> WebSocket
            </div>
          </div>
        </div>

        {connected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-green-800 mb-2">🎉 Success!</h3>
            <p className="text-green-700">
              WebSocket connection is working properly. The two-way chat support system is ready for testing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketTest;
