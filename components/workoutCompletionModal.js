class WorkoutCompletionModal {
  constructor() {
    this.modal = document.createElement('div');
    this.modal.className = 'workout-completion-overlay';
    this.modal.innerHTML = `
            <div class="completion-content">
                <div class="completion-animation">
                    <div class="trophy-container">
                        <svg class="trophy-icon" viewBox="0 0 24 24">
                            <path d="M6 3h12v2H6zm2 2h8v3h2a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4h-1v3H9v-3H8a4 4 0 0 1-4-4v-3a2 2 0 0 1 2-2h2zm8 5h2v3a2 2 0 0 1-2 2h-1zm-8 0v5H8a2 2 0 0 1-2-2v-3z"/>
                        </svg>
                        <div class="confetti"></div>
                    </div>
                </div>
                <h1 class="completion-title">Treino Concluído!</h1>
                <p class="completion-subtitle">Você completou seu treino com sucesso</p>
                
                <div class="completion-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8"/>
                                <path d="M12 6a6 6 0 0 0-6 6h2a4 4 0 0 1 4-4z"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value" id="completion-time">00:00</div>
                            <div class="stat-label">Tempo Total</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M18 2h-2v2h-4V2H8v2H6v2h2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6h2zm-2 16H8V6h8z"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value" id="completion-exercises">0</div>
                            <div class="stat-label">Exercícios</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8"/>
                                <path d="m14.7 8.4-4.3 4.3-1.8-1.8-1.4 1.4 3.2 3.2 5.7-5.7z"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value" id="completion-series">0</div>
                            <div class="stat-label">Séries</div>
                        </div>
                    </div>
                </div>
                
                <div class="completion-actions">
                    <button class="btn-completion btn-finish" id="completion-finish-btn">Finalizar</button>
                    <button class="btn-completion btn-share" id="completion-share-btn">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M18 16a3 3 0 0 0-1.9.7l-7-4.2a3 3 0 0 0 0-1.8l7-4.2a3 3 0 1 0-.8-1.4l-7 4.2a3 3 0 1 0 0 4.6l7 4.2a3 3 0 1 0 2.7-1.9"/>
                        </svg>
                        Compartilhar
                    </button>
                </div>
            </div>
        `;

    this.finishButton = null;
    this.shareButton = null;
    this.onFinishCallback = null;
  }

  show(stats = {}) {
    document.body.appendChild(this.modal);

    // Atualizar estatísticas
    if (stats.time) document.getElementById('completion-time').textContent = stats.time;
    if (stats.exercises)
      document.getElementById('completion-exercises').textContent = stats.exercises;
    if (stats.series) document.getElementById('completion-series').textContent = stats.series;

    // Configurar botões
    this.finishButton = document.getElementById('completion-finish-btn');
    this.shareButton = document.getElementById('completion-share-btn');

    this.finishButton.addEventListener('click', () => {
      this.hide();
      if (this.onFinishCallback) this.onFinishCallback();
    });

    this.shareButton.addEventListener('click', () => {
      // Lógica para compartilhar
      console.log('Compartilhar treino');
    });
  }

  hide() {
    if (this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
  }

  onFinish(callback) {
    this.onFinishCallback = callback;
  }
}

// Expor globalmente para uso nos templates
window.WorkoutCompletionModal = WorkoutCompletionModal;

export default WorkoutCompletionModal;
