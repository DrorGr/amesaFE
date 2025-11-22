// Lottery Favorites & Entry Management Translation Keys
// Translation key constants for lottery-related UI elements
// These keys will be added to the database by BE Agent in BE-1.5

/**
 * Translation key categories for lottery features
 * Format: lottery.{category}.{key}
 */

export const LOTTERY_TRANSLATION_KEYS = {
  // Favorites
  favorites: {
    title: 'lottery.favorites.title',
    empty: 'lottery.favorites.empty',
    emptyDescription: 'lottery.favorites.emptyDescription',
    addToFavorites: 'lottery.favorites.addToFavorites',
    removeFromFavorites: 'lottery.favorites.removeFromFavorites',
    added: 'lottery.favorites.added',
    removed: 'lottery.favorites.removed',
    alreadyFavorite: 'lottery.favorites.alreadyFavorite',
    notFavorite: 'lottery.favorites.notFavorite'
  },

  // Entries
  entries: {
    title: 'lottery.entries.title',
    active: 'lottery.entries.active',
    history: 'lottery.entries.history',
    empty: 'lottery.entries.empty',
    emptyDescription: 'lottery.entries.emptyDescription',
    ticketNumber: 'lottery.entries.ticketNumber',
    purchaseDate: 'lottery.entries.purchaseDate',
    status: 'lottery.entries.status',
    statusActive: 'lottery.entries.statusActive',
    statusWinner: 'lottery.entries.statusWinner',
    statusRefunded: 'lottery.entries.statusRefunded',
    isWinner: 'lottery.entries.isWinner',
    notWinner: 'lottery.entries.notWinner'
  },

  // Dashboard
  dashboard: {
    title: 'lottery.dashboard.title',
    welcome: 'lottery.dashboard.welcome',
    activeEntries: 'lottery.dashboard.activeEntries',
    favoriteHouses: 'lottery.dashboard.favoriteHouses',
    statistics: 'lottery.dashboard.statistics',
    recentActivity: 'lottery.dashboard.recentActivity',
    viewAll: 'lottery.dashboard.viewAll'
  },

  // Quick Entry
  quickEntry: {
    title: 'lottery.quickEntry.title',
    enterNow: 'lottery.quickEntry.enterNow',
    fromFavorites: 'lottery.quickEntry.fromFavorites',
    quantity: 'lottery.quickEntry.quantity',
    totalCost: 'lottery.quickEntry.totalCost',
    confirm: 'lottery.quickEntry.confirm',
    cancel: 'lottery.quickEntry.cancel',
    success: 'lottery.quickEntry.success',
    error: 'lottery.quickEntry.error'
  },

  // Notifications
  notifications: {
    newLottery: 'lottery.notifications.newLottery',
    favoriteUpdate: 'lottery.notifications.favoriteUpdate',
    drawReminder: 'lottery.notifications.drawReminder',
    winnerAnnouncement: 'lottery.notifications.winnerAnnouncement',
    entryConfirmed: 'lottery.notifications.entryConfirmed',
    entryStatusChanged: 'lottery.notifications.entryStatusChanged'
  },

  // Filters
  filters: {
    title: 'lottery.filters.title',
    status: 'lottery.filters.status',
    house: 'lottery.filters.house',
    dateRange: 'lottery.filters.dateRange',
    startDate: 'lottery.filters.startDate',
    endDate: 'lottery.filters.endDate',
    apply: 'lottery.filters.apply',
    clear: 'lottery.filters.clear',
    all: 'lottery.filters.all'
  },

  // Statistics
  statistics: {
    title: 'lottery.statistics.title',
    totalEntries: 'lottery.statistics.totalEntries',
    activeEntries: 'lottery.statistics.activeEntries',
    totalWins: 'lottery.statistics.totalWins',
    totalSpending: 'lottery.statistics.totalSpending',
    totalWinnings: 'lottery.statistics.totalWinnings',
    winRate: 'lottery.statistics.winRate',
    averageSpending: 'lottery.statistics.averageSpending',
    favoriteHouse: 'lottery.statistics.favoriteHouse',
    mostActiveMonth: 'lottery.statistics.mostActiveMonth',
    lastEntry: 'lottery.statistics.lastEntry'
  },

  // Recommendations
  recommendations: {
    title: 'lottery.recommendations.title',
    basedOnFavorites: 'lottery.recommendations.basedOnFavorites',
    similarPrice: 'lottery.recommendations.similarPrice',
    sameLocation: 'lottery.recommendations.sameLocation',
    viewDetails: 'lottery.recommendations.viewDetails',
    empty: 'lottery.recommendations.empty'
  },

  // Common
  common: {
    loading: 'lottery.common.loading',
    error: 'lottery.common.error',
    retry: 'lottery.common.retry',
    close: 'lottery.common.close',
    save: 'lottery.common.save',
    cancel: 'lottery.common.cancel',
    delete: 'lottery.common.delete',
    edit: 'lottery.common.edit',
    view: 'lottery.common.view',
    back: 'lottery.common.back',
    next: 'lottery.common.next',
    previous: 'lottery.common.previous'
  }
} as const;

/**
 * Helper function to get all translation keys as a flat array
 * Useful for validation or bulk operations
 */
export function getAllLotteryTranslationKeys(): string[] {
  const keys: string[] = [];
  
  Object.values(LOTTERY_TRANSLATION_KEYS).forEach(category => {
    Object.values(category).forEach(key => {
      if (typeof key === 'string') {
        keys.push(key);
      }
    });
  });
  
  return keys;
}

