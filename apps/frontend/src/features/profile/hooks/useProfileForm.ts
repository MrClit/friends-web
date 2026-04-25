import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/useAuth';
import { useUpdateCurrentUserProfile } from '@/hooks/api/useUsers';
import { useToastStore } from '@/shared/store/useToastStore';
import { getApiErrorMessage } from '@/shared/utils';

const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export interface UseProfileFormResult {
  name: string;
  setName: (name: string) => void;
  avatarFile: File | null;
  avatarPreviewUrl: string | null;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  trimmedName: string;
  hasChanges: boolean;
  isSaving: boolean;
  handleSelectAvatar: (file: File | null) => void;
  handleSave: () => Promise<void>;
}

export function useProfileForm(): UseProfileFormResult {
  const { t } = useTranslation('profile');
  const { user, refreshUser, updateUser } = useAuth();
  const addToast = useToastStore((state) => state.addToast);
  const updateCurrentUserProfile = useUpdateCurrentUserProfile();

  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    setName(user.name ?? '');
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.createdAt && user.updatedAt) {
      return;
    }
    void refreshUser();
  }, [refreshUser, user]);

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) {
      return null;
    }
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const trimmedName = name.trim();
  const initialName = (user?.name ?? '').trim();
  const hasNameChange = Boolean(user) && trimmedName !== initialName;
  const hasAvatarChange = Boolean(avatarFile);
  const hasChanges = hasNameChange || hasAvatarChange;
  const isSaving = updateCurrentUserProfile.isPending;

  const handleSelectAvatar = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        message: t('toasts.invalidImage', 'Please select a valid image file.'),
        duration: 5000,
      });
      return;
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      addToast({
        type: 'error',
        message: t('toasts.fileTooLarge', 'Image is too large. Maximum size is 5 MB.'),
        duration: 5000,
      });
      return;
    }

    setAvatarFile(file);
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    if (!trimmedName) {
      addToast({
        type: 'error',
        message: t('toasts.invalidName', 'Name cannot be empty.'),
        duration: 5000,
      });
      return;
    }

    if (!hasChanges) {
      return;
    }

    try {
      const updatedProfile = await updateCurrentUserProfile.mutateAsync({
        name: hasNameChange ? trimmedName : undefined,
        avatarFile: avatarFile ?? undefined,
      });

      updateUser(updatedProfile);
      setAvatarFile(null);

      addToast({
        type: 'success',
        message: t('toasts.updateSuccess', 'Profile updated successfully.'),
        duration: 3500,
      });

      void refreshUser();
    } catch (error) {
      const description = getApiErrorMessage(error, t);

      addToast({
        type: 'error',
        message: t('toasts.updateError', 'Could not update profile.'),
        description,
        duration: 6000,
      });
    }
  };

  return {
    name,
    setName,
    avatarFile,
    avatarPreviewUrl,
    galleryInputRef,
    trimmedName,
    hasChanges,
    isSaving,
    handleSelectAvatar,
    handleSave,
  };
}
