// 火星坐标系(GCJ-02)转地球坐标系(WGS-84)
function gcj02towgs84(lng, lat) {
    if (outOfChina(lng, lat)) {
        return [lng, lat];
    }
    let dlat = transformlat(lng - 105.0, lat - 35.0);
    let dlng = transformlng(lng - 105.0, lat - 35.0);
    let radlat = lat / 180.0 * Math.PI;
    let magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    let sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * Math.PI);
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * Math.PI);
    let mglat = lat + dlat;
    let mglng = lng + dlng;
    return [lng * 2 - mglng, lat * 2 - mglat];
}

// 判断是否在中国境内
function outOfChina(lng, lat) {
    return (lng < 72.004 || lng > 137.8347) || ((lat < 0.8293 || lat > 55.8271));
}

function transformlat(lng, lat) {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 
              0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformlng(lng, lat) {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 
              0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
}

const a = 6378245.0;
const ee = 0.00669342162296594323;

// 监听地图移动事件
// 在文件开头添加
let enabled = true;

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'toggleEnabled') {
        enabled = request.enabled;
        chrome.runtime.sendMessage({
            action: 'updateBadge',
            enabled: enabled
        });
    }
});

// 修改init函数
// ... 保持现有函数不变 ...

// 添加 WGS84 到 GCJ02 的转换函数
function wgs84togcj02(lng, lat) {
    if (outOfChina(lng, lat)) {
        return [lng, lat];
    }
    let dlat = transformlat(lng - 105.0, lat - 35.0);
    let dlng = transformlng(lng - 105.0, lat - 35.0);
    let radlat = lat / 180.0 * Math.PI;
    let magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    let sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * Math.PI);
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * Math.PI);
    return [lng + dlng, lat + dlat];
}

// 修改 init 函数中的日志输出
// 将 processMapTiles 函数移到全局作用域
function processMapTiles() {
    if (!enabled) return;
    
    const elements = document.querySelectorAll('img[src*="maps.googleapis.com"]');
    console.log('搜索到的图片元素数量:', elements.length);
    
    elements.forEach(img => {
        console.log('检查图片URL:', img.src);
            
            if (!img.dataset.processed && img.src.includes('maps.googleapis.com')) {
                try {
                    const url = new URL(img.src);
                    console.log('处理URL:', url.toString());
                    
                    // 获取瓦片参数
                    const params = url.searchParams;
                    const x = parseInt(params.get('x'));
                    const y = parseInt(params.get('y'));
                    const z = parseInt(params.get('z'));
                    
                    console.log('瓦片参数:', { x, y, z });
                    
                    if (isNaN(x) || isNaN(y) || isNaN(z)) {
                        console.log('跳过非地图瓦片');
                        return;
                    }
                    
                    // 删除重复的变量声明
                    // const x = parseInt(url.searchParams.get('x'));
                    // const y = parseInt(url.searchParams.get('y'));
                    // const z = parseInt(url.searchParams.get('z'));
                    
                    // 计算瓦片坐标对应的经纬度
                    const lng = (x / Math.pow(2, z) * 360 - 180);
                    const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * y / Math.pow(2, z)))) * 180 / Math.PI);
                    
                    if (!outOfChina(lng, lat)) {
                        const [gcjLng, gcjLat] = wgs84togcj02(lng, lat);
                        const offsetLng = gcjLng - lng;
                        const offsetLat = gcjLat - lat;
                        const correctedLng = lng - offsetLng;
                        const correctedLat = lat - offsetLat;
                        
                        const newX = Math.floor((correctedLng + 180) / 360 * Math.pow(2, z));
                        const newY = Math.floor((1 - Math.log(Math.tan(correctedLat * Math.PI / 180) + 1 / Math.cos(correctedLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
                        
                        console.log('坐标修正:', {
                            original: {lng, lat},
                            gcj02: {lng: gcjLng, lat: gcjLat},
                            corrected: {lng: correctedLng, lat: correctedLat},
                            offset: {lng: offsetLng, lat: offsetLat},
                            tile: {oldX: x, oldY: y, newX, newY}
                        });
                        
                        if (newX !== x || newY !== y) {
                            const newUrl = new URL(img.src);
                            newUrl.searchParams.set('x', newX);
                            newUrl.searchParams.set('y', newY);
                            
                            // 使用新的图片对象预加载
                            const newImg = new Image();
                            newImg.onload = function() {
                                img.src = newUrl.toString();
                            };
                            newImg.src = newUrl.toString();
                        }
                    }
                    img.dataset.processed = 'true';
                } catch (error) {
                    console.error('处理瓦片时出错:', error, img.src);
                }
            }
        });
}

function init() {
    console.log('Google Maps China Fix 插件开始初始化');

    // 从存储中读取状态并通知 background
    chrome.storage.local.get(['enabled'], function(result) {
        enabled = result.enabled !== false;
        chrome.runtime.sendMessage({
            action: 'updateBadge',
            enabled: enabled
        });
        
        // 确保状态更新后再开始处理
        startObserver();
    });
}

    // 修改观察策略
    function startObserver() {
        // 观察整个文档
        const observer = new MutationObserver((mutations) => {
            const shouldProcess = mutations.some(mutation => {
                return mutation.addedNodes.length > 0 || 
                       (mutation.type === 'attributes' && 
                        (mutation.target.tagName === 'IMG' || 
                         mutation.target.tagName === 'CANVAS'));
            });
            
            if (shouldProcess) {
                processMapTiles();
            }
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'style']
        });

        // 初始处理
        processMapTiles();
        
        // 监听地图事件
        window.addEventListener('scroll', processMapTiles);
        window.addEventListener('resize', processMapTiles);
        window.addEventListener('zoom', processMapTiles);
    }

    // 立即启动观察器
    startObserver();

// 修改 processMapTiles 函数
function processMapTiles() {
    if (!enabled) return;
    
    // 使用更精确的选择器
    const elements = document.querySelectorAll('img[src*="maps.googleapis.com/maps/vt"], img[src*="khms"]');
    console.log('搜索到的地图瓦片数量:', elements.length);
    
    elements.forEach(img => {
        if (!img.dataset.processed && img.src) {
            try {
                const url = new URL(img.src);
                const params = url.searchParams;
                const x = parseInt(params.get('x'));
                const y = parseInt(params.get('y'));
                const z = parseInt(params.get('z'));
                
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                    return;
                }
                
                // 计算瓦片坐标对应的经纬度
                const lng = (x / Math.pow(2, z) * 360 - 180);
                const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * y / Math.pow(2, z)))) * 180 / Math.PI);
                
                if (!outOfChina(lng, lat)) {
                    // 使用 wgs84togcj02 进行正向转换
                    const [gcjLng, gcjLat] = wgs84togcj02(lng, lat);
                    
                    // 计算偏移量
                    const offsetLng = gcjLng - lng;
                    const offsetLat = gcjLat - lat;
                    
                    // 应用反向偏移
                    const correctedLng = lng - offsetLng;
                    const correctedLat = lat - offsetLat;
                    
                    // 计算新的瓦片坐标
                    const newX = Math.floor((correctedLng + 180) / 360 * Math.pow(2, z));
                    const newY = Math.floor((1 - Math.log(Math.tan(correctedLat * Math.PI / 180) + 1 / Math.cos(correctedLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
                    
                    if (newX !== x || newY !== y) {
                        console.log('修正瓦片:', {
                            from: {x, y},
                            to: {newX, newY},
                            coords: {
                                original: {lng, lat},
                                corrected: {lng: correctedLng, lat: correctedLat}
                            }
                        });
                        
                        const newUrl = new URL(img.src);
                        newUrl.searchParams.set('x', newX);
                        newUrl.searchParams.set('y', newY);
                        
                        // 使用新的图片对象预加载
                        const newImg = new Image();
                        newImg.onload = function() {
                            img.src = newUrl.toString();
                        };
                        newImg.src = newUrl.toString();
                    }
                }
                img.dataset.processed = 'true';
            } catch (error) {
                console.error('处理瓦片时出错:', error);
            }
        }
    });
}

// 当页面加载完成后开始执行
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}