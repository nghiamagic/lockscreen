const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const SIZE = 1400;

canvas.width = SIZE;
canvas.height = SIZE;

const input = document.getElementById("text");
const btn = document.getElementById("render");

const config = {

    padding:120,

    maxFont:260,

    minFont:80,

    lineHeight:0.86,

    fontFamily:
        '"Arial Black","Impact",sans-serif',

    fill:"#000000",

    background:"#ffffff"

};

function clearCanvas(){

    ctx.fillStyle = config.background;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

}

function splitLines(text){

    return text
        .replace(/\r/g,"")
        .split("\n")
        .map(v=>v.trim())
        .filter(v=>v.length);

}

function fitFont(lines){

    let size=config.maxFont;

    while(size>=config.minFont){

        ctx.font=`900 ${size}px ${config.fontFamily}`;

        let ok=true;

        for(const line of lines){

            const w=ctx.measureText(line).width;

            if(
                w>
                canvas.width-config.padding*2
            ){

                ok=false;
                break;

            }

        }

        if(ok)
            return size;

        size-=4;

    }

    return config.minFont;

}

function getStartY(count,fontSize){

    const totalHeight=
        count*
        fontSize*
        config.lineHeight;

    return (
        canvas.height-totalHeight
    )/2+fontSize*0.8;

}

function prepare(){

    clearCanvas();

    ctx.textAlign="center";
    ctx.textBaseline="alphabetic";
    ctx.lineJoin="round";
    ctx.lineCap="round";
    ctx.imageSmoothingEnabled=true;

}
// =====================================================
// BRUSH ENGINE
// =====================================================

function rand(a, b) {
    return a + Math.random() * (b - a);
}

function drawBrushStroke(text, x, y, size) {

    ctx.save();

    ctx.font = `900 ${size}px ${config.fontFamily}`;
    ctx.fillStyle = config.fill;
    ctx.strokeStyle = config.fill;

    // ---------- Lớp ruột ----------
    ctx.globalAlpha = 1;
    ctx.fillText(text, x, y);

    // ---------- Viền dày ----------
    ctx.lineWidth = size * 0.03;

    for (let i = 0; i < 12; i++) {

        ctx.globalAlpha = 0.22;

        ctx.strokeText(
            text,
            x + rand(-1.5, 1.5),
            y + rand(-1.5, 1.5)
        );

    }

    // ---------- Brush ----------
    for (let i = 0; i < 280; i++) {

        ctx.globalAlpha = rand(0.015, 0.05);

        ctx.lineWidth = rand(
            size * 0.01,
            size * 0.035
        );

        ctx.strokeText(
            text,
            x + rand(-4, 4),
            y + rand(-4, 4)
        );

    }

    // ---------- Heavy Brush ----------
    for (let i = 0; i < 140; i++) {

        ctx.globalAlpha = rand(0.03, 0.08);

        ctx.lineWidth = rand(
            size * 0.02,
            size * 0.05
        );

        ctx.strokeText(
            text,
            x + rand(-7, 7),
            y + rand(-7, 7)
        );

    }

    ctx.restore();

}
function renderBaseText() {

    prepare();

    const lines = splitLines(input.value);

    const fontSize = fitFont(lines);

    const startY = getStartY(
        lines.length,
        fontSize
    );

    for (let i = 0; i < lines.length; i++) {

        drawBrushStroke(

            lines[i],

            canvas.width / 2,

            startY +
                i *
                fontSize *
                config.lineHeight,

            fontSize

        );

    }

    applyTexture();

    roughEdge();

    addHeavyInk();

    sharpenImage();

}

// =====================================================
// TEXTURE ENGINE
// =====================================================

function addDryBrushTexture(){

    const img = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const d = img.data;

    for(let y=0;y<canvas.height;y++){

        for(let x=0;x<canvas.width;x++){

            const i=(y*canvas.width+x)*4;

            if(d[i+3]<5) continue;

            // Xác suất tạo lỗ trắng
            if(Math.random()<0.028){

                d[i+3]=0;
                continue;

            }

            // Làm nhám cạnh
            const n=(Math.random()-0.5)*36;

            d[i]+=n;
            d[i+1]+=n;
            d[i+2]+=n;

        }

    }

    ctx.putImageData(img,0,0);

}

function addInkNoise(){

    ctx.save();

    ctx.fillStyle="#000";

    for(let i=0;i<70000;i++){

        ctx.globalAlpha=Math.random()*0.03;

        ctx.fillRect(

            Math.random()*canvas.width,

            Math.random()*canvas.height,

            1+Math.random()*2,

            1+Math.random()*2

        );

    }

    ctx.restore();

}

function addBrushScratches(){

    ctx.save();

    ctx.strokeStyle="#000";

    for(let i=0;i<3500;i++){

        ctx.globalAlpha=Math.random()*0.05;

        ctx.lineWidth=Math.random()*2;

        const x=Math.random()*canvas.width;
        const y=Math.random()*canvas.height;

        const len=5+Math.random()*20;

        const a=Math.random()*Math.PI;

        ctx.beginPath();

        ctx.moveTo(x,y);

        ctx.lineTo(

            x+Math.cos(a)*len,

            y+Math.sin(a)*len

        );

        ctx.stroke();

    }

    ctx.restore();

}

function addInkBreak(){

    ctx.save();

    ctx.globalCompositeOperation="destination-out";

    for(let i=0;i<22000;i++){

        ctx.globalAlpha=Math.random()*0.12;

        ctx.beginPath();

        ctx.arc(

            Math.random()*canvas.width,

            Math.random()*canvas.height,

            Math.random()*2.4,

            0,

            Math.PI*2

        );

        ctx.fill();

    }

    ctx.restore();

}

function applyTexture(){

    addDryBrushTexture();

    addInkNoise();

    addBrushScratches();

    addInkBreak();

}
// ======================================================
// EDGE ENGINE
// ======================================================

function roughEdge() {

    ctx.save();

    ctx.strokeStyle = "#000";

    for (let i = 0; i < 1200; i++) {

        ctx.globalAlpha = Math.random() * 0.05;

        ctx.lineWidth = 0.5 + Math.random() * 3;

        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;

        ctx.beginPath();

        ctx.moveTo(
            x,
            y
        );

        ctx.lineTo(
            x + (Math.random() - 0.5) * 12,
            y + (Math.random() - 0.5) * 12
        );

        ctx.stroke();

    }

    ctx.restore();

}

function addHeavyInk() {

    ctx.save();

    ctx.fillStyle = "#000";

    for (let i = 0; i < 9000; i++) {

        ctx.globalAlpha = Math.random() * 0.025;

        ctx.beginPath();

        ctx.arc(

            Math.random() * canvas.width,

            Math.random() * canvas.height,

            Math.random() * 1.6,

            0,

            Math.PI * 2

        );

        ctx.fill();

    }

    ctx.restore();

}

function sharpenImage() {

    const img = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const d = img.data;

    for (let i = 0; i < d.length; i += 4) {

        if (d[i + 3] < 5)
            continue;

        d[i] = Math.min(255, d[i] * 1.12);
        d[i + 1] = Math.min(255, d[i + 1] * 1.12);
        d[i + 2] = Math.min(255, d[i + 2] * 1.12);

    }

    ctx.putImageData(img, 0, 0);

}

function exportPNG() {

    const a = document.createElement("a");

    a.download = "marker.png";

    a.href = canvas.toDataURL("image/png");

    a.click();

}
document
    .getElementById("save")
    .onclick = exportPNG;

btn.onclick = renderBaseText;

renderBaseText();
