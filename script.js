/**
 * Lockscreen Prediction System (LPS) - Core Engine
 */

window.addEventListener('DOMContentLoaded', () => {
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png', 
        targetX: 211,       // Tọa độ X chuẩn xác của mép trái vùng trắng
        targetY: 531,       // Tọa độ Y chuẩn xác của mép trên vùng trắng
        targetWidth: 610,   // Chiều rộng thực tế của bảng trắng
        targetHeight: 303,  // Chiều cao thực tế của bảng trắng
        padding: 35,        // Tăng khoảng cách lề an toàn lên một chút cho chữ đẹp hơn
        defaultFontSize: 46,// Tăng kích thước chữ tối đa ban đầu lên để nhìn rõ hơn
        lineHeightRatio: 1.35, 
        fontFamily: 'Arial, sans-serif' 
    };

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const loadingDiv = document.getElementById('loading');

    function showError(message) {
        if (loadingDiv) {
            loadingDiv.innerHTML = `<span style="color: #ff4d4d; font-weight: bold;">LỖI:</span> ${message}`;
        }
    }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        let textToRender = urlParams.get('text') || "DỰ ÁN LOCKSCREEN:\nĐã tích hợp thành công!\nSẵn sàng render nội dung tùy chỉnh.";
        textToRender = textToRender.replace(/\\n/g, '\n');

        const baseImage = new Image();
        
        // Tuyệt đối KHÔNG dùng baseImage.crossOrigin = "anonymous" ở đây để tránh bị kẹt luồng load ảnh local.

        baseImage.onload = () => {
            canvas.width = baseImage.width;
            canvas.height = baseImage.height;

            ctx.drawImage(baseImage, 0, 0);
            renderTextOnBoard(ctx, textToRender, BOARD_CONFIG);

            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resultImage.src = dataUrl;
            resultImage.style.display = 'block';
            if (loadingDiv) loadingDiv.style.display = 'none';
        };

        baseImage.onerror = () => {
            showError(`Không thể tải file "${BOARD_CONFIG.baseImageSrc}". Hãy chắc chắn file ảnh viết thường và nằm cùng thư mục trên GitHub.`);
        };

        baseImage.src = BOARD_CONFIG.baseImageSrc + '?v=' + new Date().getTime(); // Thêm phá cache để cập nhật ảnh mới ngay lập tức

        // Bộ đếm thời gian đề phòng kẹt ảnh
        setTimeout(() => {
            if (!baseImage.complete && loadingDiv) {
                showError("Quá thời gian tải ảnh base.png (Timeout). Kiểm tra lại đường dẫn file.");
            }
        }, 4000);

    } catch (globalError) {
        showError("Lỗi khởi tạo hệ thống.");
    }
});

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
