# Training Save Issue Analysis

## Problem Description
Training orders aren't being saved to the `planejamento_semanal` table when users configure their weekly planning.

## Current Investigation Status
Based on the conversation history and code analysis, extensive debugging has been added to track the data flow from UI to database.

## Key Areas to Investigate

### 1. Data Flow Analysis
- `planejamentoAtual` object structure and population
- `selecionarTreinoParaDia` function (line 830 in planning.js)
- `salvarPlanejamentoSemanal` function (line 968 in planning.js)
- Data transformation logic (lines 1018-1070)

### 2. Potential Issues Found

#### A. Day Parameter Handling
- Mixed usage of numeric vs string day values
- Conversion between 0-6 (JS) and 1-7 (DB) formats
- Object key structure inconsistencies

#### B. Object Key Structure
```javascript
// In selecionarTreinoParaDia (line 891)
planejamentoAtual[dia] = {
    id: treino.id,
    nome: treino.nome,
    tipo: treino.tipo,
    categoria: treino.categoria
};
```

#### C. Empty Object Validation
```javascript
// Critical check at line 1072
if (Object.keys(planejamentoParaSupabase).length === 0) {
    console.error('[salvarPlanejamentoSemanal] ❌ ERRO CRÍTICO: Nenhum dia foi planejado!');
    // ...
    return;
}
```

### 3. Code Changes Made
- Extensive logging added throughout the save process
- Table name migrated from `D_calendario` to `d_calendario` (lowercase)
- Import fixes for WeeklyPlanService compatibility
- Global function assignments for browser compatibility

### 4. Debug Functions Available
- `window.testInsercaoDireta()` - Test direct insertion
- `window.testSalvamentoSupabase()` - Test save process
- `window.verificarAcessoTabelaPlanejamento()` - Test table access
- `window.diagnosticoCompletoSalvamento()` - Complete diagnosis

## Next Steps to Debug

1. **Check Console Logs**: Look for the extensive debugging output during save process
2. **Test Direct Insertion**: Run `testInsercaoDireta()` to verify table access
3. **Verify Data Flow**: Check if `planejamentoAtual` is properly populated
4. **Validate Object Keys**: Ensure consistent day indexing (0-6 vs 1-7)

## Suspected Root Cause
The issue likely stems from:
1. **Day indexing mismatch** between UI (0-6) and database (1-7)
2. **Empty planejamentoAtual object** when save is called
3. **Import/export compatibility issues** with WeeklyPlanService

## Files Modified
- `/home/em_indo/app_treino/feature/planning.js` - Main planning logic
- `/home/em_indo/app_treino/services/weeklyPlanningService.js` - Service layer
- Extensive debugging and compatibility fixes added

## Resolution Strategy
1. Run diagnostic functions to identify the exact failure point
2. Verify day indexing consistency
3. Ensure proper data population before save attempt
4. Test with simplified data structure if needed