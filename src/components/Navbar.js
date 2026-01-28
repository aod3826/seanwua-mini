import { authService } from '../services/auth.js';

export class Navbar {
  constructor(profile, onNavigate) {
    this.profile = profile;
    this.onNavigate = onNavigate;
  }

  render() {
    return `
      <nav class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-8">
              <h1 class="text-xl font-bold text-blue-600">ระบบแทงหวย</h1>

              <div class="hidden md:flex space-x-4">
                <button data-nav="betting" class="nav-link hover:text-blue-600 transition-colors">
                  แทงหวย
                </button>
                <button data-nav="history" class="nav-link hover:text-blue-600 transition-colors">
                  ประวัติ
                </button>
                ${this.profile.role === 'admin' ? `
                  <button data-nav="admin" class="nav-link hover:text-blue-600 transition-colors">
                    Admin
                  </button>
                ` : ''}
              </div>
            </div>

            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-sm text-gray-600">${this.profile.full_name}</p>
                <p class="text-sm font-semibold text-green-600">
                  ฿${parseFloat(this.profile.balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button id="logoutBtn" class="btn-secondary text-sm">
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </nav>
    `;
  }

  attachEvents() {
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.getAttribute('data-nav');
        this.onNavigate(page);
      });
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await authService.signOut();
      window.location.reload();
    });
  }
}
