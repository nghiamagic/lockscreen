/**
 * Lockscreen Prediction System (LPS) - Bộ Engine Tính Toán Chuẩn Tỷ Lệ %
 */

window.addEventListener('DOMContentLoaded', () => {
    // Cấu hình tỷ lệ % hình học của tấm bảng so với tổng thể bức ảnh base.png
    const BOARD_PERCENT_CONFIG = {
        baseImageSrc: 'base.png',
        xRatio: 0.215,       // 21.5% từ lề trái vào
        yRatio: 0.353,       // 35.3% từ lề trên xuống
        widthRatio: 0.605,   // 60.5% chiều rộng ảnh
        heightRatio: 0.206,  // 20.6% chiều cao ảnh
        paddingRatio: 0.04,  // Lề an toàn bên trong bảng
        fontRatio: 0.038,    // Cỡ chữ tối đa ban đầu
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
        let textToRender = urlParams.get('text') || "DỰ ÁN LOCKSCREEN:\nĐã tích hợp thành công!";
        textToRender = textToRender.replace(/\\n/g, '\n');

        const baseImage = new Image();

        baseImage.onload = () => {
            // Lấy kích thước thực tế của ảnh
            const w = baseImage.naturalWidth || baseImage.width;
            const h = baseImage.naturalHeight || baseImage.height;

            if (w === 0 || h === 0) {
                showError("Trình duyệt chưa đọc được kích thước ảnh nguồn.");
                return;
            }

            canvas.width = w;
            canvas.height = h;

            // Vẽ ảnh gốc lên trước
            ctx.drawImage(baseImage, 0, 0, w, h);
            
            // Tính toán tọa độ pixel động dựa trên tỷ lệ %
            const dynamicConfig = {
                targetX: w * BOARD_PERCENT_CONFIG.xRatio,
                targetY: h * BOARD_PERCENT_CONFIG.yRatio,
                targetWidth: w * BOARD_PERCENT_CONFIG.widthRatio,
                targetHeight: h * BOARD_PERCENT_CONFIG.heightRatio,
                padding: w * BOARD_PERCENT_CONFIG.paddingRatio,
                defaultFontSize: h * BOARD_PERCENT_CONFIG.fontRatio,
                lineHeightRatio: 1.4,
                fontFamily: BOARD_PERCENT_CONFIG.fontFamily
            };

            // Vẽ chữ lên bảng bằng cấu hình động vừa tính
            renderTextOnBoard(ctx, textToRender, dynamicConfig);

            // Xuất ảnh kết quả dạng PNG chất lượng cao
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resultImage.src = dataUrl;
            resultImage.style.display = 'block';
            if (loadingDiv) loadingDiv.style.display = 'none';
        };

        baseImage.onerror = () => {
            showError(`Không thể tải file ảnh nguồn base.png.`);
        };

        baseImage.src = BOARD_PERCENT_CONFIG.baseImageSrc + '?v=' + new Date().getTime();

    } catch (globalError) {
        showError("Lỗi hệ thống: " + globalError.message);
    }
});

function renderTextOnBoard(ctx, text, config) {
    const maxWidth = config.targetWidth - (config.padding * 2);
    const maxHeight = config.targetHeight - (config.padding * 2);
    
    let currentFontSize = config.defaultFontSize;
    let lines = [];
    let totalHeight = 0;

    // Thuật toán tự động xuống dòng và co chữ cho vừa vặn
    while (currentFontSize > 12) {
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
            currentFontSize -= 1; 
        } else {
            break; 
        }
    }

    // Thiết lập vẽ chữ phẳng chính xác
    ctx.font = `bold ${currentFontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top'; 
    ctx.fillStyle = '#1c1c1e'; // Màu đen mực bút viết bảng tự nhiên

    // Căn giữa khối chữ theo chiều dọc và ngang của vùng trắng
    const startY = config.targetY + config.padding + (maxHeight - totalHeight) / 2;
    const centerX = config.targetX + (config.targetWidth / 2);

    // Tiến hành vẽ chữ
    for (let k = 0; k < lines.length; k++) {
        const lineY = startY + (k * currentFontSize * config.lineHeightRatio);
        ctx.fillText(lines[k], centerX, lineY);
    }
}
