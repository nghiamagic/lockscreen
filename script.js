window.addEventListener('DOMContentLoaded', () => {
    // 1. Cấu hình tọa độ vùng viết chữ trên bảng trắng (Bản gốc base.png)
    const BOARD_CONFIG = {
        startX: 222,      // Tọa độ X góc trên bên trái vùng trắng
        startY: 532,      // Tọa độ Y góc trên bên trái vùng trắng
        width: 580,       // Chiều rộng tối đa của vùng viết chữ
        height: 300,      // Chiều cao tối đa của vùng viết chữ
        defaultFontSize: 42, // Cỡ chữ lớn nhất ban đầu
        minFontSize: 18,  // Cỡ chữ nhỏ nhất có thể co lại nếu chữ quá dài
        lineHeightRatio: 1.25, // Khoảng cách dòng
        fontFamily: '"Patrick Hand", "Sriracha", cursive',
        textColor: '#1a1a1a' // Màu mực bút lông đen hơi nhạt tự nhiên
    };

    // 2. Lấy tham số text từ URL (?text=Nội dung cần ghi)
    const urlParams = new URLSearchParams(window.location.search);
    let textToRender = urlParams.get('text') || "Chào bạn!\nHệ thống LPS đã sẵn sàng.";
    
    // Hỗ trợ ký tự xuống dòng thực tế \n nếu truyền từ Shortcut ngắt dòng
    textToRender = textToRender.replace(/\\n/g, '\n');

    const canvas = document.getElementById('lockscreenCanvas');
    const ctx = canvas.getContext('2d');
    const resultImg = document.getElementById('resultImage');
    const loadingDiv = document.getElementById('loading');

    // 3. Tải ảnh nền base.png
    const baseImage = new Image();
    baseImage.src = 'base.png'; // Đảm bảo tệp base.png nằm cùng thư mục

    baseImage.onload = () => {
        // Thiết lập kích thước canvas bằng chính xác kích thước ảnh gốc
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;

        // Vẽ ảnh gốc lên canvas trước
        ctx.drawImage(baseImage, 0, 0);

        // Tiến hành tính toán cấu trúc chữ viết và render
        renderTextWithAutoFit(ctx, textToRender, BOARD_CONFIG);

        // Xuất kết quả cuối cùng ra thẻ <img> dưới dạng PNG chất lượng cao
        resultImg.src = canvas.toDataURL('image/png');
        resultImg.style.display = 'block';
        loadingDiv.style.display = 'none';
    };

    baseImage.onerror = () => {
        loadingDiv.innerText = "Lỗi: Không thể tải ảnh nền base.png!";
    };
});

/**
 * Thuật toán tự động tính toán kích thước, xuống dòng và căn giữa chữ viết trên bảng
 */
function renderTextWithAutoFit(ctx, text, config) {
    let currentFontSize = config.defaultFontSize;
    let lines = [];
    let totalTextHeight = 0;

    // Tách các đoạn văn bản nếu người dùng chủ động nhấn xuống dòng trước
    const paragraphs = text.split('\n');

    // Vòng lặp hạ kích thước font chữ nếu tổng chiều cao vượt quá giới hạn bảng
    while (currentFontSize >= config.minFontSize) {
        ctx.font = `${currentFontSize}px ${config.fontFamily}`;
        lines = [];
        
        // Xử lý xuống dòng tự động cho từng đoạn văn bản dựa trên chiều rộng (Width)
        for (let i = 0; i < paragraphs.length; i++) {
            const words = paragraphs[i].split(' ');
            let currentLine = '';

            for (let n = 0; n < words.length; n++) {
                let testLine = currentLine + (currentLine ? ' ' : '') + words[n];
                let metrics = ctx.measureText(testLine);
                
                if (metrics.width > config.width && n > 0) {
                    lines.push(currentLine);
                    currentLine = words[n];
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
        }

        // Tính toán tổng chiều cao của toàn bộ các dòng chữ sau khi wrap
        const lineHeight = currentFontSize * config.lineHeightRatio;
        totalTextHeight = lines.length * lineHeight;

        // Nếu tổng chiều cao chữ nhỏ hơn chiều cao bảng, kích thước font này đã chuẩn
        if (totalTextHeight <= config.height) {
            break;
        }

        // Ngược lại, hạ cỡ chữ xuống 2 đơn vị và tính toán lại từ đầu
        currentFontSize -= 2;
    }

    // Thiết lập lại thuộc tính vẽ chữ cuối cùng
    ctx.font = `${currentFontSize}px ${config.fontFamily}`;
    ctx.fillStyle = config.textColor;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center'; // Căn giữa dòng chữ theo trục dọc X

    const lineHeight = currentFontSize * config.lineHeightRatio;
    
    // Tính toán điểm bắt đầu vẽ Y sao cho khối chữ nằm chính giữa bảng theo chiều dọc (Vertical Center)
    const centerYOffset = config.startY + (config.height - totalTextHeight) / 2;
    // Điểm chính giữa bảng theo chiều ngang
    const centerX = config.startX + (config.width / 2);

    // Tiến hành vẽ từng dòng lên canvas
    lines.forEach((line, index) => {
        const lineY = centerYOffset + (index * lineHeight);
        
        // Tạo một độ nghiêng chữ cực kỳ nhẹ (tầm 0.3 độ) cho tự nhiên giống người viết tay thật
        ctx.save();
        ctx.translate(centerX, lineY);
        ctx.rotate(0.005); // Góc xoay rất nhỏ tính bằng radian (~0.28 độ)
        ctx.fillText(line, 0, 0);
        ctx.restore();
    });
}
