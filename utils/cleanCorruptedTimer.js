// Utilitário para limpar dados corrompidos do timer
export function cleanCorruptedTimerData() {
    console.log('[cleanCorruptedTimer] Verificando dados do timer...');
    
    // Verificar treino_tempo_temp
    const tempoSalvo = localStorage.getItem('treino_tempo_temp');
    if (tempoSalvo) {
        try {
            const dados = JSON.parse(tempoSalvo);
            
            // Verificar se os dados são válidos
            const tempoValido = !isNaN(dados.tempo) && dados.tempo >= 0;
            const timestampValido = !isNaN(dados.ultimaAtualizacao) && dados.ultimaAtualizacao > 0;
            
            if (!tempoValido || !timestampValido) {
                console.warn('[cleanCorruptedTimer] Dados corrompidos encontrados:', dados);
                localStorage.removeItem('treino_tempo_temp');
                console.log('[cleanCorruptedTimer] Dados do timer limpos');
            } else {
                console.log('[cleanCorruptedTimer] Dados do timer válidos');
            }
        } catch (error) {
            console.error('[cleanCorruptedTimer] Erro ao parsear dados:', error);
            localStorage.removeItem('treino_tempo_temp');
        }
    }
    
    // Verificar estado unificado
    const estadoUnificado = localStorage.getItem('treino_unified_state');
    if (estadoUnificado) {
        try {
            const estado = JSON.parse(estadoUnificado);
            
            if (estado.cronometro && estado.cronometro.workoutStartTime) {
                const startTime = Number(estado.cronometro.workoutStartTime);
                
                if (isNaN(startTime) || startTime <= 0) {
                    console.warn('[cleanCorruptedTimer] workoutStartTime corrompido:', estado.cronometro.workoutStartTime);
                    
                    // Corrigir usando o timestamp do estado ou tempo atual
                    if (estado.timestamp && !isNaN(estado.timestamp)) {
                        estado.cronometro.workoutStartTime = estado.timestamp;
                    } else {
                        estado.cronometro.workoutStartTime = Date.now();
                    }
                    
                    localStorage.setItem('treino_unified_state', JSON.stringify(estado));
                    console.log('[cleanCorruptedTimer] workoutStartTime corrigido');
                }
            }
        } catch (error) {
            console.error('[cleanCorruptedTimer] Erro ao processar estado unificado:', error);
        }
    }
}

// Executar automaticamente ao carregar
if (typeof window !== 'undefined') {
    window.cleanCorruptedTimerData = cleanCorruptedTimerData;
    
    // Executar na inicialização se houver problema detectado
    document.addEventListener('DOMContentLoaded', () => {
        const tempoSalvo = localStorage.getItem('treino_tempo_temp');
        if (tempoSalvo && tempoSalvo.includes('NaN')) {
            cleanCorruptedTimerData();
        }
    });
}