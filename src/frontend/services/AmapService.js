/**
 * 高德地图服务类
 * 提供地图初始化、标记管理、路径绘制等功能
 */
class AmapService {
  constructor(config) {
    this.config = config;
    this.map = null;
    this.markers = new Map();
    this.polylines = new Map();
    this.isLoaded = false;
  }

  /**
   * 加载高德地图API
   */
  async loadAmapAPI() {
    return new Promise((resolve, reject) => {
      if (window.AMap) {
        this.isLoaded = true;
        resolve();
        return;
      }

      // 设置安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: this.config.security_js_code,
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://webapi.amap.com/maps?v=${this.config.version}&key=${this.config.api_key}&plugin=${this.config.plugins.join(',')}`;
      
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('高德地图API加载失败'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * 初始化地图
   */
  async initMap(containerId) {
    if (!this.isLoaded) {
      await this.loadAmapAPI();
    }

    this.map = new AMap.Map(containerId, {
      zoom: this.config.default_zoom,
      center: [this.config.default_center.lng, this.config.default_center.lat],
      mapStyle: this.config.map_style,
      viewMode: this.config.view_mode,
      features: ['bg', 'road', 'building', 'point'],
      showLabel: true
    });

    // 添加地图控件
    this.map.addControl(new AMap.Scale());
    this.map.addControl(new AMap.ToolBar());

    return this.map;
  }

  /**
   * 添加标记点
   */
  addMarker(id, position, options = {}) {
    if (!this.map) {
      throw new Error('地图未初始化');
    }

    const marker = new AMap.Marker({
      position: [position.lng, position.lat],
      title: options.title || '',
      icon: options.icon || undefined,
      offset: options.offset || new AMap.Pixel(-13, -30)
    });

    // 添加信息窗体
    if (options.infoWindow) {
      const infoWindow = new AMap.InfoWindow({
        content: options.infoWindow.content,
        offset: new AMap.Pixel(0, -30)
      });

      marker.on('click', () => {
        infoWindow.open(this.map, marker.getPosition());
      });
    }

    this.map.add(marker);
    this.markers.set(id, marker);
    
    return marker;
  }

  /**
   * 移除标记点
   */
  removeMarker(id) {
    const marker = this.markers.get(id);
    if (marker) {
      this.map.remove(marker);
      this.markers.delete(id);
    }
  }

  /**
   * 绘制时间序列路径
   */
  drawTimeSeriesPath(id, coordinates, options = {}) {
    if (!this.map) {
      throw new Error('地图未初始化');
    }

    // 转换坐标格式
    const path = coordinates.map(coord => [coord.lng, coord.lat]);

    const polyline = new AMap.Polyline({
      path: path,
      strokeColor: options.strokeColor || '#3366FF',
      strokeWeight: options.strokeWeight || 6,
      strokeOpacity: options.strokeOpacity || 0.8,
      strokeStyle: options.strokeStyle || 'solid',
      showDir: options.showDirection || true
    });

    this.map.add(polyline);
    this.polylines.set(id, polyline);

    // 自动调整视野
    if (options.fitView !== false) {
      this.map.setFitView([polyline]);
    }

    return polyline;
  }

  /**
   * 移除路径
   */
  removePath(id) {
    const polyline = this.polylines.get(id);
    if (polyline) {
      this.map.remove(polyline);
      this.polylines.delete(id);
    }
  }

  /**
   * 清除所有标记和路径
   */
  clearAll() {
    // 清除所有标记
    this.markers.forEach(marker => this.map.remove(marker));
    this.markers.clear();

    // 清除所有路径
    this.polylines.forEach(polyline => this.map.remove(polyline));
    this.polylines.clear();
  }

  /**
   * 地理编码 - 地址转坐标
   */
  async geocode(address) {
    return new Promise((resolve, reject) => {
      const geocoder = new AMap.Geocoder();
      geocoder.getLocation(address, (status, result) => {
        if (status === 'complete' && result.geocodes.length) {
          const location = result.geocodes[0].location;
          resolve({
            lng: location.lng,
            lat: location.lat,
            address: result.geocodes[0].formattedAddress
          });
        } else {
          reject(new Error('地理编码失败'));
        }
      });
    });
  }

  /**
   * 逆地理编码 - 坐标转地址
   */
  async reverseGeocode(position) {
    return new Promise((resolve, reject) => {
      const geocoder = new AMap.Geocoder();
      geocoder.getAddress([position.lng, position.lat], (status, result) => {
        if (status === 'complete' && result.regeocode) {
          resolve({
            address: result.regeocode.formattedAddress,
            addressComponent: result.regeocode.addressComponent
          });
        } else {
          reject(new Error('逆地理编码失败'));
        }
      });
    });
  }

  /**
   * POI搜索
   */
  async searchPOI(keyword, options = {}) {
    return new Promise((resolve, reject) => {
      const placeSearch = new AMap.PlaceSearch({
        pageSize: options.pageSize || 10,
        pageIndex: options.pageIndex || 1,
        city: options.city || '全国',
        citylimit: options.citylimit || false
      });

      placeSearch.search(keyword, (status, result) => {
        if (status === 'complete' && result.poiList) {
          const pois = result.poiList.pois.map(poi => ({
            id: poi.id,
            name: poi.name,
            address: poi.address,
            location: {
              lng: poi.location.lng,
              lat: poi.location.lat
            },
            type: poi.type,
            tel: poi.tel
          }));
          resolve(pois);
        } else {
          reject(new Error('POI搜索失败'));
        }
      });
    });
  }

  /**
   * 获取地图实例
   */
  getMap() {
    return this.map;
  }

  /**
   * 销毁地图
   */
  destroy() {
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
    this.markers.clear();
    this.polylines.clear();
  }
}

export default AmapService;