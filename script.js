/**
 * Lockscreen Prediction System (LPS) - Core Engine Production
 */

window.addEventListener('DOMContentLoaded', () => {
    // Khóa cứng bộ thông số chuẩn xác bạn đã chỉnh tay thành công
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png', 
        targetX: 231,       
        targetY: 770,       
        targetWidth: 605,   
        targetHeight: 300,  
        padding: 25,        
        defaultFontSize: 44,
        lineHeightRatio: 1.4, 
        fontFamily: 'Arial, sans-serif' 
    };

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const loadingDiv = document.getElementById('loading');

    try {
        const urlParams = new URLSearchParams(window.location.search);
        let textToRender = urlParams.get('text') || "DỰ ÁN LOCKSCREEN:\nSẵn sàng nhận lệnh.";
        textToRender = textToRender.replace(/\\n/g, '\n');

        const baseImage = new Image();

        baseImage.onload = () => {
            const w = baseImage.naturalWidth || baseImage.width;
            const h = baseImage.naturalHeight || baseImage.height;

            canvas.width = w;
            canvas.height = h;

            // Vẽ ảnh nền
            ctx.drawImage(baseImage, 0, 0, w, h);
            
            // Vẽ chữ đè lên bảng
            renderTextOnBoard(ctx, textToRender, BOARD_CONFIG);

            // Xuất ra ảnh PNG cuối cùng
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resultImage.src = dataUrl;
            resultImage.style.display = 'block';
            if (loadingDiv) loadingDiv.style.display = 'none';
        };

        baseImage.onerror = () => {
            if (loadingDiv) loadingDiv.innerHTML = "Lỗi: Không tải được ảnh base.png";
        };

        baseImage.src = BOARD_CONFIG.baseImageSrc + '?v=' + new Date().getTime();

    } catch (err) {
        if (loadingDiv) loadingDiv.innerHTML = "Lỗi hệ thống: " + err.message;
    }
});

function renderTextOnBoard(ctx, text, config) {
    const maxWidth = config.targetWidth - (config.padding * 2);
    const maxHeight = config.targetHeight - (config.padding * 2);
    
    let currentFontSize = config.defaultFontSize;
    let lines = [];
    let totalHeight = 0;

    while (currentFontSize > 12) {
        ctx.font = `bold ${currentFontSize}px ${config.fontFamily}`;
        lines = [];
        const rawLines = text.split('\n');

        for (let i = 0; i < rawLines.length; i++) {
            const words = rawLines[i].split(' ');
            let currentLine = '';

            for (let j = 0; j < words.length; j++) {
                let testLine = currentLine + (currentLine ? ' ' : '') + words[j];
                if (ctx.measureText(testLine).width > maxWidth) {
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
            if (currentLine) lines.push(currentLine);
        }

        totalHeight = lines.length * currentFontSize * config.lineHeightRatio;
        if (totalHeight > maxHeight) currentFontSize -= 1; else break;
    }

    ctx.font = `bold ${currentFontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top'; 
    ctx.fillStyle = '#1c1c1e'; 

    const startY = config.targetY + config.padding + (maxHeight - totalHeight) / 2;
    const centerX = config.targetX + (config.targetWidth / 2);

    for (let k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], centerX, startY + (k * currentFontSize * config.lineHeightRatio));
    }
}
