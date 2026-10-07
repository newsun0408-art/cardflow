export interface ParsedTransactionEntry {
  merchant: string;
  amount: number;
  type: 'expense' | 'income';
  category: 'dining' | 'shopping' | 'transport' | 'tech' | 'housing' | 'investment' | 'other';
  categoryLabel: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  referenceNote?: string;
  confidence: number;
}

export interface ParsedReceiptResult {
  success: boolean;
  isHistoryList?: boolean; // True nếu nhận diện được là ảnh chụp danh sách lịch sử giao dịch (MoMo, Banking...)
  transactions?: ParsedTransactionEntry[]; // Danh sách các giao dịch bóc tách được (từ 1 đến N giao dịch)
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

// Phân loại danh mục thông minh theo tên giao dịch / merchant
export function detectCategoryFromTitle(title: string): {
  category: 'dining' | 'shopping' | 'transport' | 'tech' | 'housing' | 'investment' | 'other';
  categoryLabel: string;
} {
  const lower = title.toLowerCase();
  if (
    lower.includes('data') ||
    lower.includes('mobifone') ||
    lower.includes('viettel') ||
    lower.includes('vinaphone') ||
    lower.includes('điện thoại') ||
    lower.includes('nạp tiền điện thoại') ||
    lower.includes('fpt') ||
    lower.includes('tgdd') ||
    lower.includes('laptop') ||
    lower.includes('công nghệ')
  ) {
    return { category: 'tech', categoryLabel: 'Công nghệ / Viễn thông' };
  }
  if (
    lower.includes('bách hóa') ||
    lower.includes('siêu thị') ||
    lower.includes('winmart') ||
    lower.includes('co.op') ||
    lower.includes('shopee') ||
    lower.includes('lazada') ||
    lower.includes('tiki') ||
    lower.includes('mua sắm') ||
    lower.includes('mart')
  ) {
    return { category: 'shopping', categoryLabel: 'Mua sắm / Siêu thị' };
  }
  if (
    lower.includes('grab') ||
    lower.includes('be') ||
    lower.includes('gojek') ||
    lower.includes('xăng') ||
    lower.includes('petrolimex') ||
    lower.includes('taxi')
  ) {
    return { category: 'transport', categoryLabel: 'Di chuyển' };
  }
  if (
    lower.includes('trà') ||
    lower.includes('coffee') ||
    lower.includes('cà phê') ||
    lower.includes('highlands') ||
    lower.includes('phúc long') ||
    lower.includes('cơm') ||
    lower.includes('phở') ||
    lower.includes('bún') ||
    lower.includes('quán') ||
    lower.includes('nhà hàng') ||
    lower.includes('ăn uống') ||
    lower.includes('food')
  ) {
    return { category: 'dining', categoryLabel: 'Ăn uống' };
  }
  if (lower.includes('tiền điện') || lower.includes('tiền nước') || lower.includes('internet') || lower.includes('chung cư')) {
    return { category: 'housing', categoryLabel: 'Nhà cửa & Hóa đơn' };
  }
  if (lower.includes('chứng khoán') || lower.includes('tiết kiệm') || lower.includes('đầu tư') || lower.includes('cổ phiếu')) {
    return { category: 'investment', categoryLabel: 'Đầu tư' };
  }
  return { category: 'other', categoryLabel: 'Chuyển khoản / Khác' };
}

// Bóc tách danh sách giao dịch từ ảnh chụp màn hình ứng dụng ngân hàng / ví điện tử (MoMo, Techcombank, VCB...)
export function parseTransactionHistoryList(text: string): ParsedTransactionEntry[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ParsedTransactionEntry[] = [];

  // 1. Tìm năm và tháng mặc định từ tiêu đề (ví dụ "Tháng 10/2026")
  let defaultYear = new Date().getFullYear().toString();
  let defaultMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  for (const line of lines) {
    const monthYearMatch = line.match(/tháng\s*(\d{1,2})[\/\s,.-]+(\d{4})/i);
    if (monthYearMatch && monthYearMatch[1] && monthYearMatch[2]) {
      defaultMonth = monthYearMatch[1].padStart(2, '0');
      defaultYear = monthYearMatch[2];
      break;
    }
  }

  // 2. Quét qua các dòng để tìm các block giao dịch
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Bỏ qua dòng số dư ví, header chung
    if (line.match(/^số\s*dư/i) || line.match(/^tìm\s*kiếm/i) || line.match(/^tháng\s*\d+/i)) {
      continue;
    }

    // Kiểm tra xem dòng này có chứa số tiền giao dịch không (e.g. "-200.000đ", "+150.000đ", "-40.400")
    // Lưu ý: không lấy "Số dư ví: 214đ"
    const amountRegex = /(?:^|[^\w])([+-]\s*[0-9]{1,3}(?:[.,][0-9]{3})+)\s*(?:đ|vnd|d)?/i;
    let match = line.match(amountRegex);
    let merchantName = '';
    let amountVal = 0;
    let isIncome = false;

    if (match && match[1]) {
      const rawNum = match[1].replace(/\s+/g, '');
      isIncome = rawNum.startsWith('+');
      amountVal = Math.abs(parseInt(rawNum.replace(/[.,]/g, ''), 10));

      // Lấy tên merchant ở phía trước số tiền trên cùng 1 dòng
      merchantName = line.replace(amountRegex, '').replace(/số\s*dư[\s\S]*/i, '').trim();
    }

    // Nếu dòng này không có amount, nhưng dòng kế tiếp là amount
    if (!match && i + 1 < lines.length) {
      const nextLine = lines[i + 1]!;
      const nextMatch = nextLine.match(amountRegex);
      if (nextMatch && nextMatch[1] && !line.match(/^(ngày|giờ|\d{1,2}:)/i)) {
        match = nextMatch;
        const rawNum = nextMatch[1].replace(/\s+/g, '');
        isIncome = rawNum.startsWith('+');
        amountVal = Math.abs(parseInt(rawNum.replace(/[.,]/g, ''), 10));
        merchantName = line.replace(/số\s*dư[\s\S]*/i, '').trim();
      }
    }

    if (amountVal > 0 && merchantName.length >= 2) {
      // Dọn dẹp tên merchant
      merchantName = merchantName
        .replace(/^[•\-\s*#]+/g, '')
        .replace(/[,~=*\-—_]+$/g, '')
        .trim();

      // Tìm thời gian và ngày tháng ở dòng hiện tại hoặc 2 dòng xung quanh
      let time = '12:00';
      let date = `${defaultYear}-${defaultMonth}-01`;

      const searchWindow = [line, lines[i + 1] || '', lines[i + 2] || ''].join(' ');
      
      // Match "11:40 - 07/10" hoặc "08:29, 07/10/2026"
      const timeDateMatch = searchWindow.match(/(\d{1,2}:\d{2})\s*[-–—,]?\s*(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/);
      if (timeDateMatch && timeDateMatch[1] && timeDateMatch[2] && timeDateMatch[3]) {
        time = timeDateMatch[1];
        const day = timeDateMatch[2].padStart(2, '0');
        const month = timeDateMatch[3].padStart(2, '0');
        const year = timeDateMatch[4] ? (timeDateMatch[4].length === 2 ? `20${timeDateMatch[4]}` : timeDateMatch[4]) : defaultYear;
        date = `${year}-${month}-${day}`;
      } else {
        const timeOnly = searchWindow.match(/(\d{1,2}:\d{2})/);
        if (timeOnly && timeOnly[1]) time = timeOnly[1];
      }

      const catInfo = detectCategoryFromTitle(merchantName);

      // Tránh trùng lặp với giao dịch vừa thêm
      const isDuplicate = results.some(
        (r) => r.merchant === merchantName && r.amount === amountVal && r.time === time
      );

      if (!isDuplicate) {
        results.push({
          merchant: merchantName,
          amount: amountVal,
          type: isIncome ? 'income' : 'expense',
          category: catInfo.category,
          categoryLabel: catInfo.categoryLabel,
          date,
          time,
          confidence: 95,
        });
      }
    }
  }

  return results;
}

// Bóc tách thông minh từ văn bản OCR tiếng Việt & quốc tế
export function parseReceiptOcrText(text: string): ParsedReceiptResult {
  // 1. Kiểm tra trước xem có phải là dạng danh sách lịch sử giao dịch (App ngân hàng/MoMo) không
  const historyTransactions = parseTransactionHistoryList(text);
  if (historyTransactions.length >= 2) {
    const first = historyTransactions[0]!;
    return {
      success: true,
      isHistoryList: true,
      transactions: historyTransactions,
      merchant: first.merchant,
      amount: first.amount,
      category: first.category,
      categoryLabel: first.categoryLabel,
      date: first.date,
      time: first.time,
      confidence: 95,
      rawText: text,
    };
  }

  // 2. Nếu chỉ có 1 giao dịch hoặc là hóa đơn bán lẻ thông thường:
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 2.1. Tên điểm bán (Merchant Name): Tìm dòng tiêu đề gần đỉnh hóa đơn
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
        cleaned.toLowerCase().includes('chuyển đến') ||
        cleaned.toLowerCase().includes('thanh toán') ||
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

  // 2.2. Tổng số tiền (Amount): Tìm từ khóa TỔNG CỘNG, Tổng tiền, Thanh toán
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

  // 2.3. Ngày và Giờ (Date & Time)
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

  // 2.4. Phân loại danh mục
  const cat = detectCategoryFromTitle(merchant + ' ' + text);

  const singleEntry: ParsedTransactionEntry = {
    merchant,
    amount,
    type: 'expense',
    category: cat.category,
    categoryLabel: cat.categoryLabel,
    date,
    time,
    confidence: amount > 0 && merchant !== 'Điểm Bán / Hóa Đơn' ? 98 : 85,
  };

  return {
    success: true,
    isHistoryList: false,
    transactions: [singleEntry],
    merchant,
    amount,
    category: cat.category,
    categoryLabel: cat.categoryLabel,
    date,
    time,
    confidence: singleEntry.confidence,
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
