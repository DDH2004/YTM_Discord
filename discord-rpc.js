/**
 * Simplified Discord RPC Client for Browser Extensions
 * 
 * This is a simplified version of Discord's RPC client that works in browser extensions.
 * NOTE: This is a custom implementation because Discord's official RPC library 
 * doesn't work in browsers.
 */

const DiscordRPC = (() => {
    class RPCError extends Error {
      constructor(message) {
        super(message);
        this.name = 'RPCError';
      }
    }
    
    class EventEmitter {
      constructor() {
        this.events = {};
      }
      
      on(event, listener) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
      }
      
      once(event, listener) {
        const onceWrapper = (...args) => {
          listener(...args);
          this.off(event, onceWrapper);
        };
        return this.on(event, onceWrapper);
      }
      
      off(event, listener) {
        if (!this.events[event]) return this;
        this.events[event] = this.events[event].filter(l => l !== listener);
        return this;
      }
      
      emit(event, ...args) {
        if (!this.events[event]) return false;
        this.events[event].forEach(listener => listener(...args));
        return true;
      }
    }
    
    class WebSocketTransport {
      constructor(client) {
        this.client = client;
        this.socket = null;
        this.connected = false;
      }
      
      connect() {
        return new Promise((resolve, reject) => {
          try {
            // Connect to Discord's local RPC server
            this.socket = new WebSocket('ws://127.0.0.1:6463/?v=1&client_id=' + this.client.clientId);
            
            this.socket.onopen = () => {
              this.connected = true;
              this.client.emit('connected');
              resolve();
            };
            
            this.socket.onclose = () => {
              this.connected = false;
              this.client.emit('disconnected');
            };
            
            this.socket.onerror = (error) => {
              console.error('WebSocket error:', error);
              this.connected = false;
              this.client.emit('error', new RPCError('Connection error'));
              reject(new RPCError('Failed to connect to Discord'));
            };
            
            this.socket.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                this.client.emit('message', data);
                
                if (data.cmd === 'DISPATCH' && data.evt === 'READY') {
                  this.client.user = data.data.user;
                  this.client.emit('ready');
                }
              } catch (error) {
                console.error('Error processing message:', error);
              }
            };
          } catch (error) {
            console.error('Error creating WebSocket:', error);
            reject(new RPCError('Failed to create WebSocket connection'));
          }
        });
      }
      
      send(data) {
        return new Promise((resolve, reject) => {
          if (!this.connected || !this.socket) {
            return reject(new RPCError('Not connected'));
          }
          
          try {
            const nonce = this.generateNonce();
            const payload = { ...data, nonce };
            
            this.socket.send(JSON.stringify(payload));
            resolve();
          } catch (error) {
            reject(new RPCError('Failed to send data: ' + error.message));
          }
        });
      }
      
      close() {
        if (this.socket) {
          this.socket.close();
          this.socket = null;
          this.connected = false;
        }
      }
      
      generateNonce() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }
    }
    
    class Client extends EventEmitter {
      constructor(options = {}) {
        super();
        this.clientId = null;
        this.user = null;
        
        // Default to WebSocket transport for browser extensions
        this.transport = new WebSocketTransport(this);
      }
      
      async login(options) {
        if (!options || !options.clientId) {
          throw new RPCError('ClientID is required');
        }
        
        this.clientId = options.clientId;
        
        try {
          await this.transport.connect();
          
          // Send identify command
          await this.transport.send({
            cmd: 'DISPATCH',
            evt: 'AUTHORIZE',
            data: {
              client_id: this.clientId,
              scopes: ['rpc']
            }
          });
        } catch (error) {
          throw new RPCError('Failed to login: ' + error.message);
        }
      }
      
      async setActivity(activity) {
        if (!this.transport.connected) {
          throw new RPCError('Not connected');
        }
        
        try {
          await this.transport.send({
            cmd: 'SET_ACTIVITY',
            data: {
              pid: 1, // Browser process ID (not actually used)
              activity
            }
          });
        } catch (error) {
          throw new RPCError('Failed to set activity: ' + error.message);
        }
      }
      
      async clearActivity() {
        if (!this.transport.connected) {
          throw new RPCError('Not connected');
        }
        
        try {
          await this.transport.send({
            cmd: 'SET_ACTIVITY',
            data: {
              pid: 1, // Browser process ID (not actually used)
              activity: null
            }
          });
        } catch (error) {
          throw new RPCError('Failed to clear activity: ' + error.message);
        }
      }
      
      destroy() {
        this.transport.close();
        return Promise.resolve();
      }
    }
    
    return {
      Client,
      RPCError
    };
  })();