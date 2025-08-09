import { io } from 'socket.io-client';

/**
 * IoT数据服务类
 * 负责处理设备位置数据、MQTT通信和实时数据更新
 */
class IoTDataService {
  constructor(config) {
    this.config = config;
    this.mqttClient = null;
    this.websocket = null;
    this.deviceData = new Map();
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config?.max_reconnect_attempts || 10;
    this.reconnectInterval = config?.reconnect_interval || 5000;
  }

  /**
   * 初始化连接
   */
  async initialize() {
    try {
      await this.connectWebSocket();
      await this.connectMQTT();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('IoT数据服务初始化成功');
    } catch (error) {
      console.error('IoT数据服务初始化失败:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 连接WebSocket
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        // 使用Socket.IO客户端连接
        this.websocket = io('http://localhost:3000', {
          transports: ['websocket', 'polling']
        });
        
        this.websocket.on('connect', () => {
          console.log('Socket.IO连接已建立');
          this.isConnected = true;
          resolve();
        });
        
        // 监听各种数据更新事件
        this.websocket.on('device_location_update', (data) => {
          this.handleDeviceLocationUpdate(data);
        });
        
        this.websocket.on('device_status_update', (data) => {
          this.handleDeviceStatusUpdate(data);
        });
        
        this.websocket.on('system_alert', (data) => {
          this.handleSystemAlert(data);
        });
        
        this.websocket.on('historical_data', (data) => {
          this.handleHistoricalData(data);
        });
        
        this.websocket.on('disconnect', () => {
          console.log('Socket.IO连接已关闭');
          this.isConnected = false;
          this.scheduleReconnect();
        });
        
        this.websocket.on('connect_error', (error) => {
          console.error('Socket.IO连接错误:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 连接MQTT（通过WebSocket）
   */
  async connectMQTT() {
    // 这里使用mqtt.js库的WebSocket连接
    // 需要在package.json中添加mqtt依赖
    try {
      // 模拟MQTT连接，实际项目中需要使用mqtt.js
      console.log('MQTT连接模拟建立');
      this.subscribeMQTTTopics();
    } catch (error) {
      console.error('MQTT连接失败:', error);
      throw error;
    }
  }

  /**
   * 订阅MQTT主题
   */
  subscribeMQTTTopics() {
    const topics = this.config.iot.topics;
    
    // 订阅设备位置主题
    console.log('订阅MQTT主题:', topics.device_location);
    
    // 订阅设备状态主题
    console.log('订阅MQTT主题:', topics.device_status);
    
    // 订阅系统告警主题
    console.log('订阅MQTT主题:', topics.system_alerts);
  }

  /**
   * 处理WebSocket消息
   */
  handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'device_location':
          this.handleDeviceLocationUpdate(message.data);
          break;
        case 'device_status':
          this.handleDeviceStatusUpdate(message.data);
          break;
        case 'system_alert':
          this.handleSystemAlert(message.data);
          break;
        case 'historical_data':
          this.handleHistoricalData(message.data);
          break;
        default:
          console.log('未知消息类型:', message.type);
      }
    } catch (error) {
      console.error('处理WebSocket消息失败:', error);
    }
  }

  /**
   * 处理设备位置更新
   */
  handleDeviceLocationUpdate(data) {
    const { deviceId, location, timestamp } = data;
    
    // 更新设备数据
    if (!this.deviceData.has(deviceId)) {
      this.deviceData.set(deviceId, {
        id: deviceId,
        locations: [],
        status: 'online',
        lastUpdate: timestamp
      });
    }
    
    const device = this.deviceData.get(deviceId);
    device.locations.push({
      ...location,
      timestamp
    });
    
    // 保持最近100个位置点
    if (device.locations.length > 100) {
      device.locations = device.locations.slice(-100);
    }
    
    device.lastUpdate = timestamp;
    
    // 通知监听器
    this.notifyListeners('device_location_update', {
      deviceId,
      location,
      timestamp,
      device
    });
  }

  /**
   * 处理设备状态更新
   */
  handleDeviceStatusUpdate(data) {
    const { deviceId, status, timestamp } = data;
    
    if (this.deviceData.has(deviceId)) {
      const device = this.deviceData.get(deviceId);
      device.status = status;
      device.lastUpdate = timestamp;
      
      this.notifyListeners('device_status_update', {
        deviceId,
        status,
        timestamp,
        device
      });
    }
  }

  /**
   * 处理系统告警
   */
  handleSystemAlert(data) {
    console.log('系统告警:', data);
    this.notifyListeners('system_alert', data);
  }

  /**
   * 处理历史数据
   */
  handleHistoricalData(data) {
    const { deviceId, locations } = data;
    
    if (!this.deviceData.has(deviceId)) {
      this.deviceData.set(deviceId, {
        id: deviceId,
        locations: [],
        status: 'unknown',
        lastUpdate: null
      });
    }
    
    const device = this.deviceData.get(deviceId);
    device.locations = locations;
    
    this.notifyListeners('historical_data_loaded', {
      deviceId,
      locations,
      device
    });
  }

  /**
   * 添加事件监听器
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 通知监听器
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('监听器回调执行失败:', error);
        }
      });
    }
  }

  /**
   * 获取设备数据
   */
  getDeviceData(deviceId) {
    return this.deviceData.get(deviceId);
  }

  /**
   * 获取所有设备数据
   */
  getAllDeviceData() {
    return Array.from(this.deviceData.values());
  }

  /**
   * 获取设备位置历史
   */
  getDeviceLocationHistory(deviceId, limit = 50) {
    const device = this.deviceData.get(deviceId);
    if (!device) return [];
    
    return device.locations.slice(-limit);
  }

  /**
   * 请求历史数据
   */
  async requestHistoricalData(deviceId, startTime, endTime) {
    if (!this.websocket || !this.websocket.connected) {
      throw new Error('Socket.IO连接未建立');
    }
    
    const data = {
      deviceId,
      startTime,
      endTime
    };
    
    this.websocket.emit('request_historical_data', data);
  }

  /**
   * 发送设备命令
   */
  async sendDeviceCommand(deviceId, command, params = {}) {
    if (!this.websocket || !this.websocket.connected) {
      throw new Error('Socket.IO连接未建立');
    }
    
    const data = {
      deviceId,
      command,
      params,
      timestamp: Date.now()
    };
    
    this.websocket.emit('device_command', data);
  }

  /**
   * 计划重连
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`${this.reconnectInterval / 1000}秒后尝试第${this.reconnectAttempts}次重连`);
    
    setTimeout(() => {
      this.initialize();
    }, this.reconnectInterval);
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      websocketState: this.websocket?.readyState,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.isConnected = false;
    
    if (this.websocket) {
      this.websocket.disconnect();
      this.websocket = null;
    }
    
    if (this.mqttClient) {
      // 断开MQTT连接
      this.mqttClient = null;
    }
    
    console.log('IoT数据服务已断开连接');
  }

  /**
   * 清理资源
   */
  destroy() {
    this.disconnect();
    this.deviceData.clear();
    this.listeners.clear();
  }
}

export default IoTDataService;