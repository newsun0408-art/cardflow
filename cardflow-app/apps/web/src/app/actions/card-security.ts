'use server';

import { createLogger } from 'fe-kit/logger';
import {
  createApi,
  cardApi,
  type CardDto,
  type CreateCardInput,
  type VerifyPinResult,
  type ChangePinInput,
  type SetLimitInput,
  type ToggleLockInput,
} from '@cardflow-app/shared';

export type { VerifyPinResult };

const logger = createLogger('card-security');

export async function getCardsAction(): Promise<CardDto[]> {
  try {
    const api = createApi();
    const res = await cardApi.list(api);
    logger.info('Fetched cards from Go backend', { count: res?.length ?? 0 });
    return res ?? [];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to fetch cards from backend', { error: message });
    return [];
  }
}

export async function verifyCardPinAction(payload: {
  cardId: string;
  pin: string;
}): Promise<VerifyPinResult> {
  const { cardId, pin } = payload;
  logger.info('PIN verification attempt via Go backend', { cardId, pinMasked: pin.replace(/./g, '*') });

  try {
    const api = createApi();
    const res = await cardApi.verifyPin(api, { cardId, pin });
    return (
      res ?? {
        success: false,
        error: 'Không nhận được phản hồi từ máy chủ bảo mật',
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('PIN verification API error', { cardId, error: message });
    return {
      success: false,
      error: 'Lỗi kết nối đến máy chủ bảo mật Backend',
    };
  }
}

export async function createCardAction(
  payload: CreateCardInput,
): Promise<{ success: boolean; card?: CardDto; error?: string }> {
  try {
    const api = createApi();
    const res = await cardApi.create(api, payload);
    logger.info('Created card on Go backend', { id: res?.id });
    return { success: true, card: res };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to create card on backend', { error: message });
    return { success: false, error: message };
  }
}

export async function changePinAction(
  payload: ChangePinInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const api = createApi();
    await cardApi.changePin(api, payload);
    logger.info('Changed card PIN on Go backend', { cardId: payload.cardId });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to change PIN on backend', { error: message });
    return { success: false, error: message };
  }
}

export async function setLimitAction(
  payload: SetLimitInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const api = createApi();
    await cardApi.setLimit(api, payload);
    logger.info('Updated card limit on Go backend', { cardId: payload.cardId, limit: payload.dailyLimit });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to set limit on backend', { error: message });
    return { success: false, error: message };
  }
}

export async function toggleLockAction(
  payload: ToggleLockInput,
): Promise<{ success: boolean; isLocked?: boolean; error?: string }> {
  try {
    const api = createApi();
    const res = await cardApi.toggleLock(api, payload);
    logger.info('Toggled card lock on Go backend', { cardId: payload.cardId, isLocked: res?.isLocked });
    return { success: true, isLocked: res?.isLocked };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to toggle lock on backend', { error: message });
    return { success: false, error: message };
  }
}
