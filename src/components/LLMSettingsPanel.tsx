import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useLLMConfig } from '@hooks/useLLMConfig';
import { LLMConfig, LLM_PROVIDER_DEFAULTS } from '../types/llmConfig';

interface LLMSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LLMSettingsPanel({ isOpen, onClose }: LLMSettingsPanelProps) {
  const { config, setConfig, clearConfig, isConfigured } = useLLMConfig();
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing config when panel opens
  useEffect(() => {
    if (isOpen && config) {
      setBaseUrl(config.baseUrl);
      setApiKey(config.apiKey);
      setModel(config.model);
    } else if (isOpen) {
      setBaseUrl('');
      setApiKey('');
      setModel('');
    }
    setErrors({});
  }, [isOpen, config]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!baseUrl.trim()) {
      newErrors.baseUrl = 'API Endpoint is required';
    } else if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      newErrors.baseUrl = 'Endpoint must start with http:// or https://';
    }

    if (!apiKey.trim()) {
      newErrors.apiKey = 'API Key is required';
    }

    if (!model.trim()) {
      newErrors.model = 'Model name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const newConfig: LLMConfig = {
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
    };

    setConfig(newConfig);
    onClose();
  };

  const handleClear = () => {
    clearConfig();
    setBaseUrl('');
    setApiKey('');
    setModel('');
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const applyPreset = (presetKey: keyof typeof LLM_PROVIDER_DEFAULTS) => {
    const preset = LLM_PROVIDER_DEFAULTS[presetKey];
    if (preset.baseUrl) setBaseUrl(preset.baseUrl);
    if (preset.model) setModel(preset.model);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div data-testid="llm-settings-panel" role="dialog" aria-labelledby="llm-settings-title" className="bg-white border border-gray-300 rounded shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#E6F7E5]">
          <h2 id="llm-settings-title" className="text-lg font-semibold text-gray-800">LLM Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Provider Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(LLM_PROVIDER_DEFAULTS).map((key) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as keyof typeof LLM_PROVIDER_DEFAULTS)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors"
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* API Endpoint */}
          <div>
            <label
              htmlFor="llm-endpoint"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              API Endpoint
            </label>
            <input
              id="llm-endpoint"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className={`w-full px-3 py-2 bg-white border rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.baseUrl ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.baseUrl && (
              <p className="mt-1 text-xs text-red-500">{errors.baseUrl}</p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label
              htmlFor="llm-apikey"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              API Key
            </label>
            <div className="relative">
              <input
                id="llm-apikey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className={`w-full px-3 py-2 pr-10 bg-white border rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.apiKey ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label="Toggle API key visibility"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.apiKey && (
              <p className="mt-1 text-xs text-red-500">{errors.apiKey}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Stored locally in your browser. Never sent to our servers.
            </p>
          </div>

          {/* Model */}
          <div>
            <label
              htmlFor="llm-model"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Model
            </label>
            <input
              id="llm-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className={`w-full px-3 py-2 bg-white border rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.model ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.model && (
              <p className="mt-1 text-xs text-red-500">{errors.model}</p>
            )}
          </div>

          {/* Status */}
          {isConfigured && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              LLM is configured and ready
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
