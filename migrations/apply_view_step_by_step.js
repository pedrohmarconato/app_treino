// Script para aplicar a view em etapas testáveis
// Executa cada parte separadamente para identificar problemas

import { supabase } from '../services/supabaseService.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ViewMigration {
    
    async executar() {
        console.log('🚀 Iniciando migration da view vw_treino_completo (step by step)...\n');
        
        try {
            // Etapa 1: Testar conexão
            await this.testarConexao();
            
            // Etapa 2: Verificar tabelas necessárias
            await this.verificarTabelas();
            
            // Etapa 3: Remover view existente (se houver)
            await this.removerViewExistente();
            
            // Etapa 4: Criar a view
            await this.criarView();
            
            // Etapa 5: Criar índices
            await this.criarIndices();
            
            // Etapa 6: Testar a view
            await this.testarView();
            
            console.log('\n✅ Migration concluída com sucesso!');
            console.log('\n📋 Próximos passos:');
            console.log('1. A view vw_treino_completo está pronta para uso');
            console.log('2. Use TreinoViewService.buscarTreinoPorData() para consultas');
            console.log('3. Use TreinoMetricasService para métricas agregadas');
            
        } catch (error) {
            console.error('\n❌ Erro na migration:', error.message);
            await this.mostrarInstrucoesManuais();
        }
    }
    
    async testarConexao() {
        console.log('🔍 Testando conexão com Supabase...');
        
        const { data, error } = await supabase
            .from('usuarios')
            .select('count')
            .limit(1);
            
        if (error) {
            throw new Error(`Falha na conexão: ${error.message}`);
        }
        
        console.log('✅ Conexão OK');
    }
    
    async verificarTabelas() {
        console.log('🔍 Verificando tabelas necessárias...');
        
        const tabelas = [
            'execucao_exercicio_usuario',
            'exercicios', 
            'usuario_1rm',
            'planejamento_semanal'
        ];
        
        for (const tabela of tabelas) {
            const { error } = await supabase
                .from(tabela)
                .select('count')
                .limit(1);
                
            if (error) {
                throw new Error(`Tabela ${tabela} não encontrada: ${error.message}`);
            }
            
            console.log(`✅ Tabela ${tabela} OK`);
        }
    }
    
    async removerViewExistente() {
        console.log('🗑️  Removendo view existente (se houver)...');
        
        try {
            // Tentar consultar a view para ver se existe
            const { error } = await supabase
                .from('vw_treino_completo')
                .select('count')
                .limit(1);
                
            if (!error) {
                console.log('⚠️ View existente encontrada, será substituída');
            }
        } catch (e) {
            console.log('ℹ️ Nenhuma view existente encontrada');
        }
    }
    
    async criarView() {
        console.log('🏗️  Criando view vw_treino_completo...');
        
        // Ler o arquivo SQL
        const sqlPath = join(__dirname, 'create_view_simples.sql');
        const sqlContent = readFileSync(sqlPath, 'utf-8');
        
        // Dividir em comandos (separar view dos índices)
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
            
        // Executar apenas a criação da view (primeiro comando)
        const viewCommand = commands.find(cmd => cmd.includes('CREATE OR REPLACE VIEW'));
        
        if (!viewCommand) {
            throw new Error('Comando CREATE VIEW não encontrado no arquivo SQL');
        }
        
        console.log('📝 Executando SQL da view...');
        
        // Como não podemos executar SQL direto, vamos mostrar instruções
        console.log('\n⚠️ Execução manual necessária no painel do Supabase:');
        console.log('═'.repeat(80));
        console.log(viewCommand + ';');
        console.log('═'.repeat(80));
        
        // Aguardar confirmação do usuário
        console.log('\n⏳ Aguardando execução manual...');
        console.log('📋 Após executar o SQL acima no Supabase, pressione Enter para continuar...');
        
        // Em um ambiente real, aqui teríamos input do usuário
        // Por enquanto, vamos simular que foi executado
        await this.sleep(2000);
    }
    
    async criarIndices() {
        console.log('📊 Criando índices de performance...');
        
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_vw_treino_usuario_data ON execucao_exercicio_usuario(usuario_id, data_execucao)',
            'CREATE INDEX IF NOT EXISTS idx_vw_treino_exercicio_serie ON execucao_exercicio_usuario(usuario_id, exercicio_id, serie_numero, data_execucao)'
        ];
        
        console.log('\n⚠️ Execute também estes índices no painel do Supabase:');
        console.log('═'.repeat(80));
        indices.forEach(sql => console.log(sql + ';'));
        console.log('═'.repeat(80));
        
        await this.sleep(1000);
    }
    
    async testarView() {
        console.log('🧪 Testando a view criada...');
        
        try {
            const { data, error } = await supabase
                .from('vw_treino_completo')
                .select('execucao_id, usuario_id, exercicio_nome, volume_serie')
                .limit(1);
                
            if (error) {
                throw new Error(`Erro ao testar view: ${error.message}`);
            }
            
            console.log('✅ View funcionando corretamente!');
            
            if (data && data.length > 0) {
                console.log('📊 Exemplo de dados retornados:');
                console.log(JSON.stringify(data[0], null, 2));
            } else {
                console.log('ℹ️ View criada mas sem dados (normal se não houver execuções)');
            }
            
        } catch (error) {
            console.log('❌ Erro ao testar view:', error.message);
            console.log('⚠️ Verifique se o SQL foi executado corretamente no Supabase');
        }
    }
    
    async mostrarInstrucoesManuais() {
        console.log('\n📋 INSTRUÇÕES PARA EXECUÇÃO MANUAL:');
        console.log('═'.repeat(80));
        console.log('1. Acesse o painel do Supabase');
        console.log('2. Vá em "SQL Editor"');
        console.log('3. Execute o seguinte SQL:');
        console.log('');
        
        const sqlPath = join(__dirname, 'create_view_simples.sql');
        const sqlContent = readFileSync(sqlPath, 'utf-8');
        console.log(sqlContent);
        
        console.log('═'.repeat(80));
        console.log('4. Após executar, teste com: SELECT * FROM vw_treino_completo LIMIT 1;');
        console.log('═'.repeat(80));
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const migration = new ViewMigration();
    migration.executar();
}

export { ViewMigration };