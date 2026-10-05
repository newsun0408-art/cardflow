export interface ParsedReceiptResult {
  success: boolean;
  merchant: string;
  amount: number;
  category: 'dining' | 'shopping' | 'transport' | 'tech' | 'housing' | 'investment' | 'other';
  categoryLabel: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  confidence: number;
  rawText?: string;
  error?: string;
}

// Bóc tách thông minh từ văn bản OCR tiếng Việt & quốc tế
export function parseReceiptOcrText(text: string): ParsedReceiptResult {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Tên điểm bán (Merchant Name): Tìm dòng tiêu đề gần đỉnh hóa đơn
  let merchant = '';
  for (const line of lines) {
    const cleaned = line
      .replace(/^[0-9=\-—_~.`\s*]+/g, '')
      .replace(/[,~=*\-—_]+$/g, '')
      .trim();

    if (
      cleaned.length >= 3 &&
      !cleaned.match(/^(số\s*hđ|hóa\s*đơn|thu\s*ngân|ngày|giờ|stt|tên\s*món|cảm\s*ơn|phiếu|bill|receipt|tel|phone|địa\s*chỉ)/i) &&
      !cleaned.match(/^số\s*\d+/i) &&
      !cleaned.match(/^(tra sua|trà sữa|trà trái cây|ăn vặt|cafe|coffee|menu)/i)
    ) {
      if (
        cleaned.toLowerCase().includes('tiệm') ||
        cleaned.toLowerCase().includes('trà') ||
        cleaned.toLowerCase().includes('coffee') ||
        cleaned.toLowerCase().includes('highlands') ||
        cleaned.toLowerCase().includes('phúc long') ||
        cleaned.toLowerCase().includes('winmart') ||
        cleaned.toLowerCase().includes('co.opmart') ||
        cleaned.toLowerCase().includes('petrolimex') ||
        cleaned.toLowerCase().includes('nhà hàng') ||
        cleaned.toLowerCase().includes('quán') ||
        cleaned.toLowerCase().includes('mart') ||
        cleaned.toLowerCase().includes('công ty') ||
        !merchant
      ) {
        merchant = cleaned;
        if (
          cleaned.toLowerCase().includes('tiệm') ||
          cleaned.toLowerCase().includes('trà') ||
          cleaned.toLowerCase().includes('coffee') ||
          cleaned.toLowerCase().includes('mart') ||
          cleaned.toLowerCase().includes('petrolimex')
        ) {
          break;
        }
      }
    }
  }

  if (!merchant) {
    merchant = 'Điểm Bán / Hóa Đơn';
  }

  // 2. Tổng số tiền (Amount): Tìm từ khóa TỔNG CỘNG, Tổng tiền, Thanh toán
  let amount = 0;
  const totalRegexList = [
    /tổng\s*cộng[\s:]*([0-9.,]+)/i,
    /tổng\s*tiền\s*(?:hàng|thanh\s*toán)?[\s:]*([0-9.,]+)/i,
    /thanh\s*toán[\s:]*([0-9.,]+)/i,
    /total[\s:]*([0-9.,]+)/i,
    /cộng\s*tiền\s*hàng[\s:]*([0-9.,]+)/i,
    /grand\s*total[\s:]*([0-9.,]+)/i,
  ];

  for (const regex of totalRegexList) {
    const match = text.match(regex);
    if (match && match[1]) {
      const parsed = parseInt(match[1].replace(/[.,]/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // Quét tất cả số tiền có định dạng hàng nghìn (.000 hoặc ,000) và lấy số lớn nhất hợp lý
  if (amount === 0) {
    const allPrices = Array.from(text.matchAll(/([0-9]{1,3}(?:[.,][0-9]{3})+)/g))
      .map((m) => (m && m[1] ? parseInt(m[1].replace(/[.,]/g, ''), 10) : NaN))
      .filter((n) => !isNaN(n) && n >= 1000 && n <= 100000000);

    if (allPrices.length > 0) {
      amount = Math.max(...allPrices);
    }
  }

  // 3. Ngày và Giờ (Date & Time)
  let date = new Date().toISOString().split('T')[0] || '2026-10-05';
  const dateMatch = text.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (dateMatch && dateMatch[1] && dateMatch[2] && dateMatch[3]) {
    const d = dateMatch[1].padStart(2, '0');
    const m = dateMatch[2].padStart(2, '0');
    const y = dateMatch[3];
    date = `${y}-${m}-${d}`;
  }

  let time = '12:00';
  const timeMatch = text.match(/(\d{1,2}:\d{2})/);
  if (timeMatch && timeMatch[1]) {
    time = timeMatch[1];
  }

  // 4. Phân loại danh mục tự động (Category Classification)
  const lower = text.toLowerCase();
  let category: ParsedReceiptResult['category'] = 'other';
  let categoryLabel = 'Khác';

  if (
    lower.includes('trà') ||
    lower.includes('sữa') ||
    lower.includes('cà phê') ||
    lower.includes('coffee') ||
    lower.includes('ăn vặt') ||
    lower.includes('bánh tráng') ||
    lower.includes('quán') ||
    lower.includes('món') ||
    lower.includes('nhà hàng') ||
    lower.includes('food') ||
    lower.includes('phở') ||
    lower.includes('cơm') ||
    lower.includes('bún')
  ) {
    category = 'dining';
    categoryLabel = 'Ăn uống';
  } else if (
    lower.includes('siêu thị') ||
    lower.includes('mart') ||
    lower.includes('mua sắm') ||
    lower.includes('thực phẩm') ||
    lower.includes('quần áo') ||
    lower.includes('shopee')
  ) {
    category = 'shopping';
    categoryLabel = 'Mua sắm';
  } else if (
    lower.includes('xăng') ||
    lower.includes('petrolimex') ||
    lower.includes('pvoil') ||
    lower.includes('grab') ||
    lower.includes('be') ||
    lower.includes('taxi')
  ) {
    category = 'transport';
    categoryLabel = 'Di chuyển';
  } else if (
    lower.includes('điện thoại') ||
    lower.includes('laptop') ||
    lower.includes('công nghệ') ||
    lower.includes('fpt') ||
    lower.includes('tgdd')
  ) {
    category = 'tech';
    categoryLabel = 'Công nghệ';
  }

  return {
    success: true,
    merchant,
    amount,
    category,
    categoryLabel,
    date,
    time,
    confidence: amount > 0 && merchant !== 'Điểm Bán / Hóa Đơn' ? 98 : 85,
    rawText: text,
  };
}

// Hàm nén ảnh trên trình duyệt trước khi gửi lên OCR server
export function compressImageForOcr(dataUrl: string, maxDim = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
