/**
 * Lockscreen Prediction System (LPS) - Core Engine
 */

window.addEventListener('DOMContentLoaded', () => {
    // Bộ tọa độ chuẩn xác theo pixel gốc của tấm bảng trắng
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png', 
        targetX: 215,       // Tọa độ lề trái vùng trắng
        targetY: 520,       // Tọa độ lề trên vùng trắng
        targetWidth: 605,   // Chiều rộng vùng trắng
        targetHeight: 310,  // Chiều cao vùng trắng
        padding: 30,        // Khoảng cách an toàn từ viền bảng
        defaultFontSize: 44,// Kích thước chữ tối đa
        lineHeightRatio: 1.4, 
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
            // ÉP CANVAS LẤY ĐÚNG KÍCH THƯỚC GỐC CỦA FILE ẢNH (QUAN TRỌNG NHẤT)
            const imgWidth = baseImage.naturalWidth || baseImage.width;
            const imgHeight = baseImage.naturalHeight || baseImage.height;

            canvas.width = imgWidth;
            canvas.height = imgHeight;

            // Vẽ ảnh gốc
            ctx.drawImage(baseImage, 0, 0, imgWidth, imgHeight);
            
            // Vẽ chữ đè lên bảng
            renderTextOnBoard(ctx, textToRender, BOARD_CONFIG);

            // Xuất ảnh chất lượng cao
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resultImage.src = dataUrl;
            resultImage.style.display = 'block';
            if (loadingDiv) loadingDiv.style.display = 'none';
        };

        baseImage.onerror = () => {
            showError(`Không thể tải file "${BOARD_CONFIG.baseImageSrc}".`);
        };

        // Thêm timestamp để ép trình duyệt xóa cache ảnh cũ
        baseImage.src = BOARD_CONFIG.baseImageSrc + '?v=' + new Date().getTime();

    } catch (globalError) {
        showError("Lỗi khởi tạo hệ thống: " + globalError.message);
    }
});

function renderTextOnBoard(ctx, text, config) {
    const maxWidth = config.targetWidth - (config.padding * 2);
    const maxHeight = config.targetHeight - (config.padding * 2);
    
    let currentFontSize = config.defaultFontSize;
    let lines = [];
    let totalHeight = 0;

    // Thuật toán tự động co chữ (Auto-scale)
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

    // Thiết lập thuộc tính vẽ chữ phẳng an toàn
    ctx.font = `bold ${currentFontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top'; 
    ctx.fillStyle = '#222224'; 

    // Tính toán tọa độ Y bắt đầu dựa trên tổng chiều cao khối chữ để căn giữa bảng
    const startY = config.targetY + config.padding + (maxHeight - totalHeight) / 2;
    const centerX = config.targetX + (config.targetWidth / 2);

    // Tiến hành vẽ chữ tuần tự từng dòng
    for (let k = 0; k < lines.length; k++) {
        const lineY = startY + (k * currentFontSize * config.lineHeightRatio);
        ctx.fillText(lines[k], centerX, lineY);
    }
}
