import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getApiUrl } from '@utils/environmentHelpers';

const REFERRAL_MODAL_STORAGE_KEY = 'mermaidMuse.referral.modalDismissed';
const REFERRAL_CODE_STORAGE_KEY = 'mermaidMuse.referral.pendingCode';

export function useReferral() {
  const { getToken, isSignedIn } = useAuth();
  const [isModalDismissed, setIsModalDismissed] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(REFERRAL_MODAL_STORAGE_KEY);
    setIsModalDismissed(stored === 'true');
  }, []);

  const checkPendingReferral = React.useCallback(async () => {
    const pendingRef = localStorage.getItem(REFERRAL_CODE_STORAGE_KEY);
    if (!pendingRef) return;

    try {
      const token = await getToken();
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/apply-referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ referrerUserId: pendingRef }),
      });

      if (response.ok) {
        localStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to apply referral:', err);
    }
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn) {
      void checkPendingReferral();
    }
  }, [isSignedIn, checkPendingReferral]);

  const triggerModal = () => {
    if (isModalDismissed === false) {
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const dismissModalPermanently = () => {
    localStorage.setItem(REFERRAL_MODAL_STORAGE_KEY, 'true');
    setIsModalDismissed(true);
    setShowModal(false);
  };

  const resetDismissal = () => {
    localStorage.removeItem(REFERRAL_MODAL_STORAGE_KEY);
    setIsModalDismissed(false);
  };

  return {
    showModal,
    triggerModal,
    closeModal,
    dismissModalPermanently,
    resetDismissal,
    isModalDismissed,
  };
}

export function savePendingReferralCode(referrerUserId: string) {
  localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, referrerUserId);
}

export function getPendingReferralCode(): string | null {
  return localStorage.getItem(REFERRAL_CODE_STORAGE_KEY);
}
