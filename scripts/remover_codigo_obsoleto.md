# Script para Remover Código Obsoleto

## 1. Remover arquivo TreinoExecutadoService
```bash
rm services/treinoExecutadoService.js
```

## 2. Remover referências no código

### Arquivos que importam TreinoExecutadoService:
- `services/treinoFinalizacaoService.js` - linha 4: remover import
- Buscar por: `import.*TreinoExecutadoService` ou `from.*treinoExecutadoService`

### Remover referências às views:
Buscar e remover/comentar código que usa:
- `v_comparativo_usuarios`
- `v_estatisticas_usuarios` 
- `v_resumo_grupo_muscular`
- `v_status_semanas_usuario`

### Arquivos conhecidos com essas referências:
- `components/progressIndicators.js` - fetchDadosIndicadores() usa v_comparativo_usuarios
- `components/progressIndicators.js` - fetchMetricasUsuario() usa v_estatisticas_usuarios
- `components/progressIndicators.js` - fetchResumoGrupoMuscular() usa v_resumo_grupo_muscular
- `services/weeklyPlanningService.js` - needsPlanning() usa v_status_semanas_usuario

### Remover referências a colunas removidas:
Buscar e remover código que acessa:
- `usuario_que_programou`
- `eh_programado`
- `data_programacao`
- `sessao_treino_id`
- `rm_estimado`
- `tempo_execucao`
- `distancia_percorrida`
- `velocidade_media`
- `calorias_estimadas`
- `nome_dia_semana`
- `eh_feriado`
- `nome_feriado`
- `eh_fim_semana`
- `tipo_atividade` (em exercicios)
- `tempo_descanso_padrao`
- `data_prevista_fim`
- `dias_concluidos`

## 3. Comandos úteis para busca

```bash
# Buscar todas as referências a uma coluna
grep -r "usuario_que_programou" . --include="*.js"

# Buscar imports do TreinoExecutadoService
grep -r "TreinoExecutadoService" . --include="*.js"

# Buscar referências às views
grep -r "v_comparativo_usuarios\|v_estatisticas_usuarios\|v_resumo_grupo_muscular\|v_status_semanas_usuario" . --include="*.js"
```

## 4. Verificar após limpeza

Após remover o código, verificar:
1. Executar o app e testar funcionalidades principais
2. Verificar console por erros
3. Testar planejamento semanal
4. Testar execução de treinos
5. Testar indicadores de progresso