'use server';

import { createLogger } from 'fe-kit/logger';

const logger = createLogger('card-security');

export interface DecryptedCardData {
  fullCardNumber: string;
  cvv: string;
}

export interface VerifyPinResult {
  success: boolean;
  decryptedData?: DecryptedCardData;
  expiresInSeconds?: number;
  error?: string;
  attemptsLeft?: number;
  lockedUntil?: number;
}

// In-memory mock server database of sensitive card numbers & CVVs
// (On real backend, this is stored encrypted in HSM/Vault and never sent to client upfront)
const SENSITIVE_CARD_STORE: Record<string, DecryptedCardData> = {
  'card-1': {
    fullCardNumber: '4889 7712 9041 9921',
    cvv: '889',
  },
  'card-2': {
    fullCardNumber: '5412 8831 2049 8812',
    cvv: '452',
  },
  'card-3': {
    fullCardNumber: '4111 9012 3341 5566',
    cvv: '109',
  },
  'card-4': {
    fullCardNumber: '3782 8224 5510 3340',
    cvv: '912',
  },
};

// Accepted valid PINs for demo/security authentication
const VALID_PINS = new Set(['123456', '999999', '888888', '000000', '1234']);

// Brute-force rate limiting state: cardId -> { failedAttempts: number; lockedUntil: number }
const ATTEMPT_TRACKER: Record<string, { failedAttempts: number; lockedUntil: number }> = {};
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 3 * 60 * 1000; // 3 minutes lockout
const SENSITIVE_EXPIRES_IN_SECONDS = 20;

export async function verifyCardPinAction(payload: {
  cardId: string;
  pin: string;
}): Promise<VerifyPinResult> {
  const { cardId, pin } = payload;
  const now = Date.now();

  logger.info('PIN verification attempt', { cardId, pinMasked: pin.replace(/./g, '*') });

  // 1. Check lockout status
  const tracker = ATTEMPT_TRACKER[cardId] || { failedAttempts: 0, lockedUntil: 0 };
  if (tracker.lockedUntil > now) {
    const remainingMs = tracker.lockedUntil - now;
    const remainingSec = Math.ceil(remainingMs / 1000);
    logger.warn('PIN verification blocked due to active lockout', { cardId, remainingSec });
    return {
      success: false,
      error: `Thao tác bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${remainingSec}s.`,
      attemptsLeft: 0,
      lockedUntil: tracker.lockedUntil,
    };
  }

  // If lockout expired, reset attempts
  if (tracker.lockedUntil > 0 && tracker.lockedUntil <= now) {
    tracker.failedAttempts = 0;
    tracker.lockedUntil = 0;
  }

  // 2. Validate PIN
  const isValid = VALID_PINS.has(pin);

  if (!isValid) {
    tracker.failedAttempts += 1;
    const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - tracker.failedAttempts);

    if (attemptsLeft === 0) {
      tracker.lockedUntil = now + LOCKOUT_DURATION_MS;
      ATTEMPT_TRACKER[cardId] = tracker;
      logger.warn('PIN verification failed - Account locked out', { cardId, durationMs: LOCKOUT_DURATION_MS });
      return {
        success: false,
        error: 'Bạn đã nhập sai quá 3 lần. Chức năng xem thông tin bảo mật bị tạm khóa trong 3 phút.',
        attemptsLeft: 0,
        lockedUntil: tracker.lockedUntil,
      };
    }

    ATTEMPT_TRACKER[cardId] = tracker;
    logger.warn('PIN verification failed', { cardId, attemptsLeft });
    return {
      success: false,
      error: `Mã PIN không chính xác. Còn ${attemptsLeft} lần thử.`,
      attemptsLeft,
    };
  }

  // 3. Reset failed attempts on success
  delete ATTEMPT_TRACKER[cardId];
  logger.info('PIN verification successful - Decrypting sensitive card data', { cardId });

  // 4. Retrieve decrypted data from vault/store (or generate consistent mock if dynamically created)
  let decrypted = SENSITIVE_CARD_STORE[cardId];
  if (!decrypted) {
    // If dynamic card was created in session, synthesize secure data
    decrypted = {
      fullCardNumber: `4889 0000 0000 ${cardId.slice(-4) || '9921'}`,
      cvv: '779',
    };
  }

  return {
    success: true,
    decryptedData: decrypted,
    expiresInSeconds: SENSITIVE_EXPIRES_IN_SECONDS,
  };
}
