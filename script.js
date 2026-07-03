/**
 * Lockscreen Prediction System (LPS) - Permanent Marker & Brush Custom Engine
 */

window.addEventListener('DOMContentLoaded', () => {
    // Cấu hình tọa độ bảng mới ôm trọn vùng trắng trong image_048c71.jpg
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png', 
        targetX: 231,       
        targetY: 770,       
        targetWidth: 605,   
        targetHeight: 300,  
        padding: 30,        
        defaultFontSize: 110, // Tăng cỡ chữ đại bản giống mẫu
        lineHeightRatio: 1.15,
        fontFamily: '"Permanent Marker", Arial, sans-serif'
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
            // Chờ font load hẳn trong 400ms để không bị lỗi rụng font trên iPhone
            setTimeout(() => {
                const w = baseImage.naturalWidth || baseImage.width;
                const h = baseImage.naturalHeight || baseImage.height;

                canvas.width = w;
                canvas.height = h;

                // Vẽ ảnh nền gốc
                ctx.drawImage(baseImage, 0, 0, w, h);
                
                // Khởi chạy thuật toán xử lý cọ nhám Permanent Marker
                renderPermanentMarkerText(ctx, textToRender, BOARD_CONFIG);

                const dataUrl = canvas.toDataURL('image/png', 1.0);
                resultImage.src = dataUrl;
                resultImage.style.display = 'block';
                if (loadingDiv) loadingDiv.style.display = 'none';
            }, 400);
        };

        baseImage.onerror = () => {
            if (loadingDiv) loadingDiv.innerHTML = "Lỗi: Không tìm thấy file base.png mới.";
        };

        baseImage.src = BOARD_CONFIG.baseImageSrc + '?v=' + new Date().getTime();

    } catch (err) {
        if (loadingDiv) loadingDiv.innerHTML = "Lỗi engine: " + err.message;
    }
});

function renderPermanentMarkerText(ctx, text, config) {
    const maxWidth = config.targetWidth - (config.padding * 2);
    const maxHeight = config.targetHeight - (config.padding * 2);
    
    let currentFontSize = config.defaultFontSize;
    let lines = [];
    let totalHeight = 0;

    // Phân tách dòng chữ
    while (currentFontSize > 30) {
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
        if (totalHeight > maxHeight) currentFontSize -= 4; else break;
    }

    // Đặt trục xoay nghiêng theo góc bảng của ảnh mới (-1.2 độ)
    const centerX = config.targetX + (config.targetWidth / 2);
    const centerY = config.targetY + (config.targetHeight / 2);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-1.2 * Math.PI / 180); 

    // Sử dụng Canvas phụ để xử lý hạt mực nhám
    const scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = config.targetWidth + 100;
    scratchCanvas.height = config.targetHeight + 100;
    const sCtx = scratchCanvas.getContext('2d');

    sCtx.font = `${currentFontSize}px ${config.fontFamily}`;
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.lineJoin = 'round';
    sCtx.lineCap = 'round';

    // Tạo dải màu chuyển tiếp nhấc cọ: Đầu đậm cuối nhạt dần giống hệt người viết thật
    let markerGradient = sCtx.createLinearGradient(0, 0, 0, totalHeight);
    markerGradient.addColorStop(0, '#151518');
    markerGradient.addColorStop(0.7, '#1f1f24');
    markerGradient.addColorStop(1, '#33333a');

    sCtx.strokeStyle = markerGradient;
    sCtx.lineWidth = currentFontSize * 0.05; // Độ dày cọ ngoài
    sCtx.fillStyle = markerGradient;

    const startY = (scratchCanvas.height / 2) - (totalHeight / 2) + (currentFontSize * config.lineHeightRatio / 2);
    const sCenterX = scratchCanvas.width / 2;

    // Thực hiện vẽ chữ in hoa phác thảo cọ lên bộ nhớ tạm
    for (let k = 0; k < lines.length; k++) {
        const lineY = startY + (k * currentFontSize * config.lineHeightRatio);
        const cleanText = lines[k].toUpperCase();
        
        sCtx.strokeText(cleanText, sCenterX, lineY);
        sCtx.fillText(cleanText, sCenterX, lineY);
    }

    // THUẬT TOÁN ĐÁNH NÁT VIỀN TẠO HIỆU ỨNG GAI XƯỚC MỰC BÚT LÔNG MANH MANH
    const imgData = sCtx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
    const data = imgData.data;

    for (let y = 0; y < scratchCanvas.height; y++) {
        for (let x = 0; x < scratchCanvas.width; x++) {
            const alphaIndex = (y * scratchCanvas.width + x) * 4 + 3;
            const alpha = data[alphaIndex];

            if (alpha > 40) {
                // Đánh gai rìa chữ ngẫu nhiên
                if (Math.random() > 0.4) {
                    const bX = x + Math.floor((Math.random() - 0.5) * 4);
                    const bY = y + Math.floor((Math.random() - 0.5) * 4);
                    if (bX >= 0 && bX < scratchCanvas.width && bY >= 0 && bY < scratchCanvas.height) {
                        const tIndex = (bY * scratchCanvas.width + bX) * 4 + 3;
                        if (data[tIndex] < 140) {
                            data[tIndex] = alpha * (0.25 + Math.random() * 0.35);
                        }
                    }
                }
                // Đục lỗ sớ xước siêu nhỏ dọc thân chữ để giả lập bề mặt bảng mica bám mực không đều
                if (Math.random() > 0.95) {
                    data[alphaIndex] = alpha * 0.3;
                }
            }
        }
    }

    sCtx.putImageData(imgData, 0, 0);

    // Đổ bóng mờ tĩnh tạo độ chìm thực tế
    ctx.shadowColor = 'rgba(15, 15, 18, 0.3)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0.8;
    ctx.shadowOffsetY = 0.8;

    // Ghép chữ đã xử lý hạt nhám lên bảng
    ctx.drawImage(scratchCanvas, -scratchCanvas.width / 2, -scratchCanvas.height / 2);
    ctx.restore();
}
