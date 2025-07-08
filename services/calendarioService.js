// services/calendarioService.js
// Serviço para gerenciar a tabela d_calendario e atualizar semana atual

import { supabase, safeQuery, queryWithRetry } from './supabaseService.js';

export class CalendarioService {
    
    /**
     * Atualiza a coluna eh_semana_atual baseada na data atual
     * Garante que apenas o dia atual tenha eh_semana_atual = true
     */
    static async atualizarSemanaAtual() {
        console.log('[CalendarioService] 🗓️ Iniciando atualização da semana atual...');
        
        try {
            const hoje = new Date();
            const dataHoje = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
            
            console.log('[CalendarioService] 📅 Data atual:', dataHoje);
            
            // 1. Primeiro, definir TODAS as datas como eh_semana_atual = false
            console.log('[CalendarioService] 🔄 Resetando todas as semanas atuais...');
            // Atualizar apenas registros que têm eh_semana_atual = true para evitar UPDATE sem WHERE
            const { error: resetError } = await supabase
                .from('d_calendario')
                .update({ eh_semana_atual: false })
                .eq('eh_semana_atual', true); // Só atualiza registros que já são true
            
            if (resetError) {
                console.error('[CalendarioService] ❌ Erro ao resetar semanas atuais:', resetError);
                throw resetError;
            }
            
            console.log('[CalendarioService] ✅ Todas as semanas resetadas para false');
            
            // 2. Definir apenas a data atual como eh_semana_atual = true
            console.log('[CalendarioService] 🎯 Definindo data atual como semana atual...');
            const { data: dataAtualizada, error: updateError } = await supabase
                .from('d_calendario')
                .update({ 
                    eh_semana_atual: true,
                    updated_at: new Date().toISOString()
                })
                .eq('data_completa', dataHoje)
                .select();
            
            if (updateError) {
                console.error('[CalendarioService] ❌ Erro ao definir semana atual:', updateError);
                throw updateError;
            }
            
            if (!dataAtualizada || dataAtualizada.length === 0) {
                console.warn('[CalendarioService] ⚠️ Nenhum registro encontrado para a data atual:', dataHoje);
                console.log('[CalendarioService] 🔍 Verificando se a data existe na tabela...');
                
                const { data: verificacao, error: verificacaoError } = await supabase
                    .from('d_calendario')
                    .select('*')
                    .eq('data_completa', dataHoje);
                
                if (verificacaoError) {
                    console.error('[CalendarioService] ❌ Erro na verificação:', verificacaoError);
                } else if (!verificacao || verificacao.length === 0) {
                    console.error('[CalendarioService] ❌ Data atual não existe na tabela d_calendario!');
                    return { success: false, error: 'Data atual não encontrada na tabela' };
                } else {
                    console.log('[CalendarioService] 📊 Registro encontrado:', verificacao[0]);
                }
                
                return { success: false, error: 'Nenhum registro atualizado' };
            }
            
            console.log('[CalendarioService] ✅ Semana atual atualizada com sucesso!');
            console.log('[CalendarioService] 📊 Registro atualizado:', dataAtualizada[0]);
            
            return { 
                success: true, 
                data: dataAtualizada[0],
                dataAtual: dataHoje
            };
            
        } catch (error) {
            console.error('[CalendarioService] ❌ Erro crítico na atualização:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Verifica qual registro está marcado como semana atual com retry automático
     */
    static async verificarSemanaAtual() {
        console.log('[CalendarioService] 🔍 Verificando semana atual...');
        
        try {
            // Usar safeQuery com retry automático
            const result = await safeQuery(async () => {
                return await supabase
                    .from('d_calendario')
                    .select('*')
                    .eq('eh_semana_atual', true)
                    .order('data_completa', { ascending: false });
            }, { maxRetries: 3, baseDelay: 1000 });
            
            // Verificar se está offline
            if (result.offline) {
                console.warn('[CalendarioService] 📵 Operação offline - usando dados em cache se disponível');
                return { 
                    success: false, 
                    error: 'Sem conexão com a internet',
                    offline: true 
                };
            }
            
            if (result.error) {
                console.error('[CalendarioService] ❌ Erro ao verificar semana atual:', result.error);
                return { 
                    success: false, 
                    error: result.error.message,
                    isNetworkError: true 
                };
            }
            
            const { data } = result;
            
            console.log('[CalendarioService] 📊 Semanas marcadas como atuais:', data);
            
            const hoje = new Date().toISOString().split('T')[0];
            const semanaCorreta = data.find(d => d.data_completa === hoje);
            
            if (semanaCorreta) {
                console.log('[CalendarioService] ✅ Semana atual está correta!');
            } else {
                console.log('[CalendarioService] ⚠️ Semana atual NÃO está correta. Data atual:', hoje);
            }
            
            return { 
                success: true, 
                data, 
                dataAtual: hoje,
                estaCorreta: !!semanaCorreta
            };
            
        } catch (error) {
            console.error('[CalendarioService] ❌ Erro na verificação:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Função automática que deve ser chamada periodicamente
     * para manter a semana atual sempre atualizada
     */
    static async manterSemanaAtualizada() {
        console.log('[CalendarioService] 🔄 Mantendo semana atual atualizada...');
        
        // Verificar se precisa atualizar
        const verificacao = await this.verificarSemanaAtual();
        
        if (!verificacao.success) {
            console.error('[CalendarioService] ❌ Erro na verificação:', verificacao.error);
            
            // Se foi erro de rede, não tentar reset forçado ainda
            if (verificacao.isNetworkError) {
                console.warn('[CalendarioService] 🌐 Erro de rede detectado, pulando reset forçado');
                return { 
                    success: false, 
                    error: verificacao.error,
                    skippedReset: true,
                    reason: 'network_error'
                };
            }
            
            console.error('[CalendarioService] ❌ Erro persistente na verificação, tentando reset forçado...');
            const resetResult = await this.resetForcado();
            if (!resetResult.success) {
                console.error('[CalendarioService] ❌ Reset forçado falhou, usando atualização normal...');
                return await this.atualizarSemanaAtual();
            }
            return resetResult;
        }
        
        if (!verificacao.estaCorreta) {
            console.log('[CalendarioService] 🔧 Semana atual incorreta, atualizando...');
            const atualizacao = await this.atualizarSemanaAtual();
            
            // Se a atualização normal falhar, tentar reset forçado
            if (!atualizacao.success) {
                console.log('[CalendarioService] 🚨 Atualização normal falhou, tentando reset forçado...');
                return await this.resetForcado();
            }
            
            return atualizacao;
        }
        
        console.log('[CalendarioService] ✅ Semana atual já está correta!');
        return { success: true, message: 'Semana atual já está correta' };
    }
    
    /**
     * Função para debug - mostra os últimos registros
     */
    static async debugCalendario() {
        console.log('[CalendarioService] 🐛 Debug do calendário...');
        
        try {
            const hoje = new Date().toISOString().split('T')[0];
            
            // Buscar registros próximos à data atual
            const { data, error } = await supabase
                .from('d_calendario')
                .select('*')
                .gte('data_completa', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // 7 dias atrás
                .lte('data_completa', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // 7 dias à frente
                .order('data_completa', { ascending: true });
            
            if (error) {
                console.error('[CalendarioService] ❌ Erro no debug:', error);
                return;
            }
            
            console.log('[CalendarioService] 📊 Registros próximos à data atual:');
            console.table(data.map(d => ({
                data: d.data_completa,
                dia_semana: d.dia_semana,
                semana_treino: d.semana_treino,
                eh_semana_atual: d.eh_semana_atual,
                eh_semana_ativa: d.eh_semana_ativa,
                updated_at: d.updated_at
            })));
            
            const registroHoje = data.find(d => d.data_completa === hoje);
            if (registroHoje) {
                console.log('[CalendarioService] 🎯 Registro de hoje:', registroHoje);
            } else {
                console.error('[CalendarioService] ❌ Não encontrou registro para hoje:', hoje);
            }
            
        } catch (error) {
            console.error('[CalendarioService] ❌ Erro crítico no debug:', error);
        }
    }

    /**
     * Reset forçado para casos críticos - usado quando há problemas
     */
    static async resetForcado() {
        console.log('[CalendarioService] 🚨 Executando reset forçado...');
        
        try {
            const hoje = new Date().toISOString().split('T')[0];
            
            // 1. Verificar se existe registro para hoje
            const { data: registroHoje } = await supabase
                .from('d_calendario')
                .select('*')
                .eq('data_completa', hoje)
                .single();
            
            if (!registroHoje) {
                console.error('[CalendarioService] ❌ Registro para hoje não existe!');
                return { success: false, error: 'Registro para data atual não existe' };
            }
            
            // 2. Reset usando a estratégia de OR para garantir que funcione
            const { error: resetError } = await supabase
                .from('d_calendario')
                .update({ eh_semana_atual: false })
                .or('eh_semana_atual.eq.true,eh_semana_atual.eq.false'); // Pega todos os registros
            
            if (resetError) {
                console.error('[CalendarioService] ❌ Erro no reset forçado:', resetError);
                return { success: false, error: resetError.message };
            }
            
            // 3. Definir hoje como true
            const { error: updateError } = await supabase
                .from('d_calendario')
                .update({ 
                    eh_semana_atual: true,
                    updated_at: new Date().toISOString()
                })
                .eq('data_completa', hoje);
            
            if (updateError) {
                console.error('[CalendarioService] ❌ Erro ao definir hoje:', updateError);
                return { success: false, error: updateError.message };
            }
            
            console.log('[CalendarioService] ✅ Reset forçado concluído!');
            return { success: true };
            
        } catch (error) {
            console.error('[CalendarioService] ❌ Erro crítico no reset forçado:', error);
            return { success: false, error: error.message };
        }
    }
}

// Exportar também as funções individuais para compatibilidade
export const atualizarSemanaAtual = CalendarioService.atualizarSemanaAtual.bind(CalendarioService);
export const verificarSemanaAtual = CalendarioService.verificarSemanaAtual.bind(CalendarioService);
export const manterSemanaAtualizada = CalendarioService.manterSemanaAtualizada.bind(CalendarioService);
export const debugCalendario = CalendarioService.debugCalendario.bind(CalendarioService);
export const resetForcado = CalendarioService.resetForcado.bind(CalendarioService);

// Expor globalmente para debug e correção rápida
if (typeof window !== 'undefined') {
    window.CalendarioService = CalendarioService;
    window.debugCalendario = CalendarioService.debugCalendario.bind(CalendarioService);
    window.resetForcadoCalendario = CalendarioService.resetForcado.bind(CalendarioService);
    
    // Função de correção rápida para o console
    window.corrigirCalendarioRapido = async function() {
        console.log('🚨 Executando correção rápida do calendário...');
        
        try {
            // 1. Debug primeiro
            await CalendarioService.debugCalendario();
            
            // 2. Reset forçado
            const result = await CalendarioService.resetForcado();
            
            if (result.success) {
                console.log('✅ Calendário corrigido com sucesso!');
                
                // 3. Recarregar dashboard se disponível
                if (window.carregarDashboard) {
                    console.log('🔄 Recarregando dashboard...');
                    setTimeout(() => window.carregarDashboard(), 1000);
                }
            } else {
                console.error('❌ Falha na correção:', result.error);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Erro na correção rápida:', error);
            return { success: false, error: error.message };
        }
    };
}