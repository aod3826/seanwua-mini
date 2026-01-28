import { authService } from '../services/auth.js';

export class Auth {
  constructor() {
    this.isLogin = true;
  }

  render() {
    return `
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div class="card max-w-md w-full mx-4">
          <h1 class="text-3xl font-bold text-center mb-6 text-gray-800">
            ${this.isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </h1>

          <form id="authForm" class="space-y-4">
            ${!this.isLogin ? `
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  id="fullName"
                  class="input-field"
                  placeholder="กรอกชื่อ-นามสกุล"
                  required
                />
              </div>
            ` : ''}

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
              <input
                type="email"
                id="email"
                class="input-field"
                placeholder="กรอกอีเมล"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
              <input
                type="password"
                id="password"
                class="input-field"
                placeholder="กรอกรหัสผ่าน"
                required
              />
            </div>

            <div id="errorMessage" class="hidden text-red-600 text-sm p-3 bg-red-50 rounded-lg"></div>

            <button type="submit" class="btn-primary w-full">
              ${this.isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>

          <div class="mt-4 text-center">
            <button id="toggleAuth" class="text-blue-600 hover:text-blue-700 text-sm">
              ${this.isLogin ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const form = document.getElementById('authForm');
    const toggleBtn = document.getElementById('toggleAuth');
    const errorMessage = document.getElementById('errorMessage');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage.classList.add('hidden');

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        if (this.isLogin) {
          await authService.signIn(email, password);
        } else {
          const fullName = document.getElementById('fullName').value;
          await authService.signUp(email, password, fullName);
        }
      } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
      }
    });

    toggleBtn.addEventListener('click', () => {
      this.isLogin = !this.isLogin;
      this.refresh();
    });
  }

  refresh() {
    const app = document.getElementById('app');
    app.innerHTML = this.render();
    this.attachEvents();
  }
}
