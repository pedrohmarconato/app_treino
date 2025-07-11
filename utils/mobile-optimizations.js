/**
 * 🚀 OTIMIZAÇÕES MOBILE E PERFORMANCE
 * 
 * Sistema de otimizações para melhorar performance e UX em dispositivos móveis
 */

class MobileOptimizations {
    constructor() {
        this.init();
    }

    init() {
        this.setupImageOptimization();
        this.setupAccessibility();
        this.setupPerformanceMonitoring();
        this.setupTouchOptimizations();
        this.setupOfflineSupport();
    }

    // ============================================================================
    // 🖼️ OTIMIZAÇÃO DE IMAGENS
    // ============================================================================
    
    setupImageOptimization() {
        // Lazy loading para imagens
        this.setupLazyLoading();
        
        // Responsive images
        this.setupResponsiveImages();
        
        // WebP fallback
        this.setupWebPSupport();
    }

    setupLazyLoading() {
        // Usar Intersection Observer para lazy loading
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        // Carregar imagem
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                        }
                        
                        // Parar de observar
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observar todas as imagens com data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });

            // Observer para imagens adicionadas dinamicamente
            const mutationObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeName === 'IMG' && node.dataset.src) {
                            imageObserver.observe(node);
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll('img[data-src]').forEach(img => {
                                imageObserver.observe(img);
                            });
                        }
                    });
                });
            });

            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    setupResponsiveImages() {
        // Aplicar srcset baseado no DPR e viewport
        const optimizeImage = (img) => {
            const viewport = window.innerWidth;
            const dpr = window.devicePixelRatio || 1;
            
            let targetWidth;
            if (viewport <= 375) {
                targetWidth = 375;
            } else if (viewport <= 768) {
                targetWidth = 768;
            } else {
                targetWidth = 1024;
            }
            
            const actualWidth = Math.round(targetWidth * dpr);
            
            // Se a imagem tem data-base-url, gerar URLs otimizadas
            if (img.dataset.baseUrl) {
                const formats = this.supportsWebP() ? 'webp,jpg' : 'jpg';
                img.src = `${img.dataset.baseUrl}?w=${actualWidth}&f=${formats}&q=85`;
            }
        };

        // Aplicar a todas as imagens responsivas
        document.querySelectorAll('img[data-responsive]').forEach(optimizeImage);
        
        // Reotimizar em resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                document.querySelectorAll('img[data-responsive]').forEach(optimizeImage);
            }, 250);
        });
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('webp') !== -1;
    }

    setupWebPSupport() {
        if (!this.supportsWebP()) {
            // Fallback para browsers sem suporte a WebP
            document.querySelectorAll('img[data-webp]').forEach(img => {
                img.src = img.dataset.fallback || img.src.replace('.webp', '.jpg');
            });
        }
    }

    // ============================================================================
    // ♿ ACESSIBILIDADE
    // ============================================================================
    
    setupAccessibility() {
        this.setupFocusManagement();
        this.setupARIASupport();
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
    }

    setupFocusManagement() {
        // Focus trap para modais
        const trapFocus = (element) => {
            const focusableElements = element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            element.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;
                
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            });
            
            firstElement.focus();
        };

        // Aplicar focus trap a modais
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('modal-overlay')) {
                        const modal = node.querySelector('.modal');
                        if (modal) trapFocus(modal);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    setupARIASupport() {
        // Aplicar ARIA labels automaticamente
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
            const text = btn.textContent.trim();
            if (!text) {
                const icon = btn.querySelector('svg, img');
                if (icon) {
                    btn.setAttribute('aria-label', 'Botão');
                }
            }
        });

        // ARIA live regions para notificações
        if (!document.getElementById('announcements')) {
            const announcements = document.createElement('div');
            announcements.id = 'announcements';
            announcements.setAttribute('aria-live', 'polite');
            announcements.setAttribute('aria-atomic', 'true');
            announcements.className = 'sr-only';
            document.body.appendChild(announcements);
        }
    }

    announce(message, priority = 'polite') {
        const announcements = document.getElementById('announcements');
        if (announcements) {
            announcements.setAttribute('aria-live', priority);
            announcements.textContent = message;
            
            // Limpar após 1 segundo
            setTimeout(() => {
                announcements.textContent = '';
            }, 1000);
        }
    }

    setupKeyboardNavigation() {
        // Skip links
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Pular para o conteúdo principal';
        skipLink.className = 'skip-link';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Navegação por teclado em componentes customizados
        document.addEventListener('keydown', (e) => {
            const activeElement = document.activeElement;
            
            // Tab navigation em grids
            if (activeElement.closest('.grid')) {
                this.handleGridNavigation(e, activeElement);
            }
            
            // Arrow navigation em tabs
            if (activeElement.closest('[role="tablist"]')) {
                this.handleTabNavigation(e, activeElement);
            }
        });
    }

    handleGridNavigation(e, element) {
        const grid = element.closest('.grid');
        const items = Array.from(grid.querySelectorAll('[tabindex="0"], button, a'));
        const currentIndex = items.indexOf(element);
        
        let nextIndex;
        switch (e.key) {
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowLeft':
                nextIndex = (currentIndex - 1 + items.length) % items.length;
                break;
            case 'ArrowDown':
                // Assumir grid de 7 colunas (dias da semana)
                nextIndex = (currentIndex + 7) % items.length;
                break;
            case 'ArrowUp':
                nextIndex = (currentIndex - 7 + items.length) % items.length;
                break;
            default:
                return;
        }
        
        e.preventDefault();
        items[nextIndex].focus();
    }

    handleTabNavigation(e, element) {
        const tabList = element.closest('[role="tablist"]');
        const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        const currentIndex = tabs.indexOf(element);
        
        let nextIndex;
        switch (e.key) {
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % tabs.length;
                break;
            case 'ArrowLeft':
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = tabs.length - 1;
                break;
            default:
                return;
        }
        
        e.preventDefault();
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
    }

    setupScreenReaderSupport() {
        // Anunciar mudanças de página
        window.addEventListener('mobileNavigation', (e) => {
            const pageNames = {
                home: 'Página inicial',
                workout: 'Execução de treino',
                planning: 'Planejamento semanal',
                stats: 'Estatísticas'
            };
            
            this.announce(`Navegou para ${pageNames[e.detail.page] || e.detail.page}`);
        });

        // Anunciar progresso de treino
        window.addEventListener('workoutProgress', (e) => {
            this.announce(`Exercício ${e.detail.current} de ${e.detail.total}`, 'assertive');
        });
    }

    // ============================================================================
    // 📱 OTIMIZAÇÕES DE TOUCH
    // ============================================================================
    
    setupTouchOptimizations() {
        // Prevent 300ms delay
        document.addEventListener('touchstart', () => {}, { passive: true });
        
        // Disable pull-to-refresh em elementos específicos
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.no-pull-refresh')) {
                e.preventDefault();
            }
        }, { passive: false });

        // Melhorar scroll momentum
        document.querySelectorAll('.scroll-container').forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
        });

        // Gesture handlers para swipe navigation
        this.setupSwipeGestures();
    }

    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let startTime = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;
            
            // Verificar se é um swipe válido
            if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100 && deltaTime < 300) {
                if (deltaX > 0) {
                    // Swipe right
                    this.handleSwipeRight();
                } else {
                    // Swipe left
                    this.handleSwipeLeft();
                }
            }
        }, { passive: true });
    }

    handleSwipeRight() {
        // Abrir drawer se estiver na borda esquerda
        if (startX < 50 && window.mobileNav) {
            window.mobileNav.openDrawer();
        }
    }

    handleSwipeLeft() {
        // Fechar drawer se estiver aberto
        if (window.mobileNav && window.mobileNav.drawerOpen) {
            window.mobileNav.closeDrawer();
        }
    }

    // ============================================================================
    // 📊 MONITORAMENTO DE PERFORMANCE
    // ============================================================================
    
    setupPerformanceMonitoring() {
        // Core Web Vitals
        this.measureCoreWebVitals();
        
        // Memory usage
        this.monitorMemoryUsage();
        
        // Fps monitoring
        this.monitorFPS();
    }

    measureCoreWebVitals() {
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });

        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            console.log('CLS:', clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
    }

    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const used = Math.round(memory.usedJSHeapSize / 1048576);
                const total = Math.round(memory.totalJSHeapSize / 1048576);
                
                if (used > 50) { // Mais de 50MB
                    console.warn(`High memory usage: ${used}MB / ${total}MB`);
                }
            }, 30000);
        }
    }

    monitorFPS() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 50) {
                    console.warn(`Low FPS detected: ${fps}`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        measureFPS();
    }

    // ============================================================================
    // 📡 SUPORTE OFFLINE
    // ============================================================================
    
    setupOfflineSupport() {
        // Cache de dados críticos no localStorage
        this.setupLocalCache();
        
        // Detectar mudanças de conectividade
        this.setupConnectivityMonitoring();
        
        // Queue de ações offline
        this.setupOfflineQueue();
    }

    setupLocalCache() {
        window.localStorage.setItem('app_version', '1.0.0');
        
        // Cache de configurações do usuário
        this.cacheUserSettings();
        
        // Cache de dados de treino
        this.cacheWorkoutData();
    }

    cacheUserSettings() {
        const settings = {
            theme: 'dark',
            notifications: true,
            autoRest: true,
            restTime: 60,
            cached_at: Date.now()
        };
        
        localStorage.setItem('user_settings', JSON.stringify(settings));
    }

    cacheWorkoutData() {
        // Cache dos últimos treinos para acesso offline
        const cachedWorkouts = JSON.parse(localStorage.getItem('cached_workouts') || '[]');
        
        // Manter apenas os últimos 10 treinos
        if (cachedWorkouts.length > 10) {
            cachedWorkouts.splice(0, cachedWorkouts.length - 10);
            localStorage.setItem('cached_workouts', JSON.stringify(cachedWorkouts));
        }
    }

    setupConnectivityMonitoring() {
        const updateOnlineStatus = () => {
            const isOnline = navigator.onLine;
            
            if (window.mobileNav) {
                window.mobileNav.showOnlineStatus(isOnline);
            }
            
            if (isOnline) {
                this.syncOfflineQueue();
                this.announce('Conexão restaurada');
            } else {
                this.announce('Sem conexão - funcionando offline');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Status inicial
        updateOnlineStatus();
    }

    setupOfflineQueue() {
        if (!localStorage.getItem('offline_queue')) {
            localStorage.setItem('offline_queue', JSON.stringify([]));
        }
    }

    addToOfflineQueue(action) {
        const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        queue.push({
            id: Date.now(),
            action,
            timestamp: Date.now()
        });
        localStorage.setItem('offline_queue', JSON.stringify(queue));
    }

    syncOfflineQueue() {
        const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        
        if (queue.length === 0) return;
        
        this.announce(`Sincronizando ${queue.length} ações offline`);
        
        // Processar queue (implementar conforme necessário)
        queue.forEach(item => {
            console.log('Syncing offline action:', item);
        });
        
        // Limpar queue após sincronização
        localStorage.setItem('offline_queue', JSON.stringify([]));
    }

    // ============================================================================
    // 🔧 UTILITÁRIOS
    // ============================================================================
    
    // Verificar se é dispositivo móvel
    isMobile() {
        return window.innerWidth < 768 || 'ontouchstart' in window;
    }

    // Verificar orientação
    isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    // Verificar se é PWA
    isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone;
    }

    // Vibração haptic feedback
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // Share API
    async share(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                return true;
            } catch (err) {
                console.log('Share cancelled');
                return false;
            }
        }
        
        // Fallback: copiar para clipboard
        if (navigator.clipboard && data.url) {
            try {
                await navigator.clipboard.writeText(data.url);
                this.announce('Link copiado para a área de transferência');
                return true;
            } catch (err) {
                console.error('Failed to copy to clipboard', err);
                return false;
            }
        }
        
        return false;
    }
}

// Inicializar otimizações
window.mobileOptimizations = new MobileOptimizations();

export default MobileOptimizations;