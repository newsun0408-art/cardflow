'use server';

import { createLogger } from 'fe-kit/logger';
import type { UserProfile } from '@cardflow-app/shared';

const logger = createLogger('user-profile');

export interface UpdateProfileInput {
  fullName: string;
  phone: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UpdateProfileResult {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
const NICKNAME_REGEX = /^[a-zA-Z0-9_.-]{2,30}$/;

export async function updateUserProfileAction(
  currentProfile: UserProfile,
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  logger.info('Updating user profile', {
    userId: currentProfile.id,
    hasAvatar: Boolean(input.avatarUrl),
  });

  // 1. Validate Họ và tên (Full Name)
  const fullName = input.fullName.trim();
  if (!fullName) {
    logger.warn('Profile update failed: empty full name');
    return { success: false, error: 'Họ và tên không được để trống.' };
  }
  if (fullName.length < 2 || fullName.length > 50) {
    logger.warn('Profile update failed: invalid full name length', { length: fullName.length });
    return { success: false, error: 'Họ và tên phải từ 2 đến 50 ký tự.' };
  }

  // 2. Validate Nickname
  const nickname = input.nickname.trim().replace(/^@/, '');
  if (!nickname) {
    logger.warn('Profile update failed: empty nickname');
    return { success: false, error: 'Nickname không được để trống.' };
  }
  if (!NICKNAME_REGEX.test(nickname)) {
    logger.warn('Profile update failed: invalid nickname characters', { nickname });
    return {
      success: false,
      error: 'Nickname chỉ được chứa chữ cái, số, dấu gạch dưới, gạch ngang và dấu chấm (2 - 30 ký tự).',
    };
  }

  // 3. Validate Số điện thoại (Phone)
  const rawPhone = input.phone.replace(/[\s.-]/g, '');
  if (!rawPhone) {
    logger.warn('Profile update failed: empty phone');
    return { success: false, error: 'Số điện thoại không được để trống.' };
  }
  if (!VN_PHONE_REGEX.test(rawPhone)) {
    logger.warn('Profile update failed: invalid phone format', { phone: rawPhone });
    return {
      success: false,
      error: 'Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0912 345 678).',
    };
  }

  // 4. Validate Avatar nếu có
  if (input.avatarUrl) {
    if (!input.avatarUrl.startsWith('data:image/') && !input.avatarUrl.startsWith('http')) {
      logger.warn('Profile update failed: invalid avatar format');
      return { success: false, error: 'Định dạng ảnh đại diện không hợp lệ.' };
    }
    // Giới hạn Base64 ~ 4MB (khoảng 5.5MB chuỗi base64)
    if (input.avatarUrl.length > 5.5 * 1024 * 1024) {
      logger.warn('Profile update failed: avatar too large');
      return { success: false, error: 'Kích thước ảnh đại diện quá lớn (tối đa 3MB).' };
    }
  }

  const updatedProfile: UserProfile = {
    ...currentProfile,
    fullName,
    nickname,
    phone: rawPhone,
    avatarUrl: input.avatarUrl ?? '',
    bio: input.bio?.trim() ?? currentProfile.bio,
    updatedAt: new Date().toISOString(),
  };

  logger.info('User profile updated successfully', {
    userId: updatedProfile.id,
    fullName: updatedProfile.fullName,
    nickname: updatedProfile.nickname,
  });

  return {
    success: true,
    profile: updatedProfile,
  };
}
