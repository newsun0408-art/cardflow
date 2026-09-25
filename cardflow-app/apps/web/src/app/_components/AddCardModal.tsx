'use client';

import { useState, useCallback } from 'react';
import {
  CloseOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  SafetyOutlined,
  SkinOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import type { CardTheme } from './PersonalCard3D';

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface CardDataModel {
  id: string;
  nickname: string;
  bankName: string;
  cardType: string;
  cardNetwork?: CardNetwork;
  cardCategory?: 'international' | 'domestic';
  lastFourDigits: string;
  cardNumberFormatted: string;
  nfcId: string;
  holderName: string;
  expiryDate: string;
  issueDate?: string;
  cvv: string;
  theme: CardTheme;
  isLocked: boolean;
  isDefault: boolean;
  balance: number;
  dailyLimit: number;
  spentToday: number;
  onlinePayment: boolean;
  internationalPayment: boolean;
  atmWithdrawal: boolean;
  notificationsEnabled: boolean;
  syncToSheet?: boolean;
}

type CardNetwork = 'VISA' | 'MASTERCARD' | 'JCB' | 'AMEX' | 'NAPAS' | 'UNKNOWN';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: Omit<CardDataModel, 'id' | 'isLocked' | 'balance' | 'spentToday'>) => void;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const THEME_OPTIONS: { id: CardTheme; label: string; bg: string }[] = [
  { id: 'dark-cyber',     label: 'Dark Cyber Platinum', bg: 'linear-gradient(135deg,#090d16 0%,#1e1b4b 60%,#0284c7 100%)' },
  { id: 'gold-luxe',     label: 'Gold Luxe VIP',        bg: 'linear-gradient(135deg,#78350f 0%,#b45309 50%,#f59e0b 100%)' },
  { id: 'deep-sapphire', label: 'Deep Sapphire',         bg: 'linear-gradient(135deg,#0369a1 0%,#0f172a 60%,#38bdf8 100%)' },
  { id: 'crimson-ruby',  label: 'Crimson Ruby',          bg: 'linear-gradient(135deg,#881337 0%,#be123c 60%,#fb7185 100%)' },
];

const BANKS = [
  'Vietcombank','Techcombank','MB Bank','ACB','BIDV','VietinBank',
  'Sacombank','VPBank','TPBank','OCB','SHB','HDBank','SeABank',
  'Agribank','Nam A Bank','Cardflow Bank',
];

const NETWORK_META: Record<CardNetwork, { color: string; label: string; logo: string }> = {
  VISA:       { color: '#1a1f71', label: 'Visa',       logo: 'VISA'  },
  MASTERCARD: { color: '#eb001b', label: 'Mastercard', logo: 'MC'    },
  JCB:        { color: '#003087', label: 'JCB',        logo: 'JCB'   },
  AMEX:       { color: '#007bc1', label: 'Amex',       logo: 'AMEX'  },
  NAPAS:      { color: '#e30613', label: 'Napas',      logo: 'NAPAS' },
  UNKNOWN:    { color: '#64748b', label: '?',          logo: '?'     },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function luhnCheck(num: string): boolean {
  const digits = num.replace(/\s/g, '');
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

function detectNetwork(pan: string): CardNetwork {
  const d = pan.replace(/\s/g, '');
  if (/^4/.test(d))              return 'VISA';
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'MASTERCARD';
  if (/^35/.test(d))             return 'JCB';
  if (/^3[47]/.test(d))         return 'AMEX';
  if (/^96/.test(d))             return 'NAPAS';
  return 'UNKNOWN';
}

function formatPAN(raw: string, network: CardNetwork): string {
  const digits = raw.replace(/\D/g, '');
  if (network === 'AMEX') {
    return digits.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_,a,b,c) => [a,b,c].filter(Boolean).join(' '));
  }
  return digits.replace(/(.{4})(?=.)/g, '$1 ').trimEnd();
}

function formatMMYY(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0,2) + '/' + digits.slice(2);
  return digits;
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: '100%', background: 'rgba(15,23,42,0.8)',
  border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
  borderRadius: '10px', padding: '11px 14px',
  color: '#ffffff', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color .2s',
  fontFamily: 'Inter,sans-serif',
});

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
};

const STEPS = [
  { icon: <CreditCardOutlined />, label: 'Thông tin thẻ' },
  { icon: <SafetyOutlined />,     label: 'Bảo mật' },
  { icon: <SkinOutlined />,       label: 'Giao diện' },
  { icon: <CheckOutlined />,      label: 'Xác nhận' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export function AddCardModal({ isOpen, onClose, onAddCard }: AddCardModalProps) {
  const [step, setStep]         = useState(0);
  const [pan, setPan]           = useState('');
  const [holderName, setHolder] = useState('');
  const [bankName, setBank]     = useState('Vietcombank');
  const [cardType, setType]     = useState('VISA PLATINUM');
  const [isIntl, setIsIntl]     = useState(true);
  const [expiry, setExpiry]     = useState('');
  const [issueDate, setIssue]   = useState('');
  const [cvv, setCvv]           = useState('');
  const [showCvv, setShowCvv]   = useState(false);
  const [nickname, setNickname] = useState('');
  const [theme, setTheme]       = useState<CardTheme>('dark-cyber');
  const [isDefault, setDefault] = useState(false);
  const [syncToSheet, setSyncToSheet] = useState(true);

  const rawPan    = pan.replace(/\s/g, '');
  const network   = detectNetwork(rawPan);
  const cvvLength = network === 'AMEX' ? 4 : 3;
  const isLuhnOk  = rawPan.length >= 13 && luhnCheck(rawPan);
  const netMeta   = NETWORK_META[network];

  const step0Valid = rawPan.length >= 13 && isLuhnOk && holderName.trim().length >= 2;
  const step1Valid = isIntl
    ? (expiry.length === 5 && cvv.length >= 3 && nickname.trim().length >= 1)
    : (issueDate.length === 5 && nickname.trim().length >= 1);

  const handlePanChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const net = detectNetwork(e.target.value);
    const formatted = formatPAN(e.target.value, net);
    if (formatted.replace(/\s/g, '').length > 19) return;
    setPan(formatted);
  }, []);

  const handleSubmit = () => {
    const last4 = rawPan.slice(-4);
    onAddCard({
      nickname: nickname.trim(), bankName, cardType, cardNetwork: network,
      cardCategory: isIntl ? 'international' : 'domestic',
      lastFourDigits: last4,
      cardNumberFormatted: rawPan.replace(/(.{4})(?=.)/g, '$1 '),
      nfcId: `CF-NFC-${Math.floor(1000 + Math.random() * 9000)}-PL`,
      holderName: holderName.trim(),
      expiryDate: isIntl ? expiry : '',
      issueDate: isIntl ? '' : issueDate,
      cvv: '•••', theme, isDefault,
      dailyLimit: 30_000_000,
      onlinePayment: true, internationalPayment: isIntl,
      atmWithdrawal: true, notificationsEnabled: true,
      syncToSheet,
    });
    setPan(''); setHolder(''); setBank('Vietcombank'); setType('VISA PLATINUM');
    setExpiry(''); setIssue(''); setCvv(''); setNickname('');
    setTheme('dark-cyber'); setDefault(false); setIsIntl(true); setSyncToSheet(true); setStep(0);
    onClose();
  };

  if (!isOpen) return null;

  const disabled = (step === 0 && !step0Valid) || (step === 1 && !step1Valid);

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:10000,
      background:'rgba(2,6,23,0.88)',backdropFilter:'blur(14px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',
    }}>
      <div style={{
        width:'100%',maxWidth:'520px',
        background:'rgba(10,18,38,0.97)',
        border:'1px solid rgba(56,189,248,0.25)',borderRadius:'24px',
        boxShadow:'0 30px 80px rgba(0,0,0,0.8)',overflow:'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding:'20px 24px 16px',background:'rgba(2,132,199,0.08)',
          borderBottom:'1px solid rgba(255,255,255,0.07)',
          display:'flex',justifyContent:'space-between',alignItems:'center',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'rgba(56,189,248,0.15)',color:'#38bdf8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px'}}>
              <CreditCardOutlined />
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:'17px',color:'#fff'}}>Thêm Thẻ Ngân Hàng</div>
              <div style={{fontSize:'11px',color:'#64748b'}}>Bảo mật chuẩn fintech — mã hoá AES-256</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:'18px',padding:'4px'}}>
            <CloseOutlined />
          </button>
        </div>

        {/* Steps */}
        <div style={{display:'flex',padding:'16px 24px 0',gap:'6px'}}>
          {STEPS.map((s, i) => (
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'5px'}}>
              <div style={{
                width:'32px',height:'32px',borderRadius:'50%',
                background: i < step ? '#0284c7' : i === step ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${i <= step ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                color: i <= step ? '#38bdf8' : '#475569',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',transition:'all .3s',
              }}>
                {i < step ? <CheckOutlined style={{fontSize:'12px'}} /> : s.icon}
              </div>
              <span style={{fontSize:'9px',color:i===step?'#38bdf8':'#475569',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em',textAlign:'center'}}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{margin:'10px 24px 0',height:'2px',background:'rgba(255,255,255,0.06)',borderRadius:'2px'}}>
          <div style={{height:'100%',width:`${(step/(STEPS.length-1))*100}%`,background:'linear-gradient(90deg,#0284c7,#38bdf8)',borderRadius:'2px',transition:'width .4s ease'}} />
        </div>

        {/* Body */}
        <div style={{padding:'20px 24px 24px'}}>

          {/* STEP 0 */}
          {step === 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {/* Category Toggle */}
              <div style={{display:'flex',gap:'8px'}}>
                {[true,false].map(intl => (
                  <button key={String(intl)} onClick={() => setIsIntl(intl)} style={{
                    flex:1,padding:'9px',borderRadius:'10px',
                    background: isIntl===intl ? 'rgba(2,132,199,0.2)' : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${isIntl===intl?'#0284c7':'rgba(255,255,255,0.1)'}`,
                    color: isIntl===intl ? '#38bdf8' : '#64748b',
                    cursor:'pointer',fontSize:'12px',fontWeight:700,transition:'all .2s',
                  }}>
                    {intl ? '🌐 Quốc tế (Visa/MC/JCB)' : '🏦 Nội địa (Napas ATM)'}
                  </button>
                ))}
              </div>

              {/* PAN */}
              <div>
                <label style={labelStyle}>Số thẻ (PAN) <span style={{color:'#ef4444'}}>*</span></label>
                <div style={{position:'relative'}}>
                  <input
                    type="text" inputMode="numeric"
                    placeholder={isIntl ? '0000 0000 0000 0000' : '0000 0000 0000 0000 000'}
                    value={pan} onChange={handlePanChange} maxLength={24}
                    style={{...inputStyle(pan.length>12 && !isLuhnOk),paddingRight:'80px',fontFamily:'monospace',fontSize:'15px',letterSpacing:'0.12em'}}
                  />
                  <div style={{
                    position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',
                    background:netMeta.color+'33',border:`1px solid ${netMeta.color}66`,
                    borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:800,color:'#fff',minWidth:'48px',textAlign:'center',
                  }}>{netMeta.logo}</div>
                </div>
                {rawPan.length >= 13 && (
                  <div style={{marginTop:'4px',fontSize:'11px',color:isLuhnOk?'#22c55e':'#ef4444',display:'flex',alignItems:'center',gap:'4px'}}>
                    {isLuhnOk ? <CheckCircleFilled/> : '✕'} {isLuhnOk ? 'Số thẻ hợp lệ' : 'Số thẻ không hợp lệ (Luhn fail)'}
                  </div>
                )}
              </div>

              {/* Holder */}
              <div>
                <label style={labelStyle}>Tên chủ thẻ (in trên thẻ) <span style={{color:'#ef4444'}}>*</span></label>
                <input type="text" placeholder="VD: NGUYEN VAN AN" value={holderName}
                  onChange={e => setHolder(e.target.value.toUpperCase().replace(/[^A-Z\s]/g,''))}
                  maxLength={26}
                  style={{...inputStyle(),fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}
                />
                <div style={{fontSize:'10px',color:'#475569',marginTop:'3px'}}>Chỉ chữ IN HOA không dấu, đúng như trên thẻ vật lý</div>
              </div>

              {/* Bank + Type */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div>
                  <label style={labelStyle}>Ngân hàng</label>
                  <select value={bankName} onChange={e=>setBank(e.target.value)} style={{...inputStyle(),appearance:'none',cursor:'pointer'}}>
                    {BANKS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Hạng thẻ</label>
                  <select value={cardType} onChange={e=>setType(e.target.value)} style={{...inputStyle(),appearance:'none',cursor:'pointer'}}>
                    {isIntl ? <>
                      <option>VISA CLASSIC</option><option>VISA GOLD</option><option>VISA PLATINUM</option><option>VISA SIGNATURE</option>
                      <option>MASTERCARD STANDARD</option><option>MASTERCARD GOLD</option><option>MASTERCARD BLACK</option>
                      <option>JCB CLASSIC</option><option>JCB SIGNATURE</option>
                      <option>AMEX GOLD</option><option>AMEX PLATINUM</option>
                    </> : <>
                      <option>NAPAS STANDARD</option><option>NAPAS PLUS</option><option>NAPAS PRIORITY</option>
                    </>}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {/* Mini preview */}
              <div style={{background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',borderRadius:'12px',padding:'14px 16px',border:'1px solid rgba(56,189,248,0.15)'}}>
                <div style={{fontSize:'11px',color:'#64748b',fontWeight:600}}>CARD PREVIEW</div>
                <div style={{fontFamily:'monospace',fontSize:'15px',color:'#cbd5e1',letterSpacing:'0.1em',marginTop:'4px'}}>{pan||'•••• •••• •••• ••••'}</div>
                <div style={{fontSize:'12px',color:'#94a3b8',marginTop:'4px'}}>{holderName||'—'}</div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'6px'}}>
                  <span style={{fontSize:'11px',color:'#64748b'}}>{bankName} · {cardType}</span>
                  <span style={{fontSize:'10px',fontWeight:800,background:netMeta.color+'33',color:'#fff',padding:'1px 6px',borderRadius:'4px'}}>{netMeta.label}</span>
                </div>
              </div>

              {isIntl ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  <div>
                    <label style={labelStyle}>Ngày hết hạn <span style={{color:'#ef4444'}}>*</span></label>
                    <input type="text" inputMode="numeric" placeholder="MM/YY" value={expiry}
                      onChange={e=>setExpiry(formatMMYY(e.target.value))} maxLength={5}
                      style={{...inputStyle(expiry.length===5 && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)),fontFamily:'monospace',letterSpacing:'0.1em'}}
                    />
                    <div style={{fontSize:'10px',color:'#475569',marginTop:'3px'}}>Mặt trước thẻ</div>
                  </div>
                  <div>
                    <label style={labelStyle}>CVV / CVC <span style={{color:'#ef4444'}}>*</span></label>
                    <div style={{position:'relative'}}>
                      <input type={showCvv?'text':'password'} inputMode="numeric"
                        placeholder={network==='AMEX'?'4 số':'3 số'} value={cvv}
                        onChange={e=>setCvv(e.target.value.replace(/\D/g,'').slice(0,cvvLength))} maxLength={cvvLength}
                        style={{...inputStyle(),paddingRight:'38px',fontFamily:'monospace',letterSpacing:'0.2em'}}
                      />
                      <button type="button" onClick={()=>setShowCvv(v=>!v)}
                        style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:'14px'}}>
                        {showCvv ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                      </button>
                    </div>
                    <div style={{fontSize:'10px',color:'#475569',marginTop:'3px'}}>{network==='AMEX'?'4 số mặt TRƯỚC':'3 số mặt SAU thẻ'}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Ngày phát hành <span style={{color:'#ef4444'}}>*</span></label>
                  <input type="text" inputMode="numeric" placeholder="MM/YY" value={issueDate}
                    onChange={e=>setIssue(formatMMYY(e.target.value))} maxLength={5}
                    style={{...inputStyle(),fontFamily:'monospace',letterSpacing:'0.1em'}}
                  />
                  <div style={{fontSize:'10px',color:'#475569',marginTop:'3px'}}>Thẻ nội địa dùng ngày PHÁT HÀNH, không phải ngày hết hạn</div>
                </div>
              )}

              {!isIntl && (
                <div style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:'10px',padding:'10px 14px',fontSize:'12px',color:'#fbbf24'}}>
                  🔐 <strong>OTP sẽ được gửi về SĐT</strong> đăng ký với ngân hàng khi xác thực. Bạn không cần nhập OTP tại đây.
                </div>
              )}

              <div>
                <label style={labelStyle}>Tên gợi nhớ <span style={{color:'#ef4444'}}>*</span></label>
                <input type="text" placeholder="VD: Thẻ Chi Tiêu, Thẻ Online, Lương..."
                  value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={30}
                  style={inputStyle()}
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <label style={labelStyle}>Chọn giao diện thẻ 3D</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {THEME_OPTIONS.map(opt => (
                  <div key={opt.id} onClick={()=>setTheme(opt.id)} style={{
                    height:'64px',borderRadius:'12px',background:opt.bg,
                    border:theme===opt.id?'2px solid #38bdf8':'1px solid rgba(255,255,255,0.1)',
                    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'0 14px',fontSize:'12px',fontWeight:700,color:'#fff',
                    boxShadow:theme===opt.id?'0 0 20px rgba(56,189,248,0.35)':'none',transition:'all .2s',
                  }}>
                    <span>{opt.label}</span>
                    {theme===opt.id && <CheckCircleFilled style={{color:'#38bdf8',fontSize:'16px'}}/>}
                  </div>
                ))}
              </div>
              <div onClick={()=>setDefault(v=>!v)} style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.04)',borderRadius:'10px',padding:'12px 14px',cursor:'pointer'}}>
                <div style={{width:'20px',height:'20px',borderRadius:'4px',background:isDefault?'#0284c7':'transparent',border:`2px solid ${isDefault?'#38bdf8':'rgba(255,255,255,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>
                  {isDefault && <CheckOutlined style={{color:'#fff',fontSize:'11px'}}/>}
                </div>
                <span style={{fontSize:'13px',color:'#cbd5e1'}}>Đặt làm thẻ thanh toán mặc định</span>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{fontSize:'13px',color:'#94a3b8',marginBottom:'4px'}}>Kiểm tra thông tin trước khi lưu:</div>
              {([
                ['Số thẻ', pan],
                ['Chủ thẻ', holderName],
                ['Ngân hàng', bankName],
                ['Hạng thẻ', cardType],
                ['Loại thẻ', isIntl ? '🌐 Quốc tế' : '🏦 Nội địa (Napas)'],
                isIntl ? ['Ngày hết hạn', expiry] : ['Ngày phát hành', issueDate],
                isIntl ? ['CVV/CVC', '•'.repeat(cvvLength)] : null,
                ['Tên gợi nhớ', nickname],
                ['Giao diện', THEME_OPTIONS.find(t=>t.id===theme)?.label ?? theme],
                ['Thẻ mặc định', isDefault ? 'Có' : 'Không'],
              ] as ([string,string]|null)[]).filter((x): x is [string, string] => Boolean(x)).map(([k,v]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(255,255,255,0.04)',borderRadius:'8px'}}>
                  <span style={{fontSize:'12px',color:'#64748b',fontWeight:600}}>{k}</span>
                  <span style={{fontSize:'12px',color:'#e2e8f0',fontFamily:/\d{4}/.test(v)?'monospace':undefined}}>{v}</span>
                </div>
              ))}

              {/* Tùy chọn đồng bộ Google Sheet */}
              <div
                onClick={()=>setSyncToSheet(v=>!v)}
                style={{
                  display:'flex',alignItems:'center',gap:'12px',
                  background:'rgba(16,185,129,0.06)',
                  border:'1px solid rgba(16,185,129,0.25)',
                  borderRadius:'10px',padding:'12px 14px',cursor:'pointer',
                  transition:'all 0.2s',
                }}
              >
                <div style={{
                  width:'20px',height:'20px',borderRadius:'4px',
                  background:syncToSheet?'#059669':'transparent',
                  border:`2px solid ${syncToSheet?'#10b981':'rgba(255,255,255,0.2)'}`,
                  display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'
                }}>
                  {syncToSheet && <CheckOutlined style={{color:'#fff',fontSize:'11px'}}/>}
                </div>
                <div style={{display:'flex',flexDirection:'column'}}>
                  <span style={{fontSize:'13px',fontWeight:700,color:'#34d399'}}>📊 Đồng bộ vào Google Sheet</span>
                  <span style={{fontSize:'11px',color:'#94a3b8'}}>Tự động cập nhật bảng tính trong thư mục <strong>CardFlow</strong> trên Google Drive</span>
                </div>
              </div>

              <div style={{marginTop:'4px',background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:'10px',padding:'10px 14px',fontSize:'11px',color:'#34d399'}}>
                🔒 Dữ liệu thẻ được mã hoá AES-256 và không chia sẻ với bên thứ ba.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{display:'flex',gap:'10px',marginTop:'20px'}}>
            {step > 0 && (
              <button onClick={()=>setStep(s=>s-1)} style={{
                padding:'11px 18px',borderRadius:'10px',background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',
                fontSize:'13px',fontWeight:600,display:'flex',alignItems:'center',gap:'6px',
              }}>
                <ArrowLeftOutlined/> Quay lại
              </button>
            )}
            <button
              onClick={()=>{ if(step<STEPS.length-1) setStep(s=>s+1); else handleSubmit(); }}
              disabled={disabled}
              style={{
                flex:1,padding:'12px 0',borderRadius:'10px',
                background: disabled ? 'rgba(56,189,248,0.1)' : 'linear-gradient(135deg,#0284c7 0%,#38bdf8 100%)',
                color: disabled ? '#475569' : '#fff',
                border:'none',cursor:disabled?'not-allowed':'pointer',
                fontSize:'14px',fontWeight:700,
                boxShadow:'0 0 20px rgba(56,189,248,0.2)',transition:'all .2s',
              }}
            >
              {step===STEPS.length-1 ? '✅ Lưu Thẻ' : 'Tiếp theo →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
