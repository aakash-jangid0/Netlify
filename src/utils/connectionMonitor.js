// Connection monitor utility
// This will track and limit simultaneous connections to prevent overwhelming the Supabase service

class ConnectionMonitor {
  constructor() {
    this.activeConnections = {
      supabase: new Map(),
      socketio: new Map(),
      general: new Map()
    };
    this.connectionLimits = {
      supabase: 10,      // Max simultaneous Supabase connections
      socketio: 5,       // Max simultaneous Socket.IO connections
      general: 20        // Max total connections
    };
    this.stats = {
      totalConnections: 0,
      failedConnections: 0,
      timeouts: 0
    };
    
    // Only initialize event listeners in browser environment
    if (typeof window !== 'undefined') {
      this.initEventListeners();
    }
  }
  
  initEventListeners() {
    try {
      // Clean up old connections periodically
      setInterval(() => {
        const now = Date.now();
        for (const type in this.activeConnections) {
          const connections = this.activeConnections[type];
          for (const [id, conn] of connections.entries()) {
            // Close connections older than 30 seconds
            if (now - conn.startTime > 30000) {
              console.warn(`Closing stale ${type} connection: ${id}`);
              this.releaseConnection(type, id, true);
            }
          }
        }
      }, 10000);
      
      // Log stats every minute
      setInterval(() => {
        console.info('Connection stats:', this.stats);
        for (const type in this.activeConnections) {
          console.info(`Active ${type} connections:`, this.activeConnections[type].size);
        }
      }, 60000);
    } catch (error) {
      console.error('Failed to initialize connection monitor:', error);
    }
  }
  
  trackConnection(type, id) {
    if (!this.activeConnections[type]) {
      this.activeConnections[type] = new Map();
    }
    
    // Check if we're exceeding limits
    if (this.activeConnections[type].size >= this.connectionLimits[type]) {
      console.warn(`Connection limit reached for ${type} (${this.connectionLimits[type]})`);
      this.stats.failedConnections++;
      return false;
    }
    
    // Track this connection
    this.activeConnections[type].set(id, {
      startTime: Date.now(),
      type
    });
    
    this.stats.totalConnections++;
    return true;
  }
  
  releaseConnection(type, id, isError = false) {
    if (!this.activeConnections[type]) return;
    
    if (this.activeConnections[type].has(id)) {
      this.activeConnections[type].delete(id);
      
      if (isError) {
        this.stats.failedConnections++;
      }
    }
  }
  
  getActiveConnectionCount(type = null) {
    if (type && this.activeConnections[type]) {
      return this.activeConnections[type].size;
    }
    
    // Count all connections
    let total = 0;
    for (const type in this.activeConnections) {
      total += this.activeConnections[type].size;
    }
    return total;
  }
}

// Create a singleton instance
const connectionMonitor = new ConnectionMonitor();

export default connectionMonitor;
