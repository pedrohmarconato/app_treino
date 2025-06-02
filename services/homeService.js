// services/homeService.js
// Consolida funcionalidades de dashboard, setupHome e reactiveUI para a Home

// --- Dashboard ---
import AppState from '../state/appState.js';
import { fetchMetricasUsuario } from '../services/userService.js';
import { getWeekPlan } from '../utils/weekPlanStorage.js';
import { showNotification } from '../ui/notifications.js';

// --- Reactive UI ---
import { reactiveUI, HomeAnimations, stateNotifier } from '../utils/reactiveUI.js';

// --- Home Manager ---
import { MetricsWidget } from '../components/MetricsWidget.js';

const TREINO_EMOJIS = {
    'Peito': '💪',
    'Costas': '🔙',
    'Pernas': '🦵',
    'Ombro': '🎯',
    'Ombro e Braço': '💪',
    'Braço': '💪',
    'Cardio': '🏃',
    'folga': '😴',
    'A': '💪',
    'B': '🔙',
    'C': '🦵',
    'D': '🎯'
};
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Função principal para carregar dashboard
export async function carregarDashboard() {
    console.log('[carregarDashboard] Iniciando carregamento completo...');
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser) {
            console.warn('[carregarDashboard] Usuário não definido');
            return;
        }
        console.log('[carregarDashboard] Carregando para usuário:', currentUser.nome);
        await Promise.all([
            carregarIndicadoresSemana(),
            carregarTreinoAtual(),
            carregarMetricasUsuario(),
            carregarPlanejamentoSemanal()
        ]);
        configurarBotaoIniciar();
        configurarEventListeners();
        console.log('[carregarDashboard] ✅ Dashboard carregado com sucesso!');
    } catch (error) {
        console.error('[carregarDashboard] Erro:', error);
        showNotification('Alguns dados podem não estar atualizados', 'warning');
        configurarBotaoIniciar();
    }
}

// Carregar e renderizar indicadores da semana
export async function carregarIndicadoresSemana() {
    // ... (copiar a implementação de dashboard.js)
}

// Carregar treino atual do dia
export async function carregarTreinoAtual() {
    // ... (copiar a implementação de dashboard.js)
}

// Atualizar UI do treino atual
export function atualizarUITreinoAtual(treino) {
    // ... (copiar a implementação de dashboard.js)
}

// Carregar métricas do usuário
export async function carregarMetricasUsuario() {
    // ... (copiar a implementação de dashboard.js)
}

// Carregar e renderizar planejamento semanal
export async function carregarPlanejamentoSemanal() {
    // ... (copiar a implementação de dashboard.js)
}

// Configurar botão de iniciar treino
export function configurarBotaoIniciar() {
    // ... (copiar a implementação de dashboard.js)
}

// Configurar event listeners
export function configurarEventListeners() {
    // ... (copiar a implementação de dashboard.js)
}

// Função auxiliar para atualizar elementos
export function updateElement(element, value) {
    // ... (copiar a implementação de dashboard.js)
}

// Atualizar métricas em tempo real
export function atualizarMetricasTempoReal(novasMetricas) {
    // ... (copiar a implementação de dashboard.js)
}

// Forçar reload completo do dashboard
export function recarregarDashboard() {
    // ... (copiar a implementação de dashboard.js)
}

// --- HomeManager (setupHome.js) ---
export class HomeManager {
    constructor() {
        this.isInitialized = false;
        this.metricsWidget = null;
        this.refreshInterval = null;
        this.animationTimeouts = [];
    }
    // ... (copiar métodos principais de HomeManager de setupHome.js)
}

export const homeManager = new HomeManager();

export function initializeHomeComplete() {
    // ... (copiar de setupHome.js)
}

export function destroyHome() {
    // ... (copiar de setupHome.js)
}

// --- Reactive UI ---
export { reactiveUI, HomeAnimations, stateNotifier };
export { setupHomeReactivity } from '../utils/reactiveUI.js';
