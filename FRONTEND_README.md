# LBS IoT 前端应用 - 高德地图集成

基于React和高德地图API的物联网设备位置可视化前端应用。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量示例文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，配置高德地图API密钥：
```env
# 高德地图API配置
REACT_APP_AMAP_API_KEY=your_amap_api_key_here
REACT_APP_AMAP_SECURITY_CODE=your_amap_security_code_here

# API服务配置
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000

# MQTT配置
REACT_APP_MQTT_BROKER=ws://localhost:8083/mqtt
```

### 3. 获取高德地图API密钥

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并登录账号
3. 创建应用，选择「Web端(JS API)」
4. 获取API Key和安全密钥
5. 将密钥配置到 `.env` 文件中

### 4. 启动开发服务器

#### 方式一：同时启动前后端
```bash
npm run dev:all
```

#### 方式二：分别启动
```bash
# 启动后端API服务器 (端口3000)
npm run dev:backend

# 启动前端开发服务器 (端口3001)
npm run dev:frontend
```

### 5. 访问应用

- 前端应用: http://localhost:3001
- 后端API: http://localhost:3000/api

## 📁 项目结构

```
src/frontend/
├── components/          # React组件
│   └── AmapComponent.jsx   # 高德地图组件
├── services/           # 服务层
│   ├── AmapService.js     # 高德地图服务
│   ├── ConfigService.js   # 配置服务
│   └── IoTDataService.js  # IoT数据服务
├── pages/              # 页面组件
│   └── MapPage.jsx        # 地图主页面
├── utils/              # 工具函数
├── assets/             # 静态资源
├── public/             # 公共文件
│   └── index.html         # HTML模板
├── App.jsx             # 主应用组件
├── App.css             # 应用样式
├── index.js            # 应用入口
└── index.css           # 基础样式
```

## 🗺️ 功能特性

### 地图功能
- ✅ 高德地图初始化和显示
- ✅ 设备位置标记显示
- ✅ 时间序列轨迹绘制
- ✅ 地图控件（缩放、工具栏）
- ✅ 信息窗口显示设备详情
- ✅ 地理编码和逆地理编码
- ✅ POI搜索功能

### IoT数据功能
- ✅ 实时设备位置更新
- ✅ 设备状态监控
- ✅ 历史轨迹查询
- ✅ WebSocket实时通信
- ✅ MQTT消息处理（模拟）
- ✅ 设备列表管理

### 用户界面
- ✅ 响应式设计
- ✅ 设备面板侧边栏
- ✅ 实时连接状态显示
- ✅ 时间范围选择
- ✅ 设备筛选和搜索
- ✅ 工具栏操作

## 🔧 开发命令

```bash
# 安装依赖
npm install

# 开发模式（前后端同时启动）
npm run dev:all

# 仅启动前端开发服务器
npm run dev:frontend

# 仅启动后端服务器
npm run dev:backend

# 构建生产版本
npm run build:frontend

# 运行测试
npm run test:frontend

# 代码检查
npm run lint

# 代码格式化
npm run lint:fix

# 清理构建文件
npm run clean
```

## 🌐 API接口

### 配置接口
- `GET /api/config` - 获取应用配置

### 设备接口
- `GET /api/devices` - 获取所有设备
- `GET /api/devices/:deviceId` - 获取特定设备信息
- `GET /api/devices/:deviceId/history` - 获取设备历史位置

### WebSocket事件
- `device_location_update` - 设备位置更新
- `device_status_update` - 设备状态更新
- `historical_data` - 历史数据响应
- `system_alert` - 系统告警

## 📱 使用说明

### 1. 查看设备列表
- 左侧面板显示所有在线设备
- 设备状态用颜色区分（绿色=在线，红色=离线，黄色=告警）
- 显示设备位置点数量和最后更新时间

### 2. 查看设备轨迹
- 点击设备列表中的设备
- 地图上会显示该设备的历史轨迹
- 可以选择不同的时间范围（1小时、6小时、24小时、7天）

### 3. 地图操作
- 鼠标滚轮缩放地图
- 拖拽移动地图视角
- 点击设备标记查看详细信息
- 使用工具栏按钮控制显示

### 4. 实时监控
- 设备位置会实时更新
- 连接状态显示在设备面板顶部
- 新的位置点会自动添加到轨迹中

## 🔧 配置说明

### 高德地图配置
```javascript
{
  api_key: 'your_api_key',           // API密钥
  security_js_code: 'your_code',     // 安全密钥
  version: '2.0',                    // API版本
  plugins: [...],                    // 插件列表
  default_center: { lng, lat },      // 默认中心点
  default_zoom: 12,                  // 默认缩放级别
  map_style: 'amap://styles/normal', // 地图样式
  view_mode: '3D'                    // 视图模式
}
```

### WebSocket配置
```javascript
{
  url: 'ws://localhost:3000',        // WebSocket地址
  reconnect_interval: 5000,          // 重连间隔
  max_reconnect_attempts: 10         // 最大重连次数
}
```

## 🐛 故障排除

### 1. 地图无法加载
- 检查API密钥是否正确配置
- 确认网络连接正常
- 查看浏览器控制台错误信息

### 2. 设备数据不显示
- 确认后端服务器正在运行
- 检查WebSocket连接状态
- 查看网络请求是否成功

### 3. 构建失败
- 删除 `node_modules` 文件夹
- 重新运行 `npm install`
- 检查Node.js版本是否符合要求

## 📋 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 现代浏览器（Chrome, Firefox, Safari, Edge）

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到问题或有疑问，请：

1. 查看本文档的故障排除部分
2. 搜索现有的 [Issues](https://github.com/your-repo/issues)
3. 创建新的 Issue 描述您的问题

## 🔗 相关链接

- [高德地图开放平台](https://lbs.amap.com/)
- [高德地图JS API文档](https://lbs.amap.com/api/jsapi-v2/summary)
- [React官方文档](https://reactjs.org/)
- [Socket.IO文档](https://socket.io/docs/)