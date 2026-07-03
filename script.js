/**
 * Lockscreen Prediction System (LPS) - Core Engine (Debug Version)
 */

window.addEventListener('DOMContentLoaded', () => {
    // 1. Cấu hình tọa độ vùng viết chữ trên tấm bảng (đã đo đạc từ base.png)
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png', // Hãy chắc chắn file ảnh viết thường toàn bộ và nằm cùng thư mục
        targetX: 225,       
        targetY: 525,       
        targetWidth: 580,   
        targetHeight: 315,  
        padding: 25,        
        defaultFontSize: 42,
        lineHeightRatio: 1.35, 
        fontFamily: 'Arial, sans-serif' 
    };

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const loadingDiv = document.getElementById('loading');

    // Hàm hiển thị lỗi trực tiếp lên giao diện để dễ debug
    function showError(message, err) {
        console.error(message, err);
        loadingDiv.innerHTML = `<span style="color: #ff4d4d; font-weight: bold;">LỖI ENGINE:</span> ${message}<br><small style="color: #888;">${err ? err.message : ''}</small>`;
    }

    try {
        // 2. Lấy tham số "text" từ URL query
        const urlParams = new URLSearchParams(window.location.search);
        let textToRender = urlParams.get('text') || "DỰ ÁN LOCKSCREEN:\nĐã tích hợp thành công!\nSẵn sàng render nội dung tùy chỉnh.";
        textToRender = textToRender.replace(/\\n/g, '\n');

        // 3. Tiến hành tải ảnh base.png
        const baseImage = new Image();
        
        // Tránh lỗi CORS khi load ảnh trên một số môi trường vẽ Canvas
        baseImage.crossOrigin = "anonymous"; 
        baseImage.src = BOARD_CONFIG.baseImageSrc;
        
        baseImage.onload = () => {
            try {
                // Thiết lập kích thước canvas bằng chính xác kích thước ảnh gốc
                canvas.width = baseImage.width;
                canvas.height = baseImage.height;

                // Vẽ ảnh nền lên trước
                ctx.drawImage(baseImage, 0, 0);

                // Khởi chạy bộ xử lý render văn bản nâng cao
                renderTextOnBoard(ctx, textToRender, BOARD_CONFIG);

                // Xuất canvas thành ảnh PNG
                const dataUrl = canvas.toDataURL('image/png', 1.0);
                resultImage.src = dataUrl;
                resultImage.style.display = 'block';
                loadingDiv.style.display = 'none';
            } catch (renderError) {
                showError("Không thể vẽ chữ hoặc xuất ảnh từ Canvas.", renderError);
            }
        };

        baseImage.onerror = (e) => {
            showError(`Không thể tải file ảnh nguồn "${BOARD_CONFIG.baseImageSrc}". Vui lòng kiểm tra lại tên file trên GitHub xem có viết hoa/thường sai không.`, e);
        };

    } catch (globalError) {
        showError("Lỗi khởi tạo tham số hệ thống.", globalError);
    }
});

/**
 * Hàm xử lý thuật toán tự động wrap chữ, tự động co font và căn giữa
 */
function renderTextOnBoard(ctx, text, config) {
    const maxWidth = config.targetWidth - (config.padding * 2);
    const maxHeight = config.targetHeight - (config.padding * 2);
    
    let currentFontSize = config.defaultFontSize;
    let lines = [];
    let totalHeight = 0;

    while (currentFontSize > 14) {
        ctx.font = `bold ${currentFontSize}px ${config.fontFamily}`;
        lines = [];
        const rawLines = text.split('\n');

        for (let i = 0; i < rawLines.length; i++) {
            const words = rawLines[i].split(' ');
            let currentLine = '';

            for (let j = 0; j < words.length; j++) {
                let testLine = currentLine + (currentLine ? ' ' : '') + words[j];
                let metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth) {
                    if (currentLine === '') {
                        currentLine = testLine;
                        lines.push(currentLine);
                        currentLine = '';
                    } else {
                        lines.push(currentLine);
                        currentLine = words[j];
                    }
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
        }

        totalHeight = lines.length * currentFontSize * config.lineHeightRatio;

        if (totalHeight > maxHeight) {
            currentFontSize -= 2; 
        } else {
            break; 
        }
    }

    ctx.font = `bold ${currentFontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1c1c1e'; 

    const startY = config.targetY + config.padding + (maxHeight - totalHeight) / 2 + (currentFontSize * config.lineHeightRatio / 2);
    const centerX = config.targetX + (config.targetWidth / 2);

    for (let k = 0; k < lines.length; k++) {
        const lineY = startY + (k * currentFontSize * config.lineHeightRatio);
        ctx.fillText(lines[k], centerX, lineY);
    }
}
