import React, { useEffect, useRef, useState, useCallback } from 'react';
import AmapService from '../services/AmapService';

/**
 * 高德地图组件
 * 支持标记点显示、时间序列路径绘制、POI搜索等功能
 */
const AmapComponent = ({
  config,
  markers = [],
  paths = [],
  onMapReady,
  onMarkerClick,
  onMapClick,
  className = '',
  style = { width: '100%', height: '400px' }
}) => {
  const mapContainerRef = useRef(null);
  const amapServiceRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化地图
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // 创建地图服务实例
        amapServiceRef.current = new AmapService(config);
        
        // 初始化地图
        await amapServiceRef.current.initMap(mapContainerRef.current);
        
        // 添加地图点击事件
        if (onMapClick) {
          amapServiceRef.current.getMap().on('click', (e) => {
            onMapClick({
              lng: e.lnglat.lng,
              lat: e.lnglat.lat
            });
          });
        }

        setIsMapReady(true);
        setLoading(false);
        
        // 通知父组件地图已准备就绪
        if (onMapReady) {
          onMapReady(amapServiceRef.current);
        }
      } catch (err) {
        console.error('地图初始化失败:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (mapContainerRef.current && config) {
      initializeMap();
    }

    // 清理函数
    return () => {
      if (amapServiceRef.current) {
        amapServiceRef.current.destroy();
      }
    };
  }, [config, onMapReady, onMapClick]);

  // 处理标记点变化
  useEffect(() => {
    if (!isMapReady || !amapServiceRef.current) return;

    const amapService = amapServiceRef.current;
    
    // 清除现有标记
    amapService.markers.forEach((marker, id) => {
      amapService.removeMarker(id);
    });

    // 添加新标记
    markers.forEach((marker, index) => {
      const markerId = marker.id || `marker_${index}`;
      const markerInstance = amapService.addMarker(markerId, marker.position, {
        title: marker.title,
        icon: marker.icon,
        infoWindow: marker.infoWindow ? {
          content: marker.infoWindow
        } : null
      });

      // 添加点击事件
      if (onMarkerClick) {
        markerInstance.on('click', () => {
          onMarkerClick(marker, markerId);
        });
      }
    });
  }, [markers, isMapReady, onMarkerClick]);

  // 处理路径变化
  useEffect(() => {
    if (!isMapReady || !amapServiceRef.current) return;

    const amapService = amapServiceRef.current;
    
    // 清除现有路径
    amapService.polylines.forEach((polyline, id) => {
      amapService.removePath(id);
    });

    // 添加新路径
    paths.forEach((path, index) => {
      const pathId = path.id || `path_${index}`;
      amapService.drawTimeSeriesPath(pathId, path.coordinates, {
        strokeColor: path.color || '#3366FF',
        strokeWeight: path.weight || 6,
        strokeOpacity: path.opacity || 0.8,
        showDirection: path.showDirection !== false,
        fitView: path.fitView !== false && index === 0 // 只有第一条路径自动调整视野
      });
    });
  }, [paths, isMapReady]);

  // 获取地图服务实例
  const getAmapService = useCallback(() => {
    return amapServiceRef.current;
  }, []);

  // 添加标记点的方法
  const addMarker = useCallback((position, options = {}) => {
    if (!amapServiceRef.current) return null;
    const id = options.id || `marker_${Date.now()}`;
    return amapServiceRef.current.addMarker(id, position, options);
  }, []);

  // 绘制路径的方法
  const drawPath = useCallback((coordinates, options = {}) => {
    if (!amapServiceRef.current) return null;
    const id = options.id || `path_${Date.now()}`;
    return amapServiceRef.current.drawTimeSeriesPath(id, coordinates, options);
  }, []);

  // 清除所有覆盖物
  const clearAll = useCallback(() => {
    if (amapServiceRef.current) {
      amapServiceRef.current.clearAll();
    }
  }, []);

  // 地理编码
  const geocode = useCallback(async (address) => {
    if (!amapServiceRef.current) throw new Error('地图未初始化');
    return await amapServiceRef.current.geocode(address);
  }, []);

  // 逆地理编码
  const reverseGeocode = useCallback(async (position) => {
    if (!amapServiceRef.current) throw new Error('地图未初始化');
    return await amapServiceRef.current.reverseGeocode(position);
  }, []);

  // POI搜索
  const searchPOI = useCallback(async (keyword, options = {}) => {
    if (!amapServiceRef.current) throw new Error('地图未初始化');
    return await amapServiceRef.current.searchPOI(keyword, options);
  }, []);

  // 暴露方法给父组件 (通过props传递，不使用ref)
  // React.useImperativeHandle应该在forwardRef组件中使用

  if (error) {
    return (
      <div className={`amap-error ${className}`} style={style}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          color: '#ff4d4f',
          fontSize: '14px'
        }}>
          <div style={{ marginBottom: '8px' }}>⚠️ 地图加载失败</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`amap-container ${className}`} style={{ position: 'relative', ...style }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1000,
          fontSize: '14px',
          color: '#666'
        }}>
          <div>
            <div style={{ marginBottom: '8px' }}>🗺️ 正在加载地图...</div>
            <div style={{ fontSize: '12px' }}>请稍候</div>
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: loading ? 0.3 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
};

export default AmapComponent;