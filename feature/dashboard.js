// js/features/dashboard.js
// Lógica do dashboard/home

import AppState from '../state/appState.js';
import { fetchMetricasUsuario } from '../services/userService.js';
import { fetchExerciciosTreino, fetchDadosIndicadores } from '../services/workoutService.js';
import { getWeekPlan } from '../utils/weekPlanStorage.js';
import { showNotification } from '../ui/notifications.js';
import { iniciarTreino } from './workout.js';

// Carregar dados do dashboard
export async function carregarDashboard() {
    try {
        // Atualizar indicadores visuais
        atualizarIndicadorSemana();
        renderCustomWeekList();
        
        const currentUser = AppState.get('currentUser');
        const currentProtocol = AppState.get('currentProtocol');
        
        if (!currentUser || !currentProtocol) {
            console.warn('Usuário ou protocolo não definido');
            return;
        }
        
        // Carregar métricas do usuário
        await carregarMetricas(currentUser.id);
        
        // Atualizar informações do protocolo
        atualizarInfoProtocolo();
        
        // Carregar informações do próximo treino
        await carregarProximoTreino();
        
        // Carregar indicadores competitivos
        await carregarIndicadores();
        
        // Configurar botão de início
        configurarBotaoIniciar();
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar dados', 'error');
    }
}

// Carregar métricas do usuário
async function carregarMetricas(userId) {
    try {
        const metricas = await fetchMetricasUsuario(userId);
        
        // Atualizar elementos da UI
        updateElement('completed-workouts', metricas.treinosConcluidos);
        updateElement('current-week', metricas.semanaAtual);
        updateElement('progress-percentage', `${metricas.progresso}%`);
        
        // Atualizar anel de progresso
        const progressRing = document.querySelector('.progress-ring-progress');
        if (progressRing) {
            const circumference = 2 * Math.PI * 40;
            const offset = circumference - (metricas.progresso / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
        }
        
        // Atualizar barras de comparação
        const userProgressBar = document.getElementById('user-progress-bar');
        if (userProgressBar) {
            userProgressBar.style.width = `${(metricas.treinosConcluidos / 4) * 100}%`;
        }
        
        updateElement('user-workouts', metricas.treinosConcluidos);
        
    } catch (error) {
        console.error('Erro ao carregar métricas:', error);
        // Definir valores padrão em caso de erro
        updateElement('completed-workouts', '0');
        updateElement('current-week', '1');
        updateElement('progress-percentage', '0%');
    }
}

// Atualizar informações do protocolo
function atualizarInfoProtocolo() {
    const protocol = AppState.get('currentProtocol');
    if (!protocol) return;
    
    const userProtocolEl = document.getElementById('user-protocol');
    if (userProtocolEl) {
        const semanaAtual = protocol.semana_atual || 1;
        const nomeProtocolo = protocol.nome_protocolo || 'Protocolo Padrão';
        userProtocolEl.textContent = `${nomeProtocolo} - Semana ${semanaAtual}`;
    }
}

// Carregar informações do próximo treino
async function carregarProximoTreino() {
    const workout = AppState.get('currentWorkout');
    const protocol = AppState.get('currentProtocol');
    
    if (!workout || !protocol) {
        updateElement('next-workout-name', 'Nenhum treino hoje');
        updateElement('workout-exercises', '0 exercícios');
        return;
    }
    
    // Determinar tipo de treino
    const tipoTreino = obterTipoTreino(workout.dia_semana);
    updateElement('next-workout-name', `Treino ${tipoTreino}`);
    
    // Carregar exercícios do treino
    try {
        const exercicios = await fetchExerciciosTreino(
            workout.numero_treino,
            protocol.protocolo_treinamento_id
        );
        
        AppState.set('currentExercises', exercicios);
        updateElement('workout-exercises', `${exercicios.length} exercícios`);
        
    } catch (error) {
        console.error('Erro ao carregar exercícios:', error);
        updateElement('workout-exercises', '0 exercícios');
    }
}

// Carregar indicadores competitivos
async function carregarIndicadores() {
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser) return;
        
        const dados = await fetchDadosIndicadores(currentUser.id);
        
        // Aqui você pode renderizar os indicadores competitivos
        // Por exemplo: comparação entre usuários, evolução, etc.
        
    } catch (error) {
        console.error('Erro ao carregar indicadores:', error);
    }
}

// Atualizar indicador da semana
function atualizarIndicadorSemana() {
    const weekPlan = AppState.get('weekPlan');
    if (!weekPlan) return;
    
    const today = new Date().getDay();
    const dayPills = document.querySelectorAll('.day-pill');
    
    dayPills.forEach((pill, index) => {
        pill.classList.remove('active', 'completed');
        
        if (weekPlan[index]) {
            const dayPlan = weekPlan[index];
            
            if (dayPlan === 'folga') {
                pill.textContent = 'Folga';
                pill.style.opacity = '0.5';
            } else if (dayPlan === 'cardio') {
                pill.textContent = 'Cardio';
            } else {
                pill.textContent = dayPlan;
            }
            
            if (index === today) {
                pill.classList.add('active');
            } else if (index < today) {
                pill.classList.add('completed');
            }
        }
    });
}

// Renderizar lista customizada da semana
function renderCustomWeekList() {
    const ul = document.getElementById('custom-week-list');
    if (!ul) return;
    
    const semana = getSemanaOrdem();
    ul.innerHTML = '';
    
    semana.forEach(item => {
        const li = document.createElement('li');
        li.className = 'custom-week-item';
        li.innerHTML = `
            <strong>${item.dia}:</strong> 
            <span>${item.tipo}${item.tipo === 'Treino' && item.grupo ? ' (' + item.grupo + ')' : ''}</span>
        `;
        ul.appendChild(li);
    });
}

// Obter ordem da semana
function getSemanaOrdem() {
    const stored = localStorage.getItem('semanaOrdem');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erro ao parsear semana ordem:', e);
        }
    }
    
    // Retornar padrão
    return [
        { dia: 'Domingo', tipo: 'Folga', grupo: null },
        { dia: 'Segunda', tipo: 'Treino', grupo: 'A' },
        { dia: 'Terça', tipo: 'Treino', grupo: 'B' },
        { dia: 'Quarta', tipo: 'Cardio', grupo: null },
        { dia: 'Quinta', tipo: 'Treino', grupo: 'C' },
        { dia: 'Sexta', tipo: 'Treino', grupo: 'D' },
        { dia: 'Sábado', tipo: 'Folga', grupo: null }
    ];
}

// Configurar botão de iniciar treino
function configurarBotaoIniciar() {
    const startBtn = document.getElementById('start-workout-btn');
    if (!startBtn) return;
    
    const workout = AppState.get('currentWorkout');
    const exercises = AppState.get('currentExercises');
    
    if (workout && exercises && exercises.length > 0) {
        startBtn.disabled = false;
        startBtn.onclick = iniciarTreino;
    } else {
        startBtn.disabled = true;
        startBtn.onclick = null;
    }
}

// Função auxiliar para atualizar elementos
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Obter tipo de treino
function obterTipoTreino(diaSemana) {
    const tipos = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tipos[diaSemana] || 'A';
}