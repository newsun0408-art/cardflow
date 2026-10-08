'use server';

import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import { parseReceiptOcrText, type ParsedReceiptResult, type ParsedTransactionEntry } from '@/features/transactions/utils/receipt-parser';

export type { ParsedReceiptResult, ParsedTransactionEntry };

function resolveWorkerPath(): string | undefined {
  const candidates = [
    path.resolve(process.cwd(), 'node_modules/tesseract.js/src/worker-script/node/index.js'),
    path.resolve(process.cwd(), '../../node_modules/.pnpm/tesseract.js@7.0.0/node_modules/tesseract.js/src/worker-script/node/index.js'),
    'D:/lehuynhthuan/cardflow/cardflow-app/apps/web/node_modules/tesseract.js/src/worker-script/node/index.js',
    'D:/lehuynhthuan/cardflow/cardflow-app/node_modules/.pnpm/tesseract.js@7.0.0/node_modules/tesseract.js/src/worker-script/node/index.js',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return undefined;
}

export async function scanReceiptAction(formData: FormData): Promise<ParsedReceiptResult> {
  let worker: any = null;
  try {
    const file = formData.get('file') as File | null;
    const base64Data = formData.get('base64') as string | null;

    if (!file && !base64Data) {
      return {
        success: false,
        merchant: '',
        amount: 0,
        category: 'other',
        categoryLabel: 'Khác',
        date: '',
        time: '',
        confidence: 0,
        error: 'Không tìm thấy tệp hình ảnh để quét.',
      };
    }

    console.log('[receipt-ocr-action] Starting OCR receipt processing...');
    let imageInput: Buffer;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      imageInput = Buffer.from(arrayBuffer);
    } else {
      const cleanBase64 = base64Data!.replace(/^data:image\/\w+;base64,/, '');
      imageInput = Buffer.from(cleanBase64, 'base64');
    }

    const workerPath = resolveWorkerPath();
    worker = await createWorker('vie+eng', 1, {
      workerPath,
      errorHandler: (err) => console.warn('[receipt-ocr-action] Tesseract notice', err),
    });

    const ocrResult = await worker.recognize(imageInput);
    const ocrText = ocrResult?.data?.text || '';
    console.log('[receipt-ocr-action] OCR raw text recognized, length:', ocrText.length);

    return parseReceiptOcrText(ocrText);
  } catch (err: any) {
    console.error('[receipt-ocr-action] Failed to run OCR receipt action:', err?.message || err);
    return {
      success: false,
      merchant: 'Điểm Bán / Hóa Đơn',
      amount: 0,
      category: 'dining',
      categoryLabel: 'Ăn uống',
      date: new Date().toISOString().split('T')[0] || '2026-10-05',
      time: '12:00',
      confidence: 0,
      error: 'Không thể nhận diện hình ảnh. Vui lòng thử lại với ảnh rõ nét hơn.',
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.warn('[receipt-ocr-action] Error terminating worker:', e);
      }
    }
  }
}
