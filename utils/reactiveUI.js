// utils/reactiveUI.js - Sistema reativo para atualizar UI automaticamente
import AppState from '../state/appState.js';

export class ReactiveUI {
    constructor() {
        this.bindings = new Map();
        this.formatters = new Map();
        this.animations = new Map();
        this.isInitialized = false;
    }

    // Inicializar sistema reativo
    init() {
        if (this.isInitialized) return;

        this.setupDefaultFormatters();
        this.setupDefaultAnimations();
        this.bindStateChanges();
        
        this.isInitialized = true;
        console.log('[ReactiveUI] ✅ Sistema reativo inicializado');
    }

    // Vincular elemento a uma propriedade do estado
    bind(elementId, statePath, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`[ReactiveUI] Elemento ${elementId} não encontrado`);
            return;
        }

        const binding = {
            element,
            statePath,
            formatter: options.formatter || 'default',
            animation: options.animation || null,
            attribute: options.attribute || 'textContent',
            condition: options.condition || null,
            transform: options.transform || null
        };

        this.bindings.set(elementId, binding);

        // Aplicar valor inicial
        this.updateBinding(binding);
        
        console.log(`[ReactiveUI] Binding criado: ${elementId} -> ${statePath}`);
    }

    // Vincular múltiplos elementos de uma vez
    bindMultiple(bindings) {
        bindings.forEach(binding => {
            this.bind(binding.elementId, binding.statePath, binding.options);
        });
    }

    // Atualizar um binding específico
    updateBinding(binding) {
        try {
            const value = this.getNestedValue(AppState, binding.statePath);
            
            // Aplicar condição se existir
            if (binding.condition && !binding.condition(value)) {
                return;
            }

            // Aplicar transformação se existir
            let finalValue = binding.transform ? binding.transform(value) : value;

            // Aplicar formatador
            const formatter = this.formatters.get(binding.formatter);
            if (formatter) {
                finalValue = formatter(finalValue);
            }

            // Aplicar animação se especificada
            if (binding.animation) {
                this.applyAnimation(binding.element, binding.animation, finalValue);
            } else {
                // Atualizar elemento diretamente
                if (binding.attribute === 'textContent') {
                    binding.element.textContent = finalValue;
                } else if (binding.attribute === 'innerHTML') {
                    binding.element.innerHTML = finalValue;
                } else if (binding.attribute.startsWith('style.')) {
                    const styleProp = binding.attribute.replace('style.', '');
                    binding.element.style[styleProp] = finalValue;
                } else {
                    binding.element.setAttribute(binding.attribute, finalValue);
                }
            }

        } catch (error) {
            console.error(`[ReactiveUI] Erro ao atualizar binding ${binding.element.id}:`, error);
        }
    }

    // Configurar observadores do estado
    bindStateChanges() {
        // Observar mudanças gerais
        AppState.subscribe('currentUser', () => this.updateAllBindings());
        AppState.subscribe('weekPlan', () => this.updateAllBindings());
        AppState.subscribe('currentWorkout', () => this.updateAllBindings());
        AppState.subscribe('userMetrics', () => this.updateAllBindings());
    }

    // Atualizar todos os bindings
    updateAllBindings() {
        this.bindings.forEach(binding => this.updateBinding(binding));
    }

    // Configurar formatadores padrão
    setupDefaultFormatters() {
        // Formatador padrão
        this.formatters.set('default', (value) => {
            return value !== null && value !== undefined ? String(value) : '';
        });

        // Formatador de porcentagem
        this.formatters.set('percentage', (value) => {
            return `${Math.round(Number(value) || 0)}%`;
        });

        // Formatador de número
        this.formatters.set('number', (value) => {
            return Number(value) || 0;
        });

        // Formatador de peso
        this.formatters.set('weight', (value) => {
            return `${Number(value) || 0}kg`;
        });

        // Formatador de tempo
        this.formatters.set('time', (value) => {
            const minutes = Math.floor(Number(value) / 60);
            const seconds = Number(value) % 60;
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        });

        // Formatador de data
        this.formatters.set('date', (value) => {
            return value ? new Date(value).toLocaleDateString('pt-BR') : '';
        });

        // Formatador de nome de treino
        this.formatters.set('workoutName', (workout) => {
            if (!workout) return 'Nenhum treino';
            
            switch(workout.tipo) {
                case 'folga': return 'Dia de Folga';
                case 'cardio': 
                case 'Cardio': return 'Treino Cardiovascular';
                default: return `Treino ${workout.tipo}`;
            }
        });

        // Formatador de tipo de treino
        this.formatters.set('workoutType', (workout) => {
            if (!workout) return 'Configure';
            
            switch(workout.tipo) {
                case 'folga': return 'Descanso';
                case 'cardio':
                case 'Cardio': return 'Cardio';
                default: return `Treino ${workout.tipo}`;
            }
        });
    }

    // Configurar animações padrão
    setupDefaultAnimations() {
        // Animação de contador
        this.animations.set('counter', (element, value) => {
            const startValue = parseInt(element.textContent) || 0;
            const endValue = parseInt(value) || 0;
            const duration = 1000;
            const increment = (endValue - startValue) / (duration / 16);
            
            let current = startValue;
            const timer = setInterval(() => {
                current += increment;
                if ((increment > 0 && current >= endValue) || (increment < 0 && current <= endValue)) {
                    current = endValue;
                    clearInterval(timer);
                }
                element.textContent = Math.round(current);
            }, 16);
        });

        // Animação de barra de progresso
        this.animations.set('progressBar', (element, value) => {
            const percentage = Math.min(Number(value) || 0, 100);
            element.style.transition = 'width 1s ease-out';
            element.style.width = `${percentage}%`;
        });

        // Animação de fade in
        this.animations.set('fadeIn', (element, value) => {
            element.style.opacity = '0';
            element.textContent = value;
            element.style.transition = 'opacity 0.5s ease-in-out';
            setTimeout(() => {
                element.style.opacity = '1';
            }, 10);
        });

        // Animação de escala
        this.animations.set('scale', (element, value) => {
            element.textContent = value;
            element.style.transform = 'scale(1.1)';
            element.style.transition = 'transform 0.3s ease-out';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 100);
        });
    }

    // Aplicar animação
    applyAnimation(element, animationType, value) {
        const animation = this.animations.get(animationType);
        if (animation) {
            animation(element, value);
        } else {
            element.textContent = value;
        }
    }

    // Obter valor aninhado de um objeto
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            if (typeof current === 'object' && current !== null && key in current) {
                return current[key];
            }
            return undefined;
        }, obj);
    }

    // Adicionar formatador customizado
    addFormatter(name, formatter) {
        this.formatters.set(name, formatter);
    }

    // Adicionar animação customizada
    addAnimation(name, animation) {
        this.animations.set(name, animation);
    }

    // Remover binding
    unbind(elementId) {
        this.bindings.delete(elementId);
    }

    // Configuração rápida para a home
    setupHomeBindings() {
        const homeBindings = [
            // Informações do usuário
            {
                elementId: 'user-name',
                statePath: 'currentUser.nome',
                options: { formatter: 'default' }
            },

            // Treino atual
            {
                elementId: 'workout-name',
                statePath: 'currentWorkout',
                options: { formatter: 'workoutName' }
            },
            {
                elementId: 'workout-type',
                statePath: 'currentWorkout',
                options: { formatter: 'workoutType' }
            },

            // Métricas
            {
                elementId: 'completed-workouts',
                statePath: 'userMetrics.treinosConcluidos',
                options: { 
                    formatter: 'number',
                    animation: 'counter'
                }
            },
            {
                elementId: 'current-week',
                statePath: 'userMetrics.semanaAtual',
                options: { 
                    formatter: 'number',
                    animation: 'counter'
                }
            },
            {
                elementId: 'progress-percentage',
                statePath: 'userMetrics.progresso',
                options: { 
                    formatter: 'percentage',
                    animation: 'fadeIn'
                }
            },

            // Barras de progresso
            {
                elementId: 'user-progress-bar',
                statePath: 'userMetrics.treinosConcluidos',
                options: {
                    attribute: 'style.width',
                    animation: 'progressBar',
                    transform: (value) => Math.min((Number(value) / 4) * 100, 100)
                }
            },
            {
                elementId: 'workout-progress-circle',
                statePath: 'userMetrics.progresso',
                options: {
                    attribute: 'style.strokeDashoffset',
                    transform: (value) => {
                        const percentage = Number(value) || 0;
                        return 251.2 - (percentage / 100) * 251.2;
                    }
                }
            },

            // Texto do progresso
            {
                elementId: 'workout-progress-text',
                statePath: 'userMetrics.progresso',
                options: { 
                    formatter: 'percentage',
                    animation: 'scale'
                }
            },

            // Contador de workouts na comparação
            {
                elementId: 'user-workouts',
                statePath: 'userMetrics.treinosConcluidos',
                options: { 
                    formatter: 'number',
                    animation: 'counter'
                }
            }
        ];

        this.bindMultiple(homeBindings);
        console.log('[ReactiveUI] ✅ Bindings da home configurados');
    }

    // Configuração para elementos condicionais
    setupConditionalElements() {
        // Botão de iniciar treino
        const startBtn = document.getElementById('start-workout-btn');
        if (startBtn) {
            AppState.subscribe('currentWorkout', (workout) => {
                const btnText = document.getElementById('btn-text');
                
                if (!workout) {
                    startBtn.disabled = false;
                    if (btnText) btnText.textContent = 'Configurar Planejamento';
                    startBtn.onclick = () => {
                        if (window.abrirPlanejamentoParaUsuarioAtual) {
                            window.abrirPlanejamentoParaUsuarioAtual();
                        }
                    };
                    return;
                }

                startBtn.disabled = false;
                
                switch(workout.tipo) {
                    case 'folga':
                        if (btnText) btnText.textContent = 'Dia de Descanso';
                        startBtn.onclick = () => {
                            if (window.showNotification) {
                                window.showNotification('Hoje é dia de descanso! 😴', 'info');
                            }
                        };
                        break;
                        
                    case 'cardio':
                    case 'Cardio':
                        if (btnText) btnText.textContent = 'Iniciar Cardio';
                        startBtn.onclick = () => {
                            if (window.showNotification) {
                                window.showNotification('Hora do cardio! 🏃‍♂️', 'success');
                            }
                        };
                        break;
                        
                    default:
                        if (btnText) btnText.textContent = 'Iniciar Treino';
                        startBtn.onclick = () => {
                            if (window.showNotification) {
                                window.showNotification(`Vamos treinar ${workout.tipo}! 💪`, 'info');
                            }
                        };
                        break;
                }
            });
        }
    }

    // Atualizar avatar do usuário
    updateUserAvatar() {
        AppState.subscribe('currentUser', (user) => {
            if (!user) return;

            const avatarEl = document.getElementById('user-avatar');
            if (avatarEl) {
                const userImages = {
                    'Pedro': 'pedro.png',
                    'Japa': 'japa.png',
                    'Vini': 'vini.png'
                };
                
                avatarEl.src = userImages[user.nome] || 'pedro.png';
                avatarEl.alt = user.nome;
                
                // Animar mudança de avatar
                avatarEl.style.opacity = '0.5';
                avatarEl.style.transform = 'scale(0.9)';
                avatarEl.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    avatarEl.style.opacity = '1';
                    avatarEl.style.transform = 'scale(1)';
                }, 100);
            }
        });
    }

    // Destruir instância e limpar listeners
    destroy() {
        this.bindings.clear();
        this.formatters.clear();
        this.animations.clear();
        this.isInitialized = false;
        console.log('[ReactiveUI] Sistema reativo destruído');
    }
}

// Instância global
export const reactiveUI = new ReactiveUI();

// Função para configurar reatividade completa da home
export function setupHomeReactivity() {
    if (!reactiveUI.isInitialized) {
        reactiveUI.init();
    }
    
    reactiveUI.setupHomeBindings();
    reactiveUI.setupConditionalElements();
    reactiveUI.updateUserAvatar();
    
    console.log('[setupHomeReactivity] ✅ Reatividade da home configurada');
}

// Utilitários para animações específicas
export const HomeAnimations = {
    // Animar entrada dos indicadores da semana
    animateWeekIndicators() {
        const indicators = document.querySelectorAll('.day-indicator');
        indicators.forEach((indicator, index) => {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translateY(20px) scale(0.8)';
            
            setTimeout(() => {
                indicator.style.transition = 'all 0.4s ease-out';
                indicator.style.opacity = '1';
                indicator.style.transform = 'translateY(0) scale(1)';
            }, index * 50);
        });
    },

    // Animar métricas
    animateMetrics() {
        const metricCards = document.querySelectorAll('.metric-card');
        metricCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                
                // Efeito de brilho
                setTimeout(() => {
                    card.style.boxShadow = '0 8px 32px rgba(168, 255, 0, 0.2)';
                    setTimeout(() => {
                        card.style.boxShadow = '';
                    }, 500);
                }, 200);
            }, index * 100);
        });
    },

    // Animar card do treino atual
    animateCurrentWorkout() {
        const workoutCard = document.getElementById('current-workout-card');
        if (workoutCard) {
            workoutCard.style.opacity = '0';
            workoutCard.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                workoutCard.style.transition = 'all 0.5s ease-out';
                workoutCard.style.opacity = '1';
                workoutCard.style.transform = 'scale(1)';
            }, 300);
        }
    },

    // Animar progresso circular
    animateCircularProgress(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const circumference = 2 * Math.PI * 40; // r=40
        const offset = circumference - (percentage / 100) * circumference;
        
        element.style.strokeDasharray = circumference;
        element.style.strokeDashoffset = circumference;
        element.style.transition = 'stroke-dashoffset 1.5s ease-out';
        
        setTimeout(() => {
            element.style.strokeDashoffset = offset;
        }, 100);
    },

    // Pulso no ícone de sucesso
    pulseSuccessIcon(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.style.animation = 'pulse 0.6s ease-in-out 2';
    }
};

// Sistema de notificações visuais para mudanças de estado
export class StateChangeNotifier {
    constructor() {
        this.lastValues = new Map();
    }

    // Notificar mudança visual
    notifyChange(key, newValue, oldValue) {
        if (oldValue === undefined) return; // Primeira carga
        
        const element = document.getElementById(key);
        if (!element) return;

        // Efeito visual de mudança
        element.style.background = 'rgba(168, 255, 0, 0.2)';
        element.style.transform = 'scale(1.05)';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            element.style.background = '';
            element.style.transform = 'scale(1)';
        }, 300);

        // Log da mudança
        console.log(`[StateChange] ${key}: ${oldValue} → ${newValue}`);
    }

    // Configurar observadores
    setup() {
        AppState.subscribe('userMetrics', (newMetrics, oldMetrics) => {
            if (!oldMetrics) return;
            
            Object.keys(newMetrics).forEach(key => {
                if (newMetrics[key] !== oldMetrics[key]) {
                    this.notifyChange(`metric-${key}`, newMetrics[key], oldMetrics[key]);
                }
            });
        });
    }
}

export const stateNotifier = new StateChangeNotifier();