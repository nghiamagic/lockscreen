/**
 * Lockscreen Prediction System (LPS) - Bản tái tạo cọ Marker xước theo hình mẫu
 */

window.addEventListener('DOMContentLoaded', () => {
    // Giữ nguyên bộ tọa độ chuẩn bạn đã tìm ra
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png', 
        targetX: 231,       
        targetY: 770,       
        targetWidth: 605,   
        targetHeight: 300,  
        padding: 30,        
        defaultFontSize: 65,  // Tăng cỡ chữ lớn lên để bung nét cọ thô như hình mẫu
        lineHeightRatio: 1.15, // Khoảng cách dòng khít nhau giống như mẫu
        fontFamily: 'Arial, "Segoe UI", sans-serif' // Dùng font dày bản để bo viền cọ
    };

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const loadingDiv = document.getElementById('loading');

    try {
        const urlParams = new URLSearchParams(window.location.search);
        let textToRender = urlParams.get('text') || "PHẠM\nQUỐC\nNGHĨA";
        textToRender = textToRender.replace(/\\n/g, '\n');

        const baseImage = new Image();

        baseImage.onload = () => {
            const w = baseImage.naturalWidth || baseImage.width;
            const h = baseImage.naturalHeight || baseImage.height;

            canvas.width = w;
            canvas.height = h;

            // Vẽ ảnh nền gốc
            ctx.drawImage(baseImage, 0, 0, w, h);
            
            // Vẽ chữ cọ xước
            renderTextOnBoard(ctx, textToRender, BOARD_CONFIG);

            // Xuất file ảnh PNG sạch sẽ cho Shortcut
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

    // Tự động tính toán số dòng và co chữ
    while (currentFontSize > 20) {
        ctx.font = `900 ${currentFontSize}px ${config.fontFamily}`; // Độ dày tối đa 900
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

    // TÍNH TOÁN XOAY TÂM BẢNG ĐỂ CHỮ NGHIÊNG THEO THỚ GỖ TỰ NHIÊN
    const centerX = config.targetX + (config.targetWidth / 2);
    const centerY = config.targetY + (config.targetHeight / 2);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-0.65 * Math.PI / 180); // Độ nghiêng khớp theo mặt bảng thực tế

    // TÁI TẠO CẤU HÌNH ĐƯỜNG CỌ MARKER (Dựa theo ảnh mẫu đính kèm)
    ctx.font = `900 ${currentFontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; 
    ctx.lineJoin = 'round'; // Bo tròn điểm nối nét
    ctx.lineCap = 'round';  // Bo tròn đầu bút lông

    // Tạo nét xước lông bằng viền stroke ngoài
    ctx.strokeStyle = '#101012'; 
    ctx.lineWidth = currentFontSize * 0.08; // Độ dày viền tương xứng tỉ lệ chữ

    // Đổ mực đặc vào lòng chữ
    ctx.fillStyle = '#161619'; 

    // Đổ bóng mờ tạo độ nhòe thấm mực bút lông viết bảng
    ctx.shadowColor = 'rgba(16, 16, 19, 0.35)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Vị trí dòng đầu tiên tương đối từ tâm xoay
    const startY = - (totalHeight / 2) + (currentFontSize * config.lineHeightRatio / 2);

    // Tiến hành vẽ kép (Stroke viền cọ trước, Fill mực đè lên sau) tạo hiệu ứng nhám xước
    for (let k = 0; k < lines.length; k++) {
        const lineY = startY + (k * currentFontSize * config.lineHeightRatio);
        
        // Vẽ viền nhám phác họa của cọ trước
        ctx.strokeText(lines[k].toUpperCase(), 0, lineY); // Chuyển chữ in hoa để bung tối đa nét cọ
        
        // Đổ mực bút lông đè lòng sau
        ctx.fillText(lines[k].toUpperCase(), 0, lineY);
    }

    ctx.restore();
}
