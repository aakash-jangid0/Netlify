import React, { useState, useEffect } from 'react';
import { isOnline, checkApiAvailability, registerNetworkListeners } from '../../utils/networkChecker';

const NetworkStatus = () => {
  const [online, setOnline] = useState(isOnline());
  const [apiAvailable, setApiAvailable] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  // Check API availability periodically
  useEffect(() => {
    const checkApi = async () => {
      const available = await checkApiAvailability();
      setApiAvailable(available);
      setShowBanner(!available || !online);
    };

    checkApi();
    const intervalId = setInterval(checkApi, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [online]);

  // Register network status listeners
  useEffect(() => {
    return registerNetworkListeners(status => {
      setOnline(status);
      setShowBanner(!status);
    });
  }, []);

  // If everything is fine, don't show anything
  if (!showBanner) {
    return null;
  }

  // Styled banner for connectivity issues
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: online && !apiAvailable ? '#f8d7da' : '#dc3545',
        color: online && !apiAvailable ? '#721c24' : '#fff',
        padding: '10px',
        textAlign: 'center',
        zIndex: 9999,
        fontWeight: 'bold'
      }}
    >
      {!online ? (
        <span>You are offline. Please check your internet connection.</span>
      ) : !apiAvailable ? (
        <span>Unable to connect to the server. Some features may be unavailable.</span>
      ) : null}
    </div>
  );
};

export default NetworkStatus;
