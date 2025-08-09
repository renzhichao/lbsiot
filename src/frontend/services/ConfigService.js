/**
 * 配置服务类
 * 负责加载和管理应用配置
 */
class ConfigService {
  constructor() {
    this.config = null;
    this.loaded = false;
  }

  /**
   * 加载配置文件
   */
  async loadConfig() {
    if (this.loaded) {
      return this.config;
    }

    try {
      // 从环境变量或配置文件加载配置
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error('配置加载失败');
      }
      
      this.config = await response.json();
      this.loaded = true;
      return this.config;
    } catch (error) {
      console.warn('从服务器加载配置失败，使用默认配置:', error);
      
      // 使用默认配置
      this.config = this.getDefaultConfig();
      this.loaded = true;
      return this.config;
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
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
  }

  /**
   * 获取高德地图配置
   */
  getAmapConfig() {
    if (!this.config) {
      throw new Error('配置未加载，请先调用 loadConfig()');
    }
    return this.config.amap;
  }

  /**
   * 获取API配置
   */
  getApiConfig() {
    if (!this.config) {
      throw new Error('配置未加载，请先调用 loadConfig()');
    }
    return this.config.api;
  }

  /**
   * 获取WebSocket配置
   */
  getWebSocketConfig() {
    if (!this.config) {
      throw new Error('配置未加载，请先调用 loadConfig()');
    }
    return this.config.websocket;
  }

  /**
   * 获取IoT配置
   */
  getIoTConfig() {
    if (!this.config) {
      throw new Error('配置未加载，请先调用 loadConfig()');
    }
    return this.config.iot;
  }

  /**
   * 获取完整配置
   */
  getConfig() {
    return this.config;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 验证配置
   */
  validateConfig() {
    if (!this.config) {
      return { valid: false, errors: ['配置未加载'] };
    }

    const errors = [];

    // 验证高德地图配置
    if (!this.config.amap?.api_key || this.config.amap.api_key === 'YOUR_AMAP_API_KEY') {
      errors.push('高德地图API密钥未配置');
    }

    if (!this.config.amap?.security_js_code || this.config.amap.security_js_code === 'YOUR_AMAP_SECURITY_CODE') {
      errors.push('高德地图安全密钥未配置');
    }

    // 验证API配置
    if (!this.config.api?.base_url) {
      errors.push('API基础URL未配置');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 创建单例实例
const configService = new ConfigService();

export default configService;