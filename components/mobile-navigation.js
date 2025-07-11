/**
 * 📱 COMPONENTE DE NAVEGAÇÃO MOBILE OTIMIZADA
 * 
 * Sistema de navegação touch-friendly para aplicação fitness
 * Inclui bottom navigation, drawer menu e breadcrumbs responsivos
 */

class MobileNavigation {
    constructor() {
        this.currentPage = 'home';
        this.drawerOpen = false;
        this.init();
    }

    init() {
        this.injectNavigationHTML();
        this.bindEvents();
        this.updateActiveNavigation();
    }

    injectNavigationHTML() {
        // Verificar se já existe
        if (document.querySelector('.mobile-nav-system')) return;

        const navHTML = `
            <!-- Sistema de Navegação Mobile -->
            <div class="mobile-nav-system">
                <!-- Header Mobile -->
                <header class="mobile-nav">
                    <div class="mobile-nav-content">
                        <button class="btn btn-icon mobile-menu-toggle" 
                                aria-label="Abrir menu"
                                onclick="mobileNav.toggleDrawer()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        
                        <div class="mobile-nav-brand">
                            <img src="./icons/logo.png" alt="App Treino" class="nav-logo">
                            <span class="nav-title">App Treino</span>
                        </div>
                        
                        <button class="btn btn-icon mobile-profile" 
                                aria-label="Perfil do usuário"
                                onclick="mobileNav.toggleProfile()">
                            <img src="pedro.png" alt="Perfil" class="profile-avatar">
                        </button>
                    </div>
                </header>

                <!-- Bottom Navigation -->
                <nav class="bottom-nav" role="navigation" aria-label="Navegação principal">
                    <div class="bottom-nav-items">
                        <a href="#" class="bottom-nav-item" data-page="home" 
                           onclick="mobileNav.navigateTo('home', event)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9,22 9,12 15,12 15,22"></polyline>
                            </svg>
                            <span>Início</span>
                        </a>
                        
                        <a href="#" class="bottom-nav-item" data-page="workout" 
                           onclick="mobileNav.navigateTo('workout', event)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 2v6h.01L6 8.01 10 8l2-2 2 2 4 .01L18 8.01V2.01A2 2 0 0 0 16 0H8a2 2 0 0 0-2 2z"></path>
                                <path d="M10 16V8h4v8"></path>
                                <path d="M6 18h12"></path>
                            </svg>
                            <span>Treino</span>
                        </a>
                        
                        <a href="#" class="bottom-nav-item" data-page="planning" 
                           onclick="mobileNav.navigateTo('planning', event)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>Planos</span>
                        </a>
                        
                        <a href="#" class="bottom-nav-item" data-page="stats" 
                           onclick="mobileNav.navigateTo('stats', event)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            <span>Stats</span>
                        </a>
                    </div>
                </nav>

                <!-- Drawer Menu -->
                <div class="drawer-overlay" onclick="mobileNav.closeDrawer()"></div>
                <aside class="drawer" role="navigation" aria-label="Menu lateral">
                    <div class="drawer-header">
                        <div class="drawer-profile">
                            <img src="pedro.png" alt="Perfil" class="drawer-avatar">
                            <div class="drawer-user-info">
                                <h3 id="drawer-user-name">Atleta</h3>
                                <p id="drawer-user-status">Treino ativo</p>
                            </div>
                        </div>
                        <button class="btn btn-icon drawer-close" 
                                aria-label="Fechar menu"
                                onclick="mobileNav.closeDrawer()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <nav class="drawer-menu">
                        <a href="#" class="drawer-item" onclick="mobileNav.navigateTo('home', event)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            </svg>
                            <span>Página Inicial</span>
                        </a>
                        
                        <a href="#" class="drawer-item" onclick="mobileNav.navigateTo('workout', event)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 2v6h.01L6 8.01 10 8l2-2 2 2 4 .01L18 8.01V2.01A2 2 0 0 0 16 0H8a2 2 0 0 0-2 2z"></path>
                            </svg>
                            <span>Executar Treino</span>
                        </a>
                        
                        <a href="#" class="drawer-item" onclick="mobileNav.navigateTo('planning', event)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            </svg>
                            <span>Planejamento</span>
                        </a>
                        
                        <div class="drawer-divider"></div>
                        
                        <a href="#" class="drawer-item" onclick="mobileNav.navigateTo('settings', event)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="m12 1 1.07.56.21.94.48.86.86.48.94.21.56 1.07-.56 1.07-.21.94-.48.86-.86.48-.94.21-.56 1.07-1.07-.56-.94-.21-.86-.48-.48-.86-.21-.94L1 12l.56-1.07.21-.94.48-.86.86-.48.94-.21L5 7.93l1.07.56.94.21.86.48.48.86.21.94L9 12.07"></path>
                            </svg>
                            <span>Configurações</span>
                        </a>
                        
                        <a href="#" class="drawer-item" onclick="mobileNav.showHelp()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span>Ajuda</span>
                        </a>
                        
                        <a href="#" class="drawer-item drawer-item-danger" onclick="logout()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16,17 21,12 16,7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            <span>Sair</span>
                        </a>
                    </nav>
                </aside>
            </div>
        `;

        // Inserir no início do body
        document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    bindEvents() {
        // Touch events para drawer
        let startX = 0;
        let currentX = 0;
        let dragging = false;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            if (startX < 20) { // Edge swipe
                dragging = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!dragging) return;
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            
            if (diff > 80 && !this.drawerOpen) {
                this.openDrawer();
                dragging = false;
            }
        });

        document.addEventListener('touchend', () => {
            dragging = false;
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.drawerOpen) {
                this.closeDrawer();
            }
        });
    }

    navigateTo(page, event) {
        if (event) {
            event.preventDefault();
        }

        this.currentPage = page;
        this.updateActiveNavigation();
        this.closeDrawer();

        // Dispatch custom event para outras partes do app
        window.dispatchEvent(new CustomEvent('mobileNavigation', {
            detail: { page }
        }));

        // Chamar função de navegação específica se existir
        switch (page) {
            case 'home':
                if (window.mostrarHome) window.mostrarHome();
                break;
            case 'workout':
                if (window.mostrarWorkout) window.mostrarWorkout();
                break;
            case 'planning':
                if (window.mostrarPlanejamento) window.mostrarPlanejamento();
                break;
            case 'stats':
                if (window.mostrarEstatisticas) window.mostrarEstatisticas();
                break;
            case 'settings':
                if (window.mostrarConfiguracoes) window.mostrarConfiguracoes();
                break;
        }
    }

    updateActiveNavigation() {
        // Atualizar bottom nav
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === this.currentPage) {
                item.classList.add('active');
            }
        });

        // Atualizar title
        const titles = {
            home: 'App Treino',
            workout: 'Executar Treino',
            planning: 'Planejamento',
            stats: 'Estatísticas',
            settings: 'Configurações'
        };

        const navTitle = document.querySelector('.nav-title');
        if (navTitle) {
            navTitle.textContent = titles[this.currentPage] || 'App Treino';
        }

        // Atualizar title da página
        document.title = `${titles[this.currentPage] || 'App Treino'} - Sistema de Treinamento`;
    }

    toggleDrawer() {
        if (this.drawerOpen) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    }

    openDrawer() {
        this.drawerOpen = true;
        const drawer = document.querySelector('.drawer');
        const overlay = document.querySelector('.drawer-overlay');
        
        if (drawer && overlay) {
            drawer.classList.add('open');
            overlay.classList.add('visible');
            
            // Focus trap
            const firstFocusable = drawer.querySelector('button, a');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }

        // Prevenir scroll do body
        document.body.style.overflow = 'hidden';
    }

    closeDrawer() {
        this.drawerOpen = false;
        const drawer = document.querySelector('.drawer');
        const overlay = document.querySelector('.drawer-overlay');
        
        if (drawer && overlay) {
            drawer.classList.remove('open');
            overlay.classList.remove('visible');
        }

        // Restaurar scroll do body
        document.body.style.overflow = '';
    }

    toggleProfile() {
        // Implementar dropdown de perfil ou modal
        console.log('Toggle profile menu');
    }

    showHelp() {
        // Implementar modal de ajuda
        const helpModal = `
            <div class="modal-overlay active" onclick="this.remove()">
                <div class="modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Ajuda - App Treino</h3>
                        <button class="btn btn-icon" onclick="this.closest('.modal-overlay').remove()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <h4>Como usar o aplicativo:</h4>
                        <ul style="margin-left: var(--space-4); margin-bottom: var(--space-4);">
                            <li>📱 <strong>Navegação:</strong> Use os ícones na parte inferior para navegar</li>
                            <li>💪 <strong>Treino:</strong> Toque em "Iniciar Treino" na tela inicial</li>
                            <li>📅 <strong>Planejamento:</strong> Configure seus treinos semanais</li>
                            <li>📊 <strong>Stats:</strong> Acompanhe seu progresso</li>
                            <li>🎯 <strong>Gestos:</strong> Deslize da borda esquerda para abrir o menu</li>
                        </ul>
                        
                        <h4>Dúvidas frequentes:</h4>
                        <details style="margin-bottom: var(--space-3);">
                            <summary>Como iniciar um treino?</summary>
                            <p>Na tela inicial, toque no botão "Iniciar Treino" do card principal.</p>
                        </details>
                        
                        <details style="margin-bottom: var(--space-3);">
                            <summary>Como configurar meu plano semanal?</summary>
                            <p>Vá para "Planos" e toque em "Editar" para personalizar seus treinos.</p>
                        </details>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary btn-full" onclick="this.closest('.modal-overlay').remove()">
                            Entendi!
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', helpModal);
        this.closeDrawer();
    }

    // Métodos utilitários
    setCurrentPage(page) {
        this.currentPage = page;
        this.updateActiveNavigation();
    }

    addBadge(navItem, count) {
        const item = document.querySelector(`[data-page="${navItem}"]`);
        if (item) {
            let badge = item.querySelector('.nav-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'nav-badge';
                item.appendChild(badge);
            }
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    removeBadge(navItem) {
        const item = document.querySelector(`[data-page="${navItem}"]`);
        if (item) {
            const badge = item.querySelector('.nav-badge');
            if (badge) {
                badge.remove();
            }
        }
    }

    showOnlineStatus(isOnline) {
        const header = document.querySelector('.mobile-nav');
        if (header) {
            header.classList.toggle('offline', !isOnline);
        }
    }
}

// CSS específico para a navegação
const navStyles = `
<style>
.mobile-nav-system {
    --nav-height: 60px;
    --bottom-nav-height: 60px;
}

/* Header Mobile */
.mobile-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--nav-height);
    background-color: var(--color-bg-secondary);
    border-bottom: 1px solid var(--border-color);
    z-index: 100;
    backdrop-filter: blur(10px);
}

.mobile-nav-content {
    height: 100%;
    padding: 0 var(--space-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
}

.mobile-nav-brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    justify-content: center;
}

.nav-logo {
    height: 32px;
    width: auto;
}

.nav-title {
    font-size: var(--font-lg);
    font-weight: 600;
    color: var(--color-text-primary);
}

.profile-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

/* Bottom Navigation */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--bottom-nav-height);
    background-color: var(--color-bg-secondary);
    border-top: 1px solid var(--border-color);
    padding: var(--space-2);
    padding-bottom: calc(var(--space-2) + var(--safe-area-bottom));
    z-index: 100;
    backdrop-filter: blur(10px);
}

.bottom-nav-items {
    height: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
}

.bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-2);
    min-width: var(--touch-large);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: all var(--duration-fast) var(--ease-out);
    border-radius: var(--radius-md);
    position: relative;
}

.bottom-nav-item:hover,
.bottom-nav-item:focus {
    color: var(--color-accent);
    background-color: rgba(250, 204, 21, 0.1);
}

.bottom-nav-item.active {
    color: var(--color-accent);
}

.bottom-nav-item svg {
    width: 24px;
    height: 24px;
}

.bottom-nav-item span {
    font-size: var(--font-xs);
    font-weight: 500;
}

/* Badge para notificações */
.nav-badge {
    position: absolute;
    top: 4px;
    right: 8px;
    background-color: var(--color-error);
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    min-width: 18px;
    text-align: center;
    line-height: 1.2;
}

/* Drawer */
.drawer {
    position: fixed;
    top: 0;
    left: -100%;
    width: 85%;
    max-width: 320px;
    height: 100vh;
    background-color: var(--color-bg-secondary);
    box-shadow: var(--shadow-xl);
    transition: left var(--duration-base) var(--ease-out);
    z-index: 200;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.drawer.open {
    left: 0;
}

.drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 0;
    visibility: hidden;
    transition: all var(--duration-base) var(--ease-out);
    z-index: 199;
}

.drawer-overlay.visible {
    opacity: 1;
    visibility: visible;
}

.drawer-header {
    padding: var(--space-5);
    padding-top: calc(var(--space-5) + var(--safe-area-top));
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.drawer-profile {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.drawer-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
}

.drawer-user-info h3 {
    margin: 0;
    font-size: var(--font-lg);
}

.drawer-user-info p {
    margin: 0;
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
}

.drawer-menu {
    flex: 1;
    padding: var(--space-4);
}

.drawer-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    color: var(--color-text-primary);
    text-decoration: none;
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--ease-out);
    margin-bottom: var(--space-2);
}

.drawer-item:hover,
.drawer-item:focus {
    background-color: var(--color-bg-hover);
}

.drawer-item svg {
    width: 20px;
    height: 20px;
    color: var(--color-text-secondary);
}

.drawer-item-danger {
    color: var(--color-error);
}

.drawer-item-danger svg {
    color: var(--color-error);
}

.drawer-divider {
    height: 1px;
    background-color: var(--border-color);
    margin: var(--space-4) 0;
}

/* Status offline */
.mobile-nav.offline::after {
    content: 'Offline';
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--color-warning);
    color: white;
    text-align: center;
    font-size: var(--font-xs);
    padding: 2px;
}

/* Ajustes para safe areas */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
    .bottom-nav {
        padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
    }
    
    .drawer-header {
        padding-top: calc(var(--space-5) + env(safe-area-inset-top));
    }
}

/* Responsivo */
@media (min-width: 768px) {
    .mobile-nav-system {
        display: none;
    }
}
</style>
`;

// Injetar estilos
document.head.insertAdjacentHTML('beforeend', navStyles);

// Inicializar navegação mobile
window.mobileNav = new MobileNavigation();

// Ajustar padding do body para compensar as barras de navegação
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth < 768) {
        document.body.style.paddingTop = '60px';
        document.body.style.paddingBottom = '60px';
    }
});

// Event listeners para mudanças de orientação
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        document.body.style.paddingTop = '';
        document.body.style.paddingBottom = '';
    } else {
        document.body.style.paddingTop = '60px';
        document.body.style.paddingBottom = '60px';
    }
});

export default MobileNavigation;