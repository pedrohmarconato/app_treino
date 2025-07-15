/**
 * 🎉 MODAL DE SUCESSO DO TREINO
 * 
 * Modal moderno e motivacional para celebrar a conclusão do treino
 * Seguindo melhores práticas de UX para fitness apps
 */

export class WorkoutSuccessModal {
    
    /**
     * Mostrar modal de sucesso com estatísticas do treino
     */
    static mostrar(dadosTreino) {
        return new Promise((resolve) => {
            const modal = this.criarModal(dadosTreino);
            document.body.appendChild(modal);
            
            // Animar entrada
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
            
            // Vibração de sucesso (se disponível)
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
            
            // Auto-fechar após 8 segundos (ou quando usuário clicar)
            const autoClose = setTimeout(() => {
                this.fechar(modal);
                resolve();
            }, 8000);
            
            // Event listeners
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('btn-continue')) {
                    clearTimeout(autoClose);
                    this.fechar(modal);
                    resolve();
                }
            });
            
            // ESC para fechar
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    clearTimeout(autoClose);
                    this.fechar(modal);
                    document.removeEventListener('keydown', handleEsc);
                    resolve();
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }
    
    /**
     * Criar HTML do modal
     */
    static criarModal(dados) {
        const modal = document.createElement('div');
        modal.className = 'workout-success-modal';
        modal.innerHTML = `
            <div class="success-modal-content">
                <!-- Ícone de sucesso animado -->
                <div class="success-icon-container">
                    <div class="success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                    </div>
                    <div class="success-rings">
                        <div class="ring ring-1"></div>
                        <div class="ring ring-2"></div>
                        <div class="ring ring-3"></div>
                    </div>
                </div>
                
                <!-- Mensagem principal -->
                <div class="success-header">
                    <h2>Treino Concluído! 🎉</h2>
                    <p class="success-subtitle">Parabéns! Você completou mais um treino.</p>
                </div>
                
                <!-- Estatísticas em destaque -->
                <div class="workout-stats">
                    <div class="stat-card primary">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-content">
                            <span class="stat-value">${this.formatarTempo(dados.tempo_total_minutos || 0)}</span>
                            <span class="stat-label">Duração</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">💪</div>
                        <div class="stat-content">
                            <span class="stat-value">${dados.total_series || 0}</span>
                            <span class="stat-label">Séries</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⚖️</div>
                        <div class="stat-content">
                            <span class="stat-value">${Math.round(dados.peso_total_levantado || 0)}kg</span>
                            <span class="stat-label">Peso Total</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-content">
                            <span class="stat-value">${dados.repeticoes_totais || 0}</span>
                            <span class="stat-label">Repetições</span>
                        </div>
                    </div>
                </div>
                
                <!-- Progresso e conquistas -->
                <div class="progress-section">
                    <div class="achievement-badge">
                        <div class="badge-icon">🏆</div>
                        <div class="badge-text">
                            <span class="badge-title">${this.obterConquista(dados)}</span>
                            <span class="badge-subtitle">${this.obterMensagemMotivacional(dados)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Ações -->
                <div class="success-actions">
                    <button class="btn-continue btn-primary">
                        <span>Continuar</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9,18 15,12 9,6"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Indicador de fechamento automático -->
                <div class="auto-close-indicator">
                    <div class="auto-close-bar"></div>
                    <span class="auto-close-text">Fechamento automático em 8s</span>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    /**
     * Fechar modal com animação
     */
    static fechar(modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    /**
     * Formatar tempo em minutos para string legível
     */
    static formatarTempo(minutos) {
        if (minutos < 1) return '< 1 min';
        if (minutos < 60) return `${minutos} min`;
        
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${horas}h ${mins}m`;
    }
    
    /**
     * Obter conquista baseada nos dados do treino
     */
    static obterConquista(dados) {
        const tempo = dados.tempo_total_minutos || 0;
        const series = dados.total_series || 0;
        const peso = dados.peso_total_levantado || 0;
        
        if (tempo >= 60) return 'Guerreiro da Resistência';
        if (series >= 20) return 'Máquina de Séries';
        if (peso >= 1000) return 'Levantador de Peso';
        if (tempo >= 45) return 'Consistência Total';
        if (series >= 15) return 'Força Crescente';
        return 'Objetivo Cumprido';
    }
    
    /**
     * Obter mensagem motivacional
     */
    static obterMensagemMotivacional(dados) {
        const mensagens = [
            'Cada treino te deixa mais forte!',
            'Você está no caminho certo!',
            'Consistência é a chave do sucesso!',
            'Seu corpo agradece o esforço!',
            'Mais um passo rumo ao objetivo!',
            'Disciplina hoje, resultados amanhã!',
            'Você é mais forte do que imagina!'
        ];
        
        // Escolher mensagem baseada no desempenho
        const tempo = dados.tempo_total_minutos || 0;
        if (tempo >= 60) return 'Treino épico! Você superou os limites!';
        if (tempo >= 45) return 'Excelente consistência! Continue assim!';
        if (tempo >= 30) return 'Ótimo treino! Cada minuto conta!';
        
        return mensagens[Math.floor(Math.random() * mensagens.length)];
    }
}

// Estilos CSS para o modal
const styles = `
<style>
.workout-success-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
    padding: 20px;
    box-sizing: border-box;
}

.workout-success-modal.show {
    opacity: 1;
}

.workout-success-modal.closing {
    opacity: 0;
}

.success-modal-content {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    border-radius: 24px;
    padding: 32px;
    max-width: 480px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    transform: scale(0.9) translateY(20px);
    transition: transform 0.3s ease;
}

.workout-success-modal.show .success-modal-content {
    transform: scale(1) translateY(0);
}

.success-icon-container {
    position: relative;
    margin-bottom: 24px;
}

.success-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #CFFF04, #FFE500);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    color: #000;
    animation: successPulse 2s ease-in-out infinite;
}

.success-icon svg {
    width: 40px;
    height: 40px;
    stroke-width: 3;
}

.success-rings {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

.ring {
    position: absolute;
    border: 2px solid #CFFF04;
    border-radius: 50%;
    opacity: 0;
}

.ring-1 {
    width: 100px;
    height: 100px;
    margin: -50px 0 0 -50px;
    animation: ring1 3s ease-out infinite;
}

.ring-2 {
    width: 130px;
    height: 130px;
    margin: -65px 0 0 -65px;
    animation: ring2 3s ease-out infinite 0.5s;
}

.ring-3 {
    width: 160px;
    height: 160px;
    margin: -80px 0 0 -80px;
    animation: ring3 3s ease-out infinite 1s;
}

.success-header {
    margin-bottom: 32px;
}

.success-header h2 {
    color: #CFFF04;
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    line-height: 1.2;
}

.success-subtitle {
    color: #a3a3a3;
    font-size: 1.1rem;
    margin: 0;
    line-height: 1.4;
}

.workout-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 32px;
}

.stat-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
}

.stat-card.primary {
    background: linear-gradient(135deg, rgba(207, 255, 4, 0.2), rgba(255, 229, 0, 0.1));
    border-color: rgba(207, 255, 4, 0.3);
}

.stat-icon {
    font-size: 2rem;
    margin-bottom: 8px;
}

.stat-value {
    display: block;
    color: #CFFF04;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 4px;
}

.stat-label {
    color: #a3a3a3;
    font-size: 0.9rem;
    font-weight: 500;
}

.progress-section {
    margin-bottom: 32px;
}

.achievement-badge {
    background: linear-gradient(135deg, rgba(207, 255, 4, 0.1), rgba(255, 229, 0, 0.05));
    border: 1px solid rgba(207, 255, 4, 0.3);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.badge-icon {
    font-size: 2.5rem;
    animation: bounce 2s ease-in-out infinite;
}

.badge-text {
    text-align: left;
    flex: 1;
}

.badge-title {
    display: block;
    color: #CFFF04;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 4px;
}

.badge-subtitle {
    color: #a3a3a3;
    font-size: 0.95rem;
    line-height: 1.3;
}

.success-actions {
    margin-bottom: 24px;
}

.btn-continue {
    background: linear-gradient(135deg, #CFFF04, #FFE500);
    color: #000;
    border: none;
    border-radius: 12px;
    padding: 16px 32px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 auto;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    min-width: 140px;
    justify-content: center;
}

.btn-continue:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(207, 255, 4, 0.4);
}

.btn-continue svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s ease;
}

.btn-continue:hover svg {
    transform: translateX(4px);
}

.auto-close-indicator {
    text-align: center;
    opacity: 0.7;
}

.auto-close-bar {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin-bottom: 8px;
    position: relative;
    overflow: hidden;
}

.auto-close-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: #CFFF04;
    border-radius: 2px;
    animation: countdown 8s linear;
}

.auto-close-text {
    color: #a3a3a3;
    font-size: 0.85rem;
}

/* Animações */
@keyframes successPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

@keyframes ring1 {
    0% { opacity: 0; transform: scale(0.8); }
    20% { opacity: 1; }
    100% { opacity: 0; transform: scale(1.4); }
}

@keyframes ring2 {
    0% { opacity: 0; transform: scale(0.8); }
    20% { opacity: 0.8; }
    100% { opacity: 0; transform: scale(1.4); }
}

@keyframes ring3 {
    0% { opacity: 0; transform: scale(0.8); }
    20% { opacity: 0.6; }
    100% { opacity: 0; transform: scale(1.4); }
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
    60% { transform: translateY(-4px); }
}

@keyframes countdown {
    from { width: 100%; }
    to { width: 0%; }
}

/* Mobile Responsivo */
@media (max-width: 480px) {
    .success-modal-content {
        padding: 24px 20px;
        margin: 10px;
        border-radius: 20px;
    }
    
    .success-header h2 {
        font-size: 2rem;
    }
    
    .workout-stats {
        grid-template-columns: 1fr;
        gap: 12px;
    }
    
    .stat-card {
        padding: 16px;
    }
    
    .achievement-badge {
        flex-direction: column;
        text-align: center;
        gap: 12px;
    }
    
    .badge-text {
        text-align: center;
    }
}

/* Reduzir animações para acessibilidade */
@media (prefers-reduced-motion: reduce) {
    .success-icon, .ring, .badge-icon {
        animation: none;
    }
    
    .success-modal-content {
        transform: none;
    }
    
    .workout-success-modal.show .success-modal-content {
        transform: none;
    }
}
</style>`;

// Injetar estilos se ainda não existirem
if (!document.getElementById('workout-success-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'workout-success-styles';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}

export default WorkoutSuccessModal;