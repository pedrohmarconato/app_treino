// ===== MODAL SELETOR CLEAN REDESIGNED =====

// Função para criar modal de seletor de grupo muscular com design clean e moderno
function criarModalSeletorClean(historico, dayIndex) {
  const dayName = DIAS_SEMANA[dayIndex];
  const dataFormatada = historico.data_treino.toLocaleDateString('pt-BR');

  return `
        <div id="modal-seletor-grupo" class="modal-overlay-seletor-clean" onclick="fecharModalSeletorGrupo(event)">
            <div class="modal-content-seletor-clean" onclick="event.stopPropagation()">
                <!-- Header Clean -->
                <div class="modal-header-seletor-clean">
                    <div class="seletor-header-clean">
                        <div class="seletor-title-section-clean">
                            <h2 class="modal-title-seletor-clean">
                                🎯 Múltiplos Treinos
                            </h2>
                            <div class="seletor-subtitle-clean">
                                <span class="day-badge-seletor-clean">${dayName}</span>
                                <span class="date-seletor-clean">${dataFormatada}</span>
                            </div>
                        </div>
                        <button class="btn-close-seletor-clean" onclick="fecharModalSeletorGrupo()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Body Clean -->
                <div class="modal-body-seletor-clean">
                    <div class="selector-message-clean">
                        <div class="message-icon-clean">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M9,9 h6 a3,3 0 0,1 6,6 h-6 a3,3 0 0,1 -6,-6"/>
                            </svg>
                        </div>
                        <div class="message-content-clean">
                            <h3>Treinos Encontrados</h3>
                            <p>Foram encontrados treinos de múltiplos grupos musculares neste dia. Selecione qual grupo você deseja visualizar:</p>
                        </div>
                    </div>
                    
                    <div class="grupos-grid-clean">
                        ${historico.grupos_disponiveis
                          .map(
                            (grupo, index) => `
                            <div class="grupo-card-clean" onclick="selecionarGrupoMuscular('${grupo.grupo_muscular}', ${dayIndex})" style="animation-delay: ${index * 0.1}s">
                                <div class="grupo-header-clean">
                                    <div class="grupo-icon-clean">
                                        ${getGrupoMuscularIcon(grupo.grupo_muscular)}
                                    </div>
                                    <h3 class="grupo-nome-clean">${grupo.grupo_muscular}</h3>
                                </div>
                                
                                <div class="grupo-stats-clean">
                                    <div class="grupo-stat-clean">
                                        <span class="stat-number-clean">${grupo.total_execucoes}</span>
                                        <span class="stat-text-clean">Séries</span>
                                    </div>
                                    <div class="grupo-stat-clean">
                                        <span class="stat-number-clean">${grupo.exercicios.length}</span>
                                        <span class="stat-text-clean">Exercícios</span>
                                    </div>
                                    <div class="grupo-stat-clean volume-stat">
                                        <span class="stat-number-clean">${Math.round(grupo.metricas.volume_total)}kg</span>
                                        <span class="stat-text-clean">Volume</span>
                                    </div>
                                </div>
                                
                                <div class="grupo-action-clean">
                                    <span class="action-text-clean">Ver Histórico</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="9 18 15 12 9 6"/>
                                    </svg>
                                </div>
                            </div>
                        `
                          )
                          .join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .modal-overlay-seletor-clean {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.92) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 10000 !important;
                backdrop-filter: blur(12px) !important;
                padding: 16px !important;
                box-sizing: border-box !important;
                overflow-y: auto !important;
                animation: fadeInOverlay 0.3s ease-out !important;
            }
            
            .modal-content-seletor-clean {
                background: linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%) !important;
                border-radius: 24px !important;
                max-width: 850px !important;
                width: 100% !important;
                max-height: 90vh !important;
                overflow: hidden !important;
                border: 1px solid rgba(168, 255, 0, 0.2) !important;
                box-shadow: 
                    0 30px 60px rgba(0, 0, 0, 0.8),
                    0 0 50px rgba(168, 255, 0, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
                position: relative !important;
                animation: slideInModal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            }
            
            .modal-header-seletor-clean {
                padding: 32px 32px 24px !important;
                background: linear-gradient(135deg, rgba(168, 255, 0, 0.08) 0%, transparent 70%) !important;
                border-bottom: 1px solid rgba(168, 255, 0, 0.15) !important;
                position: relative !important;
            }
            
            .seletor-header-clean {
                display: flex !important;
                justify-content: space-between !important;
                align-items: flex-start !important;
            }
            
            .modal-title-seletor-clean {
                margin: 0 0 16px 0 !important;
                font-size: 1.9rem !important;
                font-weight: 700 !important;
                color: #ffffff !important;
                letter-spacing: -1px !important;
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
                line-height: 1.2 !important;
            }
            
            .seletor-subtitle-clean {
                display: flex !important;
                align-items: center !important;
                gap: 16px !important;
                flex-wrap: wrap !important;
            }
            
            .day-badge-seletor-clean {
                background: linear-gradient(135deg, #a8ff00 0%, #7acc00 100%) !important;
                color: #000 !important;
                padding: 8px 16px !important;
                border-radius: 20px !important;
                font-weight: 700 !important;
                font-size: 0.9rem !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                box-shadow: 0 4px 12px rgba(168, 255, 0, 0.3) !important;
            }
            
            .date-seletor-clean {
                color: #bbb !important;
                font-size: 1rem !important;
                font-weight: 500 !important;
            }
            
            .btn-close-seletor-clean {
                background: rgba(255, 255, 255, 0.08) !important;
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                color: #ccc !important;
                cursor: pointer !important;
                padding: 14px !important;
                border-radius: 16px !important;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 48px !important;
                height: 48px !important;
                backdrop-filter: blur(10px) !important;
            }
            
            .btn-close-seletor-clean:hover {
                background: rgba(255, 255, 255, 0.15) !important;
                border-color: rgba(255, 255, 255, 0.3) !important;
                color: #fff !important;
                transform: scale(1.1) rotate(90deg) !important;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
            }
            
            .modal-body-seletor-clean {
                padding: 32px !important;
                overflow-y: auto !important;
                max-height: calc(90vh - 140px) !important;
            }
            
            .selector-message-clean {
                display: flex !important;
                align-items: flex-start !important;
                gap: 20px !important;
                margin-bottom: 32px !important;
                padding: 24px !important;
                background: linear-gradient(135deg, rgba(168, 255, 0, 0.05) 0%, rgba(168, 255, 0, 0.02) 100%) !important;
                border: 1px solid rgba(168, 255, 0, 0.15) !important;
                border-radius: 16px !important;
                position: relative !important;
            }
            
            .selector-message-clean::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 4px !important;
                height: 100% !important;
                background: linear-gradient(to bottom, #a8ff00, #7acc00) !important;
                border-radius: 0 4px 4px 0 !important;
            }
            
            .message-icon-clean {
                width: 48px !important;
                height: 48px !important;
                background: rgba(168, 255, 0, 0.1) !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: #a8ff00 !important;
                border: 2px solid rgba(168, 255, 0, 0.2) !important;
                flex-shrink: 0 !important;
            }
            
            .message-content-clean h3 {
                margin: 0 0 8px 0 !important;
                color: #a8ff00 !important;
                font-size: 1.2rem !important;
                font-weight: 700 !important;
            }
            
            .message-content-clean p {
                margin: 0 !important;
                color: #ccc !important;
                font-size: 1rem !important;
                line-height: 1.5 !important;
            }
            
            .grupos-grid-clean {
                display: grid !important;
                gap: 20px !important;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)) !important;
            }
            
            .grupo-card-clean {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 20px !important;
                padding: 28px !important;
                cursor: pointer !important;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                position: relative !important;
                overflow: hidden !important;
                backdrop-filter: blur(10px) !important;
                animation: slideInCard 0.6s ease-out both !important;
            }
            
            .grupo-card-clean::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 3px !important;
                background: linear-gradient(90deg, #a8ff00, #7acc00) !important;
                transform: scaleX(0) !important;
                transition: transform 0.3s ease !important;
            }
            
            .grupo-card-clean:hover {
                transform: translateY(-8px) scale(1.02) !important;
                border-color: rgba(168, 255, 0, 0.4) !important;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(168, 255, 0, 0.2) !important;
            }
            
            .grupo-card-clean:hover::before {
                transform: scaleX(1) !important;
            }
            
            .grupo-header-clean {
                display: flex !important;
                align-items: center !important;
                gap: 16px !important;
                margin-bottom: 24px !important;
            }
            
            .grupo-icon-clean {
                width: 52px !important;
                height: 52px !important;
                background: rgba(168, 255, 0, 0.1) !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: #a8ff00 !important;
                border: 2px solid rgba(168, 255, 0, 0.2) !important;
                font-size: 1.5rem !important;
            }
            
            .grupo-nome-clean {
                margin: 0 !important;
                color: #fff !important;
                font-size: 1.3rem !important;
                font-weight: 700 !important;
                letter-spacing: -0.3px !important;
            }
            
            .grupo-stats-clean {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 16px !important;
                margin-bottom: 24px !important;
            }
            
            .grupo-stat-clean {
                text-align: center !important;
                padding: 16px 12px !important;
                background: rgba(255, 255, 255, 0.02) !important;
                border-radius: 12px !important;
                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                transition: all 0.3s ease !important;
            }
            
            .grupo-stat-clean:hover {
                background: rgba(168, 255, 0, 0.05) !important;
                border-color: rgba(168, 255, 0, 0.2) !important;
            }
            
            .volume-stat:hover {
                background: rgba(255, 152, 0, 0.05) !important;
                border-color: rgba(255, 152, 0, 0.2) !important;
            }
            
            .stat-number-clean {
                display: block !important;
                font-size: 1.4rem !important;
                font-weight: 800 !important;
                color: #a8ff00 !important;
                margin-bottom: 4px !important;
            }
            
            .volume-stat .stat-number-clean {
                color: #ff9800 !important;
            }
            
            .stat-text-clean {
                font-size: 0.75rem !important;
                color: #aaa !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                font-weight: 600 !important;
            }
            
            .grupo-action-clean {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 16px 20px !important;
                background: rgba(168, 255, 0, 0.05) !important;
                border-radius: 12px !important;
                border: 1px solid rgba(168, 255, 0, 0.1) !important;
                transition: all 0.3s ease !important;
            }
            
            .grupo-card-clean:hover .grupo-action-clean {
                background: rgba(168, 255, 0, 0.1) !important;
                border-color: rgba(168, 255, 0, 0.3) !important;
            }
            
            .action-text-clean {
                color: #a8ff00 !important;
                font-weight: 600 !important;
                font-size: 0.95rem !important;
            }
            
            .grupo-action-clean svg {
                color: #a8ff00 !important;
                transition: transform 0.3s ease !important;
            }
            
            .grupo-card-clean:hover .grupo-action-clean svg {
                transform: translateX(4px) !important;
            }
            
            /* Animações */
            @keyframes fadeInOverlay {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideInModal {
                from { 
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            @keyframes slideInCard {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Responsivo */
            @media (max-width: 768px) {
                .modal-content-seletor-clean {
                    max-width: calc(100vw - 24px) !important;
                    border-radius: 20px !important;
                }
                
                .modal-header-seletor-clean {
                    padding: 24px 24px 20px !important;
                }
                
                .modal-body-seletor-clean {
                    padding: 24px !important;
                }
                
                .modal-title-seletor-clean {
                    font-size: 1.6rem !important;
                }
                
                .grupos-grid-clean {
                    grid-template-columns: 1fr !important;
                }
                
                .grupo-card-clean {
                    padding: 24px !important;
                }
                
                .selector-message-clean {
                    flex-direction: column !important;
                    gap: 16px !important;
                    text-align: center !important;
                }
                
                .grupo-header-clean {
                    flex-direction: column !important;
                    text-align: center !important;
                    gap: 12px !important;
                }
            }
        </style>
    `;
}

// Função para obter ícone do grupo muscular
function getGrupoMuscularIcon(grupoMuscular) {
  const icons = {
    Peito: '💪',
    Costas: '🦵',
    Pernas: '🦵',
    Ombros: '🏋️',
    Braços: '💪',
    Core: '🔥',
    Cardio: '❤️',
    Funcional: '⚡',
    'Ombro e Braço': '🏋️‍♂️',
    'Peito e Tríceps': '💪',
    'Costas e Bíceps': '🦵',
    'Pernas e Glúteos': '🦵',
    default: '🏋️‍♂️',
  };

  return icons[grupoMuscular] || icons['default'];
}

// Função para fechar modal seletor
window.fecharModalSeletorGrupo = function (event) {
  if (event && event.target !== event.currentTarget) return;

  const modal = document.getElementById('modal-seletor-grupo');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.95)';
    document.body.style.overflow = '';

    setTimeout(() => {
      modal.remove();
    }, 300);
  }
};

// Exportar a função principal
window.criarModalSeletorClean = criarModalSeletorClean;
