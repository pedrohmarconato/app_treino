# 🔍 Queries Exatas Executadas pelo JavaScript

## 1. **Busca do Grupo Muscular Planejado**
```sql
SELECT tipo_atividade
FROM planejamento_semanal
WHERE usuario_id = 1
  AND ano = 2025
  AND semana = 24  -- Calculado automaticamente
  AND dia_semana = 3  -- 3 = quarta-feira (0=domingo, 1=segunda, ...)
LIMIT 1;
```

## 2. **TreinoViewService - Busca COM Grupo Específico**
```sql
SELECT *
FROM vw_treino_completo
WHERE usuario_id = 1
  AND data_treino = '2025-06-11'
  AND grupo_muscular = 'GRUPO_ENCONTRADO_NO_PLANEJAMENTO'
ORDER BY exercicio_nome ASC, serie_numero ASC;
```

## 3. **TreinoViewService - Busca SEM Filtro de Grupo (Fallback)**
```sql
SELECT *
FROM vw_treino_completo
WHERE usuario_id = 1
  AND data_treino = '2025-06-11'
ORDER BY exercicio_nome ASC, serie_numero ASC;
```

## 4. **Busca Direta (Último Fallback)**
```sql
SELECT id, usuario_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou
FROM execucao_exercicio_usuario
WHERE usuario_id = 1
  AND data_execucao >= '2025-06-11T00:00:00'
  AND data_execucao < '2025-06-11T23:59:59';
```

## 5. **Query dos Detalhes dos Exercícios (se busca direta encontrar dados)**
```sql
SELECT id, nome, grupo_muscular
FROM exercicios
WHERE id IN (IDS_DOS_EXERCICIOS_ENCONTRADOS);
```

---

## 🎯 **Para Diagnosticar:**

### **Passo 1: Execute no Supabase SQL Editor**
Cole e execute as queries do arquivo `debug_quarta.sql` substituindo:
- `'2025-06-11'` pela data exata da quarta-feira
- `usuario_id = 1` pelo seu ID de usuário
- `semana = 24` pela semana correta

### **Passo 2: Verifique no Console do Navegador**
Abra o console e clique na quarta-feira. Procure por logs:
```
[buscarHistoricoTreino] Grupo muscular planejado: XXXXX
[buscarHistoricoTreino] Resultado da busca com grupo específico: {...}
```

### **Passo 3: Execute Query Manual**
No console do navegador:
```javascript
// Testar view diretamente
const teste = await supabase
  .from('vw_treino_completo')
  .select('*')
  .eq('usuario_id', 1)
  .eq('data_treino', '2025-06-11');
console.log('Teste view:', teste);

// Testar tabela original
const teste2 = await supabase
  .from('execucao_exercicio_usuario')
  .select('*')
  .eq('usuario_id', 1)
  .gte('data_execucao', '2025-06-11T00:00:00')
  .lt('data_execucao', '2025-06-11T23:59:59');
console.log('Teste tabela:', teste2);
```

---

## 🤔 **Possíveis Causas:**

1. **View não tem dados para quarta:** Dados não foram inseridos na view
2. **Formato de data diferente:** View usa DATE() mas dados têm TIMESTAMP
3. **Grupo muscular não bate:** Planejamento tem grupo X, execução tem grupo Y
4. **Semana/ano calculado errado:** Lógica de cálculo de semana diverge
5. **View não foi aplicada:** CREATE VIEW não foi executado

Execute as queries e me mostre os resultados!