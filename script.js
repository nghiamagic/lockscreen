/**
 * Lockscreen Prediction System (LPS) - Real Human Brush Simulation
 */

window.addEventListener('DOMContentLoaded', () => {
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png', 
        targetX: 231,       
        targetY: 770,       
        targetWidth: 605,   
        targetHeight: 300,  
        padding: 30,        
        defaultFontSize: 65,  
        lineHeightRatio: 1.15, 
        fontFamily: 'Arial, "Segoe UI", sans-serif' 
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
            
            // Vẽ chữ hiệu ứng giả lập người viết thực tế
            renderHumanBrushText(ctx, textToRender, BOARD_CONFIG);

            // Xuất file ảnh PNG cho Shortcut
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

function renderHumanBrushText(ctx, text, config) {
    const maxWidth = config.targetWidth - (config.padding * 2);
    const maxHeight = config.targetHeight - (config.padding * 2);
    
    let currentFontSize = config.defaultFontSize;
    let lines = [];
    let totalHeight = 0;

    // Tính toán số dòng và co kích thước chữ phù hợp
    while (currentFontSize > 20) {
        ctx.font = `900 ${currentFontSize}px ${config.fontFamily}`;
        lines = [];
        const rawLines = text.split('\n');

        for (let i = 0; i < rawLines.length; i++) {
            const words = rawLines[i].split(' ');
            let currentLine = '';

            for (let j = 0; j < words.length; j++) {
                let testLine = currentLine + (currentLine ? ' ' : '') + words[j];
                if (ctx.measureText(testLine).width > maxWidth) {
                    if (currentLine === '') {
                        currentLine = testLine; lines.push(currentLine); currentLine = '';
                    } else {
                        lines.push(currentLine); currentLine = words[j];
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

    // Thiết lập hệ trục tọa độ xoay theo góc bảng
    const centerX = config.targetX + (config.targetWidth / 2);
    const centerY = config.targetY + (config.targetHeight / 2);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-0.65 * Math.PI / 180); 

    // Dùng một canvas phụ ngầm (Scratch Canvas) để phân tách hạt mực nhằm tạo vết lem ngẫu nhiên
    const scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = config.targetWidth;
    scratchCanvas.height = config.targetHeight + 50;
    const sCtx = scratchCanvas.getContext('2d');

    // Cấu hình vẽ chữ gốc lên canvas ngầm
    sCtx.font = `900 ${currentFontSize}px ${config.fontFamily}`;
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.lineJoin = 'round';
    sCtx.lineCap = 'round';

    // Đổ mực đậm nhạt theo hiệu ứng nhấc cọ (Đầu đậm, cuối nhạt dần)
    let gradient = sCtx.createLinearGradient(0, 0, 0, totalHeight);
    gradient.addColorStop(0, '#121214');   // Đầu dòng mực đậm đặc nguyên bản
    gradient.addColorStop(0.7, '#1c1c1f'); // Giữa dòng mực chuẩn bút lông
    gradient.addColorStop(1, '#2d2d32');   // Cuối nét mực vơi dần do nhấc bút

    sCtx.strokeStyle = gradient;
    sCtx.lineWidth = currentFontSize * 0.06;
    sCtx.fillStyle = gradient;

    const startY = (scratchCanvas.height / 2) - (totalHeight / 2) + (currentFontSize * config.lineHeightRatio / 2);
    const sCenterX = scratchCanvas.width / 2;

    // Vẽ chữ thô lên bộ nhớ đệm
    for (let k = 0; k < lines.length; k++) {
        const lineY = startY + (k * currentFontSize * config.lineHeightRatio);
        sCtx.strokeText(lines[k].toUpperCase(), sCenterX, lineY);
        sCtx.fillText(lines[k].toUpperCase(), sCenterX, lineY);
    }

    // THUẬT TOÁN ĐÁNH NÁT VÀ TẠO LEM MỰC NGẪU NHIÊN (MỖI LẦN CHẠY MỘT KHÁC)
    const imgData = sCtx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
    const data = imgData.data;

    // Quét qua các pixel mực để tạo độ sần sùi (Mực lem bút lông)
    for (let y = 0; y < scratchCanvas.height; y++) {
        for (let x = 0; x < scratchCanvas.width; x++) {
            const alphaIndex = (y * scratchCanvas.width + x) * 4 + 3;
            const alpha = data[alphaIndex];

            if (alpha > 30) {
                // Tạo biến thiên ngẫu nhiên (Random biến dạng nét viền chữ)
                if (Math.random() > 0.35) {
                    // Phun hạt mực lem ngẫu nhiên ra rìa ngoài từ 1-2 pixel
                    const bleedX = x + Math.floor((Math.random() - 0.5) * 3);
                    const bleedY = y + Math.floor((Math.random() - 0.5) * 3);
                    
                    if (bleedX >= 0 && bleedX < scratchCanvas.width && bleedY >= 0 && bleedY < scratchCanvas.height) {
                        const targetAlphaIndex = (bleedY * scratchCanvas.width + bleedX) * 4 + 3;
                        // Đổ mực lem với độ mờ ngẫu nhiên tự nhiên
                        if (data[targetAlphaIndex] < 150) {
                            data[targetAlphaIndex] = alpha * (0.2 + Math.random() * 0.4);
                        }
                    }
                }
                
                // Giảm bớt ngẫu nhiên độ đậm trong lòng chữ để tạo vệt xước sớ bảng gồ ghề
                if (Math.random() > 0.96) {
                    data[alphaIndex] = alpha * 0.4;
                }
            }
        }
    }

    // Cập nhật lại dữ liệu hạt mực đã loang lem ngẫu nhiên vào canvas phụ
    sCtx.putImageData(imgData, 0, 0);

    // Đổ bóng mờ mịn cuối cùng cho khối mực tiệp hoàn toàn vào bề mặt bảng
    ctx.shadowColor = 'rgba(10, 10, 12, 0.25)';
    ctx.shadowBlur = 1.5;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 0.5;

    // Vẽ canvas chứa chữ đã lem hoàn hảo lên ảnh nền gốc
    ctx.drawImage(scratchCanvas, -scratchCanvas.width / 2, -scratchCanvas.height / 2);

    ctx.restore();
}
