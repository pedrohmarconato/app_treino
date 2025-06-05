// Script para configurar dados de teste no Supabase
import { supabase } from './services/supabaseService.js';

async function configurarDadosTeste() {
    try {
        console.log('🔧 Configurando dados de teste...');
        
        // 1. Verificar se usuários existem
        const { data: usuarios, error: userError } = await supabase
            .from('usuarios')
            .select('id, nome')
            .limit(5);
            
        if (userError) {
            console.error('❌ Erro ao buscar usuários:', userError);
            return;
        }
        
        console.log('👥 Usuários encontrados:', usuarios);
        
        if (!usuarios || usuarios.length === 0) {
            console.log('➕ Criando usuários de teste...');
            
            const { data: novosUsuarios, error: createError } = await supabase
                .from('usuarios')
                .insert([
                    { nome: 'Pedro', email: 'pedro@teste.com', status: 'ativo' },
                    { nome: 'Japa', email: 'japa@teste.com', status: 'ativo' }
                ])
                .select();
                
            if (createError) {
                console.error('❌ Erro ao criar usuários:', createError);
                return;
            }
            
            console.log('✅ Usuários criados:', novosUsuarios);
        }
        
        // 2. Verificar protocolo de treinamento
        const { data: protocolos, error: protocoloError } = await supabase
            .from('protocolos_treinamento')
            .select('*')
            .limit(1);
            
        if (protocoloError) {
            console.error('❌ Erro ao buscar protocolos:', protocoloError);
            return;
        }
        
        let protocoloId = protocolos?.[0]?.id;
        
        if (!protocoloId) {
            console.log('➕ Criando protocolo de teste...');
            
            const { data: novoProtocolo, error: createProtocoloError } = await supabase
                .from('protocolos_treinamento')
                .insert({
                    nome: 'Protocolo Básico',
                    descricao: 'Protocolo de teste para desenvolvimento',
                    duracao_meses: 3,
                    total_semanas: 12,
                    dias_por_semana: 4,
                    total_treinos: 4
                })
                .select()
                .single();
                
            if (createProtocoloError) {
                console.error('❌ Erro ao criar protocolo:', createProtocoloError);
                return;
            }
            
            protocoloId = novoProtocolo.id;
            console.log('✅ Protocolo criado:', novoProtocolo);
        }
        
        // 3. Configurar usuário com protocolo ativo
        const userId = usuarios[0]?.id;
        if (userId) {
            console.log(`🔗 Vinculando usuário ${userId} ao protocolo ${protocoloId}...`);
            
            const { data: planoUsuario, error: planoError } = await supabase
                .from('usuario_plano_treino')
                .upsert({
                    usuario_id: userId,
                    protocolo_treinamento_id: protocoloId,
                    semana_atual: 1,
                    status: 'ativo'
                })
                .select();
                
            if (planoError) {
                console.error('❌ Erro ao criar plano do usuário:', planoError);
                return;
            }
            
            console.log('✅ Plano do usuário criado:', planoUsuario);
        }
        
        // 4. Criar planejamento semanal para hoje
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const ano = hoje.getFullYear();
        const semana = getWeekNumber(hoje);
        
        console.log(`📅 Criando planejamento para: dia=${diaSemana}, ano=${ano}, semana=${semana}`);
        
        const { data: planejamento, error: planError } = await supabase
            .from('planejamento_semanal')
            .upsert({
                usuario_id: userId,
                ano: ano,
                semana: semana,
                dia_semana: diaSemana,
                tipo_atividade: 'Treino',
                numero_treino: 1,
                concluido: false
            })
            .select();
            
        if (planError) {
            console.error('❌ Erro ao criar planejamento:', planError);
            return;
        }
        
        console.log('✅ Planejamento criado:', planejamento);
        
        console.log('🎉 Dados de teste configurados com sucesso!');
        
    } catch (error) {
        console.error('💥 Erro geral:', error);
    }
}

// Função auxiliar para calcular número da semana
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Executar se chamado diretamente
if (typeof window !== 'undefined') {
    window.configurarDadosTeste = configurarDadosTeste;
    console.log('💡 Execute: window.configurarDadosTeste() no console para configurar dados de teste');
}

export { configurarDadosTeste };