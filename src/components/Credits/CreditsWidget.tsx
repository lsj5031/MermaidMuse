import { useState } from 'react';
import { SignedIn } from '@clerk/clerk-react';
import { useCredits } from '@hooks/useCredits';
import { Users } from 'lucide-react';
import ReferralModal from '@components/ReferralModal';

export default function CreditsWidget() {
  const { creditsBalance, isLoading, error, createCheckoutSession } = useCredits();
  const [showReferralModal, setShowReferralModal] = useState(false);

  return (
    <SignedIn>
      <>
        <ReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          onDontShowAgain={() => setShowReferralModal(false)}
        />
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <div className="rounded border border-gray-300 bg-white px-2 py-1">
            Credits:{' '}
            <span className="font-semibold">
              {isLoading && creditsBalance === null ? '…' : (creditsBalance ?? '—')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void createCheckoutSession()}
            className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold"
          >
            Top up 100 ($10 + fees)
          </button>

          <button
            type="button"
            onClick={() => setShowReferralModal(true)}
            className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold flex items-center gap-1"
            title="Share with friends and earn credits"
          >
            <Users className="w-3 h-3" />
            <span>Referral</span>
          </button>

          {error ? (
            <div className="text-[11px] text-red-600 max-w-56 truncate">{error}</div>
          ) : null}
        </div>
      </>
    </SignedIn>
  );
}
