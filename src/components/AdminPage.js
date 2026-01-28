import { lotteryService } from '../services/lottery.js';
import { BET_TYPES, formatCurrency, formatDate } from '../utils/lottery.js';

export class AdminPage {
  constructor() {
    this.currentDraw = null;
    this.riskSummary = [];
    this.allBets = [];
    this.selectedBetType = 'all';
    this.init();
  }

  async init() {
    try {
      this.currentDraw = await lotteryService.getCurrentDraw();
      if (this.currentDraw) {
        this.riskSummary = await lotteryService.getAdminRiskSummary(this.currentDraw.id);
        this.allBets = await lotteryService.getAllBets(this.currentDraw.id);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }

  getTotalRisk() {
    return this.riskSummary.reduce((sum, item) => sum + item.totalRisk, 0);
  }

  getTotalBets() {
    return this.allBets.length;
  }

  getTotalBetAmount() {
    return this.allBets.reduce((sum, bet) => sum + parseFloat(bet.total_amount), 0);
  }

  getFilteredRiskSummary() {
    if (this.selectedBetType === 'all') {
      return this.riskSummary;
    }
    return this.riskSummary.filter(item => item.betType === this.selectedBetType);
  }

  getRiskLevel(amount) {
    const avg = this.getTotalRisk() / this.riskSummary.length;
    if (amount > avg * 2) return 'high';
    if (amount > avg) return 'medium';
    return 'low';
  }

  getRiskColor(level) {
    const colors = {
      high: 'bg-red-100 border-red-400 text-red-800',
      medium: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      low: 'bg-green-100 border-green-400 text-green-800'
    };
    return colors[level] || colors.low;
  }

  render() {
    if (!this.currentDraw) {
      return `
        <div class="max-w-7xl mx-auto p-4">
          <div class="card text-center">
            <p class="text-gray-600">ไม่มีงวดที่เปิดรับแทง</p>
          </div>
        </div>
      `;
    }

    const filteredRisk = this.getFilteredRiskSummary();

    return `
      <div class="max-w-7xl mx-auto p-4">
        <!-- Header Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 class="text-sm font-medium opacity-90">งวดปัจจุบัน</h3>
            <p class="text-2xl font-bold mt-2">${this.currentDraw.draw_number}</p>
          </div>

          <div class="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 class="text-sm font-medium opacity-90">ยอดรับทั้งหมด</h3>
            <p class="text-2xl font-bold mt-2">${formatCurrency(this.getTotalBetAmount())}</p>
          </div>

          <div class="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <h3 class="text-sm font-medium opacity-90">จำนวนโพย</h3>
            <p class="text-2xl font-bold mt-2">${this.getTotalBets()}</p>
          </div>

          <div class="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <h3 class="text-sm font-medium opacity-90">ยอดสู้รวม</h3>
            <p class="text-2xl font-bold mt-2">${formatCurrency(this.getTotalRisk())}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Risk Summary -->
          <div class="card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-gray-800">สรุปยอดสู้</h2>
              <select
                id="betTypeFilter"
                class="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">ทุกประเภท</option>
                ${Object.entries(BET_TYPES).map(([type, info]) => `
                  <option value="${type}" ${this.selectedBetType === type ? 'selected' : ''}>
                    ${info.label}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="space-y-2 max-h-96 overflow-y-auto">
              ${filteredRisk.length === 0 ? `
                <div class="text-center text-gray-400 py-8">
                  <p>ยังไม่มีข้อมูล</p>
                </div>
              ` : filteredRisk.map(item => {
                const riskLevel = this.getRiskLevel(item.totalRisk);
                return `
                  <div class="border-2 rounded-lg p-3 ${this.getRiskColor(riskLevel)}">
                    <div class="flex justify-between items-center">
                      <div>
                        <span class="font-bold text-2xl">${item.number}</span>
                        <span class="text-sm ml-2">${BET_TYPES[item.betType].label}</span>
                      </div>
                      <div class="text-right">
                        <div class="font-bold text-lg">${formatCurrency(item.totalRisk)}</div>
                        <div class="text-xs opacity-75">
                          ${riskLevel === 'high' ? '⚠️ สูง' : riskLevel === 'medium' ? '⚡ ปานกลาง' : '✓ ต่ำ'}
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- All Bets -->
          <div class="card">
            <h2 class="text-xl font-bold text-gray-800 mb-4">รายการแทงทั้งหมด</h2>

            <div class="space-y-3 max-h-96 overflow-y-auto">
              ${this.allBets.length === 0 ? `
                <div class="text-center text-gray-400 py-8">
                  <p>ยังไม่มีรายการแทง</p>
                </div>
              ` : this.allBets.map(bet => `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <p class="font-semibold text-gray-800">${bet.profiles?.full_name || 'N/A'}</p>
                      <p class="text-xs text-gray-600">${bet.profiles?.email || 'N/A'}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-green-600">${formatCurrency(bet.total_amount)}</p>
                      <p class="text-xs text-gray-500">${formatDate(bet.created_at)}</p>
                    </div>
                  </div>

                  <div class="border-t border-gray-300 pt-2 mt-2">
                    <details class="cursor-pointer">
                      <summary class="text-sm text-blue-600 hover:text-blue-700">
                        ดูรายละเอียด (${bet.bet_numbers.length} รายการ)
                      </summary>
                      <div class="mt-2 space-y-1">
                        ${bet.bet_numbers.map(bn => `
                          <div class="text-xs flex justify-between bg-white p-2 rounded">
                            <span>
                              <span class="font-bold">${bn.number}</span>
                              <span class="text-gray-600 ml-1">${BET_TYPES[bn.bet_type].label}</span>
                            </span>
                            <span class="font-medium">${formatCurrency(bn.amount)}</span>
                          </div>
                        `).join('')}
                      </div>
                    </details>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    document.getElementById('betTypeFilter')?.addEventListener('change', (e) => {
      this.selectedBetType = e.target.value;
      this.refresh();
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
