# Google Maps China Fix

这是一个 Chrome 扩展，用于修正 Google Maps 在中国区域的地图偏移问题。

## 功能特性

- 自动检测并修正中国区域的地图瓦片偏移
- 支持实时切换开启/关闭状态
- 支持地图缩放和平移操作

## 安装使用

1. 下载本项目代码
2. 在 Chrome 浏览器中打开 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"，选择项目目录

## 技术实现

本扩展使用 GCJ-02 到 WGS-84 的坐标转换算法，实时处理 Google Maps 的地图瓦片请求，确保中国区域的地图显示准确。