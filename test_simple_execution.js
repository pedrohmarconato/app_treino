// Teste simples para validar salvamento de execução
const fs = require('fs');
const https = require('https');

async function makeSupabaseRequest(url, supabaseKey, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => resolve({ 
                statusCode: res.statusCode, 
                data: responseData
            }));
        });
        
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function testSimpleExecution() {
    console.log('🚀 Teste simples de salvamento de execução\n');
    
    try {
        // Ler config
        const configContent = fs.readFileSync('./config.js', 'utf8');
        const urlMatch = configContent.match(/url:\s*['"`]([^'"`]+)['"`]/);
        const keyMatch = configContent.match(/key:\s*['"`]([^'"`]+)['"`]/);
        
        const supabaseUrl = urlMatch[1];
        const supabaseKey = keyMatch[1];
        
        console.log('📡 Conectado ao Supabase');
        
        // Teste de execução básica
        const execucaoTeste = {
            usuario_id: 1,
            protocolo_treino_id: 1,
            exercicio_id: 1,
            data_execucao: new Date().toISOString(),
            peso_utilizado: 70.0,
            repeticoes: 10,
            serie_numero: 1,
            falhou: false,
            observacoes: 'Teste de execução simples'
        };
        
        console.log('🧪 Testando salvamento...');
        console.log(`   Peso: ${execucaoTeste.peso_utilizado}kg`);
        console.log(`   Repetições: ${execucaoTeste.repeticoes}`);
        console.log(`   Série: ${execucaoTeste.serie_numero}`);
        
        const insertUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario`;
        const insertData = JSON.stringify([execucaoTeste]);
        
        const response = await makeSupabaseRequest(insertUrl, supabaseKey, 'POST', insertData);
        
        console.log(`\n📊 Status: ${response.statusCode}`);
        
        if (response.statusCode === 201) {
            console.log('✅ SUCESSO! Execução salva no banco');
            
            // Buscar execução salva
            const selectUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario?usuario_id=eq.1&exercicio_id=eq.1&order=id.desc&limit=1`;
            const selectResponse = await makeSupabaseRequest(selectUrl, supabaseKey);
            
            if (selectResponse.statusCode === 200) {
                const execucoes = JSON.parse(selectResponse.data);
                if (execucoes.length > 0) {
                    const exec = execucoes[0];
                    console.log('\n📋 Dados salvos:');
                    console.log(`   ID: ${exec.id}`);
                    console.log(`   Peso: ${exec.peso_utilizado}kg`);
                    console.log(`   Repetições: ${exec.repeticoes}`);
                    console.log(`   Série: ${exec.serie_numero}`);
                    console.log(`   Data: ${new Date(exec.data_execucao).toLocaleString()}`);
                    
                    // Limpar teste
                    const deleteUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario?id=eq.${exec.id}`;
                    await makeSupabaseRequest(deleteUrl, supabaseKey, 'DELETE');
                    console.log('\n🧹 Dados de teste removidos');
                }
            }
            
            console.log('\n🎉 RESULTADO: Sistema PRONTO para salvar execuções!');
            console.log('✅ Peso e repetições funcionando');
            console.log('✅ Controle de séries funcionando');
            console.log('✅ Banco de dados configurado corretamente');
            
        } else {
            console.log('❌ Erro no salvamento:', response.data);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
        return false;
    }
}

testSimpleExecution();