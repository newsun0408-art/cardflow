'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CameraOutlined,
  UploadOutlined,
  ScanOutlined,
  CheckCircleFilled,
  CloseOutlined,
  ThunderboltFilled,
  CoffeeOutlined,
  ShoppingOutlined,
  CarOutlined,
  VideoCameraOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  SyncOutlined,
  MobileOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  CreditCardOutlined,
  PlusOutlined,
  PictureOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { CardDataModel } from '@/app/_components/AddCardModal';
import type { TransactionItem } from '../types';
import { scanReceiptAction } from '@/app/actions/receipt-ocr';
import { compressImageForOcr, type ParsedReceiptResult } from '../utils/receipt-parser';
import { formatTransactionDate } from '../dateUtils';

export interface ScannedReceiptData {
  merchant: string;
  amount: number;
  category: TransactionItem['category'];
  categoryLabel: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  suggestedCardId: string;
  suggestedCardName: string;
  confidence: number;
  rawItems: { name: string; price: number; qty?: number }[];
  receiptPreviewUrl?: string;
  sampleType?: string;
}

export interface BatchReceiptItem {
  id: string;
  fileName: string;
  dataUrl: string;
  status: 'scanning' | 'success' | 'failed';
  progress: number;
  merchant: string;
  amount: number;
  category: TransactionItem['category'];
  categoryLabel: string;
  date: string;
  time: string;
  selectedCardId: string;
  confidence: number;
  rawItems?: { name: string; price: number; qty?: number }[];
}

export interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardDataModel[];
  onApplyToForm: (scanned: ScannedReceiptData) => void;
  onQuickSaveTransaction: (tx: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>) => void;
  onQuickSaveBatchTransactions?: (txs: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>[]) => void;
  onToast: (msg: string) => void;
}

interface SampleReceiptPreset {
  id: string;
  title: string;
  icon: React.ReactNode;
  tag: string;
  merchant: string;
  amount: number;
  category: TransactionItem['category'];
  categoryLabel: string;
  date: string;
  time: string;
  items: { name: string; price: number; qty: number }[];
  address: string;
  headerColor: string;
  isHistory?: boolean;
  historyTransactions?: {
    merchant: string;
    amount: number;
    category: TransactionItem['category'];
    categoryLabel: string;
    date: string;
    time: string;
  }[];
}

const SAMPLE_PRESETS: SampleReceiptPreset[] = [
  {
    id: 'momo-history',
    title: 'Lịch Sử Ví MoMo (7 GD)',
    icon: <MobileOutlined style={{ color: '#d946ef' }} />,
    tag: 'Ảnh Chụp Lịch Sử',
    merchant: 'Lịch Sử Ví MoMo - Tháng 10/2026',
    amount: 487200,
    category: 'other',
    categoryLabel: 'Lịch sử giao dịch',
    date: '2026-10-07',
    time: '11:40',
    isHistory: true,
    historyTransactions: [
      {
        merchant: 'Chuyển đến Lê Huỳnh Thuận',
        amount: 200000,
        category: 'other',
        categoryLabel: 'Chuyển khoản',
        date: '2026-10-07',
        time: '11:40',
      },
      {
        merchant: 'Chuyển đến NGUYEN LE DAI AN (Techcombank)',
        amount: 148000,
        category: 'other',
        categoryLabel: 'Chuyển khoản',
        date: '2026-10-07',
        time: '08:29',
      },
      {
        merchant: 'Nạp Data MobiFone',
        amount: 8800,
        category: 'tech',
        categoryLabel: 'Viễn thông',
        date: '2026-10-06',
        time: '18:51',
      },
      {
        merchant: 'Thanh toán BÁCH HÓA XANH',
        amount: 40400,
        category: 'shopping',
        categoryLabel: 'Siêu thị',
        date: '2026-10-06',
        time: '10:15',
      },
      {
        merchant: 'Thanh toán cho LE HUNG THINH (Techcombank)',
        amount: 62000,
        category: 'other',
        categoryLabel: 'Chuyển khoản',
        date: '2026-10-04',
        time: '11:54',
      },
      {
        merchant: 'Nạp Data Viettel',
        amount: 8000,
        category: 'tech',
        categoryLabel: 'Viễn thông',
        date: '2026-10-03',
        time: '21:44',
      },
      {
        merchant: 'Nạp tiền điện thoại Vinaphone',
        amount: 20000,
        category: 'tech',
        categoryLabel: 'Nạp tiền ĐT',
        date: '2026-10-01',
        time: '12:14',
      },
    ],
    items: [
      { name: 'Chuyển đến Lê Huỳnh Thuận', price: 200000, qty: 1 },
      { name: 'Chuyển đến NGUYEN LE DAI AN', price: 148000, qty: 1 },
      { name: 'Nạp Data MobiFone', price: 8800, qty: 1 },
      { name: 'Thanh toán BÁCH HÓA XANH', price: 40400, qty: 1 },
      { name: 'Thanh toán LE HUNG THINH', price: 62000, qty: 1 },
      { name: 'Nạp Data Viettel', price: 8000, qty: 1 },
      { name: 'Nạp tiền điện thoại Vinaphone', price: 20000, qty: 1 },
    ],
    address: 'Ảnh chụp màn hình Lịch sử giao dịch MoMo Tháng 10/2026',
    headerColor: '#c026d3',
  },
  {
    id: 'highlands',
    title: 'Highlands Coffee',
    icon: <CoffeeOutlined style={{ color: '#f59e0b' }} />,
    tag: 'Ăn uống',
    merchant: 'Highlands Coffee - Vincom Center',
    amount: 89000,
    category: 'dining',
    categoryLabel: 'Ăn uống',
    date: new Date().toISOString().split('T')[0] || '2026-10-05',
    time: '09:15',
    items: [
      { name: 'Phin Sữa Đá (Lớn)', price: 45000, qty: 1 },
      { name: 'Trà Sen Vàng (Vừa)', price: 44000, qty: 1 },
    ],
    address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM',
    headerColor: '#b45309',
  },
  {
    id: 'winmart',
    title: 'Siêu thị WinMart',
    icon: <ShoppingOutlined style={{ color: '#ec4899' }} />,
    tag: 'Mua sắm',
    merchant: 'WinMart Thảo Điền Pearl',
    amount: 485000,
    category: 'shopping',
    categoryLabel: 'Mua sắm',
    date: new Date().toISOString().split('T')[0] || '2026-10-05',
    time: '17:45',
    items: [
      { name: 'Thịt Ba Rọi Heo CP 500g', price: 95000, qty: 2 },
      { name: 'Sữa Tươi Tiệt Trùng TH 1L', price: 38000, qty: 2 },
      { name: 'Táo Envy New Zealand (Kg)', price: 179000, qty: 1 },
      { name: 'Bánh Mì Sandwich Gối', price: 40000, qty: 1 },
    ],
    address: '12 Quốc Hương, Thảo Điền, TP. Thủ Đức',
    headerColor: '#be123c',
  },
  {
    id: 'petrolimex',
    title: 'Cây xăng Petrolimex',
    icon: <CarOutlined style={{ color: '#38bdf8' }} />,
    tag: 'Di chuyển',
    merchant: 'Petrolimex - Cửa Hàng Xăng Dầu Số 01',
    amount: 500000,
    category: 'transport',
    categoryLabel: 'Di chuyển',
    date: new Date().toISOString().split('T')[0] || '2026-10-05',
    time: '08:20',
    items: [
      { name: 'Xăng RON 95-V (20.92 lít x 23.900đ)', price: 500000, qty: 1 },
    ],
    address: '136 Hai Bà Trưng, Đa Kao, Quận 1, TP.HCM',
    headerColor: '#0284c7',
  },
  {
    id: 'cgv',
    title: 'Rạp Chiếu Phim CGV',
    icon: <VideoCameraOutlined style={{ color: '#8b5cf6' }} />,
    tag: 'Giải trí',
    merchant: 'CGV Cinemas Landmark 81',
    amount: 230000,
    category: 'dining',
    categoryLabel: 'Giải trí',
    date: new Date().toISOString().split('T')[0] || '2026-10-05',
    time: '20:10',
    items: [
      { name: 'Vé 2D Starium (Ghế VIP)', price: 130000, qty: 1 },
      { name: 'My Combo Bắp + Nước ngọt', price: 100000, qty: 1 },
    ],
    address: 'Tầng B1, Landmark 81, Bình Thạnh, TP.HCM',
    headerColor: '#6d28d9',
  },
];

export function ReceiptScannerModal({
  isOpen,
  onClose,
  cards,
  onApplyToForm,
  onQuickSaveTransaction,
  onQuickSaveBatchTransactions,
  onToast,
}: ReceiptScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'sample' | 'camera'>('upload');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('highlands');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('Đang khởi động AI Vision Scanner...');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScannedReceiptData | null>(null);
  const [editableMerchant, setEditableMerchant] = useState('');
  const [editableAmount, setEditableAmount] = useState<number>(0);
  const [editableCategory, setEditableCategory] = useState<TransactionItem['category']>('dining');
  const [editableCardId, setEditableCardId] = useState<string>('');

  // Batch Multi-Image State
  const [batchQueue, setBatchQueue] = useState<BatchReceiptItem[]>([]);
  const [batchGlobalCardId, setBatchGlobalCardId] = useState<string>('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Camera states & refs
  const [, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [, setIsCameraStarting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Tìm thẻ tối ưu nhất phù hợp với danh mục
  const findBestCardForCategory = useCallback((category: TransactionItem['category']): CardDataModel => {
    const matched = cards.find((c) => {
      if (category === 'dining' && (c.purpose === 'dining' || c.nickname.toLowerCase().includes('ăn'))) return true;
      if (category === 'shopping' && (c.purpose === 'shopping' || c.nickname.toLowerCase().includes('mua'))) return true;
      if (category === 'transport' && (c.purpose === 'travel' || c.nickname.toLowerCase().includes('xăng') || c.nickname.toLowerCase().includes('xe'))) return true;
      if (category === 'tech' && (c.purpose === 'tech' || c.nickname.toLowerCase().includes('công nghệ'))) return true;
      return false;
    });

    if (matched) return matched;
    const defaultCard = cards.find((c) => c.isDefault);
    return defaultCard || cards[0] || ({ id: 'card-1', nickname: 'Thẻ Mặc Định', lastFourDigits: '9921', bankName: 'Cardflow Bank' } as any);
  }, [cards]);

  // Set default editable card when cards are available
  useEffect(() => {
    if (cards.length > 0 && !editableCardId && cards[0]) {
      setEditableCardId(cards[0].id);
      setBatchGlobalCardId(cards[0].id);
    }
  }, [cards, editableCardId]);

  // Dừng camera
  const stopCamera = useCallback(() => {
    setCameraStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((t) => t.stop());
      }
      return null;
    });
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Khởi động camera
  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    setCameraError(null);
    setIsCameraStarting(true);

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Trình duyệt không hỗ trợ trực tiếp. Vui lòng bấm nút "Mở Máy Ảnh Điện Thoại" bên dưới.');
        setIsCameraStarting(false);
        return;
      }

      setCameraStream((prev) => {
        if (prev) prev.getTracks().forEach((t) => t.stop());
        return null;
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setCameraStream(stream);
      setCameraFacingMode(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setCameraError('Không thể mở camera. Bạn có thể bấm nút "Mở Máy Ảnh Điện Thoại" để chụp từ ứng dụng máy ảnh gốc.');
    } finally {
      setIsCameraStarting(false);
    }
  }, []);

  // Quản lý camera khi đổi tab
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera(cameraFacingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera, cameraFacingMode]);

  // Gọi OCR xử lý dataURL
  const scanDataUrlWithAi = async (dataUrl: string): Promise<ParsedReceiptResult> => {
    const compressedDataUrl = await compressImageForOcr(dataUrl, 1600, 0.85);
    try {
      const response = await fetch('/api/receipt-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: compressedDataUrl }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {}

    const formData = new FormData();
    formData.append('base64', compressedDataUrl);
    return await scanReceiptAction(formData);
  };

  // Vẽ mô phỏng ảnh hóa đơn / ảnh lịch sử giao dịch canvas
  const generateSampleReceiptDataUrl = useCallback((preset: SampleReceiptPreset): string => {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    if (preset.isHistory) {
      canvas.width = 540;
      canvas.height = 960;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 540, 960);

      // Status Bar
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('14:10', 36, 32);
      ctx.font = '14px sans-serif';
      ctx.fillText('📶 5G  🔋 41%', 430, 32);

      // Search Bar
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(24, 52, 492, 44, 22);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = '15px sans-serif';
      ctx.fillText('🔍 Tìm kiếm giao dịch', 44, 80);

      // Header Tháng 10/2026
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Tháng 10/2026', 24, 134);

      const txs = preset.historyTransactions || [];
      let currentY = 175;

      for (let i = 0; i < txs.length; i++) {
        const tx = txs[i]!;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(48, currentY + 12, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '16px sans-serif';
        const iconChar = tx.category === 'tech' ? '📱' : tx.category === 'shopping' ? '🛒' : '💸';
        ctx.fillText(iconChar, 38, currentY + 18);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        const displayTitle = tx.merchant.length > 25 ? tx.merchant.slice(0, 24) + '...' : tx.merchant;
        ctx.fillText(displayTitle, 82, currentY + 8);

        ctx.fillStyle = '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText(`${tx.time} - ${tx.date.split('-').slice(1).reverse().join('/')}`, 82, currentY + 28);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`-${tx.amount.toLocaleString('vi-VN')}đ`, 516, currentY + 8);
        ctx.textAlign = 'left';

        ctx.strokeStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(82, currentY + 44);
        ctx.lineTo(516, currentY + 44);
        ctx.stroke();

        currentY += 76;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 880, 540, 80);
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(0, 880);
      ctx.lineTo(540, 880);
      ctx.stroke();

      ctx.fillStyle = '#d946ef';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📅 Giao dịch', 270, 928);
      ctx.textAlign = 'left';

      return canvas.toDataURL('image/jpeg', 0.92);
    }

    canvas.width = 460;
    canvas.height = 620;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 460, 620);

    ctx.fillStyle = preset.headerColor || '#0284c7';
    ctx.fillRect(0, 0, 460, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(preset.merchant.slice(0, 26), 230, 48);

    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.fillText(preset.address, 230, 110);
    ctx.fillText(`Ngày: ${preset.date} — Giờ: ${preset.time}`, 230, 130);

    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, 150);
    ctx.lineTo(430, 150);
    ctx.stroke();
    ctx.setLineDash([]);

    let y = 180;
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#0f172a';

    for (const it of preset.items) {
      ctx.fillText(`${it.qty}x ${it.name}`, 36, y);
      ctx.textAlign = 'right';
      ctx.fillText(`${(it.price * it.qty).toLocaleString('vi-VN')}đ`, 424, y);
      ctx.textAlign = 'left';
      y += 32;
    }

    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, y + 10);
    ctx.lineTo(430, y + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    y += 40;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('TỔNG CỘNG:', 36, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0284c7';
    ctx.fillText(`${preset.amount.toLocaleString('vi-VN')} VNĐ`, 424, y);
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  // Quét preset mẫu
  const runPresetScan = useCallback((presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId) || SAMPLE_PRESETS[0];
    if (!preset) return;

    setIsScanning(true);
    setScanProgress(20);
    setScanStepMessage('Đang phát hiện vùng biên ảnh...');
    setScanResult(null);

    const timer = setTimeout(() => {
      const generatedImg = generateSampleReceiptDataUrl(preset);
      setImagePreview(generatedImg);

      // Nếu là mẫu lịch sử giao dịch (MoMo): tự động mở Batch Queue với 7 giao dịch
      if (preset.isHistory && preset.historyTransactions) {
        const batchItems: BatchReceiptItem[] = preset.historyTransactions.map((tx, idx) => {
          const card = findBestCardForCategory(tx.category);
          return {
            id: `sample-momo-${idx}`,
            fileName: `Lịch sử MoMo (#${idx + 1})`,
            dataUrl: generatedImg,
            status: 'success',
            progress: 100,
            merchant: tx.merchant,
            amount: tx.amount,
            category: tx.category,
            categoryLabel: tx.categoryLabel,
            date: tx.date,
            time: tx.time,
            selectedCardId: card.id,
            confidence: 99,
          };
        });

        setBatchQueue(batchItems);
        setIsScanning(false);
        onToast(`📱 AI đã bóc tách thành công 7 giao dịch từ ảnh lịch sử ví MoMo!`);
        return;
      }

      // Nếu là mẫu đơn lẻ
      const bestCard = findBestCardForCategory(preset.category);
      const result: ScannedReceiptData = {
        merchant: preset.merchant,
        amount: preset.amount,
        category: preset.category,
        categoryLabel: preset.categoryLabel,
        date: preset.date,
        time: preset.time,
        suggestedCardId: bestCard.id,
        suggestedCardName: `${bestCard.bankName || 'Ngân Hàng'} (${bestCard.lastFourDigits})`,
        confidence: 98,
        rawItems: preset.items,
        sampleType: preset.id,
        receiptPreviewUrl: generatedImg,
      };

      setScanResult(result);
      setEditableMerchant(result.merchant);
      setEditableAmount(result.amount);
      setEditableCategory(result.category);
      setEditableCardId(result.suggestedCardId);
      setIsScanning(false);
      onToast(`✨ AI đã quét thành công hóa đơn mẫu: ${preset.title}!`);
    }, 900);

    return () => clearTimeout(timer);
  }, [findBestCardForCategory, generateSampleReceiptDataUrl, onToast]);

  // Quét 1 ảnh riêng lẻ
  const scanSingleUploadedImage = async (dataUrl: string) => {
    setIsScanning(true);
    setScanProgress(25);
    setScanStepMessage('Đang nén & tối ưu hóa độ nét ảnh...');
    setScanResult(null);

    try {
      setScanProgress(50);
      setScanStepMessage('AI đang nhận diện chữ & bóc tách giao dịch...');
      const res = await scanDataUrlWithAi(dataUrl);

      // NẾU ẢNH LÀ MÀN HÌNH LỊCH SỬ GIAO DỊCH (NHIỀU GD) -> TỰ ĐỘNG CHUYỂN SANG BATCH QUEUE
      if (res.isHistoryList && res.transactions && res.transactions.length > 1) {
        const batchItems: BatchReceiptItem[] = res.transactions.map((txEntry, idx) => {
          const card = findBestCardForCategory(txEntry.category);
          return {
            id: `single-multi-${Date.now()}-${idx}`,
            fileName: `Giao dịch #${idx + 1}`,
            dataUrl,
            status: 'success',
            progress: 100,
            merchant: txEntry.merchant,
            amount: txEntry.amount,
            category: txEntry.category,
            categoryLabel: txEntry.categoryLabel,
            date: txEntry.date,
            time: txEntry.time,
            selectedCardId: card.id,
            confidence: txEntry.confidence || 95,
          };
        });

        setBatchQueue(batchItems);
        setIsScanning(false);
        onToast(`📱 AI đã bóc tách thành công ${res.transactions.length} giao dịch từ ảnh lịch sử!`);
        return;
      }

      setScanProgress(90);
      setScanStepMessage('Đang phân loại danh mục & đối soát thẻ...');

      const category = res.category || 'dining';
      const bestCard = findBestCardForCategory(category);
      const merchant = res.merchant && res.merchant !== 'Điểm Bán / Hóa Đơn' ? res.merchant : 'Điểm Bán Hóa Đơn';
      const amount = res.amount > 0 ? res.amount : 100000;

      const result: ScannedReceiptData = {
        merchant,
        amount,
        category,
        categoryLabel: res.categoryLabel || 'Ăn uống',
        date: res.date || new Date().toISOString().split('T')[0] || '2026-10-05',
        time: res.time || '12:00',
        suggestedCardId: bestCard.id,
        suggestedCardName: `${bestCard.bankName || 'Ngân Hàng'} (${bestCard.lastFourDigits})`,
        confidence: res.confidence || 95,
        rawItems: [{ name: merchant, price: amount, qty: 1 }],
        receiptPreviewUrl: dataUrl,
      };

      setScanResult(result);
      setEditableMerchant(result.merchant);
      setEditableAmount(result.amount);
      setEditableCategory(result.category);
      setEditableCardId(result.suggestedCardId);
      onToast(`✨ AI đã bóc tách: ${result.merchant} (${result.amount.toLocaleString('vi-VN')} VNĐ)!`);
    } catch {
      const bestCard = findBestCardForCategory('dining');
      const fallbackResult: ScannedReceiptData = {
        merchant: 'Hóa Đơn Mới',
        amount: 100000,
        category: 'dining',
        categoryLabel: 'Ăn uống',
        date: new Date().toISOString().split('T')[0] || '2026-10-05',
        time: '12:00',
        suggestedCardId: bestCard.id,
        suggestedCardName: `${bestCard.bankName || 'Ngân Hàng'} (${bestCard.lastFourDigits})`,
        confidence: 88,
        rawItems: [{ name: 'Hóa Đơn', price: 100000, qty: 1 }],
        receiptPreviewUrl: dataUrl,
      };
      setScanResult(fallbackResult);
      setEditableMerchant(fallbackResult.merchant);
      setEditableAmount(fallbackResult.amount);
      setEditableCategory(fallbackResult.category);
      setEditableCardId(fallbackResult.suggestedCardId);
      onToast('📸 Đã nhận diện ảnh (vui lòng kiểm tra lại thông tin)');
    } finally {
      setIsScanning(false);
    }
  };

  // XỬ LÝ CHỌN NHIỀU ẢNH (Multi-Image Files)
  const handleMultipleFiles = async (filesList: FileList | File[]) => {
    const files = Array.from(filesList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      onToast('⚠️ Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP)');
      return;
    }

    setActiveTab('upload');

    // Đọc tất cả ảnh sang dataURL
    const newItems: BatchReceiptItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const defaultCard = cards[0] || ({ id: 'card-1', bankName: 'Cardflow Bank', lastFourDigits: '9921' } as any);
      newItems.push({
        id: `batch-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        fileName: file.name,
        dataUrl,
        status: 'scanning',
        progress: 25,
        merchant: 'Đang bóc tách AI...',
        amount: 0,
        category: 'dining',
        categoryLabel: 'Ăn uống',
        date: new Date().toISOString().split('T')[0] || '2026-10-05',
        time: '12:00',
        selectedCardId: defaultCard.id,
        confidence: 0,
      });
    }

    // Nếu chỉ có 1 ảnh và chưa có batch nào: quét thử
    if (files.length === 1 && batchQueue.length === 0 && newItems[0]) {
      setImagePreview(newItems[0].dataUrl);
      scanSingleUploadedImage(newItems[0].dataUrl);
      return;
    }

    // Thêm vào Batch Queue
    setBatchQueue((prev) => [...prev, ...newItems]);
    onToast(`📸 Đang bóc tách ${newItems.length} ảnh cùng lúc...`);

    // Quét từng ảnh trong batch
    for (const item of newItems) {
      try {
        const res = await scanDataUrlWithAi(item.dataUrl);

        // NẾU ẢNH NÀY CHỨA NHIỀU GIAO DỊCH (Lịch sử GD ngân hàng/ví):
        if (res.isHistoryList && res.transactions && res.transactions.length > 1) {
          const expanded: BatchReceiptItem[] = res.transactions.map((txEntry, subIdx) => {
            const card = findBestCardForCategory(txEntry.category);
            return {
              id: `${item.id}-tx-${subIdx}`,
              fileName: `${item.fileName} (#${subIdx + 1})`,
              dataUrl: item.dataUrl,
              status: 'success',
              progress: 100,
              merchant: txEntry.merchant,
              amount: txEntry.amount,
              category: txEntry.category,
              categoryLabel: txEntry.categoryLabel,
              date: txEntry.date,
              time: txEntry.time,
              selectedCardId: card.id,
              confidence: txEntry.confidence || 95,
            };
          });

          setBatchQueue((prev) => {
            const idx = prev.findIndex((b) => b.id === item.id);
            if (idx !== -1) {
              const copy = [...prev];
              copy.splice(idx, 1, ...expanded);
              return copy;
            }
            return [...prev, ...expanded];
          });
        } else {
          // Chỉ chứa 1 giao dịch
          const category = res.category || 'dining';
          const bestCard = findBestCardForCategory(category);
          const merchant = res.merchant && res.merchant !== 'Điểm Bán / Hóa Đơn' ? res.merchant : 'Hóa Đơn ' + item.fileName.replace(/\.[^/.]+$/, '');
          const amount = res.amount > 0 ? res.amount : 100000;

          setBatchQueue((prev) =>
            prev.map((b) =>
              b.id === item.id
                ? {
                    ...b,
                    status: 'success',
                    progress: 100,
                    merchant,
                    amount,
                    category,
                    categoryLabel: res.categoryLabel || 'Ăn uống',
                    date: res.date || new Date().toISOString().split('T')[0] || '2026-10-05',
                    time: res.time || '12:00',
                    selectedCardId: bestCard.id,
                    confidence: res.confidence || 95,
                  }
                : b
            )
          );
        }
      } catch {
        const bestCard = findBestCardForCategory('dining');
        setBatchQueue((prev) =>
          prev.map((b) =>
            b.id === item.id
              ? {
                  ...b,
                  status: 'success',
                  progress: 100,
                  merchant: 'Hóa Đơn ' + item.fileName.replace(/\.[^/.]+$/, ''),
                  amount: 100000,
                  category: 'dining',
                  categoryLabel: 'Ăn uống',
                  date: new Date().toISOString().split('T')[0] || '2026-10-05',
                  time: '12:00',
                  selectedCardId: bestCard.id,
                  confidence: 85,
                }
              : b
          )
        );
      }
    }
  };

  // Chụp ảnh từ camera video frame
  const captureFromVideo = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      onToast('⚠️ Camera đang khởi động, vui lòng thử lại sau giây lát');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCamera();
    setImagePreview(dataUrl);
    setActiveTab('upload');
    scanSingleUploadedImage(dataUrl);
  }, [stopCamera, onToast]);

  // Cập nhật thẻ được chọn cho 1 ảnh trong batch
  const handleUpdateBatchCard = (itemId: string, cardId: string) => {
    setBatchQueue((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, selectedCardId: cardId } : item))
    );
  };

  // Cập nhật thẻ chung cho TẤT CẢ ảnh trong batch
  const handleApplyCardToAllBatch = (cardId: string) => {
    if (!cardId) return;
    setBatchQueue((prev) =>
      prev.map((item) => ({ ...item, selectedCardId: cardId }))
    );
    const card = cards.find((c) => c.id === cardId);
    onToast(`✨ Đã áp dụng thẻ "${card?.nickname || card?.bankName}" cho tất cả ${batchQueue.length} hóa đơn!`);
  };

  // Xóa 1 ảnh khỏi batch queue
  const handleRemoveBatchItem = (itemId: string) => {
    setBatchQueue((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Lưu 1 giao dịch đơn lẻ
  const handleDirectSaveSingle = () => {
    if (!scanResult) return;
    const amountVal = editableAmount > 0 ? editableAmount : scanResult.amount;
    const merchantVal = editableMerchant.trim() || scanResult.merchant;
    const card = cards.find((c) => c.id === editableCardId) || cards[0];

    const categoryLabels: Record<TransactionItem['category'], string> = {
      dining: 'Ăn uống',
      shopping: 'Mua sắm',
      transport: 'Di chuyển',
      tech: 'Công nghệ',
      salary: 'Lương',
      refund: 'Hoàn tiền',
      housing: 'Nhà cửa',
      investment: 'Đầu tư',
      education: 'Giáo dục',
      other: 'Khác',
    };

    onQuickSaveTransaction({
      cardId: card?.id || 'card-1',
      cardLast4: card?.lastFourDigits || '9921',
      merchant: merchantVal,
      category: editableCategory,
      categoryLabel: categoryLabels[editableCategory] || 'Chi tiêu',
      amount: amountVal,
      type: 'expense',
      date: scanResult.date,
      dateDisplay: formatTransactionDate(scanResult.date),
      time: scanResult.time || '12:00',
      receiptImage: scanResult.receiptPreviewUrl || imagePreview || undefined,
    });

    onToast(`✅ Đã lưu giao dịch: ${merchantVal} (-${amountVal.toLocaleString('vi-VN')} VNĐ)`);
    onClose();
  };

  // Lưu TẤT CẢ các giao dịch trong Batch Queue
  const handleSaveAllBatch = () => {
    const readyItems = batchQueue.filter((b) => b.status === 'success' && b.amount > 0);
    if (readyItems.length === 0) {
      onToast('⚠️ Chưa có hóa đơn nào hoàn tất quét để lưu');
      return;
    }

    const txsToSave: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>[] = readyItems.map((item) => {
      const card = cards.find((c) => c.id === item.selectedCardId) || cards[0];
      return {
        cardId: card?.id || 'card-1',
        cardLast4: card?.lastFourDigits || '9921',
        merchant: item.merchant,
        category: item.category,
        categoryLabel: item.categoryLabel,
        amount: item.amount,
        type: 'expense',
        date: item.date,
        dateDisplay: formatTransactionDate(item.date),
        time: item.time,
        receiptImage: item.dataUrl,
      };
    });

    if (onQuickSaveBatchTransactions) {
      onQuickSaveBatchTransactions(txsToSave);
    } else {
      txsToSave.forEach((tx) => onQuickSaveTransaction(tx));
    }

    onToast(`🎉 Đã lưu thành công ${txsToSave.length} hóa đơn kèm ảnh vào Lịch sử giao dịch!`);
    setBatchQueue([]);
    onClose();
  };

  // Tổng số tiền trong batch
  const totalBatchAmount = useMemo(() => {
    return batchQueue.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [batchQueue]);

  if (!isOpen) return null;

  const selectedPreset = (SAMPLE_PRESETS.find((p) => p.id === selectedPresetId) ?? SAMPLE_PRESETS[0])!;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10002,
        background: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: batchQueue.length > 0 ? '880px' : '780px',
          maxHeight: 'min(92vh, 860px)',
          background: 'linear-gradient(180deg, #0b1329 0%, #060a17 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 40px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
          position: 'relative',
          transition: 'max-width 0.2s',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 26px 16px',
            background: 'rgba(2, 132, 199, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(2, 132, 199, 0.35) 100%)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
              }}
            >
              <ScanOutlined />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Quét Lịch Sử Giao Dịch & Hóa Đơn AI
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                    color: '#ffffff',
                  }}
                >
                  {batchQueue.length > 0 ? `Đang xử lý (${batchQueue.length} GD)` : 'AI Vision OCR'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Thêm ảnh hoặc chụp ảnh trực tiếp — Hỗ trợ ảnh chụp màn hình ngân hàng / ví điện tử (MoMo...), chọn thẻ và quét nhiều ảnh cùng lúc
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <CloseOutlined style={{ fontSize: '14px' }} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            padding: '12px 26px 0',
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(10, 18, 38, 0.6)',
            flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '8px 14px',
              background: activeTab === 'upload' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'upload' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <UploadOutlined /> 📁 Thêm / Tải Ảnh (Chọn Nhiều Ảnh)
            {batchQueue.length > 0 && (
              <span style={{ background: '#0284c7', color: '#ffffff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
                {batchQueue.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setBatchQueue([]);
            }}
            style={{
              padding: '8px 14px',
              background: activeTab === 'camera' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'camera' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'camera' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <CameraOutlined style={{ color: '#38bdf8' }} /> 📸 Chụp Ảnh Trực Tiếp
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('sample');
              setBatchQueue([]);
              runPresetScan('momo-history');
            }}
            style={{
              padding: '8px 14px',
              background: activeTab === 'sample' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'sample' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'sample' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <ThunderboltFilled style={{ color: '#fbbf24' }} /> ⚡ Mẫu Thử Nghiệm (Có MoMo 7 GD)
          </button>
        </div>

        {/* Global Card Selector Bar */}
        <div
          style={{
            padding: '10px 26px',
            background: 'rgba(15, 23, 42, 0.75)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCardOutlined style={{ color: '#38bdf8', fontSize: '16px' }} />
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                Thẻ Thanh Toán Áp Dụng Cho Ảnh:
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                (Tự động gán cho các giao dịch quét ra từ ảnh, có thể đổi riêng từng dòng)
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={batchGlobalCardId || editableCardId}
              onChange={(e) => {
                const newCardId = e.target.value;
                setBatchGlobalCardId(newCardId);
                setEditableCardId(newCardId);
                handleApplyCardToAllBatch(newCardId);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#0f172a',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.purposeIcon || '💳'} {c.bankName} (•••• {c.lastFourDigits}) — Hạn mức: {(c.dailyLimit || 0).toLocaleString('vi-VN')}đ
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hidden File Inputs: multiple allowed! */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) handleMultipleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) handleMultipleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '20px 26px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* TAB 1: UPLOAD & MULTI-IMAGE BATCH */}
          {activeTab === 'upload' && (
            <div>
              {/* Nếu ĐÃ CÓ ẢNH TRONG BATCH QUEUE */}
              {batchQueue.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Batch Action Toolbar */}
                  <div
                    style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '16px',
                      padding: '14px 18px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                        📋 Đã chọn: <span style={{ color: '#38bdf8' }}>{batchQueue.length} hóa đơn</span>
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                        Tổng tiền: {totalBatchAmount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>

                    {/* Quick batch card assignment */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                        <CreditCardOutlined style={{ color: '#38bdf8' }} /> Gán nhanh 1 thẻ cho tất cả:
                      </span>
                      <select
                        value={batchGlobalCardId}
                        onChange={(e) => {
                          setBatchGlobalCardId(e.target.value);
                          handleApplyCardToAllBatch(e.target.value);
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          outline: 'none',
                        }}
                      >
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.purposeIcon || '💳'} {c.bankName} (•••• {c.lastFourDigits})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <PlusOutlined /> Thêm Ảnh
                      </button>
                    </div>
                  </div>

                  {/* Batch Receipts List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {batchQueue.map((item, index) => {
                      const bestCardForThis = findBestCardForCategory(item.category);
                      const isRecommended = item.selectedCardId === bestCardForThis.id;

                      return (
                        <div
                          key={item.id}
                          style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            transition: 'all 0.2s',
                          }}
                        >
                          {/* STT */}
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#94a3b8',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </div>

                          {/* Thumbnail with Lightbox trigger */}
                          <div
                            style={{
                              position: 'relative',
                              width: '56px',
                              height: '56px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              cursor: 'pointer',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                            }}
                            onClick={() => setLightboxImage(item.dataUrl)}
                            title="Bấm để xem ảnh phóng to"
                          >
                            <img
                              src={item.dataUrl}
                              alt={item.fileName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <EyeOutlined style={{ color: '#ffffff', fontSize: '14px' }} />
                            </div>
                          </div>

                          {/* Info Fields */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {item.status === 'scanning' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ReloadOutlined spin style={{ color: '#38bdf8' }} />
                                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
                                  Đang bóc tách dữ liệu AI...
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="text"
                                    value={item.merchant}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setBatchQueue((prev) =>
                                        prev.map((b) => (b.id === item.id ? { ...b, merchant: val } : b))
                                      );
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                                      color: '#ffffff',
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      outline: 'none',
                                      maxWidth: '220px',
                                    }}
                                    title="Sửa tên điểm bán"
                                  />
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      background: 'rgba(56, 189, 248, 0.12)',
                                      color: '#38bdf8',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {item.categoryLabel}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  {formatTransactionDate(item.date)} lúc {item.time} • File: {item.fileName}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Amount Input */}
                          <div style={{ width: '130px', flexShrink: 0 }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Số tiền (VNĐ)</div>
                            <input
                              type="number"
                              value={item.amount || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setBatchQueue((prev) =>
                                  prev.map((b) => (b.id === item.id ? { ...b, amount: val } : b))
                                );
                              }}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                background: 'rgba(30, 41, 59, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#34d399',
                                fontSize: '13px',
                                fontWeight: 800,
                                outline: 'none',
                                boxSizing: 'border-box',
                                fontFamily: 'monospace',
                              }}
                            />
                          </div>

                          {/* GIAO DIỆN CHỌN THẺ CHO HÌNH ẢNH NÀY */}
                          <div style={{ width: '220px', flexShrink: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Thẻ thanh toán:</span>
                              {isRecommended && (
                                <span style={{ fontSize: '9px', color: '#34d399', fontWeight: 700 }}>
                                  ⭐ Tối ưu hoàn tiền
                                </span>
                              )}
                            </div>
                            <select
                              value={item.selectedCardId}
                              onChange={(e) => handleUpdateBatchCard(item.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                background: isRecommended ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.8)',
                                border: isRecommended ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 600,
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            >
                              {cards.map((c) => {
                                const isBest = c.id === bestCardForThis.id;
                                return (
                                  <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                                    {c.purposeIcon || '💳'} {c.bankName} (•••• {c.lastFourDigits}){isBest ? ' — ⭐ [AI Gợi ý]' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchItem(item.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                            title="Xóa hóa đơn này"
                          >
                            <DeleteOutlined />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Khu Vực Kéo Thả / Upload Ban Đầu */
                <div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files) {
                        handleMultipleFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: isDragOver ? '2px dashed #38bdf8' : '2px dashed rgba(56, 189, 248, 0.4)',
                      borderRadius: '16px',
                      padding: '36px 20px',
                      textAlign: 'center',
                      background: isDragOver ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.45)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '38px', color: '#38bdf8', marginBottom: '10px' }}>
                      <PictureOutlined />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                      Thêm Ảnh Lịch Sử Giao Dịch Hoặc Hóa Đơn (Hỗ Trợ Chọn Nhiều Ảnh)
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0', lineHeight: '1.5' }}>
                      Kéo thả hoặc bấm vào đây để tải lên. Hỗ trợ <strong>ảnh chụp màn hình ứng dụng ngân hàng / ví MoMo</strong> (tự động nhận diện nhiều giao dịch trong 1 ảnh) hoặc <strong>nhiều ảnh hóa đơn</strong> cùng lúc!
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(2, 132, 199, 0.35) 100%)',
                          border: '1px solid rgba(56, 189, 248, 0.45)',
                          color: '#38bdf8',
                          fontSize: '13px',
                          fontWeight: 700,
                          boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
                        }}
                      >
                        <UploadOutlined /> 📁 Thêm Ảnh (Chọn Được Nhiều Ảnh)
                      </span>
                    </div>
                  </div>

                  {/* Nút hành động trực tiếp: Chụp ảnh & Thử mẫu MoMo */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('camera')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <CameraOutlined style={{ fontSize: '16px' }} /> 📸 Chụp Ảnh Trực Tiếp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('sample');
                        setBatchQueue([]);
                        runPresetScan('momo-history');
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.15) 0%, rgba(192, 38, 211, 0.25) 100%)',
                        border: '1px solid rgba(217, 70, 239, 0.4)',
                        color: '#f0abfc',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <MobileOutlined style={{ fontSize: '16px' }} /> ⚡ Thử Quét Mẫu MoMo (7 GD)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMERA TRỰC TIẾP */}
          {activeTab === 'camera' && (
            <div
              style={{
                borderRadius: '16px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                background: 'rgba(2, 6, 23, 0.85)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {cameraError ? (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#f59e0b', marginBottom: '8px' }}>⚠️</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                    Không Thể Mở Camera Trực Tiếp
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '440px', margin: '0 auto 16px', lineHeight: '1.5' }}>
                    {cameraError}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => startCamera(cameraFacingMode)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <SyncOutlined /> Thử Mở Lại
                    </button>
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <MobileOutlined /> Dùng Máy Ảnh Gốc
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: '320px', background: '#000000' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Khung ngắm laser */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '24px',
                      border: '2px solid rgba(56, 189, 248, 0.6)',
                      borderRadius: '14px',
                      pointerEvents: 'none',
                      boxShadow: '0 0 20px rgba(56, 189, 248, 0.2) inset',
                    }}
                  />
                  {/* Nút chụp */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '12px',
                      zIndex: 20,
                    }}
                  >
                    <button
                      type="button"
                      onClick={captureFromVideo}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(56, 189, 248, 0.5)',
                      }}
                    >
                      <CameraOutlined /> Chụp & Quét AI
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MẪU HÓA ĐƠN THỰC TẾ CÓ SẴN */}
          {activeTab === 'sample' && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ThunderboltFilled style={{ color: '#fbbf24' }} /> Chọn hóa đơn mẫu để AI phân tích ngay:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {SAMPLE_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPresetId(p.id);
                        runPresetScan(p.id);
                      }}
                      style={{
                        padding: '10px 10px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.5)',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.15)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '18px' }}>{p.icon}</span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                          }}
                        >
                          {p.tag}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                        {p.amount.toLocaleString('vi-VN')} ₫
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* HIỂN THỊ KẾT QUẢ ĐƠN LẺ (Khi ở tab Sample, Camera hoặc Upload 1 ảnh) */}
          {batchQueue.length === 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.25fr',
                gap: '16px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              {/* Cột trái: Giấy Hóa Đơn Trực Quan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  📄 Bản chụp hóa đơn:
                </div>

                <div
                  style={{
                    position: 'relative',
                    background: '#ffffff',
                    color: '#1e293b',
                    borderRadius: '10px',
                    padding: '16px 14px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    lineHeight: '1.45',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                    minHeight: '260px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Tia laser quét AI */}
                  {isScanning && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, #0284c7, #38bdf8, transparent)',
                        boxShadow: '0 0 12px #38bdf8, 0 0 24px #0284c7',
                        zIndex: 10,
                        animation: 'scanLaser 1.5s ease-in-out infinite alternate',
                      }}
                    />
                  )}

                  <style>{`
                    @keyframes scanLaser {
                      0% { top: 4%; }
                      100% { top: 94%; }
                    }
                  `}</style>

                  {/* Nội dung mẫu hóa đơn hoặc ảnh chụp */}
                  {imagePreview ? (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={imagePreview}
                        alt="Uploaded receipt"
                        style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '6px', objectFit: 'contain', cursor: 'pointer' }}
                        onClick={() => setLightboxImage(imagePreview)}
                        title="Bấm để xem ảnh phóng to"
                      />
                    </div>
                  ) : (
                    <div>
                      <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                          {selectedPreset.merchant}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{selectedPreset.address}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                          Ngày: {selectedPreset.date} — Giờ: {selectedPreset.time}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                        {selectedPreset.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span>{item.qty}x {item.name}</span>
                            <span style={{ fontWeight: 700 }}>{item.price.toLocaleString('vi-VN')}đ</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                          <span>TỔNG TIỀN:</span>
                          <span style={{ color: '#0284c7' }}>{selectedPreset.amount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', marginTop: '10px' }}>
                          --- CẢM ƠN QUÝ KHÁCH ---
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cột phải: Kết Quả & GIAO DIỆN CHỌN THẺ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    🤖 Kết Quả AI Bóc Tách:
                  </span>
                  {scanResult && (
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircleFilled /> Độ tin cậy: {scanResult.confidence}%
                    </span>
                  )}
                </div>

                {isScanning ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(2, 6, 23, 0.4)',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      gap: '12px',
                    }}
                  >
                    <ReloadOutlined spin style={{ fontSize: '28px', color: '#38bdf8' }} />
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      {scanStepMessage}
                    </div>
                    <div style={{ width: '80%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${scanProgress}%`,
                          background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                ) : scanResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Tên điểm bán */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Tên Điểm Bán / Merchant</label>
                      <input
                        type="text"
                        value={editableMerchant}
                        onChange={(e) => setEditableMerchant(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          background: 'rgba(30, 41, 59, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '7px 10px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          marginTop: '4px',
                        }}
                      />
                    </div>

                    {/* Số tiền thanh toán */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Tổng Tiền Thanh Toán (VNĐ)</label>
                      <input
                        type="number"
                        value={editableAmount || ''}
                        onChange={(e) => setEditableAmount(parseInt(e.target.value, 10) || 0)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          background: 'rgba(30, 41, 59, 0.7)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '8px',
                          padding: '7px 10px',
                          color: '#34d399',
                          fontSize: '15px',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          outline: 'none',
                          marginTop: '4px',
                        }}
                      />
                    </div>

                    {/* GIAO DIỆN CHỌN THẺ TRỰC QUAN CHO ẢNH NÀY */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CreditCardOutlined style={{ color: '#38bdf8' }} /> Thẻ Thanh Toán
                        </label>
                        {editableCardId === scanResult.suggestedCardId && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#34d399',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            ⭐ AI Gợi ý tối ưu
                          </span>
                        )}
                      </div>

                      <select
                        value={editableCardId}
                        onChange={(e) => setEditableCardId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: editableCardId === scanResult.suggestedCardId ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.8)',
                          border: editableCardId === scanResult.suggestedCardId ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        {cards.map((c) => {
                          const isBest = c.id === scanResult.suggestedCardId;
                          return (
                            <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                              {c.purposeIcon || '💳'} {c.bankName} - {c.nickname} (•••• {c.lastFourDigits}){isBest ? ' — ⭐ [AI Khuyên dùng]' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Danh mục tự động */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Danh Mục Tự Động</label>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        {[
                          { id: 'dining', label: '🍔 Ăn uống' },
                          { id: 'shopping', label: '🛍️ Mua sắm' },
                          { id: 'transport', label: '🚗 Di chuyển' },
                          { id: 'tech', label: '💻 Công nghệ' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setEditableCategory(cat.id as any)}
                            style={{
                              flex: 1,
                              padding: '6px 4px',
                              borderRadius: '8px',
                              background: editableCategory === cat.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              border: editableCategory === cat.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: editableCategory === cat.id ? '#38bdf8' : '#94a3b8',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 26px',
            background: 'rgba(8, 14, 30, 0.98)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Đóng
          </button>

          {/* Nếu ĐANG TRONG BATCH MODE */}
          {batchQueue.length > 0 ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setBatchQueue([])}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Xóa Danh Sách
              </button>
              <button
                type="button"
                onClick={handleSaveAllBatch}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                }}
              >
                <CheckOutlined /> Lưu Tất Cả ({batchQueue.filter((b) => b.status === 'success').length} Giao Dịch)
              </button>
            </div>
          ) : (
            /* Chế độ đơn lẻ */
            <div style={{ display: 'flex', gap: '10px' }}>
              {scanResult && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyToForm({
                        ...scanResult,
                        merchant: editableMerchant,
                        amount: editableAmount,
                        category: editableCategory,
                        suggestedCardId: editableCardId,
                        receiptPreviewUrl: imagePreview || undefined,
                      });
                      onClose();
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Điền Vào Form</span>
                    <ArrowRightOutlined />
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectSaveSingle}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)',
                    }}
                  >
                    <CheckOutlined /> Lưu Giao Dịch Ngay
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX FOR RECEIPT IMAGE ZOOM */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20005,
            background: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '92vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Receipt Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '84vh',
                borderRadius: '12px',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95)',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-46px',
                right: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <a
                href={lightboxImage}
                download="hoa-don-cardflow.jpg"
                style={{
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <DownloadOutlined /> Tải Ảnh
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#ffffff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseOutlined />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
