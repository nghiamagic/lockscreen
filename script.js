/**
 * Lockscreen Prediction System (LPS) - Brush Art & Rotate Engine
 */

window.addEventListener('DOMContentLoaded', () => {
    // Khóa cứng bộ thông số chuẩn của bạn kết hợp Font viết tay mới
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png', 
        targetX: 231,       
        targetY: 770,       
        targetWidth: 605,   
        targetHeight: 300,  
        padding: 35,        // Tăng padding để chữ viết tay uốn lượn không bị chạm viền
        defaultFontSize: 46,
        lineHeightRatio: 1.3, // Font viết tay cần khoảng cách dòng hẹp hơn một chút để tự nhiên
        fontFamily: '"Pattaya", cursive' // Áp dụng font viết tay nghệ thuật
    };

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const loadingDiv = document.getElementById('loading');

    try {
        const urlParams = new URLSearchParams(window.location.search);
        let textToRender = urlParams.get('text') || "Chào Bạn Nghi\nYêu Gấu!";
        textToRender = textToRender.replace(/\\n/g, '\n');

        const baseImage = new Image();

        baseImage.onload = () => {
            // Chờ thêm 300ms để đảm bảo trình duyệt đã kích hoạt Font viết tay thành công
            setTimeout(() => {
                const w = baseImage.naturalWidth || baseImage.width;
                const h = baseImage.naturalHeight || baseImage.height;

                canvas.width = w;
                canvas.height = h;

                // Vẽ ảnh nền
                ctx.drawImage(baseImage, 0, 0, w, h);
                
                // Tiến hành vẽ chữ hiệu ứng bút lông nghiêng tự nhiên
                renderTextOnBoard(ctx, textToRender, BOARD_CONFIG);

                // Xuất ra ảnh PNG cuối cùng
                const dataUrl = canvas.toDataURL('image/png', 1.0);
                resultImage.src = dataUrl;
                resultImage.style.display = 'block';
                if (loadingDiv) loadingDiv.style.display = 'none';
            }, 300);
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

    // Thuật toán tự động xuống dòng và co chữ
    while (currentFontSize > 14) {
        ctx.font = `${currentFontSize}px ${config.fontFamily}`;
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
        if (totalHeight > maxHeight) currentFontSize -= 2; else break;
    }

    // TÍNH TOÁN TÂM HÌNH HỌC TẤM BẢNG ĐỂ XOAY KHÔNG BỊ LỆCH TRỤC
    const centerX = config.targetX + (config.targetWidth / 2);
    const centerY = config.targetY + (config.targetHeight / 2);

    ctx.save(); // Lưu trạng thái canvas phẳng

    // Dịch tâm vẽ về chính giữa bảng và xoay nhẹ -0.65 độ theo dáng đứng thực tế
    ctx.translate(centerX, centerY);
    ctx.rotate(-0.65 * Math.PI / 180);

    // THIẾT LẬP HIỆU ỨNG BÚT LÔNG (BRUSH EFFECT)
    ctx.font = `${currentFontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; 
    ctx.fillStyle = '#1e1e21'; // Màu mực bút lông đen xám tự nhiên

    // Đổ bóng nhòe nhẹ tạo hiệu ứng mực thấm (Bleeding) vào sớ bảng trắng
    ctx.shadowColor = 'rgba(30, 30, 33, 0.4)';
    ctx.shadowBlur = 1.5;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 0.5;

    // Tính điểm Y bắt đầu tương đối từ tâm xoay 0
    const startY = - (totalHeight / 2) + (currentFontSize * config.lineHeightRatio / 2);

    // Vẽ từng dòng chữ uốn lượn nghệ thuật
    for (let k = 0; k < lines.length; k++) {
        const lineY = startY + (k * currentFontSize * config.lineHeightRatio);
        ctx.fillText(lines[k], 0, lineY);
    }

    ctx.restore(); // Khôi phục trạng thái canvas gốc
}
