/**
 * 🔄 MODAL DE RECUPERAÇÃO DE TREINO - Workout Recovery Modal
 * 
 * FUNÇÃO: Permitir recuperação de treinos interrompidos com validação e preview detalhado.
 * 
 * RESPONSABILIDADES:
 * - Detectar treinos em andamento salvos no cache local
 * - Validar correspondência entre cache e treino atual selecionado
 * - Exibir preview detalhado do progresso salvo (séries, exercícios, tempo)
 * - Oferecer opções de recuperação ou descarte com confirmação
 * - Calcular estatísticas de progresso e tempo decorrido
 * - Implementar validações de integridade dos dados
 * - Re-estabelecer timers e cronômetros quando necessário
 * 
 * VALIDAÇÕES IMPLEMENTADAS:
 * - Correspondência de ID do protocolo/treino
 * - Hash do planejamento para detectar modificações
 * - Limite de idade dos dados (máximo 7 dias)
 * - Verificação de exercícios modificados
 * - Integridade estrutural dos dados salvos
 * 
 * RECURSOS:
 * - Cálculo automático de tempo decorrido com formatação intuitiva
 * - Preview agrupado de séries por exercício
 * - Algoritmo de hash deterministico (djb2) para comparação
 * - Suporte a hash criptográfico SHA-256 para produção
 * - Interface responsiva com ícones SVG
 * - Sistema de confirmação para ações destrutivas
 * 
 * FLUXO DE RECUPERAÇÃO:
 * 1. Verificar cache de treino interrompido
 * 2. Validar correspondência com treino atual
 * 3. Exibir modal com preview e opções
 * 4. Processar escolha do usuário
 * 5. Restaurar estado ou limpar cache
 * 6. Re-estabelecer timers se necessário
 * 
 * INTEGRAÇÃO: Usado no início de treinos para detectar e recuperar sessões interrompidas
 */

// Modal de Recuperação de Treino
export function criarModalRecuperacaoTreino(dadosRecuperados, onContinuar, onNovoTreino) {
    const tempoDecorrido = calcularTempoDecorrido(dadosRecuperados.timestamp);
    const execucoes = dadosRecuperados.execucoes || [];
    const exerciciosUnicos = new Set(execucoes.map(e => e.exercicio_id)).size;
    
    // Validar correspondência com treino atual
    const treinoAtual = window.AppState?.get('currentWorkout');
    const validacao = validarCacheCorrespondente(dadosRecuperados, treinoAtual);
    const podeRecuperar = validacao.valido;
    
    const modal = document.createElement('div');
    modal.className = 'modal recovery-modal';
    modal.innerHTML = `
        <div class="modal-content recovery-content">
            <div class="recovery-header">
                <div class="recovery-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                        <path d="M12 7v5l4 2"/>
                    </svg>
                </div>
                <h2>Treino em Andamento Detectado</h2>
                <p class="recovery-subtitle">Encontramos um treino não finalizado</p>
            </div>
            
            <div class="recovery-info">
                <div class="info-card">
                    <div class="info-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <div class="info-content">
                        <span class="info-label">Última atividade</span>
                        <span class="info-value">${tempoDecorrido}</span>
                    </div>
                </div>
                
                <div class="info-card">
                    <div class="info-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
                        </svg>
                    </div>
                    <div class="info-content">
                        <span class="info-label">Progresso salvo</span>
                        <span class="info-value">${execucoes.length} séries • ${exerciciosUnicos} exercícios</span>
                    </div>
                </div>
            </div>
            
            <div class="recovery-preview">
                <h3>Séries Registradas:</h3>
                <div class="series-preview-list">
                    ${renderizarPreviewSeries(execucoes)}
                </div>
            </div>
            
            ${!podeRecuperar ? `
            <div class="recovery-validation-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <div>
                    <strong>Não é possível continuar este treino</strong>
                    <p>${validacao.motivo}</p>
                </div>
            </div>
            ` : ''}
            
            <div class="recovery-actions">
                <button class="btn-secondary" onclick="handleNovoTreino()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span>${podeRecuperar ? 'Começar Novo Treino' : 'Descartar e Começar Novo'}</span>
                </button>
                
                ${podeRecuperar ? `
                <button class="btn-primary" onclick="handleContinuarTreino()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <span>Continuar de Onde Parei</span>
                </button>
                ` : ''}
            </div>
            
            <div class="recovery-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Se começar um novo treino, o progresso atual será perdido.</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handlers globais temporários
    window.handleContinuarTreino = () => {
        modal.remove();
        delete window.handleContinuarTreino;
        delete window.handleNovoTreino;
        
        // Re-registrar timers necessários após recuperação
        if (window.timerManager && dadosRecuperados.cronometro) {
            const { cronometro } = dadosRecuperados;
            
            // Se havia um timer de descanso ativo
            if (cronometro.restTime && cronometro.restStartTime) {
                const tempoPassado = Date.now() - new Date(cronometro.restStartTime).getTime();
                const tempoRestante = Math.max(0, cronometro.restTime - Math.floor(tempoPassado / 1000));
                
                if (tempoRestante > 0) {
                    console.log('[Recovery] Re-iniciando timer de descanso com', tempoRestante, 'segundos restantes');
                    // Timer será re-criado pelo workout.js quando estado for restaurado
                }
            }
        }
        
        onContinuar();
    };
    
    window.handleNovoTreino = () => {
        if (confirm('Tem certeza que deseja começar um novo treino? O progresso atual será perdido.')) {
            modal.remove();
            delete window.handleContinuarTreino;
            delete window.handleNovoTreino;
            onNovoTreino();
        }
    };
    
    // Mostrar modal com animação
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    return modal;
}

/**
 * Calcula tempo decorrido formatado
 */
function calcularTempoDecorrido(timestamp) {
    const agora = Date.now();
    const diferenca = agora - timestamp;
    
    const minutos = Math.floor(diferenca / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) {
        return `há ${dias} dia${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
        return `há ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
        return `há ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
        return 'há poucos instantes';
    }
}

/**
 * Renderiza preview das séries
 */
function renderizarPreviewSeries(execucoes) {
    if (!execucoes || execucoes.length === 0) {
        return '<p class="empty-preview">Nenhuma série registrada</p>';
    }
    
    // Agrupar por exercício
    const porExercicio = {};
    execucoes.forEach(exec => {
        const nome = exec.exercicio_nome || `Exercício ${exec.exercicio_id}`;
        if (!porExercicio[nome]) {
            porExercicio[nome] = [];
        }
        porExercicio[nome].push(exec);
    });
    
    // Renderizar até 3 exercícios
    const exercicios = Object.entries(porExercicio).slice(0, 3);
    let html = '';
    
    exercicios.forEach(([nome, series]) => {
        html += `
            <div class="exercise-preview">
                <h4>${nome}</h4>
                <div class="series-chips">
                    ${series.map(s => `
                        <span class="serie-chip">
                            ${s.peso_utilizado}kg × ${s.repeticoes_realizadas || s.repeticoes}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    if (Object.keys(porExercicio).length > 3) {
        html += `<p class="more-exercises">+ ${Object.keys(porExercicio).length - 3} exercício(s)</p>`;
    }
    
    return html;
}

/**
 * Valida se o cache corresponde ao treino atual
 */
function validarCacheCorrespondente(dadosRecuperados, treinoAtual) {
    if (!treinoAtual) {
        return {
            valido: false,
            motivo: 'Nenhum treino selecionado atualmente'
        };
    }
    
    // Verificar ID do protocolo
    const cacheProtocoloId = dadosRecuperados.estadoAtual?.currentWorkout?.protocolo_id ||
                            dadosRecuperados.estadoAtual?.currentWorkout?.id;
    
    if (cacheProtocoloId && treinoAtual.id && cacheProtocoloId !== treinoAtual.id) {
        return {
            valido: false,
            motivo: 'Este progresso é de um treino diferente'
        };
    }
    
    // Verificar hash do planejamento (se disponível)
    if (dadosRecuperados.planejamento_hash && treinoAtual.planejamento_hash) {
        if (dadosRecuperados.planejamento_hash !== treinoAtual.planejamento_hash) {
            return {
                valido: false,
                motivo: 'O planejamento do treino foi alterado'
            };
        }
    }
    
    // Verificar data (não permitir cache muito antigo)
    const cacheDate = new Date(dadosRecuperados.timestamp);
    const hoje = new Date();
    const diffDays = Math.floor((hoje - cacheDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
        return {
            valido: false,
            motivo: 'Este progresso é muito antigo (mais de 7 dias)'
        };
    }
    
    // Verificar se os exercícios ainda correspondem
    if (dadosRecuperados.estadoAtual?.currentExercises && treinoAtual.exercicios) {
        const exerciciosCache = dadosRecuperados.estadoAtual.currentExercises;
        const exerciciosAtuais = treinoAtual.exercicios;
        
        // Verificar se os IDs dos exercícios mudaram
        const idsCache = exerciciosCache.map(e => e.exercicio_id).sort();
        const idsAtuais = exerciciosAtuais.map(e => e.exercicio_id).sort();
        
        if (JSON.stringify(idsCache) !== JSON.stringify(idsAtuais)) {
            return {
                valido: false,
                motivo: 'Os exercícios do treino foram modificados'
            };
        }
    }
    
    return { valido: true };
}

/**
 * Calcula hash determinístico do planejamento de treino
 * 
 * ALGORITMO DETALHADO:
 * 1. Coleta dados relevantes do treino:
 *    - ID do treino
 *    - ID do protocolo
 *    - Grupo muscular
 *    - Lista de exercícios (ID, séries, repetições)
 *    - Data de modificação (se disponível)
 * 
 * 2. Normalização dos dados:
 *    - Exercícios ordenados por exercicio_id (ordem alfabética)
 *    - Formato: "exercicio_id_series_repeticoes_alvo"
 *    - Separador entre exercícios: ","
 *    - Separador entre campos principais: "|"
 * 
 * 3. String final formato:
 *    "treino_id|protocolo_id|grupo_muscular|exercicios_ordenados|data_mod"
 * 
 * 4. Aplicação do hash (djb2 variant):
 *    - Inicializa com 5381 (número primo)
 *    - Para cada caractere: hash = ((hash << 5) + hash) + char
 *    - Mascara para 32-bit: hash & 0xFFFFFFFF
 *    - Garante valor positivo: Math.abs(hash)
 * 
 * 5. Conversão final:
 *    - Base36 para compactação (0-9, a-z)
 *    - Resultado típico: 6-8 caracteres
 * 
 * EXEMPLOS:
 * - Entrada: {id: "123", protocolo_id: "456", ...}
 * - String intermediária: "123|456|peito|ex1_3_10,ex2_4_8|2024-01-15"
 * - Hash decimal: 1234567890
 * - Hash base36: "kf12oi"
 * 
 * LIMITAÇÕES:
 * - Hash não criptográfico (apenas para comparação rápida)
 * - Possibilidade de colisões (aceitável para este uso)
 * - Sensível a qualquer mudança nos dados
 * 
 * MIGRAÇÃO FUTURA:
 * - Use calcularHashPlanejamentoCrypto() para SHA-256
 * - Mais seguro e menor chance de colisão
 * - Requer async/await
 * 
 * @param {Object} treino - Objeto do treino com estrutura esperada
 * @returns {string|null} Hash em base36 ou null se entrada inválida
 */
function calcularHashPlanejamento(treino) {
    if (!treino) return null;
    
    // Ordenar exercícios por ID para garantir consistência
    const exerciciosOrdenados = (treino.exercicios || [])
        .sort((a, b) => a.exercicio_id.localeCompare(b.exercicio_id))
        .map(e => `${e.exercicio_id}_${e.series}_${e.repeticoes_alvo}`)
        .join(',');
    
    // Criar string determinística
    const dados = [
        treino.id,
        treino.protocolo_id,
        treino.grupo_muscular,
        exerciciosOrdenados,
        treino.data_modificacao || ''
    ].filter(Boolean).join('|');
    
    // Java String hashCode (djb2 variant) - determinístico
    let hash = 5381;
    for (let i = 0; i < dados.length; i++) {
        const char = dados.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; // hash * 33 + char
        hash = hash & 0xFFFFFFFF; // Convert to 32-bit integer
    }
    
    // Garantir positivo e converter para base36
    const positiveHash = Math.abs(hash);
    return positiveHash.toString(36);
}

/**
 * Versão assíncrona usando Web Crypto API (recomendada para produção)
 */
async function calcularHashPlanejamentoCrypto(treino) {
    if (!treino || !crypto.subtle) return null;
    
    const exerciciosOrdenados = (treino.exercicios || [])
        .sort((a, b) => a.exercicio_id.localeCompare(b.exercicio_id))
        .map(e => `${e.exercicio_id}_${e.series}_${e.repeticoes_alvo}`)
        .join(',');
    
    const dados = [
        treino.id,
        treino.protocolo_id,
        treino.grupo_muscular,
        exerciciosOrdenados,
        treino.data_modificacao || ''
    ].filter(Boolean).join('|');
    
    // Converter string para ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(dados);
    
    // Calcular SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Converter para hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Retornar primeiros 16 caracteres para compactação
    return hashHex.substring(0, 16);
}