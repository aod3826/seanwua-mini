import { lotteryService } from '../services/lottery.js';
import { BET_TYPES, validateNumber, formatCurrency } from '../utils/lottery.js';

export class BettingPage {
  constructor(profile, onBalanceUpdate) {
    this.profile = profile;
    this.onBalanceUpdate = onBalanceUpdate;
    this.currentDraw = null;
    this.currentNumber = '';
    this.currentBetType = '3_top';
    this.currentAmount = '';
    this.betItems = [];
    this.init();
  }

  async init() {
    try {
      this.currentDraw = await lotteryService.getCurrentDraw();
    } catch (error) {
      console.error('Error loading draw:', error);
    }
  }

  render() {
    if (!this.currentDraw) {
      return `
        <div class="max-w-7xl mx-auto p-4">
          <div class="card text-center">
            <p class="text-gray-600">กำลังโหลดข้อมูลงวด...</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="max-w-7xl mx-auto p-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left: Numpad and Input -->
          <div class="space-y-4">
            <div class="card">
              <div class="mb-4">
                <h2 class="text-xl font-bold text-gray-800 mb-2">งวดประจำวันที่</h2>
                <p class="text-2xl font-bold text-blue-600">${this.currentDraw.draw_number}</p>
                <p class="text-sm text-gray-600">
                  ปิดรับ: ${new Date(this.currentDraw.close_time).toLocaleString('th-TH')}
                </p>
              </div>

              <!-- Bet Type Selection -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
                <div class="grid grid-cols-3 gap-2">
                  ${Object.entries(BET_TYPES).map(([type, info]) => `
                    <button
                      data-bet-type="${type}"
                      class="bet-type-btn ${this.currentBetType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}
                             py-2 px-3 rounded-lg font-medium text-sm hover:bg-blue-500 hover:text-white transition-all"
                    >
                      ${info.label}
                      <div class="text-xs opacity-80">x${info.payoutRate}</div>
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Number Display -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">เลข</label>
                <div id="numberDisplay" class="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
                  <span class="text-4xl font-bold text-gray-800 tracking-wider">
                    ${this.currentNumber || '---'}
                  </span>
                </div>
              </div>

              <!-- Amount Display -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">จำนวนเงิน</label>
                <div id="amountDisplay" class="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
                  <span class="text-3xl font-bold text-green-600">
                    ${this.currentAmount ? formatCurrency(this.currentAmount) : '฿0.00'}
                  </span>
                </div>
              </div>

              <!-- Numpad -->
              <div class="grid grid-cols-3 gap-3 mb-4">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `
                  <button data-num="${num}" class="numpad-button aspect-square py-4">
                    ${num}
                  </button>
                `).join('')}
                <button data-num="clear" class="numpad-button aspect-square py-4 bg-red-50 hover:bg-red-100 text-red-600">
                  ลบ
                </button>
                <button data-num="0" class="numpad-button aspect-square py-4">
                  0
                </button>
                <button data-num="00" class="numpad-button aspect-square py-4">
                  00
                </button>
              </div>

              <!-- Action Buttons -->
              <div class="grid grid-cols-2 gap-3">
                <button id="addToBetBtn" class="btn-primary py-3">
                  เพิ่มในโพย
                </button>
                <button id="clearAllBtn" class="btn-secondary py-3">
                  ล้างทั้งหมด
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Bet Summary (โพย) -->
          <div class="card">
            <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 pb-2">โพยแทง</h2>

            <div id="betSummary" class="space-y-2 mb-4 max-h-96 overflow-y-auto">
              ${this.betItems.length === 0 ? `
                <div class="text-center text-gray-400 py-8">
                  <p>ยังไม่มีรายการแทง</p>
                </div>
              ` : this.betItems.map((item, index) => `
                <div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-gray-200">
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-bold text-lg text-blue-600">${item.number}</span>
                      <span class="text-sm text-gray-600">${BET_TYPES[item.betType].label}</span>
                    </div>
                    <div class="text-sm text-gray-600">
                      ${formatCurrency(item.amount)}
                      <span class="text-xs">(x${BET_TYPES[item.betType].payoutRate})</span>
                    </div>
                  </div>
                  <button data-remove="${index}" class="text-red-600 hover:text-red-800 font-bold text-xl px-2">
                    ×
                  </button>
                </div>
              `).join('')}
            </div>

            ${this.betItems.length > 0 ? `
              <div class="border-t-2 pt-4 space-y-2">
                <div class="flex justify-between text-lg">
                  <span class="font-medium">รวม:</span>
                  <span class="font-bold text-green-600">
                    ${formatCurrency(this.calculateTotal())}
                  </span>
                </div>
                <div class="flex justify-between text-sm text-gray-600">
                  <span>จำนวนรายการ:</span>
                  <span class="font-semibold">${this.betItems.length} รายการ</span>
                </div>
                <button id="submitBetBtn" class="btn-primary w-full py-3 mt-4">
                  ยืนยันการแทง
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <div id="successModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="card max-w-md mx-4 text-center">
            <div class="text-6xl mb-4">✅</div>
            <h3 class="text-2xl font-bold text-green-600 mb-2">แทงสำเร็จ!</h3>
            <p class="text-gray-600 mb-6">บันทึกโพยแทงเรียบร้อยแล้ว</p>
            <button id="closeModalBtn" class="btn-primary w-full">
              ตกลง
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    document.querySelectorAll('[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-num');
        this.handleNumpad(value);
      });
    });

    document.querySelectorAll('[data-bet-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentBetType = btn.getAttribute('data-bet-type');
        this.refresh();
      });
    });

    document.getElementById('addToBetBtn')?.addEventListener('click', () => {
      this.addToBet();
    });

    document.getElementById('clearAllBtn')?.addEventListener('click', () => {
      this.currentNumber = '';
      this.currentAmount = '';
      this.betItems = [];
      this.refresh();
    });

    document.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-remove'));
        this.betItems.splice(index, 1);
        this.refresh();
      });
    });

    document.getElementById('submitBetBtn')?.addEventListener('click', () => {
      this.submitBet();
    });

    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
      document.getElementById('successModal').classList.add('hidden');
      this.betItems = [];
      this.currentNumber = '';
      this.currentAmount = '';
      this.refresh();
    });
  }

  handleNumpad(value) {
    if (value === 'clear') {
      if (this.currentAmount) {
        this.currentAmount = this.currentAmount.slice(0, -1);
      } else {
        this.currentNumber = this.currentNumber.slice(0, -1);
      }
    } else {
      if (this.currentNumber && !this.currentAmount) {
        this.currentAmount += value;
      } else {
        const maxLength = this.currentBetType.startsWith('3_') ? 3 :
                         this.currentBetType.startsWith('2_') ? 2 : 1;
        if (this.currentNumber.length < maxLength) {
          this.currentNumber += value;
        }
      }
    }
    this.refresh();
  }

  addToBet() {
    if (!validateNumber(this.currentNumber, this.currentBetType)) {
      alert('กรุณากรอกเลขให้ครบถ้วน');
      return;
    }

    if (!this.currentAmount || parseFloat(this.currentAmount) <= 0) {
      alert('กรุณากรอกจำนวนเงิน');
      return;
    }

    this.betItems.push({
      number: this.currentNumber,
      betType: this.currentBetType,
      amount: parseFloat(this.currentAmount),
      payoutRate: BET_TYPES[this.currentBetType].payoutRate
    });

    this.currentNumber = '';
    this.currentAmount = '';
    this.refresh();
  }

  calculateTotal() {
    return this.betItems.reduce((sum, item) => sum + item.amount, 0);
  }

  async submitBet() {
    const total = this.calculateTotal();
    if (total > this.profile.balance) {
      alert('ยอดเงินไม่เพียงพอ');
      return;
    }

    if (!confirm(`ยืนยันการแทง ${this.betItems.length} รายการ\nรวม ${formatCurrency(total)}`)) {
      return;
    }

    try {
      await lotteryService.placeBet(this.currentDraw.id, this.betItems, total);
      document.getElementById('successModal').classList.remove('hidden');
      this.onBalanceUpdate();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  }

  refresh() {
    const container = document.querySelector('.max-w-7xl');
    if (container) {
      container.innerHTML = this.render().replace(/<div class="max-w-7xl[^>]*>/, '').replace(/<\/div>$/, '');
      this.attachEvents();
    }
  }
}
