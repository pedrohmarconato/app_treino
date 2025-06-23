# TABELAS REAIS DO BANCO DE DADOS

Baseado na análise dos arquivos do projeto, aqui estão as tabelas REAIS que existem no banco:

## TABELAS PRINCIPAIS

### 1. **usuarios**
- Armazena dados dos usuários
- Campos: id, nome, email, data_nascimento, status

### 2. **exercicios**
- Catálogo de exercícios disponíveis
- Campos: id, nome, grupo_muscular, equipamento
- Grupos musculares: 'Peito', 'Costas', 'Pernas', 'Ombro e Braço'

### 3. **protocolos_treinamento**
- Protocolos/programas de treino
- Campos: id, nome, descricao, total_semanas, dias_por_semana

### 4. **protocolo_treinos**
- Relação entre protocolos e exercícios (detalhamento dos treinos)
- Campos: id, protocolo_id, exercicio_id, semana_referencia, tipo_atividade, series, repeticoes_alvo, percentual_1rm_base, percentual_1rm_min, percentual_1rm_max, tempo_descanso, ordem_exercicio

### 5. **usuario_plano_treino**
- Planos ativos dos usuários
- Campos: id, usuario_id, protocolo_treinamento_id, semana_atual, status, data_inicio

### 6. **planejamento_semanal**
- Planejamento semanal de cada usuário
- Campos: id, usuario_id, ano, semana, dia_semana, tipo_atividade, concluido, data_conclusao, pre_workout, post_workout, observacoes_finalizacao, semana_treino, protocolo_treinamento_id

### 7. **execucao_exercicio_usuario** ⭐ TABELA DE EXECUÇÃO
- **ESTA É A TABELA CORRETA PARA EXECUÇÃO DE EXERCÍCIOS**
- **NÃO É "treino_execucao"**
- Campos: id, usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou, observacoes

### 8. **usuario_1rm**
- Dados de 1RM (uma repetição máxima) dos usuários
- Campos: id, usuario_id, exercicio_id, peso_teste, repeticoes_teste, rm_calculado, data_teste, status

### 9. **d_calendario**
- Calendário de treinos/semanas
- Campos: id, data_completa, semana_treino, eh_semana_atual, eh_semana_ativa, ano, semana_ano

## OBSERVAÇÕES IMPORTANTES

### ❌ TABELAS QUE NÃO EXISTEM:
- `treino_execucao` - ESTA TABELA NÃO EXISTE
- `treino_executado` - Mencionada no código mas desativada

### ✅ TABELA CORRETA PARA EXECUÇÃO:
- `execucao_exercicio_usuario` - Esta é a tabela real onde são salvos os exercícios executados

### 🔍 VIEWS MENCIONADAS NO CÓDIGO:
- `v_status_semanas_usuario` - Status das semanas de treino
- `v_resumo_dia_semana` - Resumo por dia da semana
- `v_treino_planejado` - Treinos planejados
- `v_treino_executado` - Treinos executados
- `v_resumo_treino_dia` - Resumo unificado

## ESTRUTURA TÍPICA DE UM TREINO

1. **Planejamento**: `planejamento_semanal` define QUE treino fazer
2. **Protocolo**: `protocolo_treinos` define COMO fazer (séries, repetições, peso)
3. **Execução**: `execucao_exercicio_usuario` registra o que FOI feito
4. **1RM**: `usuario_1rm` armazena os máximos calculados

## CAMPOS DE DATA/TEMPO

- `data_execucao` na `execucao_exercicio_usuario` - timestamp completo
- `data_treino` no `planejamento_semanal` - formato YYYY-MM-DD
- `dia_semana` - 1=Segunda, 7=Domingo (formato DB)

## VALIDAÇÃO

Esta estrutura foi confirmada através da análise de:
- `services/weeklyPlanningService.js`
- `services/treinoFinalizacaoService.js`
- `services/workoutProtocolService.js`
- `migrations/add_pre_post_workout_constraints.sql`
- `sql_test_ids.sql`