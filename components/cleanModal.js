/**
 * 🧹 MODAL CLEAN REDESIGNED - Clean History Modal
 *
 * FUNÇÃO: Exibir histórico de treinos e planejamentos com design limpo e moderno.
 *
 * RESPONSABILIDADES:
 * - Renderizar modais de histórico com design consistente e acessível
 * - Diferenciar entre treinos executados e apenas planejados
 * - Apresentar estatísticas de treino de forma visual e intuitiva
 * - Exibir preview de exercícios sugeridos e realizados
 * - Calcular e mostrar métricas de desempenho (volume, duração, performance)
 * - Aplicar estilos responsivos e animações suaves
 * - Fornecer navegação acessível com foco trap e ARIA labels
 *
 * RECURSOS:
 * - Design clean com gradientes e efeitos modernos
 * - Cards informativos com ícones SVG vetoriais
 * - Grid responsivo que se adapta a diferentes tamanhos de tela
 * - Efeitos de hover e transições suaves
 * - Suporte a backdrop blur e glassmorphism
 * - Validação de dados com fallbacks seguros
 *
 * TIPOS DE CONTEÚDO:
 * - Treinos Executados: histórico completo com estatísticas de performance
 * - Treinos Planejados: preview de exercícios sugeridos e configurações
 * - Estatísticas: volume total, exercícios completados, duração estimada
 * - Performance: percentual de conclusão com indicadores visuais
 *
 * INTEGRAÇÃO: Usado pelo sistema de calendário e dashboard para exibir detalhes históricos
 */

// ===== MODAL CLEAN REDESIGNED =====

// Função para criar modal de histórico com design clean e moderno
function criarModalHistoricoClean(historico, dayIndex) {
  const dayName = DIAS_SEMANA[dayIndex];
  const dataFormatada = historico.data_treino.toLocaleDateString('pt-BR');

  // Verificar se é apenas planejamento (sem execuções)
  const somenteplanejamento =
    historico.semExecucoes || (historico.execucoes && historico.execucoes.length === 0);

  // Calcular estatísticas
  const stats = somenteplanejamento ? null : calcularEstatisticasTreino(historico);

  return `
        <div id="modal-historico" class="modal-overlay-clean" onclick="fecharModalHistorico(event)">
            <div class="modal-content-clean workout-history-modal-clean" onclick="event.stopPropagation()">
                <!-- Header Clean -->
                <div class="modal-header-clean">
                    <div class="workout-history-header-clean">
                        <div class="history-title-section-clean">
                            <h2 class="modal-title-clean">
                                ${somenteplanejamento ? '📋 Treino Planejado' : '🏆 Histórico do Treino'}
                            </h2>
                            <div class="history-subtitle-clean">
                                <span class="day-badge-clean">${dayName}</span>
                                <span class="date-clean">${dataFormatada}</span>
                            </div>
                        </div>
                        <button class="btn-close-clean" onclick="fecharModalHistorico()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Body Clean -->
                <div class="modal-body-clean">
                    ${somenteplanejamento ? criarConteudoPlanejamento(historico) : criarConteudoHistorico(historico, stats)}
                </div>
            </div>
        </div>
        
        <style>
            .modal-overlay-clean {
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
            
            .modal-content-clean {
                background: linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%) !important;
                border-radius: 24px !important;
                max-width: 750px !important;
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
            
            .modal-header-clean {
                padding: 32px 32px 24px !important;
                background: linear-gradient(135deg, rgba(168, 255, 0, 0.08) 0%, transparent 70%) !important;
                border-bottom: 1px solid rgba(168, 255, 0, 0.15) !important;
                position: relative !important;
            }
            
            .workout-history-header-clean {
                display: flex !important;
                justify-content: space-between !important;
                align-items: flex-start !important;
            }
            
            .modal-title-clean {
                margin: 0 0 16px 0 !important;
                font-size: 1.9rem !important;
                font-weight: 700 !important;
                color: #ffffff !important;
                letter-spacing: -1px !important;
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
                line-height: 1.2 !important;
            }
            
            .history-subtitle-clean {
                display: flex !important;
                align-items: center !important;
                gap: 16px !important;
                flex-wrap: wrap !important;
            }
            
            .day-badge-clean {
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
            
            .date-clean {
                color: #bbb !important;
                font-size: 1rem !important;
                font-weight: 500 !important;
            }
            
            .btn-close-clean {
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
            
            .btn-close-clean:hover {
                background: rgba(255, 255, 255, 0.15) !important;
                border-color: rgba(255, 255, 255, 0.3) !important;
                color: #fff !important;
                transform: scale(1.1) rotate(90deg) !important;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
            }
            
            .modal-body-clean {
                padding: 24px !important;
                overflow-y: auto !important;
                overflow-x: hidden !impor       tant;
                max-height: calc(90vh - 140px) !important;
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
            
            /* Responsivo */
            @media (max-width: 768px) {
                .modal-content-clean {
                    max-width: calc(100vw - 24px) !important;
                    border-radius: 20px !important;
                }
                
                .modal-header-clean {
                    padding: 24px 24px 20px !important;
                }
                
                .modal-body-clean {
                    padding: 16px !important;
                }
                
                .modal-title-clean {
                    font-size: 1.6rem !important;
                }
                
                .history-subtitle-clean {
                    gap: 12px !important;
                }
            }
        </style>
    `;
}

// Função para criar conteúdo do planejamento
function criarConteudoPlanejamento(historico) {
  return `
        <div class="planning-section-clean">
            <div class="planning-card-clean">
                <div class="planning-header-clean">
                    <h3 class="planning-title-clean">📋 Treino Planejado</h3>
                    <span class="planning-status-clean">Aguardando Execução</span>
                </div>
                <div class="planning-details-clean">
                    <div class="detail-item-clean">
                        <span class="detail-label-clean">Grupo Muscular</span>
                        <span class="detail-value-clean">${historico.planejamento.tipo_atividade}</span>
                    </div>
                    <div class="detail-item-clean">
                        <span class="detail-label-clean">Status</span>
                        <span class="detail-value-clean status-pending">Não Executado</span>
                    </div>
                </div>
            </div>
            
            ${
              historico.exerciciosSugeridos && historico.exerciciosSugeridos.length > 0
                ? criarExerciciosSugeridos(historico.exerciciosSugeridos)
                : ''
            }
        </div>
        
        <style>
            .planning-section-clean {
                display: flex !important;
                flex-direction: column !important;
                gap: 24px !important;
            }
            
            .planning-card-clean {
                background: linear-gradient(135deg, rgba(168, 255, 0, 0.08) 0%, rgba(168, 255, 0, 0.03) 100%) !important;
                border: 1px solid rgba(168, 255, 0, 0.2) !important;
                border-radius: 16px !important;
                padding: 28px !important;
                position: relative !important;
                overflow: hidden !important;
            }
            
            .planning-card-clean::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 4px !important;
                height: 100% !important;
                background: linear-gradient(to bottom, #a8ff00, #7acc00) !important;
                border-radius: 0 4px 4px 0 !important;
            }
            
            .planning-header-clean {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 24px !important;
                flex-wrap: wrap !important;
                gap: 12px !important;
            }
            
            .planning-title-clean {
                margin: 0 !important;
                color: #a8ff00 !important;
                font-size: 1.3rem !important;
                font-weight: 700 !important;
                letter-spacing: -0.3px !important;
            }
            
            .planning-status-clean {
                background: linear-gradient(135deg, #ff6b35 0%, #e55730 100%) !important;
                color: white !important;
                padding: 8px 16px !important;
                border-radius: 25px !important;
                font-size: 0.85rem !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3) !important;
            }
            
            .planning-details-clean {
                display: flex !important;
                flex-direction: column !important;
                gap: 16px !important;
            }
            
            .detail-item-clean {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                padding: 16px 0 !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            
            .detail-item-clean:last-child {
                border-bottom: none !important;
            }
            
            .detail-label-clean {
                color: #ccc !important;
                font-weight: 500 !important;
                font-size: 1rem !important;
            }
            
            .detail-value-clean {
                color: #a8ff00 !important;
                font-weight: 700 !important;
                font-size: 1.05rem !important;
            }
            
            .detail-value-clean.status-pending {
                color: #ff6b35 !important;
            }
        </style>
    `;
}

// Função para criar exercícios sugeridos
function criarExerciciosSugeridos(exercicios) {
  return `
        <div class="suggested-exercises-clean">
            <h3 class="exercises-title-clean">💪 Exercícios Sugeridos</h3>
            <div class="exercises-grid-clean">
                ${exercicios
                  .map(
                    (ex) => `
                    <div class="exercise-card-clean">
                        <div class="exercise-header-clean">
                            <h4 class="exercise-name-clean">${ex.nome}</h4>
                            <span class="exercise-equipment-clean">${ex.equipamento || 'Livre'}</span>
                        </div>
                        <div class="exercise-stats-clean">
                            ${
                              ex.series
                                ? `
                                <div class="stat-item-clean">
                                    <span class="stat-value-clean">${ex.series}</span>
                                    <span class="stat-label-clean">Séries</span>
                                </div>
                            `
                                : ''
                            }
                            ${
                              ex.repeticoes
                                ? `
                                <div class="stat-item-clean">
                                    <span class="stat-value-clean">${ex.repeticoes}</span>
                                    <span class="stat-label-clean">Reps</span>
                                </div>
                            `
                                : ''
                            }
                            ${
                              ex.peso_calculado
                                ? `
                                <div class="stat-item-clean">
                                    <span class="stat-value-clean">${Math.round(ex.peso_calculado)}kg</span>
                                    <span class="stat-label-clean">Peso</span>
                                </div>
                            `
                                : ''
                            }
                            ${
                              ex.descanso_sugerido
                                ? `
                                <div class="stat-item-clean">
                                    <span class="stat-value-clean">${ex.descanso_sugerido}s</span>
                                    <span class="stat-label-clean">Descanso</span>
                                </div>
                            `
                                : ''
                            }
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
        
        <style>
            .suggested-exercises-clean {
                background: linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(74, 144, 226, 0.03) 100%) !important;
                border: 1px solid rgba(74, 144, 226, 0.2) !important;
                border-radius: 16px !important;
                padding: 28px !important;
                position: relative !important;
            }
            
            .suggested-exercises-clean::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 4px !important;
                height: 100% !important;
                background: linear-gradient(to bottom, #4A90E2, #357ABD) !important;
                border-radius: 0 4px 4px 0 !important;
            }
            
            .exercises-title-clean {
                margin: 0 0 24px 0 !important;
                color: #4A90E2 !important;
                font-size: 1.3rem !important;
                font-weight: 700 !important;
                letter-spacing: -0.3px !important;
            }
            
            .exercises-grid-clean {
                display: grid !important;
                gap: 20px !important;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
                box-sizing: border-box !important;
            }

            /* Ajuste para detalhes dos exercícios */
            .exercise-details-clean {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)) !important;
                gap: 12px !important;
            }
            
            .exercise-card-clean {
                background: rgba(255, 255, 255, 0.03) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 12px !important;
                padding: 20px !important;
                transition: all 0.3s ease !important;
                backdrop-filter: blur(10px) !important;
            }
            
            .exercise-card-clean:hover {
                transform: translateY(-4px) !important;
                border-color: rgba(74, 144, 226, 0.4) !important;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3) !important;
            }
            
            .exercise-header-clean {
                display: flex !important;
                justify-content: space-between !important;
                align-items: flex-start !important;
                margin-bottom: 16px !important;
                gap: 12px !important;
            }
            
            .exercise-name-clean {
                margin: 0 !important;
                color: #fff !important;
                font-size: 1.1rem !important;
                font-weight: 600 !important;
                line-height: 1.3 !important;
                word-break: break-word !important;
                white-space: normal !important;
            }
            
            .exercise-equipment-clean {
                background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%) !important;
                color: white !important;
                padding: 4px 12px !important;
                border-radius: 15px !important;
                font-size: 0.75rem !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                white-space: nowrap !important;
                box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3) !important;
            }
            
            .exercise-stats-clean {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)) !important;
                gap: 16px !important;
            }
            
            .stat-item-clean {
                text-align: center !important;
                padding: 12px 8px !important;
                background: rgba(168, 255, 0, 0.05) !important;
                border-radius: 8px !important;
                border: 1px solid rgba(168, 255, 0, 0.1) !important;
            }
            
            .stat-value-clean {
                display: block !important;
                color: #a8ff00 !important;
                font-weight: 700 !important;
                font-size: 1.2rem !important;
                margin-bottom: 4px !important;
            }
            
            .stat-label-clean {
                color: #aaa !important;
                font-size: 0.75rem !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                font-weight: 500 !important;
            }
            
            @media (max-width: 768px) {
                .exercises-grid-clean {
                    grid-template-columns: 1fr !important;
                }
                
                .exercise-header-clean {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 8px !important;
                }
            }
        </style>
    `;
}

// Função para criar conteúdo do histórico
function criarConteudoHistorico(historico, stats) {
  return `
        <div class="history-section-clean">
            <div class="stats-overview-clean">
                <div class="stat-card-clean">
                    <div class="stat-icon-clean weight-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                    </div>
                    <div class="stat-content-clean">
                        <div class="stat-value-clean">${stats.totalPeso}kg</div>
                        <div class="stat-label-clean">Volume Total</div>
                    </div>
                </div>
                
                <div class="stat-card-clean">
                    <div class="stat-icon-clean exercises-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <div class="stat-content-clean">
                        <div class="stat-value-clean">${stats.totalExercicios}</div>
                        <div class="stat-label-clean">Exercícios</div>
                    </div>
                </div>
                
                <div class="stat-card-clean">
                    <div class="stat-icon-clean time-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <div class="stat-content-clean">
                        <div class="stat-value-clean">${stats.duracaoEstimada}min</div>
                        <div class="stat-label-clean">Duração</div>
                    </div>
                </div>
                
                <div class="stat-card-clean performance-card">
                    <div class="stat-icon-clean performance-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${stats.performance.icon}
                        </svg>
                    </div>
                    <div class="stat-content-clean">
                        <div class="stat-value-clean performance-value">${stats.performance.percentual}%</div>
                        <div class="stat-label-clean">Performance</div>
                    </div>
                </div>
            </div>
            
            <div class="exercises-history-clean">
                <h3 class="exercises-title-clean">🏋️‍♂️ Exercícios Realizados</h3>
                <div id="workout-exercises-list-modal-clean">
                    ${renderizarExerciciosHistorico(historico)}
                </div>
            </div>
        </div>
        
        <style>
            .history-section-clean {
                display: flex !important;
                flex-direction: column !important;
                gap: 32px !important;
            }
            
            .stats-overview-clean {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
                gap: 20px !important;
            }
            
            .stat-card-clean {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 16px !important;
                padding: 24px !important;
                text-align: center !important;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                backdrop-filter: blur(10px) !important;
                position: relative !important;
                overflow: hidden !important;
            }
            
            .stat-card-clean::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 3px !important;
                background: linear-gradient(90deg, #a8ff00, #7acc00) !important;
            }
            
            .stat-card-clean:hover {
                transform: translateY(-6px) scale(1.02) !important;
                border-color: rgba(168, 255, 0, 0.3) !important;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
            }
            
            .performance-card:hover {
                border-color: rgba(0, 255, 136, 0.3) !important;
            }
            
            .performance-card::before {
                background: linear-gradient(90deg, #00ff88, #00cc6a) !important;
            }
            
            .stat-icon-clean {
                margin: 0 auto 16px !important;
                width: 52px !important;
                height: 52px !important;
                background: rgba(168, 255, 0, 0.1) !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: #a8ff00 !important;
                border: 2px solid rgba(168, 255, 0, 0.2) !important;
            }
            
            .performance-icon {
                background: rgba(0, 255, 136, 0.1) !important;
                color: #00ff88 !important;
                border-color: rgba(0, 255, 136, 0.2) !important;
            }
            
            .stat-value-clean {
                font-size: 1.6rem !important;
                font-weight: 800 !important;
                color: #fff !important;
                margin-bottom: 6px !important;
                letter-spacing: -0.5px !important;
            }
            
            .performance-value {
                color: #00ff88 !important;
            }
            
            .stat-label-clean {
                font-size: 0.8rem !important;
                color: #aaa !important;
                text-transform: uppercase !important;
                font-weight: 600 !important;
                letter-spacing: 1px !important;
            }
            
            .exercises-history-clean {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 16px !important;
                padding: 28px !important;
                backdrop-filter: blur(10px) !important;
            }
            
            .exercises-title-clean {
                margin: 0 0 24px 0 !important;
                color: #fff !important;
                font-size: 1.4rem !important;
                font-weight: 700 !important;
                letter-spacing: -0.5px !important;
            }
            
            @media (max-width: 768px) {
                .stats-overview-clean {
                    grid-template-columns: repeat(2, 1fr) !important;
                }
                
                .stat-card-clean {
                    padding: 20px !important;
                }
                
                .stat-value-clean {
                    font-size: 1.4rem !important;
                }
            }
        </style>
    `;
}

// Exportar a função principal
window.criarModalHistoricoClean = criarModalHistoricoClean;
