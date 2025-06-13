// components/QuickEditModal.js
// Componente para edição rápida do planejamento semanal na home

import WeeklyPlanService from '../services/weeklyPlanningService.js';
import AppState from '../state/appState.js';
import { showNotification } from '../ui/notifications.js';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TIPOS_TREINO = [
    { id: 'folga', nome: 'Folga', emoji: '😴', categoria: 'folga', descricao: 'Dia de descanso' },
    { id: 'cardio', nome: 'Cardio', emoji: '🏃', categoria: 'cardio', descricao: 'Exercícios cardiovasculares' },
    { id: 'peito', nome: 'Peito', emoji: '💪', categoria: 'treino', descricao: 'Treino de peito' },
    { id: 'costas', nome: 'Costas', emoji: '🔙', categoria: 'treino', descricao: 'Treino de costas' },
    { id: 'pernas', nome: 'Pernas', emoji: '🦵', categoria: 'treino', descricao: 'Treino de pernas' },
    { id: 'ombro', nome: 'Ombro', emoji: '🎯', categoria: 'treino', descricao: 'Treino de ombros' },
    { id: 'braco', nome: 'Braço', emoji: '💪', categoria: 'treino', descricao: 'Treino de braços' }
];

class QuickEditModal {
    constructor() {
        this.isOpen = false;
        this.currentDay = null;
        this.currentConfig = null;
        this.onSave = null;
    }

    // Renderizar modal de edição rápida
    render(dia, config, onSaveCallback) {
        this.currentDay = dia;
        this.currentConfig = config;
        this.onSave = onSaveCallback;

        const modal = this.createModalElement();
        document.body.appendChild(modal);
        
        this.showModal();
        this.setupEventListeners();
        
        return modal;
    }

    // Criar elemento do modal
    createModalElement() {
        const modal = document.createElement('div');
        modal.id = 'quick-edit-modal';
        modal.className = 'quick-edit-modal-overlay';
        
        modal.innerHTML = `
            <div class="quick-edit-modal-container">
                <div class="quick-edit-modal-header">
                    <h3>Editar ${DIAS_SEMANA[this.currentDay]}</h3>
                    <button class="quick-edit-close-btn" type="button">&times;</button>
                </div>
                
                <div class="quick-edit-modal-body">
                    <div class="quick-edit-options">
                        ${this.renderOptions()}
                    </div>
                </div>
                
                <div class="quick-edit-modal-footer">
                    <button class="btn-secondary quick-edit-cancel">Cancelar</button>
                    <button class="btn-primary quick-edit-save" disabled>Salvar</button>
                </div>
            </div>
        `;

        return modal;
    }

    // Renderizar opções de treino
    renderOptions() {
        let html = '';
        
        TIPOS_TREINO.forEach(tipo => {
            const isSelected = this.currentConfig?.tipo === tipo.id;
            const isDisabled = this.isTypeDisabled(tipo);
            
            html += `
                <div class="quick-edit-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" 
                     data-type="${tipo.id}" 
                     data-categoria="${tipo.categoria}">
                    <div class="option-emoji">${tipo.emoji}</div>
                    <div class="option-info">
                        <div class="option-name">${tipo.nome}</div>
                        <div class="option-description">${tipo.descricao}</div>
                        ${isDisabled ? '<div class="option-status">Já utilizado esta semana</div>' : ''}
                    </div>
                    ${isSelected ? '<div class="option-check">✓</div>' : ''}
                </div>
            `;
        });

        return html;
    }

    // Verificar se um tipo está desabilitado
    isTypeDisabled(tipo) {
        if (tipo.categoria !== 'treino') return false;
        
        const weekPlan = AppState.get('weekPlan');
        if (!weekPlan) return false;

        // Verificar se já está sendo usado em outro dia
        for (let dia = 0; dia < 7; dia++) {
            if (dia === this.currentDay) continue; // Ignorar o dia atual
            
            const dayConfig = weekPlan[dia];
            if (dayConfig && dayConfig.tipo === tipo.id) {
                return true;
            }
        }

        return false;
    }

    // Configurar event listeners
    setupEventListeners() {
        const modal = document.getElementById('quick-edit-modal');
        if (!modal) return;

        // Fechar modal
        const closeBtn = modal.querySelector('.quick-edit-close-btn');
        const cancelBtn = modal.querySelector('.quick-edit-cancel');
        
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.closeModal());
            }
        });

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Selecionar opções
        const options = modal.querySelectorAll('.quick-edit-option:not(.disabled)');
        options.forEach(option => {
            option.addEventListener('click', () => {
                this.selectOption(option);
            });
        });

        // Botão salvar
        const saveBtn = modal.querySelector('.quick-edit-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveChanges());
        }

        // ESC para fechar
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    // Selecionar uma opção
    selectOption(optionElement) {
        const modal = document.getElementById('quick-edit-modal');
        if (!modal) return;

        // Remover seleção anterior
        modal.querySelectorAll('.quick-edit-option').forEach(opt => {
            opt.classList.remove('selected');
            const check = opt.querySelector('.option-check');
            if (check) check.remove();
        });

        // Adicionar nova seleção
        optionElement.classList.add('selected');
        
        const checkmark = document.createElement('div');
        checkmark.className = 'option-check';
        checkmark.textContent = '✓';
        optionElement.appendChild(checkmark);

        // Habilitar botão salvar
        const saveBtn = modal.querySelector('.quick-edit-save');
        if (saveBtn) {
            saveBtn.disabled = false;
        }

        // Salvar seleção temporariamente
        this.selectedType = {
            tipo: optionElement.dataset.type,
            categoria: optionElement.dataset.categoria
        };
    }

    // Salvar mudanças
    async saveChanges() {
        if (!this.selectedType) {
            showNotification('Selecione uma opção primeiro', 'warning');
            return;
        }

        const currentUser = AppState.get('currentUser');
        if (!currentUser) {
            showNotification('Usuário não encontrado', 'error');
            return;
        }

        try {
            // Mostrar loading
            const saveBtn = document.querySelector('.quick-edit-save');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Salvando...';
            }

            // Atualizar usando serviço unificado
            const result = await WeeklyPlanService.updateDay(
                currentUser.id,
                this.currentDay,
                this.selectedType
            );

            if (result.success) {
                // Atualizar estado local
                let weekPlan = AppState.get('weekPlan') || {};
                weekPlan[this.currentDay] = {
                    ...this.selectedType,
                    concluido: false
                };
                AppState.set('weekPlan', weekPlan);

                // Callback de sucesso
                if (this.onSave) {
                    this.onSave(this.currentDay, this.selectedType);
                }

                showNotification(`${DIAS_SEMANA[this.currentDay]} atualizado!`, 'success');
                this.closeModal();

                // Recarregar dashboard se disponível
                if (window.carregarDashboard) {
                    setTimeout(() => window.carregarDashboard(), 500);
                }

            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('[QuickEditModal] Erro ao salvar:', error);
            showNotification('Erro ao salvar: ' + error.message, 'error');

            // Restaurar botão
            const saveBtn = document.querySelector('.quick-edit-save');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Salvar';
            }
        }
    }

    // Mostrar modal
    showModal() {
        const modal = document.getElementById('quick-edit-modal');
        if (!modal) return;

        this.isOpen = true;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Animação de entrada
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    // Fechar modal
    closeModal() {
        const modal = document.getElementById('quick-edit-modal');
        if (!modal) return;

        this.isOpen = false;
        modal.classList.remove('show');
        document.body.style.overflow = '';

        // Restaurar botões que podem ter sido afetados
        const botoesParaRestaurar = document.querySelectorAll('button[disabled]');
        botoesParaRestaurar.forEach(btn => {
            if (btn.hasAttribute('data-disabled-by-quick-edit')) {
                btn.disabled = false;
                btn.removeAttribute('data-disabled-by-quick-edit');
                console.log('[QuickEditModal] Botão restaurado:', btn.className);
            }
        });

        // Remover após animação
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);

        // Limpar event listener
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Limpar seleções temporárias
        this.selectedType = null;
        this.currentDay = null;
        this.currentConfig = null;
        
        console.log('[QuickEditModal] Modal fechado e estado limpo');
    }

    // Manipular teclas
    handleKeyDown(e) {
        if (!this.isOpen) return;

        if (e.key === 'Escape') {
            this.closeModal();
        } else if (e.key === 'Enter' && this.selectedType) {
            this.saveChanges();
        }
    }
}

// Função auxiliar para abrir modal de edição rápida
export function openQuickEditModal(dia, config, onSave) {
    const modal = new QuickEditModal();
    return modal.render(dia, config, onSave);
}

// Exportar classe para uso direto
export default QuickEditModal;

// Disponibilizar globalmente para compatibilidade
window.QuickEditModal = QuickEditModal;
window.openQuickEditModal = openQuickEditModal;