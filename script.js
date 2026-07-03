/**
 * Lockscreen Prediction System (LPS) - Core Engine
 * Phát triển cho: nghiamagic/lockscreen
 */

window.addEventListener('DOMContentLoaded', () => {
    // 1. Cấu hình tọa độ vùng viết chữ trên tấm bảng (đã đo đạc từ base.png)
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png',
        targetX: 225,       // Tọa độ X góc trên bên trái vùng trắng
        targetY: 525,       // Tọa độ Y góc trên bên trái vùng trắng
        targetWidth: 580,   // Chiều rộng vùng viết chữ
        targetHeight: 315,  // Chiều cao vùng viết chữ
        padding: 25,        // Khoảng cách an toàn từ lề bảng vào trong chữ
        defaultFontSize: 42,// Kích cỡ chữ tối đa ban đầu
        lineHeightRatio: 1.35, // Khoảng cách giữa các dòng
        fontFamily: 'Arial, sans-serif' // Font mặc định (Hỗ trợ tiếng Việt tốt)
    };

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const loadingDiv = document.getElementById('loading');

    // 2. Lấy tham số "text" từ URL query (?text=Nội dung cần viết)
    const urlParams = new URLSearchParams(window.location.search);
    let textToRender = urlParams.get('text') || "DỰ ÁN LOCKSCREEN:\nĐã tích hợp thành công!\nSẵn sàng render nội dung tùy chỉnh.";
    
    // Hỗ trợ ký tự xuống dòng thực tế \n nếu được truyền từ Shortcut dưới dạng chuỗi literal
    textToRender = textToRender.replace(/\\n/g, '\n');

    // 3. Tiến hành tải ảnh base.png và vẽ lên canvas
    const baseImage = new Image();
    baseImage.src = BOARD_CONFIG.baseImageSrc;
    
    baseImage.onload = () => {
        // Thiết lập kích thước canvas bằng chính xác kích thước ảnh gốc
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;

        // Vẽ ảnh nền lên trước
        ctx.drawImage(baseImage, 0, 0);

        // Khởi chạy bộ xử lý render văn bản nâng cao
        renderTextOnBoard(ctx, textToRender, BOARD_CONFIG);

        // Xuất canvas thành ảnh PNG chất lượng cao nhất để Shortcut sử dụng
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        resultImage.src = dataUrl;
        resultImage.style.display = 'block';
        loadingDiv.style.display = 'none';
    };

    baseImage.onerror = () => {
        loadingDiv.innerText = "Lỗi: Không thể tải file base.png. Hãy chắc chắn file nằm cùng thư mục.";
        loadingDiv.style.color = '#ff4d4d';
    };
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

    // Vòng lặp tối ưu hóa kích thước chữ (Auto-scale): 
    // Nếu chữ quá dài, tự động giảm fontSize từng chút một cho đến khi vừa vặn với chiều cao và chiều rộng của bảng.
    while (currentFontSize > 14) {
        ctx.font = `bold ${currentFontSize}px ${config.fontFamily}`;
        lines = [];
        
        // Tách văn bản theo các dấu xuống dòng chủ động (\n) trước
        const rawLines = text.split('\n');
        
        let fitsPerfect = true;

        for (let i = 0; i < rawLines.length; i++) {
            const words = rawLines[i].split(' ');
            let currentLine = '';

            for (let j = 0; j < words.length; j++) {
                let testLine = currentLine + (currentLine ? ' ' : '') + words[j];
                let metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth) {
                    // Nếu từ đầu tiên đã dài hơn chiều rộng cho phép, bắt buộc phải xuống dòng
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

        // Tính toán tổng chiều cao khối chữ sau khi đã wrap dòng
        totalHeight = lines.length * currentFontSize * config.lineHeightRatio;

        // Nếu tổng chiều cao chữ vượt quá chiều cao tối đa của tấm bảng, tiếp tục giảm font size
        if (totalHeight > maxHeight) {
            currentFontSize -= 2; // Giảm kích thước font và tính toán lại từ đầu
        } else {
            break; // Đã tìm thấy kích thước font phù hợp lý tưởng
        }
    }

    // 4. Tiến hành vẽ chữ lên bảng với tọa độ đã được căn giữa hoàn hảo
    ctx.font = `bold ${currentFontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1c1c1e'; // Màu mực bút lông đen (hơi xám nhẹ cho tự nhiên)

    // Tính toán điểm Y bắt đầu (Căn giữa theo chiều dọc của bảng)
    const startY = config.targetY + config.padding + (maxHeight - totalHeight) / 2 + (currentFontSize * config.lineHeightRatio / 2);
    // Tính toán điểm X chính giữa bảng
    const centerX = config.targetX + (config.targetWidth / 2);

    // Vẽ từng dòng chữ
    for (let k = 0; k < lines.length; k++) {
        const lineY = startY + (k * currentFontSize * config.lineHeightRatio);
        ctx.fillText(lines[k], centerX, lineY);
    }
}
