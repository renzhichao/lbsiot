# LBS IoT 项目文档

## 文档结构

### 📁 API 文档 (`/api`)
- **地图API集成** (`/api/google-maps/`) - 地图服务集成文档（支持Google Maps及中国地图API）
- **中国地图API对比** (`/api/china-maps-comparison.md`) - 高德、百度、腾讯地图API详细对比
- **IoT端点** (`/api/iot-endpoints/`) - 物联网设备API文档
- **队列API** (`/api/queue-api/`) - 消息队列API文档

### 📁 部署文档 (`/deployment`)
- **Docker部署** (`/deployment/docker/`) - Docker容器化部署指南
- **Kubernetes部署** (`/deployment/kubernetes/`) - K8s集群部署指南
- **AWS部署** (`/deployment/aws/`) - 云服务部署指南

### 📁 IoT集成文档 (`/iot-integration`)
- **设备设置** (`/iot-integration/device-setup/`) - IoT设备配置指南
- **数据格式** (`/iot-integration/data-formats/`) - 数据格式规范
- **协议文档** (`/iot-integration/protocols/`) - 通信协议说明

### 📁 用户指南 (`/user-guide`)
- **安装指南** (`/user-guide/installation/`) - 系统安装步骤
- **配置指南** (`/user-guide/configuration/`) - 系统配置说明
- **使用指南** (`/user-guide/usage/`) - 用户操作手册

## 快速导航

### 开发者文档
- [API参考](./api/)
  - [地图API集成指南](./api/google-maps/) - 支持Google Maps及中国地图API
  - [中国地图API选择指南](./api/china-maps-comparison.md) - 高德、百度、腾讯地图对比
- [部署指南](./deployment/)
- [IoT集成](./iot-integration/)

### 用户文档
- [安装指南](./user-guide/installation/)
- [配置指南](./user-guide/configuration/)
- [使用手册](./user-guide/usage/)

### 系统架构
- [系统架构图](./architecture/)
- [数据流程图](./data-flow/)
- [组件关系图](./components/)

## 文档维护

### 更新频率
- API文档：随代码更新
- 部署文档：随环境变化
- 用户指南：随功能发布

### 贡献指南
1. 在相应目录下创建或更新文档
2. 遵循Markdown格式规范
3. 添加适当的目录和索引
4. 更新本文档索引

### 文档标准
- 使用清晰的标题结构
- 包含代码示例
- 提供截图和图表
- 保持文档的时效性