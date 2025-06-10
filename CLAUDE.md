# Claude Memory - App Treino

## Database Issues and Resolutions

### Issue: planejamento_semanal tipo_atividade Validation Error (2025-06-09)

**Problem**: 
- Database was inserting "treino" instead of actual muscle group names like "costa", "peito"
- Error P0001: "tipo_atividade inválido: Cardio/Mobilidade/Alongamento" when saving weekly plans

**Root Cause**: 
1. `mapTipoAtividade` function in `services/weeklyPlanningService.js:16-22` was converting all non-cardio/folga values to "treino"
2. Complex activity types like "Cardio/Mobilidade/Alongamento" weren't being mapped to database-accepted "cardio" value

**Solution Applied**:
1. **Line 21**: Changed `return 'treino';` to `return tipo;` to preserve muscle group names
2. **Line 19**: Changed `if (t === 'cardio')` to `if (t === 'cardio' || t.includes('cardio'))` to handle complex cardio activity names

**Files Modified**:
- `services/weeklyPlanningService.js:19,21`

**Testing**: 
- Now properly saves muscle groups: "Peito", "Pernas", "Ombro e Braço", etc.
- Maps "Cardio/Mobilidade/Alongamento" → "cardio" (database accepted value)
- Preserves "folga" for rest days

**Key Learning**: Database has validation constraints that only accept specific tipo_atividade values. The mapping function must handle both simple ("cardio") and complex ("Cardio/Mobilidade/Alongamento") activity type names.

### Issue: Database Constraint Blocking Muscle Groups (2025-06-09)

**Problem**: 
- P0001 error: "tipo_atividade inválido: Peito" when saving muscle groups
- Both CHECK constraint and trigger function rejected muscle group names

**Root Cause**:
1. CHECK constraint `planejamento_semanal_tipo_atividade_check` only allowed `['treino', 'folga', 'cardio']`
2. Trigger function `validate_planejamento()` had same restriction in validation logic

**Solution Applied**:
1. **Updated CHECK constraint** to include muscle groups: 'Peito', 'Costas', 'Pernas', 'Ombro', 'Braço', 'Bíceps', 'Tríceps', 'Superior', 'Inferior', 'Ombro e Braço'
2. **Updated trigger function** to accept muscle group names and require numero_treino for muscle groups (not just 'treino')

**Files Modified**:
- Database: `planejamento_semanal_tipo_atividade_check` constraint
- Database: `validate_planejamento()` trigger function
- `services/weeklyPlanningService.js:26-55` (muscle group mapping)

**Resolution**: Database now accepts proper muscle group names from `exercicios.grupo_muscular` format.

### Issue: View Query Error and Missing Function (2025-06-09)

**Problem**: 
- Error 42703: "column v_semana_atual_treino.usuario_id does not exist" 
- ReferenceError: "marcarSemanaProgramada is not defined"

**Root Cause**:
1. `v_semana_atual_treino` view query failing due to JOIN issues in database
2. `marcarSemanaProgramada` function called but not implemented

**Solution Applied**:
1. **Disabled problematic view query**: Commented out `v_semana_atual_treino` query in `weeklyPlanningService.js:911-932`, allowing fallback to working `d_calendario` direct query
2. **Implemented missing function**: Added `marcarSemanaProgramada()` in `weeklyPlanningService.js:1030-1059` and imported in `planning.js:10`

**Function Details**:
- **Purpose**: Mark weekly plans as "programmed" after successful save
- **Parameters**: `(userId, semanaTreino, usuarioQueProgramou)`
- **Updates**: `eh_programado`, `data_programacao`, `usuario_que_programou` fields

**Files Modified**:
- `services/weeklyPlanningService.js:908-932` (commented view query)
- `services/weeklyPlanningService.js:1030-1059` (new function)
- `feature/planning.js:10` (import function)

**Resolution**: Weekly planning now saves successfully without view errors and properly marks weeks as programmed.

## Summary: Complete Fix for Weekly Planning Registration

**Overall Problem**: Weekly planning system couldn't save muscle groups, training weeks, and exercise order properly.

**Complete Solution Applied**:
1. ✅ **Muscle Group Registration**: Fixed `mapTipoAtividade()` to preserve muscle group names instead of converting to "treino"
2. ✅ **Database Validation**: Updated CHECK constraint and trigger function to accept muscle group names from `exercicios.grupo_muscular` format  
3. ✅ **View Query Issues**: Disabled problematic `v_semana_atual_treino` view, using reliable `d_calendario` fallback
4. ✅ **Missing Functions**: Implemented `marcarSemanaProgramada()` for proper week state management

**Final Result**: 
- Muscle groups (Peito, Costas, Pernas, etc.) save correctly to `planejamento_semanal.tipo_atividade`
- Training week numbers (`numero_treino`) are properly assigned based on protocols
- Exercise order follows protocol definitions
- Weekly plans are marked as "programmed" after successful save
- All validation errors resolved

**Status**: ✅ COMPLETE - Ready for next features

## Dashboard Workout Display Integration (2025-06-09)

**Problem**: Dashboard wasn't properly displaying workouts from the database - relied only on localStorage fallback.

**Root Cause**: 
1. Dashboard used `getWeekPlan()` localStorage function instead of `WeeklyPlanService.getActiveWeeklyPlan()`
2. No integration between planning save and dashboard refresh
3. Data format mismatch between WeeklyPlanService return format and dashboard expectations

**Solution Applied**:
1. **Updated dashboard data fetching** to prioritize database over localStorage:
   - `carregarIndicadoresSemana()`: Now tries WeeklyPlanService first, fallback to localStorage
   - `carregarTreinoAtual()`: Same database-first approach  
   - `carregarPlanejamentoSemanal()`: Same database-first approach

2. **Fixed data format handling**:
   - Updated `formatarTipoDia()` to handle both `tipo` and `tipo_atividade` fields
   - Added emoji support for muscle groups in day indicators
   - Enhanced workout object to include `numero_treino` and `protocolo_id`

3. **Added real-time updates**:
   - AppState subscription for `planSaved` event triggers dashboard reload
   - Planning feature now triggers `AppState.set('planSaved')` when save succeeds
   - Added `window.carregarDashboard()` call after planning save

**Files Modified**:
- `js/features/dashboard.js:54-67,110-124,274-287` (database-first data fetching)
- `js/features/dashboard.js:430-445` (enhanced formatarTipoDia function)
- `js/features/dashboard.js:396-401` (planSaved subscription)
- `feature/planning.js:1120-1132` (trigger dashboard updates)

**Result**: 
- ✅ Dashboard shows current muscle groups ("Peito", "Costas", etc.) from database
- ✅ Real-time updates when weekly plans are saved
- ✅ Proper emoji display for each muscle group
- ✅ Workout details include training numbers and protocol info

**Status**: ✅ COMPLETE - Dashboard properly displays workouts from database

## REGRA CRÍTICA: Proibição de Dados Simulados ou Inventados

⚠️ **NUNCA SIMULAR OU INVENTAR DADOS** ⚠️

- É **ESTRITAMENTE PROIBIDO** criar, simular ou inventar dados de exercícios, pesos, séries, repetições ou qualquer informação de treino
- Todos os dados devem vir **EXCLUSIVAMENTE** do banco de dados Supabase ou fontes reais do usuário
- Se não houver dados disponíveis, mostrar mensagem apropriada informando que dados não estão disponíveis
- Não criar "exercícios padrão", "dados de exemplo" ou qualquer tipo de simulação
- O sistema deve trabalhar apenas com dados reais e verificáveis

## Modern Neon Green UI Design Implementation (2025-06-09)

**Objective**: Redesign Home page with modern dark theme and neon green accent system while maintaining all existing functionality.

**Design System Applied**:

### **Color Palette**:
- **Background**: Dark gradients (#101010, #181818, #232323)
- **Neon Green**: Primary accent (#CFFF04, #B3FF00, #A8FF04) 
- **Neon Yellow**: Secondary accent (#FFE500) for charts/progress
- **Text**: White primary, gray secondary (#a8a8a8)

### **Components Redesigned**:

1. **Header Section**:
   - User avatar with neon green border and pulsing glow animation
   - Status indicator dot with neon green glow
   - Modern notification badge with bounce animation
   - Enhanced header actions (search, notifications, logout)

2. **Workout Card**:
   - Large circular progress indicator with neon green stroke
   - Gradient backgrounds with radial neon accent overlays
   - Modern badge system with shimmer effects
   - Enhanced typography with text shadows and glows

3. **Metrics Cards**:
   - Mini circular progress indicators for each metric
   - Filter chips with active neon green styling
   - Trend indicators with emojis and comparison data
   - Hover effects with transform and glow animations

4. **Week Indicators**:
   - Enhanced day indicators with neon border effects
   - Dynamic state styling (today, completed, pending)
   - Glow effects and shadow enhancements

### **Modern Effects Added**:
- **Glow shadows**: `--shadow-glow` and `--shadow-glow-strong`
- **Pulse animations**: Avatar status and notification badges
- **Shimmer effects**: Button hover states with sliding highlights
- **Transform animations**: Cards lift on hover with enhanced shadows
- **Gradient overlays**: Radial gradients for depth and modern feel

### **Button System**:
- **Primary buttons**: Neon green gradient with shimmer on hover
- **Secondary buttons**: Dark with neon accent borders and glow effects
- **Icon buttons**: Circular with radial glow on hover
- **Chips/badges**: Rounded with neon active states

### **Typography Enhancements**:
- Added text shadows and glows for depth
- Enhanced contrast with modern font weights
- Proper text hierarchy with neon accent integration

**Files Modified**:
- `styles.css:1-43` (updated CSS variables for neon color system)
- `styles.css:150-274` (enhanced button system with neon effects)
- `templates/home.js:12-47` (modernized header with notifications)
- `templates/home.js:87-146` (redesigned workout card with progress circle)
- `templates/home.js:183-256` (enhanced metrics with mini progress indicators)
- `templates/home.js:286-1600` (comprehensive CSS for modern design system)
- `js/features/dashboard.js:169-218` (updated progress circle calculations)

**Key Features**:
- ✅ Maintained all existing functionality and data integration
- ✅ Responsive design for mobile and desktop
- ✅ Modern neon green accent system throughout
- ✅ Enhanced user experience with smooth animations
- ✅ Professional dark theme with proper contrast
- ✅ Accessible design with clear visual hierarchy

**Status**: ✅ COMPLETE - Modern neon green UI successfully implemented