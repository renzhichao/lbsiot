import React, { useState, useEffect, useRef, useCallback } from 'react';
import AmapComponent from '../components/AmapComponent';
import configService from '../services/ConfigService';
import IoTDataService from '../services/IoTDataService';

/**
 * 地图主页面组件
 * 集成高德地图显示和IoT设备数据可视化
 */
const MapPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false });
  const [showDevicePanel, setShowDevicePanel] = useState(true);
  const [timeRange, setTimeRange] = useState('1h'); // 1h, 6h, 24h, 7d
  
  const amapRef = useRef(null);
  const iotServiceRef = useRef(null);

  // 初始化配置和服务
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        // 加载配置
        const loadedConfig = await configService.loadConfig();
        setConfig(loadedConfig);

        // 验证配置
        const validation = configService.validateConfig();
        if (!validation.valid) {
          console.warn('配置验证失败:', validation.errors);
        }

        // 初始化IoT数据服务
        iotServiceRef.current = new IoTDataService(loadedConfig);
        await iotServiceRef.current.initialize();

        // 添加事件监听器
        iotServiceRef.current.addEventListener('device_location_update', handleDeviceLocationUpdate);
        iotServiceRef.current.addEventListener('device_status_update', handleDeviceStatusUpdate);
        iotServiceRef.current.addEventListener('historical_data_loaded', handleHistoricalDataLoaded);
        iotServiceRef.current.addEventListener('system_alert', handleSystemAlert);

        // 更新连接状态
        setConnectionStatus(iotServiceRef.current.getConnectionStatus());
        
        setLoading(false);
      } catch (err) {
        console.error('初始化失败:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initialize();

    // 清理函数
    return () => {
      if (iotServiceRef.current) {
        iotServiceRef.current.destroy();
      }
    };
  }, []);

  // 定期更新连接状态
  useEffect(() => {
    const interval = setInterval(() => {
      if (iotServiceRef.current) {
        setConnectionStatus(iotServiceRef.current.getConnectionStatus());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 处理设备位置更新
  const handleDeviceLocationUpdate = useCallback((data) => {
    const { deviceId, location, timestamp, device } = data;
    
    setDevices(prevDevices => {
      const existingIndex = prevDevices.findIndex(d => d.id === deviceId);
      if (existingIndex >= 0) {
        const updatedDevices = [...prevDevices];
        updatedDevices[existingIndex] = device;
        return updatedDevices;
      } else {
        return [...prevDevices, device];
      }
    });

    // 如果地图已准备就绪，更新地图上的标记
    if (amapRef.current) {
      updateDeviceMarker(deviceId, location, device.status);
    }
  }, []);

  // 处理设备状态更新
  const handleDeviceStatusUpdate = useCallback((data) => {
    const { deviceId, status, device } = data;
    
    setDevices(prevDevices => 
      prevDevices.map(d => 
        d.id === deviceId ? { ...d, status } : d
      )
    );
  }, []);

  // 处理历史数据加载
  const handleHistoricalDataLoaded = useCallback((data) => {
    const { deviceId, locations, device } = data;
    
    if (amapRef.current && selectedDevice === deviceId) {
      // 绘制历史轨迹
      const coordinates = locations.map(loc => ({
        lng: loc.lng,
        lat: loc.lat,
        timestamp: loc.timestamp
      }));
      
      amapRef.current.drawPath(coordinates, {
        id: `history_${deviceId}`,
        color: '#FF6B6B',
        weight: 4,
        opacity: 0.7
      });
    }
  }, [selectedDevice]);

  // 处理系统告警
  const handleSystemAlert = useCallback((data) => {
    console.log('收到系统告警:', data);
    // 这里可以添加告警通知UI
  }, []);

  // 更新设备标记
  const updateDeviceMarker = (deviceId, location, status) => {
    if (!amapRef.current) return;

    const iconColor = getStatusColor(status);
    const markerOptions = {
      id: `device_${deviceId}`,
      title: `设备 ${deviceId}`,
      icon: createDeviceIcon(iconColor),
      infoWindow: `
        <div style="padding: 10px; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0;">设备 ${deviceId}</h4>
          <p style="margin: 4px 0;">状态: <span style="color: ${iconColor}">${getStatusText(status)}</span></p>
          <p style="margin: 4px 0;">位置: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</p>
          <p style="margin: 4px 0;">更新时间: ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    amapRef.current.addMarker(location, markerOptions);
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#52c41a';
      case 'offline': return '#ff4d4f';
      case 'warning': return '#faad14';
      default: return '#d9d9d9';
    }
  };

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'online': return '在线';
      case 'offline': return '离线';
      case 'warning': return '告警';
      default: return '未知';
    }
  };

  // 创建设备图标
  const createDeviceIcon = (color) => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `)}`;
  };

  // 处理地图准备就绪
  const handleMapReady = useCallback((amapService) => {
    amapRef.current = amapService;
    
    // 加载现有设备数据
    if (iotServiceRef.current) {
      const allDevices = iotServiceRef.current.getAllDeviceData();
      setDevices(allDevices);
      
      // 在地图上显示所有设备
      allDevices.forEach(device => {
        if (device.locations.length > 0) {
          const lastLocation = device.locations[device.locations.length - 1];
          updateDeviceMarker(device.id, lastLocation, device.status);
        }
      });
    }
  }, []);

  // 处理设备选择
  const handleDeviceSelect = (deviceId) => {
    setSelectedDevice(deviceId);
    
    if (iotServiceRef.current && amapRef.current) {
      // 清除之前的轨迹
      amapRef.current.clearAll();
      
      // 重新显示所有设备标记
      devices.forEach(device => {
        if (device.locations.length > 0) {
          const lastLocation = device.locations[device.locations.length - 1];
          updateDeviceMarker(device.id, lastLocation, device.status);
        }
      });
      
      // 请求选中设备的历史数据
      const endTime = Date.now();
      const startTime = endTime - getTimeRangeMs(timeRange);
      iotServiceRef.current.requestHistoricalData(deviceId, startTime, endTime);
    }
  };

  // 获取时间范围毫秒数
  const getTimeRangeMs = (range) => {
    switch (range) {
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '16px' }}>🚀 正在初始化系统...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>加载配置和连接服务中</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        color: '#ff4d4f'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '16px' }}>⚠️ 系统初始化失败</div>
        <div style={{ fontSize: '14px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* 设备面板 */}
      {showDevicePanel && (
        <div style={{
          width: '300px',
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #d9d9d9',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 面板头部 */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #d9d9d9',
            backgroundColor: 'white'
          }}>
            <h3 style={{ margin: '0 0 8px 0' }}>设备监控</h3>
            <div style={{ 
              fontSize: '12px', 
              color: connectionStatus.isConnected ? '#52c41a' : '#ff4d4f'
            }}>
              ● {connectionStatus.isConnected ? '已连接' : '未连接'}
            </div>
          </div>

          {/* 时间范围选择 */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>时间范围:</div>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ width: '100%', padding: '4px 8px' }}
            >
              <option value="1h">最近1小时</option>
              <option value="6h">最近6小时</option>
              <option value="24h">最近24小时</option>
              <option value="7d">最近7天</option>
            </select>
          </div>

          {/* 设备列表 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {devices.length === 0 ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#666',
                fontSize: '14px'
              }}>
                暂无设备数据
              </div>
            ) : (
              devices.map(device => (
                <div
                  key={device.id}
                  onClick={() => handleDeviceSelect(device.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e8e8e8',
                    cursor: 'pointer',
                    backgroundColor: selectedDevice === device.id ? '#e6f7ff' : 'white',
                    ':hover': { backgroundColor: '#f0f0f0' }
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>设备 {device.id}</span>
                    <span style={{ 
                      fontSize: '12px',
                      color: getStatusColor(device.status),
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(device.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    位置点: {device.locations.length}
                  </div>
                  {device.lastUpdate && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      更新: {new Date(device.lastUpdate).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 地图区域 */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* 工具栏 */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setShowDevicePanel(!showDevicePanel)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {showDevicePanel ? '隐藏面板' : '显示面板'}
          </button>
          <button
            onClick={() => amapRef.current?.clearAll()}
            style={{
              padding: '8px 12px',
              backgroundColor: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            清除轨迹
          </button>
        </div>

        {/* 高德地图组件 */}
        {config && (
          <AmapComponent
            config={config.amap}
            onMapReady={handleMapReady}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;