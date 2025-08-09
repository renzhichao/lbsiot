import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MapPage from './pages/MapPage';
import './App.css';

/**
 * 主应用组件
 * 配置路由和全局布局
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 默认路由重定向到地图页面 */}
          <Route path="/" element={<Navigate to="/map" replace />} />
          
          {/* 地图页面路由 */}
          <Route path="/map" element={<MapPage />} />
          
          {/* 404页面 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

/**
 * 404页面组件
 */
const NotFoundPage = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', margin: '0', color: '#ff4d4f' }}>404</h1>
      <p style={{ fontSize: '18px', margin: '16px 0', color: '#666' }}>页面未找到</p>
      <a 
        href="/map" 
        style={{
          padding: '12px 24px',
          backgroundColor: '#1890ff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        返回地图页面
      </a>
    </div>
  );
};

export default App;