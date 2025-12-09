window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug

// 缩放比例常量
const ZOOM_LEVEL = 0.50;

// 1. 页面启动时设置缩放比例为75%
const setDefaultZoom = () => {
    console.log('Setting default zoom to 75%');
    
    // 方案：使用iframe包裹整个页面内容并缩放iframe
    // 这种方法可以保持页面内容的原始坐标系统，避免滑块交互问题
    
    // 检查是否已经有缩放iframe
    if (document.getElementById('zoom-iframe')) {
        console.log('Zoom iframe already exists');
        return;
    }
    
    // 创建一个包含当前页面内容的新文档
    const newDoc = document.implementation.createHTMLDocument('Zoomed Page');
    
    // 复制当前页面的所有内容
    newDoc.documentElement.innerHTML = document.documentElement.innerHTML;
    
    // 创建iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'zoom-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.zIndex = '9999';
    iframe.style.background = 'white';
    
    // 设置iframe的缩放 - 确保全屏显示
    iframe.style.transform = `scale(${ZOOM_LEVEL})`;
    iframe.style.transformOrigin = 'top left';
    
    // 确保iframe占满整个视口
    iframe.style.width = `${100 / ZOOM_LEVEL}vw`;
    iframe.style.height = `${100 / ZOOM_LEVEL}vh`;
    
    // 移除可能存在的滚动条
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    // 重置margin和padding
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    
    // 清空当前页面内容
    document.body.innerHTML = '';
    
    // 添加iframe到页面
    document.body.appendChild(iframe);
    
    // 将新文档加载到iframe中
    iframe.contentDocument.open();
    iframe.contentDocument.write(newDoc.documentElement.outerHTML);
    iframe.contentDocument.close();
    
    // 等待iframe加载完成后处理链接
    iframe.onload = () => {
        console.log('Zoom iframe loaded');
        
        // 在iframe中重新应用链接处理功能
        const iframeDoc = iframe.contentDocument;
        
        // 复制hookClick函数到iframe
        iframe.contentWindow.hookClick = (e) => {
            const origin = e.target.closest('a');
            const isBaseTargetBlank = iframeDoc.querySelector(
                'head base[target="_blank"]'
            );
            console.log('origin', origin, isBaseTargetBlank);
            if (
                (origin && origin.href && origin.target === '_blank') ||
                (origin && origin.href && isBaseTargetBlank)
            ) {
                e.preventDefault();
                console.log('handle origin', origin);
                iframe.contentWindow.location.href = origin.href;
            } else {
                console.log('not handle origin', origin);
            }
        };
        
        // 添加点击事件监听器
        iframeDoc.addEventListener('click', iframe.contentWindow.hookClick, { capture: true });
        
        // 重写iframe的window.open方法
        iframe.contentWindow.open = function (url, target, features) {
            console.log('iframe open', url, target, features);
            iframe.contentWindow.location.href = url;
        };
    };
    
    // 监听窗口大小变化，确保iframe仍能正确全屏显示
    window.addEventListener('resize', () => {
        console.log('Window resized, updating iframe size');
        iframe.style.width = `${100 / ZOOM_LEVEL}vw`;
        iframe.style.height = `${100 / ZOOM_LEVEL}vh`;
    });
    
    console.log('Zoom iframe applied successfully');
}

// 2. 链接点击事件处理函数
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    console.log('origin', origin, isBaseTargetBlank)
    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}

// 3. 重写window.open方法
window.open = function (url, target, features) {
    console.log('open', url, target, features)
    location.href = url
}



// 4. 事件监听器设置
// 设置页面加载完成后执行缩放
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setDefaultZoom)
} else {
    setDefaultZoom()
}

// 4. 增强的滑块交互修复（针对iframe环境）
const fixZoomedControls = () => {
    console.log('Fixing zoomed controls');
    
    // 获取主页面和iframe中的滑块元素
    const sliderElements = document.querySelectorAll('input[type="range"], .slider, .range-slider');
    
    // 为每个滑块添加正确的事件处理
    sliderElements.forEach(slider => {
        // 标记是否正在拖拽
        let isDragging = false;
        
        // 移除可能存在的旧监听器
        slider.onmousedown = null;
        slider.onmousemove = null;
        slider.onmouseup = null;
        slider.ontouchstart = null;
        slider.ontouchmove = null;
        slider.ontouchend = null;
        
        // 鼠标事件
        slider.addEventListener('mousedown', (e) => {
            isDragging = true;
            slider.classList.add('dragging');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // 计算滑块位置 - 在iframe环境下，使用原始坐标系统
            const rect = slider.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            const min = parseFloat(slider.min || 0);
            const max = parseFloat(slider.max || 100);
            const value = min + (percentage * (max - min));
            
            // 设置滑块值
            slider.value = Math.max(min, Math.min(max, value));
            
            // 触发input事件
            slider.dispatchEvent(new Event('input'));
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                slider.classList.remove('dragging');
                // 触发change事件
                slider.dispatchEvent(new Event('change'));
            }
        });
        
        // 触摸事件
        slider.addEventListener('touchstart', (e) => {
            isDragging = true;
            slider.classList.add('dragging');
            e.preventDefault();
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const touch = e.touches[0];
            // 计算滑块位置 - 在iframe环境下，使用原始坐标系统
            const rect = slider.getBoundingClientRect();
            const percentage = (touch.clientX - rect.left) / rect.width;
            const min = parseFloat(slider.min || 0);
            const max = parseFloat(slider.max || 100);
            const value = min + (percentage * (max - min));
            
            // 设置滑块值
            slider.value = Math.max(min, Math.min(max, value));
            
            // 触发input事件
            slider.dispatchEvent(new Event('input'));
            
            e.preventDefault();
        });
        
        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                slider.classList.remove('dragging');
                // 触发change事件
                slider.dispatchEvent(new Event('change'));
            }
        });
    });
    
    // 同时处理iframe内部的滑块
    const iframe = document.getElementById('zoom-iframe');
    if (iframe && iframe.contentDocument) {
        console.log('Fixing controls inside iframe');
        const iframeDoc = iframe.contentDocument;
        const iframeSliders = iframeDoc.querySelectorAll('input[type="range"], .slider, .range-slider');
        
        iframeSliders.forEach(slider => {
            // 标记是否正在拖拽
            let isDragging = false;
            
            // 移除可能存在的旧监听器
            slider.onmousedown = null;
            slider.onmousemove = null;
            slider.onmouseup = null;
            slider.ontouchstart = null;
            slider.ontouchmove = null;
            slider.ontouchend = null;
            
            // 鼠标事件
            slider.addEventListener('mousedown', (e) => {
                isDragging = true;
                slider.classList.add('dragging');
            });
            
            iframeDoc.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                // 计算滑块位置 - 在iframe内部，使用原始坐标系统
                const rect = slider.getBoundingClientRect();
                const percentage = (e.clientX - rect.left) / rect.width;
                const min = parseFloat(slider.min || 0);
                const max = parseFloat(slider.max || 100);
                const value = min + (percentage * (max - min));
                
                // 设置滑块值
                slider.value = Math.max(min, Math.min(max, value));
                
                // 触发input事件
                slider.dispatchEvent(new Event('input'));
            });
            
            iframeDoc.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    slider.classList.remove('dragging');
                    // 触发change事件
                    slider.dispatchEvent(new Event('change'));
                }
            });
            
            // 触摸事件
            slider.addEventListener('touchstart', (e) => {
                isDragging = true;
                slider.classList.add('dragging');
                e.preventDefault();
            });
            
            iframeDoc.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                const touch = e.touches[0];
                // 计算滑块位置 - 在iframe内部，使用原始坐标系统
                const rect = slider.getBoundingClientRect();
                const percentage = (touch.clientX - rect.left) / rect.width;
                const min = parseFloat(slider.min || 0);
                const max = parseFloat(slider.max || 100);
                const value = min + (percentage * (max - min));
                
                // 设置滑块值
                slider.value = Math.max(min, Math.min(max, value));
                
                // 触发input事件
                slider.dispatchEvent(new Event('input'));
                
                e.preventDefault();
            });
            
            iframeDoc.addEventListener('touchend', () => {
                if (isDragging) {
                    isDragging = false;
                    slider.classList.remove('dragging');
                    // 触发change事件
                    slider.dispatchEvent(new Event('change'));
                }
            });
        });
    }
}

// 添加点击事件监听器
document.addEventListener('click', hookClick, { capture: true });

// 页面加载完成后修复控件交互问题
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 等待缩放完成后再修复控件
        setTimeout(fixZoomedControls, 200);
    });
} else {
    setTimeout(fixZoomedControls, 200);
}