document.addEventListener('DOMContentLoaded', function() {
    const enableSwitch = document.getElementById('enableSwitch');
    
    // 从存储中读取状态
    chrome.storage.local.get(['enabled'], function(result) {
        enableSwitch.checked = result.enabled !== false;
        updateStatus(enableSwitch.checked);
    });

    // 监听开关变化
    enableSwitch.addEventListener('change', function() {
        const enabled = this.checked;
        chrome.storage.local.set({enabled: enabled});
        updateStatus(enabled);
        
        // 更新图标状态
        chrome.runtime.sendMessage({
            action: 'updateBadge',
            enabled: enabled
        });
        
        // 通知content script状态变化
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0].url.includes('google.com/maps')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleEnabled',
                    enabled: enabled
                });
            }
        });
    });

    function updateStatus(enabled) {
        const status = document.getElementById('status');
        if (enabled) {
            status.textContent = '插件已启用';
            status.className = 'status active';
        } else {
            status.textContent = '插件已禁用';
            status.className = 'status inactive';
        }
    }
});