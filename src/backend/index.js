const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// 模拟设备数据
const mockDevices = new Map();

// 初始化模拟设备数据
function initializeMockDevices() {
  const deviceIds = ['device_001', 'device_002', 'device_003', 'device_004', 'device_005'];
  
  deviceIds.forEach((deviceId, index) => {
    mockDevices.set(deviceId, {
      id: deviceId,
      status: ['online', 'offline', 'warning'][Math.floor(Math.random() * 3)],
      locations: generateMockLocationHistory(deviceId, 50),
      lastUpdate: Date.now()
    });
  });
}

// 生成模拟位置历史数据
function generateMockLocationHistory(deviceId, count) {
  const locations = [];
  const baseLocation = {
    lat: 39.9042 + (Math.random() - 0.5) * 0.1, // 北京附近
    lng: 116.4074 + (Math.random() - 0.5) * 0.1
  };
  
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now() - (count - i) * 60000; // 每分钟一个点
    locations.push({
      lat: baseLocation.lat + (Math.random() - 0.5) * 0.01,
      lng: baseLocation.lng + (Math.random() - 0.5) * 0.01,
      timestamp,
      speed: Math.random() * 60, // 0-60 km/h
      heading: Math.random() * 360 // 0-360度
    });
  }
  
  return locations;
}

// API路由

// 获取配置信息
app.get('/api/config', (req, res) => {
  const config = {
    amap: {
      api_key: process.env.REACT_APP_AMAP_API_KEY || 'YOUR_AMAP_API_KEY',
      security_js_code: process.env.REACT_APP_AMAP_SECURITY_CODE || 'YOUR_AMAP_SECURITY_CODE',
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geocoder', 'AMap.PlaceSearch'],
      default_center: {
        lng: 116.4074,
        lat: 39.9042
      },
      default_zoom: 12,
      map_style: 'amap://styles/normal',
      view_mode: '3D'
    },
    api: {
      base_url: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
      timeout: 10000
    },
    websocket: {
      url: process.env.REACT_APP_WS_URL || 'ws://localhost:3000',
      reconnect_interval: 5000,
      max_reconnect_attempts: 10
    },
    iot: {
      mqtt_broker: process.env.REACT_APP_MQTT_BROKER || 'ws://localhost:8083/mqtt',
      topics: {
        device_location: 'iot/device/+/location',
        device_status: 'iot/device/+/status',
        system_alerts: 'iot/system/alerts'
      }
    }
  };
  
  res.json(config);
});

// 获取所有设备信息
app.get('/api/devices', (req, res) => {
  const devices = Array.from(mockDevices.values());
  res.json(devices);
});

// 获取特定设备信息
app.get('/api/devices/:deviceId', (req, res) => {
  const device = mockDevices.get(req.params.deviceId);
  if (!device) {
    return res.status(404).json({ error: '设备未找到' });
  }
  res.json(device);
});

// 获取设备历史位置数据
app.get('/api/devices/:deviceId/history', (req, res) => {
  const device = mockDevices.get(req.params.deviceId);
  if (!device) {
    return res.status(404).json({ error: '设备未找到' });
  }
  
  const { startTime, endTime, limit = 100 } = req.query;
  let locations = device.locations;
  
  // 时间过滤
  if (startTime || endTime) {
    locations = locations.filter(loc => {
      if (startTime && loc.timestamp < parseInt(startTime)) return false;
      if (endTime && loc.timestamp > parseInt(endTime)) return false;
      return true;
    });
  }
  
  // 限制数量
  if (limit) {
    locations = locations.slice(-parseInt(limit));
  }
  
  res.json({
    deviceId: req.params.deviceId,
    locations,
    total: locations.length
  });
});

// WebSocket连接处理
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);
  
  // 发送初始设备数据
  socket.emit('initial_data', {
    devices: Array.from(mockDevices.values())
  });
  
  // 处理历史数据请求
  socket.on('request_historical_data', (data) => {
    const { deviceId, startTime, endTime } = data;
    const device = mockDevices.get(deviceId);
    
    if (device) {
      let locations = device.locations;
      
      // 时间过滤
      if (startTime || endTime) {
        locations = locations.filter(loc => {
          if (startTime && loc.timestamp < startTime) return false;
          if (endTime && loc.timestamp > endTime) return false;
          return true;
        });
      }
      
      socket.emit('message', {
        type: 'historical_data',
        data: {
          deviceId,
          locations
        }
      });
    }
  });
  
  // 处理设备命令
  socket.on('device_command', (data) => {
    const { deviceId, command, params } = data;
    console.log(`收到设备命令: ${deviceId} - ${command}`, params);
    
    // 模拟命令执行结果
    socket.emit('message', {
      type: 'command_result',
      data: {
        deviceId,
        command,
        success: true,
        message: '命令执行成功',
        timestamp: Date.now()
      }
    });
  });
  
  socket.on('disconnect', () => {
    console.log('客户端已断开连接:', socket.id);
  });
});

// 模拟实时数据更新
function simulateRealTimeData() {
  setInterval(() => {
    mockDevices.forEach((device, deviceId) => {
      // 随机更新设备位置
      if (Math.random() < 0.3) { // 30%概率更新
        const lastLocation = device.locations[device.locations.length - 1];
        const newLocation = {
          lat: lastLocation.lat + (Math.random() - 0.5) * 0.001,
          lng: lastLocation.lng + (Math.random() - 0.5) * 0.001,
          timestamp: Date.now(),
          speed: Math.random() * 60,
          heading: Math.random() * 360
        };
        
        device.locations.push(newLocation);
        
        // 保持最近100个位置点
        if (device.locations.length > 100) {
          device.locations = device.locations.slice(-100);
        }
        
        device.lastUpdate = Date.now();
        
        // 广播位置更新
        io.emit('message', {
          type: 'device_location_update',
          data: {
            deviceId,
            location: newLocation,
            timestamp: newLocation.timestamp,
            device
          }
        });
      }
      
      // 随机更新设备状态
      if (Math.random() < 0.05) { // 5%概率更新状态
        const statuses = ['online', 'offline', 'warning'];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        if (device.status !== newStatus) {
          device.status = newStatus;
          device.lastUpdate = Date.now();
          
          // 广播状态更新
          io.emit('message', {
            type: 'device_status_update',
            data: {
              deviceId,
              status: newStatus,
              timestamp: Date.now(),
              device
            }
          });
        }
      }
    });
  }, 5000); // 每5秒检查一次
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '内部服务器错误' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口未找到' });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📍 API地址: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket地址: ws://localhost:${PORT}`);
  
  // 初始化模拟数据
  initializeMockDevices();
  
  // 开始模拟实时数据
  simulateRealTimeData();
  
  console.log('✅ 模拟设备数据已初始化');
  console.log(`📊 模拟设备数量: ${mockDevices.size}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});