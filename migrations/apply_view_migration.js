// Script para aplicar a migration da view vw_treino_completo
import { supabase } from '../services/supabaseService.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function aplicarMigrationView() {
    try {
        console.log('🚀 Iniciando migration da view vw_treino_completo...');
        
        // Ler o arquivo SQL da view simplificada
        const sqlPath = join(__dirname, 'create_view_simples.sql');
        const sqlContent = readFileSync(sqlPath, 'utf-8');
        
        // Executar a migration
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: sqlContent
        });
        
        if (error) {
            // Se o RPC não existir, tentar executar em partes
            console.log('⚠️ RPC exec_sql não disponível, executando manualmente...');
            
            // Dividir o SQL em comandos individuais
            const commands = sqlContent
                .split(';')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
            
            for (const command of commands) {
                if (command.trim()) {
                    console.log('Executando comando:', command.substring(0, 100) + '...');
                    
                    const { error: cmdError } = await supabase
                        .from('__migration_temp')
                        .select('1')
                        .limit(1);
                    
                    // Como não podemos executar SQL direto, vamos usar uma abordagem alternativa
                    console.log('⚠️ Não é possível executar SQL direto via cliente JavaScript');
                    console.log('📝 Execute manualmente no painel do Supabase:');
                    console.log('\n' + sqlContent);
                    break;
                }
            }
        } else {
            console.log('✅ View criada com sucesso!');
        }
        
        // Testar se a view foi criada
        console.log('🧪 Testando a view...');
        const { data: testData, error: testError } = await supabase
            .from('vw_treino_completo')
            .select('count')
            .limit(1);
            
        if (testError) {
            console.log('❌ Erro ao testar view:', testError.message);
            console.log('\n📋 SQL para executar manualmente no Supabase:');
            console.log('═'.repeat(80));
            console.log(sqlContent);
            console.log('═'.repeat(80));
        } else {
            console.log('✅ View funcionando corretamente!');
        }
        
    } catch (error) {
        console.error('❌ Erro na migration:', error);
        
        // Mostrar o SQL para execução manual
        const sqlPath = join(__dirname, 'create_view_treino_completo.sql');
        const sqlContent = readFileSync(sqlPath, 'utf-8');
        
        console.log('\n📋 Execute este SQL manualmente no painel do Supabase:');
        console.log('═'.repeat(80));
        console.log(sqlContent);
        console.log('═'.repeat(80));
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    aplicarMigrationView();
}

export { aplicarMigrationView };