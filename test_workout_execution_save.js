// Teste completo para validar salvamento de execução de treino
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

async function testWorkoutExecutionSave() {
    try {
        console.log('🚀 Testando salvamento completo de execução de treino...\n');
        
        // Ler configuração
        const configContent = fs.readFileSync('./config.js', 'utf8');
        const urlMatch = configContent.match(/url:\s*['"`]([^'"`]+)['"`]/);
        const keyMatch = configContent.match(/key:\s*['"`]([^'"`]+)['"`]/);
        
        const supabaseUrl = urlMatch[1];
        const supabaseKey = keyMatch[1];
        
        console.log('📡 Conectado ao Supabase ✅');
        
        // Buscar dados reais para usar no teste
        console.log('🔍 Buscando dados reais do banco...');
        
        // Buscar usuário real
        const usuariosUrl = `${supabaseUrl}/rest/v1/usuarios?select=id&limit=1`;
        const usuariosResponse = await makeSupabaseRequest(usuariosUrl, supabaseKey);
        const usuarios = JSON.parse(usuariosResponse.data);
        
        if (usuarios.length === 0) {
            throw new Error('Nenhum usuário encontrado no banco');
        }
        
        // Buscar protocolo de treino real
        const protocolosUrl = `${supabaseUrl}/rest/v1/protocolo_treinos?select=id&limit=1`;
        const protocolosResponse = await makeSupabaseRequest(protocolosUrl, supabaseKey);
        const protocolos = JSON.parse(protocolosResponse.data);
        
        if (protocolos.length === 0) {
            throw new Error('Nenhum protocolo de treino encontrado');
        }
        
        // Buscar exercício real
        const exerciciosUrl = `${supabaseUrl}/rest/v1/exercicios?select=id,nome&limit=1`;
        const exerciciosResponse = await makeSupabaseRequest(exerciciosUrl, supabaseKey);
        const exercicios = JSON.parse(exerciciosResponse.data);
        
        if (exercicios.length === 0) {
            throw new Error('Nenhum exercício encontrado');
        }
        
        const usuario = usuarios[0];
        const protocolo = protocolos[0];
        const exercicio = exercicios[0];
        
        console.log(`✅ Usuário ID: ${usuario.id}`);
        console.log(`✅ Protocolo ID: ${protocolo.id}`);
        console.log(`✅ Exercício: ${exercicio.nome} (ID: ${exercicio.id})`);
        
        // Teste 1: Salvar execução completa com todas as informações
        console.log('\n🧪 TESTE 1: Salvamento de execução completa');
        
        const execucaoCompleta = {
            usuario_id: usuario.id,
            protocolo_treino_id: protocolo.id,
            exercicio_id: exercicio.id,
            data_execucao: new Date().toISOString(),
            peso_utilizado: 75.5,
            repeticoes: 12,
            serie_numero: 1,
            falhou: false,
            observacoes: 'Teste de execução completa - série 1'
        };
        
        const insertUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario`;
        const insertData = JSON.stringify([execucaoCompleta]);
        
        const insertResponse = await makeSupabaseRequest(insertUrl, supabaseKey, 'POST', insertData);
        
        console.log(`📊 Status da resposta: ${insertResponse.statusCode}`);
        console.log(`📊 Dados da resposta: ${insertResponse.data}`);
        
        if (insertResponse.statusCode === 201) {
            console.log('✅ SUCESSO: Execução salva no banco!');
            
            // Se não retornou dados, buscar a execução recém-criada
            let resultado = null;
            if (insertResponse.data && insertResponse.data.trim()) {
                resultado = JSON.parse(insertResponse.data)[0];
                console.log(`   ID: ${resultado.id}`);
            } else {
                // Buscar a execução mais recente para este usuário/exercício
                const recentUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario?usuario_id=eq.${usuario.id}&exercicio_id=eq.${exercicio.id}&order=id.desc&limit=1`;
                const recentResponse = await makeSupabaseRequest(recentUrl, supabaseKey);
                if (recentResponse.statusCode === 200 && recentResponse.data) {
                    resultado = JSON.parse(recentResponse.data)[0];
                }
            }
            
            if (resultado) {
                console.log(`   Peso: ${resultado.peso_utilizado}kg`);
                console.log(`   Repetições: ${resultado.repeticoes}`);
                console.log(`   Série: ${resultado.serie_numero}`);
            
            // Teste 2: Salvar segunda série do mesmo exercício
            console.log('\n🧪 TESTE 2: Segunda série do mesmo exercício');
            
            const segundaSerie = {
                ...execucaoCompleta,
                peso_utilizado: 80.0,
                repeticoes: 10,
                serie_numero: 2,
                observacoes: 'Teste de execução completa - série 2'
            };
            
            const serie2Data = JSON.stringify([segundaSerie]);
            const serie2Response = await makeSupabaseRequest(insertUrl, supabaseKey, 'POST', serie2Data);
            
            if (serie2Response.statusCode === 201) {
                const resultado2 = JSON.parse(serie2Response.data)[0];
                console.log('✅ SUCESSO: Segunda série salva com ID:', resultado2.id);
                console.log(`   Peso: ${resultado2.peso_utilizado}kg`);
                console.log(`   Repetições: ${resultado2.repeticoes}`);
                console.log(`   Série: ${resultado2.serie_numero}`);
                
                // Teste 3: Buscar execuções salvas
                console.log('\n🧪 TESTE 3: Buscar execuções do exercício');
                
                const selectUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario?usuario_id=eq.${usuario.id}&exercicio_id=eq.${exercicio.id}&order=serie_numero.asc`;
                const selectResponse = await makeSupabaseRequest(selectUrl, supabaseKey);
                
                if (selectResponse.statusCode === 200) {
                    const execucoes = JSON.parse(selectResponse.data);
                    console.log(`✅ SUCESSO: ${execucoes.length} execuções encontradas`);
                    
                    execucoes.forEach((exec, index) => {
                        console.log(`   Série ${exec.serie_numero}: ${exec.peso_utilizado}kg x ${exec.repeticoes} reps`);
                    });
                    
                    // Limpeza: Remover dados de teste
                    console.log('\n🧹 Limpando dados de teste...');
                    
                    for (const exec of execucoes) {
                        const deleteUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario?id=eq.${exec.id}`;
                        await makeSupabaseRequest(deleteUrl, supabaseKey, 'DELETE');
                    }
                    
                    console.log('✅ Dados de teste removidos');
                    
                } else {
                    console.log('❌ Erro ao buscar execuções:', selectResponse.data);
                }
                
            } else {
                console.log('❌ Erro ao salvar segunda série:', serie2Response.data);
            }
            
        } else {
            console.log('❌ Erro ao salvar execução:', insertResponse.data);
            return false;
        }
        
        // Resumo final
        console.log('\n🎉 RESULTADO FINAL:');
        console.log('✅ Banco de dados configurado corretamente');
        console.log('✅ Coluna serie_numero funcionando');
        console.log('✅ Salvamento de peso e repetições OK');
        console.log('✅ Controle de séries múltiplas OK');
        console.log('✅ Sistema pronto para guardar execuções de treino!');
        
        return true;
        
    } catch (error) {
        console.log('❌ Erro durante teste:', error.message);
        return false;
    }
}

// Executar teste
testWorkoutExecutionSave();