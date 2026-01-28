import { authService } from './services/auth.js';
import { Auth } from './components/Auth.js';
import { Navbar } from './components/Navbar.js';
import { BettingPage } from './components/BettingPage.js';
import { HistoryPage } from './components/HistoryPage.js';
import { AdminPage } from './components/AdminPage.js';

class App {
  constructor() {
    this.currentUser = null;
    this.profile = null;
    this.currentPage = 'betting';
    this.init();
  }

  async init() {
    authService.onAuthStateChange(async (event, session) => {
      if (session) {
        await this.loadUserProfile();
        this.renderApp();
      } else {
        this.renderAuth();
      }
    });

    const user = await authService.getCurrentUser();
    if (user) {
      await this.loadUserProfile();
      this.renderApp();
    } else {
      this.renderAuth();
    }
  }

  async loadUserProfile() {
    try {
      this.profile = await authService.getProfile();
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  renderAuth() {
    const auth = new Auth();
    document.getElementById('app').innerHTML = auth.render();
    auth.attachEvents();
  }

  renderApp() {
    if (!this.profile) return;

    const app = document.getElementById('app');

    const navbar = new Navbar(this.profile, (page) => {
      this.currentPage = page;
      this.renderPage();
    });

    app.innerHTML = navbar.render();
    navbar.attachEvents();

    this.renderPage();
  }

  renderPage() {
    const app = document.getElementById('app');
    const navbarElement = app.querySelector('nav');

    let pageComponent;

    switch (this.currentPage) {
      case 'betting':
        pageComponent = new BettingPage(this.profile, async () => {
          await this.loadUserProfile();
          this.renderApp();
        });
        break;

      case 'history':
        pageComponent = new HistoryPage();
        break;

      case 'admin':
        if (this.profile.role === 'admin') {
          pageComponent = new AdminPage();
        } else {
          pageComponent = new BettingPage(this.profile, async () => {
            await this.loadUserProfile();
            this.renderApp();
          });
        }
        break;

      default:
        pageComponent = new BettingPage(this.profile, async () => {
          await this.loadUserProfile();
          this.renderApp();
        });
    }

    setTimeout(() => {
      app.innerHTML = navbarElement.outerHTML + pageComponent.render();
      pageComponent.attachEvents();
    }, 0);
  }
}

new App();
