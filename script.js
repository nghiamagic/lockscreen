/**
 * Lockscreen Prediction System (LPS) - Fixed & Optimized Hyper-Realistic Engine
 */

window.addEventListener('DOMContentLoaded', () => {
    // Cấu hình tọa độ bảng mới ôm trọn vùng trắng
    const BOARD_CONFIG = {
        baseImageSrc: 'base.png', 
        targetX: 231,       
        targetY: 770,       
        targetWidth: 605,   
        targetHeight: 300,  
        padding: 30,        
        defaultFontSize: 110, 
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
            setTimeout(() => {
                const w = baseImage.naturalWidth || baseImage.width;
                const h = baseImage.naturalHeight || baseImage.height;

                canvas.width = w;
                canvas.height = h;

                // Vẽ ảnh nền gốc
                ctx.drawImage(baseImage, 0, 0, w, h);
                
                // Khởi chạy thuật toán xử lý cọ nhám Permanent Marker chuyên sâu
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
    const maxWidth = config.targetWidth - config.padding * 2;
    const maxHeight = config.targetHeight - config.padding * 2;

    let fontSize = config.defaultFontSize;
    let lines = [];
    let totalHeight = 0;

    /*==============================
      1. TỰ ĐỘNG CO GIÃN CHỮ (AUTO FIT)
    ==============================*/
    while (fontSize > 30) {
        ctx.font = `${fontSize}px ${config.fontFamily}`;
        lines = [];

        for (const raw of text.split("\n")) {
            const words = raw.split(" ");
            let line = "";

            for (const word of words) {
                const test = line ? line + " " + word : word;
                if (ctx.measureText(test).width > maxWidth) {
                    if (line) lines.push(line);
                    line = word;
                } else {
                    line = test;
                }
            }
            if (line) lines.push(line);
        }

        totalHeight = lines.length * fontSize * config.lineHeightRatio;
        if (totalHeight <= maxHeight) break;
        fontSize -= 2;
    }

    /*==============================
      2. ĐỊNH VỊ TÂM XOAY VÀ GÓC NGHIÊNG BẢNG
    ==============================*/
    const centerX = config.targetX + config.targetWidth / 2;
    const centerY = config.targetY + config.targetHeight / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-1.2 * Math.PI / 180);

    /*==============================
      3. KHỞI TẠO CANVAS ĐỆM XỬ LÝ HẠT MỰC
    ==============================*/
    const scratch = document.createElement("canvas");
    scratch.width = config.targetWidth + 120;
    scratch.height = config.targetHeight + 120;
    const sCtx = scratch.getContext("2d");

    sCtx.textAlign = "center";
    sCtx.textBaseline = "middle";
    sCtx.lineJoin = "round";
    sCtx.lineCap = "round";
    sCtx.font = `${fontSize}px ${config.fontFamily}`;

    const g = sCtx.createLinearGradient(0, 0, 0, scratch.height);
    g.addColorStop(0, "#111");
    g.addColorStop(0.6, "#1a1a1c");
    g.addColorStop(1, "#2d2d31");

    sCtx.fillStyle = g;
    sCtx.strokeStyle = g;

    /*==============================
      4. PHÁC THẢO CHỮ LÊN CANVAS ĐỆM
    ==============================*/
    const startY = scratch.height / 2 - totalHeight / 2 + (fontSize * config.lineHeightRatio) / 2;
    const cx = scratch.width / 2;

    for (let i = 0; i < lines.length; i++) {
        drawMarkerStroke(sCtx, lines[i].toUpperCase(), cx, startY + i * fontSize * config.lineHeightRatio, fontSize);
    }

    /*==============================
      5. CHẠY PIPELINE BỘ LỌC THỰC TẾ
    ==============================*/
    applyInkTexture(scratch);
    applyDryMarker(scratch);
    applyFiberNoise(scratch);
    applyEdgeRoughness(scratch);

    /*==============================
      6. ĐỔ BÓNG VÀ TRẢ KẾT QUẢ LÊN BẢNG GỐC
    ==============================*/
    ctx.shadowColor = "rgba(0,0,0,.28)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0.8;
    ctx.shadowOffsetY = 0.8;

    ctx.drawImage(scratch, -scratch.width / 2, -scratch.height / 2);
    ctx.restore();
}

function drawMarkerStroke(ctx, text, x, y, fontSize) {
    const PASS = 10;
    for (let i = 0; i < PASS; i++) {
        const pressure = 0.86 + Math.random() * 0.14;
        const ox = (Math.random() - 0.5) * (fontSize * 0.014);
        const oy = (Math.random() - 0.5) * (fontSize * 0.014);

        ctx.save();
        ctx.globalAlpha = 0.10 + Math.random() * 0.05;
        ctx.lineWidth = fontSize * (0.048 + Math.random() * 0.008) * pressure;

        ctx.strokeText(text, x + ox, y + oy);
        ctx.fillText(text, x + ox, y + oy);
        ctx.restore();
    }

    // Khử bớt mực giả lập đầu bút khô nhạt
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 0.08;

    for (let i = 0; i < fontSize * 1.2; i++) {
        const rx = x + (Math.random() - .5) * fontSize * 2.5;
        const ry = y + (Math.random() - .5) * fontSize * .65;
        const r = .35 + Math.random() * .6;

        ctx.beginPath();
        ctx.arc(rx, ry, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Lớp mực dính nhẹ cuối cùng ngoài rìa
    ctx.save();
    ctx.globalAlpha = .18;
    ctx.lineWidth = fontSize * .018;
    ctx.strokeText(text, x, y);
    ctx.restore();
}

function applyInkTexture(canvas) {
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const w = canvas.width;
    const h = canvas.height;

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const a = (y * w + x) * 4 + 3;
            if (data[a] < 25) continue;

            const grain = 0.82 + Math.random() * 0.24;
            data[a] *= grain;

            const left = data[a - 4];
            const right = data[a + 4];
            const up = data[a - w * 4];
            const down = data[a + w * 4];
            const avg = (left + right + up + down) * .25;

            if (avg > 180) {
                data[a] = Math.min(255, data[a] + 16);
            }

            if (Math.random() > .985) {
                data[a] *= .45 + Math.random() * .2;
            }

            if (Math.random() > .992) {
                data[a] = Math.min(255, data[a] + 24);
            }
        }
    }

    const copy = new Uint8ClampedArray(data);
    for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
            const a = (y * w + x) * 4 + 3;
            if (copy[a] < 170) continue;

            for (let yy = -1; yy <= 1; yy++) {
                for (let xx = -1; xx <= 1; xx++) {
                    if (xx === 0 && yy === 0) continue;
                    const t = ((y + yy) * w + x + xx) * 4 + 3;
                    if (copy[t] < 70) {
                        data[t] = Math.max(data[t], copy[a] * .18);
                    }
                }
            }
        }
    }
    ctx.putImageData(img, 0, 0);
}

function applyDryMarker(canvas) {
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const w = canvas.width;
    const h = canvas.height;

    for (let x = 0; x < w; x++) {
        if (Math.random() > 0.35) continue;
        let offset = (Math.random() - .5) * 8;

        for (let y = 0; y < h; y++) {
            const xx = Math.round(x + Math.sin(y * .045) * 1.8 + offset);
            if (xx < 1 || xx >= w - 1) continue;

            const a = (y * w + xx) * 4 + 3;
            if (data[a] < 110) continue;

            data[a] *= .45 + Math.random() * .25;
            if (Math.random() > .75) {
                data[a - 4] *= .72;
                data[a + 4] *= .72;
            }
        }
    }

    for (let y = 2; y < h - 2; y++) {
        const fade = Math.abs(y - h / 2) / (h / 2);
        for (let x = 2; x < w - 2; x++) {
            const a = (y * w + x) * 4 + 3;
            if (data[a] < 120) continue;

            if (Math.random() < fade * .03) {
                data[a] *= .45 + Math.random() * .25;
                data[a - 4] *= .82;
                data[a + 4] *= .82;
                data[a - w * 4] *= .82;
                data[a + w * 4] *= .82;
            }
        }
    }

    const dots = Math.floor(w * h * 0.0035);
    for (let i = 0; i < dots; i++) {
        const x = (Math.random() * w) | 0;
        const y = (Math.random() * h) | 0;
        const a = (y * w + x) * 4 + 3;
        if (data[a] < 90) continue;

        const r = 1 + Math.random() * 1.2;
        for (let yy = -2; yy <= 2; yy++) {
            for (let xx = -2; xx <= 2; xx++) {
                if (xx * xx + yy * yy > r * r) continue;
                const px = x + xx;
                const py = y + yy;
                if (px < 0 || py < 0 || px >= w || py >= h) continue;

                const t = (py * w + px) * 4 + 3;
                data[t] *= .25 + Math.random() * .45;
            }
        }
    }

    for (let y = 0; y < h; y++) {
        if (Math.random() > .985) {
            const start = (Math.random() * w * .7) | 0;
            const len = 15 + (Math.random() * 40) | 0;
            for (let x = start; x < start + len; x++) {
                if (x < 0 || x >= w) continue;
                const a = (y * w + x) * 4 + 3;
                if (data[a] > 80) {
                    data[a] *= .55 + Math.random() * .2;
                }
            }
        }
    }
    ctx.putImageData(img, 0, 0);
}

function applyFiberNoise(canvas) {
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const w = canvas.width;
    const h = canvas.height;

    const fibers = Math.floor(w * h * 0.010);
    for (let i = 0; i < fibers; i++) {
        let x = (Math.random() * w) | 0;
        let y = (Math.random() * h) | 0;
        const len = 3 + ((Math.random() * 8) | 0);
        let dx = (Math.random() - .5) * .8;
        let dy = 1 + Math.random();

        for (let k = 0; k < len; k++) {
            if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) break;
            const a = (y * w + x) * 4 + 3;

            if (data[a] > 90) {
                data[a] *= .60 + Math.random() * .25;
                if (Math.random() > .55) {
                    data[a - 4] *= .85;
                    data[a + 4] *= .85;
                }
            }
            x += dx + (Math.random() - .5);
            y += dy;
        }
    }

    const whiteFibers = Math.floor(w * h * 0.002);
    for (let i = 0; i < whiteFibers; i++) {
        let x = (Math.random() * w) | 0;
        let y = (Math.random() * h) | 0;
        const len = 2 + ((Math.random() * 6) | 0);

        for (let j = 0; j < len; j++) {
            if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) break;
            const a = (y * w + x) * 4 + 3;
            if (data[a] > 120) {
                data[a] *= .35 + Math.random() * .25;
            }
            x += ((Math.random() * 3) | 0) - 1;
            y++;
        }
    }
    ctx.putImageData(img, 0, 0);
}

function applyEdgeRoughness(canvas) {
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const w = canvas.width;
    const h = canvas.height;

    const copy = new Uint8ClampedArray(data);
    for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
            const a = (y * w + x) * 4 + 3;
            if (copy[a] < 60) continue;

            let edge = 0;
            if (copy[a - 4] < 20) edge++;
            if (copy[a + 4] < 20) edge++;
            if (copy[a - w * 4] < 20) edge++;
            if (copy[a + w * 4] < 20) edge++;
            if (!edge) continue;

            if (Math.random() < 0.45) {
                data[a] *= 0.55 + Math.random() * 0.35;
            }

            if (Math.random() < 0.30) {
                const nx = x + ((Math.random() * 5) | 0) - 2;
                const ny = y + ((Math.random() * 5) | 0) - 2;
                if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
                    const t = (ny * w + nx) * 4 + 3;
                    if (copy[t] < 20) {
                        data[t] = copy[a] * (0.15 + Math.random() * 0.25);
                    }
                }
            }
        }
    }

    const grains = Math.floor(w * h * 0.0025);
    for (let i = 0; i < grains; i++) {
        const x = (Math.random() * w) | 0;
        const y = (Math.random() * h) | 0;
        const a = (y * w + x) * 4 + 3;
        if (data[a] < 70) continue;
        data[a] *= 0.75 + Math.random() * 0.25;
    }

    const smooth = new Uint8ClampedArray(data);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const a = (y * w + x) * 4 + 3;
            if (smooth[a] < 25) continue;

            const avg = (smooth[a] + smooth[a - 4] + smooth[a + 4] + smooth[a - w * 4] + smooth[a + w * 4]) / 5;
            data[a] = smooth[a] * 0.72 + avg * 0.28;
        }
    }
    ctx.putImageData(img, 0, 0);
}
