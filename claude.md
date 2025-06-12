# Claude Memory - App Treino

> **📋 DOCUMENTAÇÃO COMPLETA**: Para visão detalhada do projeto, consulte `/docs/DOCUMENTACAO_COMPLETA.md`
> 
> Este arquivo mantém o histórico técnico e decisões de implementação para referência durante desenvolvimento.

---

## 🎯 Status Atual do Projeto (v5.6b)

### **Sistema Completo e Funcional** ✅
- **Autenticação**: Login com seleção de usuários (Pedro/Japa)
- **Dashboard**: Métricas reais, progresso visual, cronograma semanal
- **Planejamento**: Sistema de protocolos por grupos musculares
- **Execução**: Treinos com sugestões inteligentes de peso (1RM)
- **PWA**: Aplicativo instalável com funcionamento offline

### **Arquitetura Estável**
- **Frontend**: JavaScript vanilla + templates modulares
- **Backend**: Supabase (PostgreSQL)
- **Design**: Dark theme + neon green (#CFFF04)
- **Deploy**: Vercel ready com PWA completa

---

## ⚠️ MIGRAÇÃO CRÍTICA PENDENTE

**IMPORTANTE**: Execute `database/migrate_remove_numero_treino.sql` no Supabase ANTES de usar!

**Problema**: Código refatorado usa `tipo_atividade` mas BD ainda tem `numero_treino`
**Erro**: `column protocolo_treinos.tipo_atividade does not exist`

---

## 🔥 Últimas Correções Implementadas (v5.6b)

### **Workout Execution Rendering Fixes**
**Problema**: Template integration conflicts impediam exibição de exercícios
**Solução**: 
```javascript
// Sistema de renderização unificado com múltiplos fallbacks
renderizarComSeguranca() {
    // 1. Template oficial
    // 2. Container detection (4 estratégias)
    // 3. Emergency fallback system
    // 4. Debug tools integrados
}
```

### **Debug Tools Disponíveis**
```javascript
window.debugWorkoutTemplate()    // Verificar template
window.debugWorkoutExercicios()  // Inspecionar dados
window.forceRenderWorkout()      // Re-renderizar
```

---

## 🧮 Sistema de Peso Inteligente

### **Cálculo 1RM Implementado**
```javascript
// Fórmula Brzycki
oneRM = peso / (1.0278 - (0.0278 × reps))

// Progressão 12 semanas: 70% → 95%
peso_sugerido = 1RM × (percentual_semana / 100)
```

### **Exemplo Real**
```
Supino 1RM: 100kg
Semana 1: 70kg (70%)
Semana 6: 81kg (81%)  
Semana 12: 95kg (95%)
```

---

## 🗄️ Database Schema

### **Tabelas Principais**
- `usuarios` - Perfis de usuário
- `exercicios` - Catálogo com grupos musculares
- `protocolo_treinos` - Protocolos por usuário
- `planejamento_semanal` - Planning semanal
- `execucao_exercicio_usuario` - Histórico execuções
- `d_calendario` - Controle semanal

### **Joins Críticos**
```sql
-- Usar exercicios.grupo_muscular via JOIN
protocolo_treinos 
INNER JOIN exercicios ON protocolo_treinos.exercicio_id = exercicios.id
WHERE exercicios.grupo_muscular = 'Peito'
```

---

## 🎨 Design System

### **Color Palette**
```css
--bg-primary: #101010      /* Dark base */
--accent-primary: #CFFF04  /* Neon green */
--accent-yellow: #FFE500   /* Highlights */
--text-primary: #ffffff    /* Main text */
```

### **Components Pattern**
- **Progress Circles**: SVG com neon stroke
- **Cards**: Hierarchy com shadows + borders
- **Buttons**: Primary (neon) + Secondary (dark)
- **Animations**: Hover glow + transforms

---

## 🚀 Deploy PWA

### **Arquivos Implementados**
- ✅ `manifest.json` - PWA config
- ✅ `sw.js` - Service Worker com cache
- ✅ `vercel.json` - Deploy config
- ✅ Meta tags PWA completas

### **Deploy Vercel**
```bash
git push origin main  # Auto-deploy via GitHub
# OU
vercel --prod  # Via CLI
```

### **Instalação iOS**
1. Safari → `https://app.vercel.app`
2. Compartilhar → "Adicionar à Tela Inicial"
3. Funciona como app nativo! 📱

---

## ⚡ Performance Optimizations

### **Service Worker Cache**
- **Cache-First**: Assets estáticos (CSS, JS)
- **Network-First**: Dados dinâmicos  
- **Network-Only**: APIs Supabase

### **Template System**
- **Lazy Loading**: Login carregado dinamicamente
- **Modular Structure**: Cada tela em arquivo próprio
- **Embedded CSS**: Reduz HTTP requests

---

## 🐛 Issues Críticos Resolvidos

### **1. Muscle Group Registration** ✅
```javascript
// ANTES: Convertia tudo para "treino"
return 'treino';

// DEPOIS: Preserva grupos musculares
return tipo; // "Peito", "Costas", etc.
```

### **2. Database Validation** ✅
```sql
-- CHECK constraint atualizado para aceitar grupos
CHECK (tipo_atividade IN ('treino', 'folga', 'cardio', 'Peito', 'Costas', ...))
```

### **3. Smart Completion Logic** ✅
```javascript
// Conclusão baseada em execuções HOJE + SEMANA ATUAL
WHERE d_calendario.eh_semana_atual = true 
AND data_completa = TODAY
AND usuario_id = current_user
```

### **4. Template Integration** ✅
- Container detection com 4 estratégias
- Emergency fallback system
- Debug tools integrados

---

## 🔧 Comandos de Desenvolvimento

### **Lint/TypeCheck**
```bash
npm run lint      # Se disponível
npm run typecheck # Se disponível
```

### **Debug em Produção**
```javascript
// Console do browser
debugWorkoutTemplate()    // Verificar estrutura
debugWorkoutExercicios()  // Dados de exercício
forceRenderWorkout()      // Re-renderizar
```

---

## 📋 Checklist de Deploy

- [x] PWA completa implementada
- [x] Service Worker com cache
- [x] Manifest.json configurado
- [x] Meta tags PWA
- [x] Sistema de design unificado
- [x] Debug tools implementados
- [x] Template system robusto
- [ ] **Executar migração SQL crítica**
- [ ] Deploy no Vercel
- [ ] Testar instalação iOS/Android

---

## 🎯 Próximos Passos

1. **CRÍTICO**: Executar migração `migrate_remove_numero_treino.sql`
2. **Deploy**: Push para produção via Vercel
3. **Teste**: Validar PWA em dispositivos móveis
4. **Otimização**: Cache offline avançado
5. **Analytics**: Implementar métricas de uso

---

## 🚨 REGRA CRÍTICA

> **NUNCA SIMULAR OU INVENTAR DADOS**
> 
> - Todos os dados devem vir **EXCLUSIVAMENTE** do Supabase
> - Não criar "exercícios padrão" ou "dados de exemplo"
> - Sistema trabalha apenas com dados reais e verificáveis

---

## 📁 Arquivos Principais

### **Core Logic**
- `feature/workoutExecution.js` - Execução de treinos
- `feature/planning.js` - Planejamento semanal
- `feature/dashboard.js` - Dashboard/métricas
- `services/weeklyPlanningService.js` - Planning backend
- `services/weightCalculatorService.js` - Cálculos 1RM

### **Templates**
- `templates/home.js` - Dashboard UI
- `templates/workout.js` - Execução UI
- `templates/login.js` - Autenticação UI

### **Config**
- `config.js` - Credenciais Supabase
- `manifest.json` - PWA config
- `sw.js` - Service Worker
- `vercel.json` - Deploy config

---

**Status**: ✅ **SISTEMA COMPLETO** - Pronto para produção após migração SQL

*Última atualização: v5.6b (Janeiro 2025)*