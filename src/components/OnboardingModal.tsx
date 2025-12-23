import React, { useState } from 'react';
import { X, BookOpen, Zap, Download, Share2, RotateCcw, CreditCard } from 'lucide-react';
import { useOnboarding } from '@hooks/useOnboarding';

interface OnboardingStep {
  id: string;
  title: string;
  description: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MermaidMuse',
    description: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Create beautiful diagrams with Mermaid syntax. This guide will help you get started.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
          <p className="text-sm text-emerald-900">
            <strong>Tip:</strong> MermaidMuse is a diagram editor that lets you create flowcharts,
            sequence diagrams, state diagrams, and more.
          </p>
        </div>
      </div>
    ),
    icon: BookOpen,
  },
  {
    id: 'editor',
    title: 'Write Your Diagrams',
    description: (
      <div className="space-y-4">
        <p className="text-gray-700">
          The left panel is a code editor where you write Mermaid syntax. Changes are validated in
          real-time.
        </p>
        <div className="bg-gray-50 border border-gray-300 rounded p-3 font-mono text-xs">
          <pre className="text-gray-700">{`graph TD
  A[Start] --> B[Process]
  B --> C[End]`}</pre>
        </div>
        <p className="text-xs text-gray-600">
          👉 Edit the code on the left and see your diagram instantly on the right.
        </p>
      </div>
    ),
    icon: Zap,
  },
  {
    id: 'preview',
    title: 'Preview & Interact',
    description: (
      <div className="space-y-4">
        <p className="text-gray-700">
          The right panel shows your rendered diagram in real-time. You can:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
          <li>
            <strong>Zoom:</strong> Scroll to zoom (up to 800%), double-click to zoom to fit
          </li>
          <li>
            <strong>Pan:</strong> Click and drag to move around
          </li>
          <li>
            <strong>Themes:</strong> Change diagram themes from the toolbar
          </li>
        </ul>
      </div>
    ),
    icon: RotateCcw,
  },
  {
    id: 'export',
    title: 'Export Your Work',
    description: (
      <div className="space-y-4">
        <p className="text-gray-700">Save and share your diagrams using the toolbar at the top:</p>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <Download className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>SVG & PNG:</strong> Download watermarked versions of your diagram
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Share2 className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Share:</strong> Generate a link with your diagram embedded in the URL
            </span>
          </li>
          <li className="flex items-start gap-2">
            <RotateCcw className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Reset:</strong> Start over with the default sample diagram
            </span>
          </li>
        </ul>
      </div>
    ),
    icon: Download,
  },
  {
    id: 'features',
    title: 'AI Fix & Pro Features',
    description: (
      <div className="space-y-4">
        <p className="text-gray-700">Get help with your diagrams:</p>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <Zap className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
            <span>
              <strong>AI Fix:</strong> Let AI fix syntax errors in your diagram
            </span>
          </li>
          <li className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Real-time validation:</strong> See errors and warnings as you type
            </span>
          </li>
        </ul>
      </div>
    ),
    icon: Zap,
  },
  {
    id: 'pricing',
    title: 'Credits & Pricing',
    description: (
      <div className="space-y-4">
        <p className="text-gray-700">MermaidMuse uses a simple credit system:</p>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-900">
              <strong>✓ Free features:</strong> Creating, editing, exporting diagrams
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
            <p className="text-sm text-emerald-900">
              <strong>💳 New users:</strong> Get 10 free credits
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-900">
              <strong>⚡ AI Fix cost:</strong> 1 credit per successful fix (only charged when AI
              provides a solution)
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
            <p className="text-sm text-emerald-900">
              <strong>📦 Top up:</strong> Buy 100 credits for $10 (plus processing fees)
            </p>
          </div>
        </div>
      </div>
    ),
    icon: CreditCard,
  },
];

export default function OnboardingModal() {
  const { shouldShow, dismiss } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!shouldShow) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const Icon = step.icon;

  const handleDismiss = () => {
    if (dontShowAgain) {
      dismiss();
    } else {
      dismiss();
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleDismiss();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-emerald-100 rounded-lg p-3">
              <Icon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
              <p className="text-xs text-gray-500 mt-1">
                Step {currentStep + 1} of {ONBOARDING_STEPS.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-gray-700">{step.description}</div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 space-y-4">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span>Don't show this again</span>
          </label>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
