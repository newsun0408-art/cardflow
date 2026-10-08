import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import { parseReceiptOcrText, type ParsedReceiptResult } from '@/features/transactions/utils/receipt-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

export async function POST(req: NextRequest) {
  let worker: any = null;
  try {
    let imageBuffer: Buffer | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const base64 = formData.get('base64') as string | null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else if (base64) {
        const clean = base64.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(clean, 'base64');
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.base64) {
        const clean = (body.base64 as string).replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(clean, 'base64');
      }
    }

    if (!imageBuffer) {
      return NextResponse.json<ParsedReceiptResult>(
        {
          success: false,
          merchant: 'Điểm Bán Hóa Đơn',
          amount: 0,
          category: 'dining',
          categoryLabel: 'Ăn uống',
          date: new Date().toISOString().split('T')[0] || '2026-10-05',
          time: '12:00',
          confidence: 0,
          error: 'Không tìm thấy dữ liệu ảnh để quét.',
        },
        { status: 400 }
      );
    }

    const workerPath = resolveWorkerPath();
    console.log('[api/receipt-ocr] Starting worker with path:', workerPath);

    worker = await createWorker('vie+eng', 1, {
      workerPath,
      errorHandler: (err) => console.warn('[api/receipt-ocr] Worker warning:', err),
    });

    const ocrResult = await worker.recognize(imageBuffer);
    const recognizedText = ocrResult?.data?.text || '';
    console.log('[api/receipt-ocr] Recognized text length:', recognizedText.length);

    const parsed = parseReceiptOcrText(recognizedText);
    return NextResponse.json<ParsedReceiptResult>(parsed);
  } catch (error: any) {
    console.error('[api/receipt-ocr] Error processing OCR:', error);
    return NextResponse.json<ParsedReceiptResult>(
      {
        success: false,
        merchant: 'Điểm Bán Hóa Đơn',
        amount: 0,
        category: 'dining',
        categoryLabel: 'Ăn uống',
        date: new Date().toISOString().split('T')[0] || '2026-10-05',
        time: '12:00',
        confidence: 0,
        error: error?.message || 'Lỗi xử lý OCR hóa đơn',
      },
      { status: 500 }
    );
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (termErr) {
        console.warn('[api/receipt-ocr] Error terminating worker:', termErr);
      }
    }
  }
}
