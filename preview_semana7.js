/**
 * 🔍 PREVIEW DOS TREINOS DA SEMANA 7
 * Simula como ficarão os treinos SEM executar
 */

// Simular dados baseados no padrão das semanas anteriores
const previewSemana7 = {
    configuracao: {
        usuario: "Pedro (ID: 1)",
        semana: 7,
        protocolo: 1,
        intensidade: "82-85% do 1RM",
        tipos_excluidos: ["Peito"]
    },
    
    treinos: {
        "Pernas": {
            exercicios: [
                {
                    nome: "Agachamento",
                    series: 4,
                    repeticoes: 8,
                    peso_1rm: 120,
                    percentual: 85,
                    peso_execucao: 102.5,
                    tempo_descanso: "2-3 min"
                },
                {
                    nome: "Leg Press",
                    series: 3,
                    repeticoes: 10,
                    peso_1rm: 200,
                    percentual: 82,
                    peso_execucao: 165,
                    tempo_descanso: "2 min"
                },
                {
                    nome: "Extensão de Pernas",
                    series: 3,
                    repeticoes: 12,
                    peso_1rm: 80,
                    percentual: 80,
                    peso_execucao: 65,
                    tempo_descanso: "90 seg"
                },
                {
                    nome: "Flexão de Pernas",
                    series: 3,
                    repeticoes: 12,
                    peso_1rm: 70,
                    percentual: 80,
                    peso_execucao: 55,
                    tempo_descanso: "90 seg"
                }
            ],
            total_series: 13,
            total_repeticoes: 124,
            tempo_estimado: "45-50 min"
        },
        
        "Ombro e Braço": {
            exercicios: [
                {
                    nome: "Desenvolvimento com Halteres",
                    series: 4,
                    repeticoes: 8,
                    peso_1rm: 35,
                    percentual: 85,
                    peso_execucao: 30,
                    tempo_descanso: "2-3 min"
                },
                {
                    nome: "Elevação Lateral",
                    series: 3,
                    repeticoes: 12,
                    peso_1rm: 20,
                    percentual: 80,
                    peso_execucao: 15,
                    tempo_descanso: "90 seg"
                },
                {
                    nome: "Rosca Direta",
                    series: 3,
                    repeticoes: 10,
                    peso_1rm: 45,
                    percentual: 82,
                    peso_execucao: 37.5,
                    tempo_descanso: "90 seg"
                },
                {
                    nome: "Rosca Martelo", // CORRIGIDO: Bíceps no treino correto
                    series: 3,
                    repeticoes: 12,
                    peso_1rm: 25,
                    percentual: 80,
                    peso_execucao: 20,
                    tempo_descanso: "90 seg"
                },
                {
                    nome: "Tríceps Pulley",
                    series: 3,
                    repeticoes: 12,
                    peso_1rm: 60,
                    percentual: 80,
                    peso_execucao: 47.5,
                    tempo_descanso: "90 seg"
                }
            ],
            total_series: 16,
            total_repeticoes: 154,
            tempo_estimado: "50-55 min"
        },
        
        "Costas": {
            exercicios: [
                {
                    nome: "Puxada Frontal",
                    series: 4,
                    repeticoes: 8,
                    peso_1rm: 90,
                    percentual: 85,
                    peso_execucao: 77.5,
                    tempo_descanso: "2-3 min"
                },
                {
                    nome: "Remada Curvada",
                    series: 3,
                    repeticoes: 10,
                    peso_1rm: 80,
                    percentual: 82,
                    peso_execucao: 65,
                    tempo_descanso: "2 min"
                },
                {
                    nome: "Remada Unilateral",
                    series: 3,
                    repeticoes: 12,
                    peso_1rm: 45,
                    percentual: 80,
                    peso_execucao: 35,
                    tempo_descanso: "90 seg"
                }
                // REMOVIDO: Rosca Martelo (movido para Ombro e Braço)
            ],
            total_series: 10,
            total_repeticoes: 98,
            tempo_estimado: "35-40 min"
        }
    },
    
    execucoes_total: {
        total_exercicios: 12,
        total_series: 39, // 13 (Pernas) + 16 (Ombro/Braço) + 10 (Costas)
        total_repeticoes: 376, // 124 + 154 + 98
        total_registros_db: 39 // Uma linha por série
    },
    
    planejamento_semanal: {
        "Pernas": {
            antes: { concluido: false, data_conclusao: null },
            depois: { 
                concluido: true, 
                data_conclusao: "2025-01-15T15:30:00Z",
                post_workout: 4,
                observacoes: "Treino Pernas semana 7 - Executado via SQL"
            }
        },
        "Ombro e Braço": {
            antes: { concluido: false, data_conclusao: null },
            depois: { 
                concluido: true, 
                data_conclusao: "2025-01-15T15:30:00Z",
                post_workout: 4,
                observacoes: "Treino Ombro e Braço semana 7 - Executado via SQL"
            }
        },
        "Costas": {
            antes: { concluido: false, data_conclusao: null },
            depois: { 
                concluido: true, 
                data_conclusao: "2025-01-15T15:30:00Z",
                post_workout: 4,
                observacoes: "Treino Costas semana 7 - Executado via SQL"
            }
        }
    }
};

// Função para exibir o preview formatado
function mostrarPreviewSemana7() {
    console.log('🔍 PREVIEW: TREINOS DA SEMANA 7');
    console.log('=====================================');
    
    const { configuracao, treinos, execucoes_total, planejamento_semanal } = previewSemana7;
    
    // Configuração
    console.log('⚙️ CONFIGURAÇÃO:');
    console.log(`   Usuário: ${configuracao.usuario}`);
    console.log(`   Semana: ${configuracao.semana}`);
    console.log(`   Intensidade: ${configuracao.intensidade}`);
    console.log(`   Excluídos: ${configuracao.tipos_excluidos.join(', ')}`);
    console.log('');
    
    // Treinos detalhados
    Object.entries(treinos).forEach(([tipo, dados]) => {
        console.log(`💪 TREINO: ${tipo.toUpperCase()}`);
        console.log(`   Total: ${dados.total_series} séries | ${dados.total_repeticoes} reps | ~${dados.tempo_estimado}`);
        console.log('   Exercícios:');
        
        dados.exercicios.forEach((ex, i) => {
            console.log(`   ${i+1}. ${ex.nome}`);
            console.log(`      └─ ${ex.series}x${ex.repeticoes} @ ${ex.peso_execucao}kg (${ex.percentual}% de ${ex.peso_1rm}kg)`);
        });
        console.log('');
    });
    
    // Resumo de execuções
    console.log('📊 EXECUÇÕES QUE SERÃO CRIADAS:');
    console.log(`   ${execucoes_total.total_exercicios} exercícios diferentes`);
    console.log(`   ${execucoes_total.total_series} séries totais`);
    console.log(`   ${execucoes_total.total_repeticoes} repetições totais`);
    console.log(`   ${execucoes_total.total_registros_db} registros na execucao_exercicio_usuario`);
    console.log('');
    
    // Status do planejamento
    console.log('📅 MUDANÇAS NO PLANEJAMENTO SEMANAL:');
    Object.entries(planejamento_semanal).forEach(([tipo, status]) => {
        console.log(`   ${tipo}:`);
        console.log(`      Antes: ${status.antes.concluido ? '✅' : '⏳'} Concluído`);
        console.log(`      Depois: ${status.depois.concluido ? '✅' : '⏳'} Concluído (${status.depois.observacoes})`);
    });
}

// Exportar dados e função
if (typeof window !== 'undefined') {
    window.previewSemana7 = previewSemana7;
    window.mostrarPreviewSemana7 = mostrarPreviewSemana7;
    
    // Executar automaticamente
    setTimeout(() => {
        console.log('🎯 Preview da Semana 7 carregado!');
        console.log('💡 Execute: mostrarPreviewSemana7() para ver detalhes');
    }, 1000);
}

export { previewSemana7, mostrarPreviewSemana7 };