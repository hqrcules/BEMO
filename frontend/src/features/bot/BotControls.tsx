import React, { useState } from 'react';
import { Bot, Power, TrendingUp, Crown, Users, AlertCircle, CheckCircle, X, Zap } from 'lucide-react';
import { botService } from '@/services/botService';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { fetchUserProfile } from '@/store/slices/authSlice';
import { useTheme } from '@/shared/context/ThemeContext';

interface BotTier {
  id: 'basic' | 'premium' | 'specialist';
  name: string;
  price: number;
  icon: React.ReactNode;
  color: string;
  features: string[];
  gradient: string;
}

const BOT_TIERS: BotTier[] = [
  {
    id: 'basic',
    name: 'Basic Bot',
    price: 250,
    icon: <Bot className="w-6 h-6" />,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-blue-600',
    features: [
      'Automated Trading',
      '24/7 Market Monitoring',
      'Basic Risk Management',
      'Email Notifications'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Bot',
    price: 500,
    icon: <Crown className="w-6 h-6" />,
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-purple-600',
    features: [
      'Advanced Algorithms',
      'Multi-Pair Trading',
      'Advanced Risk Control',
      'Priority Support',
      'Custom Strategies'
    ]
  },
  {
    id: 'specialist',
    name: 'Specialist Trading',
    price: 1000,
    icon: <Users className="w-6 h-6" />,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500 to-yellow-600',
    features: [
      'Expert Trading Algorithms',
      'Unlimited Trading Pairs',
      'Maximum Profit Optimization',
      'Dedicated Support',
      'Portfolio Management',
      'Advanced Analytics'
    ]
  }
];

const BotControls: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [isToggling, setIsToggling] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<BotTier | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentTier = BOT_TIERS.find(tier => tier.id === user?.bot_type);
  const currentTierIndex = BOT_TIERS.findIndex(tier => tier.id === user?.bot_type);
  const availableUpgrades = BOT_TIERS.filter((_, index) => index > currentTierIndex);

  const handleToggleBot = async () => {
    if (!user) return;

    try {
      setIsToggling(true);
      setError(null);
      const response = await botService.toggleBot();

      if (response.success) {
        // Refresh user profile to get updated is_bot_enabled
        await dispatch(fetchUserProfile()).unwrap();
        setSuccess(response.message);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle bot');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsToggling(false);
    }
  };

  const handleUpgradeClick = (tier: BotTier) => {
    setSelectedTier(tier);
    setShowUpgradeModal(true);
    setError(null);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedTier || !user) return;

    try {
      setIsUpgrading(true);
      setError(null);

      const response = await botService.upgradeBot(selectedTier.id);

      if (response.success) {
        // Refresh user profile to get updated bot_type and balance
        await dispatch(fetchUserProfile()).unwrap();
        setSuccess(response.message);
        setShowUpgradeModal(false);
        setSelectedTier(null);
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upgrade bot');
    } finally {
      setIsUpgrading(false);
    }
  };

  const getUpgradeCost = (targetTier: BotTier): number => {
    const currentPrice = currentTier?.price || 0;
    return targetTier.price - currentPrice;
  };

  if (!user || user.bot_type === 'none') {
    return (
      <div className={`${theme === 'dark' ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 border ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'} shadow-lg`}>
        <div className="text-center">
          <Bot className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            No Bot Subscription
          </h3>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Purchase a bot subscription to enable automated trading
          </p>
          <button
            onClick={() => window.location.href = '/balance'}
            className="btn-primary py-3 px-6"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Get Started</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {success && (
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${theme === 'dark' ? 'bg-green-950 border-green-800' : 'bg-green-50 border-green-200'}`}>
          <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>{success}</p>
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${theme === 'dark' ? 'bg-red-950 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
        </div>
      )}

      {/* Current Bot Status Card */}
      <div className={`${theme === 'dark' ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 border ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'} shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-primary-500/10' : 'bg-primary-50'}`}>
              {currentTier?.icon}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {currentTier?.name}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Subscription
              </p>
            </div>
          </div>

          {/* Bot Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {user.is_bot_enabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={handleToggleBot}
              disabled={isToggling}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                user.is_bot_enabled
                  ? 'bg-primary-500'
                  : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  user.is_bot_enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              >
                {isToggling && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Current Features */}
        <div className="mb-6">
          <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Your Features:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {currentTier?.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${currentTier.color}`} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Section */}
        {availableUpgrades.length > 0 && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Upgrade Your Bot
                </h4>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Unlock more powerful features
                </p>
              </div>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {availableUpgrades.map((tier) => {
                const upgradeCost = getUpgradeCost(tier);
                const canAfford = parseFloat(user.balance) >= upgradeCost;

                return (
                  <button
                    key={tier.id}
                    onClick={() => handleUpgradeClick(tier)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      theme === 'dark'
                        ? 'bg-dark-hover border-dark-border hover:border-primary-500'
                        : 'bg-gray-50 border-gray-200 hover:border-primary-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${tier.gradient}`}>
                          {tier.icon}
                        </div>
                        <div>
                          <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {tier.name}
                          </p>
                          <p className={`text-sm ${canAfford ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>
                            Upgrade: €{upgradeCost}
                          </p>
                        </div>
                      </div>
                      <TrendingUp className={`w-5 h-5 ${tier.color}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Confirmation Modal */}
      {showUpgradeModal && selectedTier && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-card' : 'bg-white'} rounded-2xl max-w-md w-full p-6 border ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Upgrade Bot
              </h3>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedTier(null);
                  setError(null);
                }}
                disabled={isUpgrading}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-dark-hover' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {error && (
              <div className={`p-3 rounded-lg border flex items-start gap-3 mb-4 ${theme === 'dark' ? 'bg-red-950 border-red-800' : 'bg-red-50 border-red-200'}`}>
                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
              </div>
            )}

            <div className={`p-6 rounded-xl mb-6 bg-gradient-to-r ${selectedTier.gradient}`}>
              <div className="flex items-center gap-3 mb-4">
                {selectedTier.icon}
                <h4 className="text-xl font-bold text-white">{selectedTier.name}</h4>
              </div>
              <div className="space-y-2">
                {selectedTier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-white">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Current Tier:
                </span>
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {currentTier?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Upgrade Cost:
                </span>
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  €{getUpgradeCost(selectedTier)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your Balance:
                </span>
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  €{parseFloat(user.balance).toFixed(2)}
                </span>
              </div>
              <div className={`flex justify-between pt-3 border-t ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'}`}>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  New Balance:
                </span>
                <span className={`font-bold text-primary-500`}>
                  €{(parseFloat(user.balance) - getUpgradeCost(selectedTier)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmUpgrade}
                disabled={isUpgrading || parseFloat(user.balance) < getUpgradeCost(selectedTier)}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isUpgrading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    <span>Confirm Upgrade</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedTier(null);
                  setError(null);
                }}
                disabled={isUpgrading}
                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-dark-hover hover:bg-dark-border text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotControls;