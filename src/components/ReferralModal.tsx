import React, { useState, useEffect } from 'react';
import { X, Users, Copy, Check } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { getApiUrl } from '@utils/environmentHelpers';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}

export default function ReferralModal({ isOpen, onClose, onDontShowAgain }: ReferralModalProps) {
  const { getToken } = useAuth();
  const [referralLink, setReferralLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferralCode = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/referral-code`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { ok: boolean; userId: string };
        if (data.ok && data.userId) {
          const url = new URL(window.location.href);
          url.searchParams.set('ref', data.userId);
          setReferralLink(url.toString());
        }
      }
    } catch (err) {
      console.error('Failed to fetch referral code:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isOpen) {
      void fetchReferralCode();
    }
  }, [isOpen, fetchReferralCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    if (dontShowAgain) {
      onDontShowAgain();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-lg p-3">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Share & Earn!</h2>
              <p className="text-sm text-gray-500 mt-1">Get 50 credits for each referral</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>🎉 Congratulations!</strong> Your diagram has been fixed successfully!
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-gray-700">
              Share MermaidMuse with friends and colleagues. When they sign up using your link:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
              <li>
                <strong>You get 50 credits</strong>
              </li>
              <li>
                <strong>They get 50 credits</strong>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Your referral link:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={isLoading ? 'Loading...' : referralLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono bg-gray-50"
              />
              <button
                onClick={handleCopy}
                disabled={isLoading || !referralLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-900">
              <strong>💡 Tip:</strong> Share this link on social media, with your team, or anywhere
              you discuss diagramming and documentation.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 space-y-4">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span>Don't show this again (you can still access your link anytime)</span>
          </label>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
