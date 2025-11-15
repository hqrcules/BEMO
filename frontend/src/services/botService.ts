import api from '@/shared/config/axios';

export interface BotToggleResponse {
  success: boolean;
  is_bot_enabled: boolean;
  message: string;
}

export interface BotUpgradeResponse {
  success: boolean;
  bot_type: string;
  new_balance: string;
  upgrade_cost: number;
  message: string;
}

export const botService = {
  /**
   * Toggle bot enabled/disabled status
   */
  async toggleBot(): Promise<BotToggleResponse> {
    const response = await api.post('/api/auth/bot/toggle/');
    return response.data;
  },

  /**
   * Upgrade bot to a higher tier
   * @param botType - Target bot type ('basic', 'premium', or 'specialist')
   */
  async upgradeBot(botType: 'basic' | 'premium' | 'specialist'): Promise<BotUpgradeResponse> {
    const response = await api.post('/api/auth/bot/upgrade/', {
      bot_type: botType
    });
    return response.data;
  },
};
