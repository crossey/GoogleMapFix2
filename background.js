// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  // 设置初始状态
  chrome.storage.local.set({ enabled: true });
});

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge') {
    // 更新扩展图标的状态
    chrome.action.setBadgeText({
      text: request.enabled ? 'ON' : 'OFF',
      tabId: sender.tab.id
    });
    chrome.action.setBadgeBackgroundColor({
      color: request.enabled ? '#4CAF50' : '#F44336',
      tabId: sender.tab.id
    });
  }
});

// 确保 Service Worker 保持活跃
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
keepAlive();

// 初始化状态
chrome.storage.local.get(['enabled'], function(result) {
  const enabled = result.enabled !== false;
  if (enabled) {
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });  // 使用绿色背景
    chrome.action.setBadgeText({ text: ' ' });  // 使用空格而不是点
  }
});