/**
 * Lockscreen Prediction System (LPS) - Bộ Engine Tweak Tọa Độ Trực Quan
 */

window.addEventListener('DOMContentLoaded', () => {
    // Cấu hình tọa độ ban đầu (Sẽ được thay đổi trực tiếp bằng thanh kéo phía dưới)
    let BOARD_CONFIG = {
        baseImageSrc: 'base.png', 
        targetX: 215,       
        targetY: 530,       // Đang bị cao, tí nữa bạn kéo thanh Y tăng lên khoảng 750-800 chữ sẽ xuống bảng
        targetWidth: 605,   
        targetHeight: 300,  
        padding: 30,        
        defaultFontSize: 44,
        lineHeightRatio: 1.4, 
        fontFamily: 'Arial, sans-serif' 
    };

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const loadingDiv = document.getElementById('loading');

    // Tự động tạo Bộ điều khiển thủ công đè lên giao diện để bạn căn chỉnh
    const controlPanel = document.createElement('div');
    controlPanel.style = "position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,0.85);color:#fff;padding:15px;font-family:monospace;z-index:9999;max-height:40vh;overflow-y:auto;font-size:13px;line-height:1.6;";
    controlPanel.innerHTML = `
        <div style="font-weight:bold;color:#4af;margin-bottom:10px;">🛠️ BỘ CĂN CHỈNH TỌA ĐỘ CHỮ TRỰC TIẾP:</div>
        <div>Tọa độ X: <input type="range" id="sliderX" min="0" max="1200" value="${BOARD_CONFIG.targetX}" style="width:70%"> <span id="valX">${BOARD_CONFIG.targetX}</span></div>
        <div>Tọa độ Y (Đẩy chữ lên/xuống): <input type="range" id="sliderY" min="0" max="1500" value="${BOARD_CONFIG.targetY}" style="width:70%"> <span id="valY">${BOARD_CONFIG.targetY}</span></div>
        <div>Chiều RỘNG vùng chữ: <input type="range" id="sliderW" min="50" max="1000" value="${BOARD_CONFIG.targetWidth}" style="width:70%"> <span id="valW">${BOARD_CONFIG.targetWidth}</span></div>
        <div>Chiều CAO vùng chữ: <input type="range" id="sliderH" min="50" max="800" value="${BOARD_CONFIG.targetHeight}" style="width:70%"> <span id="valH">${BOARD_CONFIG.targetHeight}</span></div>
        <div>Cỡ chữ tối đa: <input type="range" id="sliderFS" min="10" max="100" value="${BOARD_CONFIG.defaultFontSize}" style="width:70%"> <span id="valFS">${BOARD_CONFIG.defaultFontSize}</span></div>
        <hr style="border-color:#444">
        <div style="color:#0f0;">👉 CODE TỌA ĐỘ ĐỂ COPY:</div>
        <textarea id="codeOutput" style="width:100%;height:50px;background:#222;color:#fff;border:1px solid #444;font-size:11px;" readonly></textarea>
    `;
    document.body.appendChild(controlPanel);

    const baseImage = new Image();

    function updateRender() {
        const w = baseImage.naturalWidth || baseImage.width;
        const h = baseImage.naturalHeight || baseImage.height;
        if (w === 0 || h === 0) return;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(baseImage, 0, 0, w, h);

        const urlParams = new URLSearchParams(window.location.search);
        let textToRender = urlParams.get('text') || "DỰ ÁN LOCKSCREEN:\nĐã tích hợp thành công!";
        textToRender = textToRender.replace(/\\n/g, '\n');

        renderTextOnBoard(ctx, textToRender, BOARD_CONFIG);

        resultImage.src = canvas.toDataURL('image/png', 1.0);
        resultImage.style.display = 'block';
        if (loadingDiv) loadingDiv.style.display = 'none';

        // Xuất đoạn code chuẩn để bạn copy sau khi chỉnh xong
        document.getElementById('codeOutput').value = `targetX: ${BOARD_CONFIG.targetX}, targetY: ${BOARD_CONFIG.targetY}, targetWidth: ${BOARD_CONFIG.targetWidth}, targetHeight: ${BOARD_CONFIG.targetHeight}, defaultFontSize: ${BOARD_CONFIG.defaultFontSize}`;
    }

    baseImage.onload = () => {
        updateRender();

        // Lắng nghe sự kiện thay đổi của các thanh kéo để lập tức vẽ lại chữ tại chỗ
        document.getElementById('sliderX').addEventListener('input', (e) => { BOARD_CONFIG.targetX = parseInt(e.target.value); document.getElementById('valX').innerText = e.target.value; updateRender(); });
        document.getElementById('sliderY').addEventListener('input', (e) => { BOARD_CONFIG.targetY = parseInt(e.target.value); document.getElementById('valY').innerText = e.target.value; updateRender(); });
        document.getElementById('sliderW').addEventListener('input', (e) => { BOARD_CONFIG.targetWidth = parseInt(e.target.value); document.getElementById('valW').innerText = e.target.value; updateRender(); });
        document.getElementById('sliderH').addEventListener('input', (e) => { BOARD_CONFIG.targetHeight = parseInt(e.target.value); document.getElementById('valH').innerText = e.target.value; updateRender(); });
        document.getElementById('sliderFS').addEventListener('input', (e) => { BOARD_CONFIG.defaultFontSize = parseInt(e.target.value); document.getElementById('valFS').innerText = e.target.value; updateRender(); });
    };

    baseImage.src = BOARD_CONFIG.baseImageSrc + '?v=' + new Date().getTime();
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

    ctx.font = `bold ${currentFontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top'; 
    ctx.fillStyle = '#1c1c1e'; 

    const startY = config.targetY + config.padding + (maxHeight - totalHeight) / 2;
    const centerX = config.targetX + (config.targetWidth / 2);

    for (let k = 0; k < lines.length; k++) {
        const lineY = startY + (k * currentFontSize * config.lineHeightRatio);
        ctx.fillText(lines[k], centerX, lineY);
    }
}
