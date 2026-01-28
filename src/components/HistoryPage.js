import { lotteryService } from '../services/lottery.js';
import { BET_TYPES, formatCurrency, formatDate } from '../utils/lottery.js';

export class HistoryPage {
  constructor() {
    this.bets = [];
    this.selectedStatus = 'all';
    this.init();
  }

  async init() {
    try {
      this.bets = await lotteryService.getUserBets();
    } catch (error) {
      console.error('Error loading bets:', error);
    }
  }

  getStatusBadge(status) {
    const badges = {
      pending: '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">รอผล</span>',
      won: '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">ถูกรางวัล</span>',
      lost: '<span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">ไม่ถูกรางวัล</span>'
    };
    return badges[status] || badges.pending;
  }

  getFilteredBets() {
    if (this.selectedStatus === 'all') {
      return this.bets;
    }
    return this.bets.filter(bet => bet.status === this.selectedStatus);
  }

  render() {
    const filteredBets = this.getFilteredBets();

    return `
      <div class="max-w-7xl mx-auto p-4">
        <div class="card mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">ประวัติการแทง</h2>

          <!-- Status Filter -->
          <div class="flex flex-wrap gap-2 mb-6">
            <button
              data-filter="all"
              class="filter-btn ${this.selectedStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}
                     px-4 py-2 rounded-lg font-medium transition-all hover:bg-blue-500 hover:text-white"
            >
              ทั้งหมด (${this.bets.length})
            </button>
            <button
              data-filter="pending"
              class="filter-btn ${this.selectedStatus === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'}
                     px-4 py-2 rounded-lg font-medium transition-all hover:bg-yellow-500 hover:text-white"
            >
              รอผล (${this.bets.filter(b => b.status === 'pending').length})
            </button>
            <button
              data-filter="won"
              class="filter-btn ${this.selectedStatus === 'won' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}
                     px-4 py-2 rounded-lg font-medium transition-all hover:bg-green-500 hover:text-white"
            >
              ถูกรางวัล (${this.bets.filter(b => b.status === 'won').length})
            </button>
            <button
              data-filter="lost"
              class="filter-btn ${this.selectedStatus === 'lost' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'}
                     px-4 py-2 rounded-lg font-medium transition-all hover:bg-gray-500 hover:text-white"
            >
              ไม่ถูกรางวัล (${this.bets.filter(b => b.status === 'lost').length})
            </button>
          </div>
        </div>

        <!-- Receipts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${filteredBets.length === 0 ? `
            <div class="col-span-full card text-center py-12">
              <p class="text-gray-400 text-lg">ไม่พบรายการแทง</p>
            </div>
          ` : filteredBets.map(bet => this.renderReceipt(bet)).join('')}
        </div>
      </div>
    `;
  }

  renderReceipt(bet) {
    const statusColors = {
      pending: 'border-yellow-400',
      won: 'border-green-500',
      lost: 'border-gray-400'
    };

    return `
      <div class="receipt ${statusColors[bet.status]} hover:shadow-lg transition-shadow">
        <!-- Header -->
        <div class="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
          <h3 class="text-lg font-bold text-gray-800">โพยแทงหวย</h3>
          <p class="text-sm text-gray-600">งวด ${bet.lottery_draws.draw_number}</p>
          <p class="text-xs text-gray-500">${formatDate(bet.created_at)}</p>
        </div>

        <!-- Bet Numbers -->
        <div class="space-y-2 mb-4">
          ${bet.bet_numbers.map(bn => `
            <div class="flex justify-between items-center text-sm ${bn.is_winner ? 'bg-green-50 p-2 rounded' : ''}">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-lg ${bn.is_winner ? 'text-green-600' : 'text-gray-800'}">
                  ${bn.number}
                </span>
                <span class="text-xs text-gray-600">${BET_TYPES[bn.bet_type].label}</span>
                ${bn.is_winner ? '<span class="text-xs text-green-600 font-bold">✓ ถูก</span>' : ''}
              </div>
              <div class="text-right">
                <div class="font-medium">${formatCurrency(bn.amount)}</div>
                <div class="text-xs text-gray-500">x${bn.payout_rate}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Footer -->
        <div class="border-t-2 border-dashed border-gray-400 pt-3 space-y-2">
          <div class="flex justify-between font-medium">
            <span>ยอดแทง:</span>
            <span>${formatCurrency(bet.total_amount)}</span>
          </div>

          ${bet.status === 'won' ? `
            <div class="flex justify-between font-bold text-green-600 text-lg">
              <span>ยอดถูก:</span>
              <span>${formatCurrency(bet.payout_amount)}</span>
            </div>
          ` : ''}

          <div class="flex justify-center pt-2">
            ${this.getStatusBadge(bet.status)}
          </div>
        </div>

        <!-- Receipt Number -->
        <div class="text-center mt-3 pt-3 border-t border-gray-300">
          <p class="text-xs text-gray-500 font-mono">REF: ${bet.id.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>
    `;
  }

  attachEvents() {
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedStatus = btn.getAttribute('data-filter');
        this.refresh();
      });
    });
  }

  async refresh() {
    await this.init();
    const app = document.getElementById('app');
    const navbar = app.querySelector('nav');
    app.innerHTML = navbar.outerHTML + this.render();
    this.attachEvents();
  }
}
