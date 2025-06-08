// COMPREHENSIVE FIX FOR SUPABASE DATA FLOW ISSUES
// This script identifies and provides solutions for all data flow problems

console.log('🔧 COMPREHENSIVE SUPABASE DATA FLOW FIX');
console.log('═'.repeat(60));

// ISSUE SUMMARY AND FIXES:

console.log(`
📋 IDENTIFIED ISSUES AND SOLUTIONS:

1️⃣ VIEW MISSING: v_planejamento_completo may not exist
   🔧 SOLUTION: Create the view or implement fallback logic

2️⃣ FIELD MAPPING: Inconsistent use of tipo vs tipo_atividade vs categoria
   🔧 SOLUTION: Standardize field mapping in WeeklyPlanService

3️⃣ ERROR HANDLING: Silent failures when view doesn't exist
   🔧 SOLUTION: Add proper error handling and fallbacks

4️⃣ DATA VALIDATION: No validation of returned data structure
   🔧 SOLUTION: Add data validation before using in dashboard
`);

// CRITICAL SQL TO RUN IN DATABASE:
console.log(`
🚨 CRITICAL: RUN THIS SQL IN YOUR SUPABASE DATABASE:

-- Create or replace the missing view
CREATE OR REPLACE VIEW v_planejamento_completo AS
SELECT 
    ps.*,
    upt.protocolo_treinamento_id,
    pt.nome as protocolo_nome,
    pt.dias_por_semana,
    pt.total_treinos,
    pt.status as protocolo_status
FROM planejamento_semanal ps
LEFT JOIN usuario_plano_treino upt 
    ON ps.usuario_id = upt.usuario_id 
    AND upt.status = 'ativo'
LEFT JOIN protocolos_treinamento pt 
    ON upt.protocolo_treinamento_id = pt.id
ORDER BY ps.usuario_id, ps.ano DESC, ps.semana DESC, ps.dia_semana;

-- Ensure tipo_atividade field has proper values
UPDATE planejamento_semanal 
SET tipo_atividade = 'folga' 
WHERE tipo_atividade IS NULL OR tipo_atividade = '' OR tipo_atividade = 'undefined';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_planejamento_semanal_lookup 
ON planejamento_semanal(usuario_id, ano, semana);
`);

// FIXED WeeklyPlanService.getPlan() method:
console.log(`
💻 FIXED WeeklyPlanService.getPlan() METHOD:

// Replace the existing getPlan method with this improved version:
static async getPlan(userId, useCache = true) {
    console.log('[WeeklyPlanService.getPlan] 🔍 INICIANDO busca do plano para usuário:', userId);
    
    // Validate input
    if (!userId || isNaN(userId)) {
        console.error('[WeeklyPlanService.getPlan] ❌ Invalid userId:', userId);
        return null;
    }
    
    const { ano, semana } = this.getCurrentWeek();
    console.log('[WeeklyPlanService.getPlan] 📅 Buscando plano para semana:', { ano, semana });
    
    // 1. Try cache first (if enabled)
    if (useCache) {
        const cached = this.getFromLocal(userId);
        if (cached && this.validatePlanData(cached)) {
            console.log('[WeeklyPlanService.getPlan] ✅ Using valid cached data');
            return cached;
        }
    }
    
    try {
        let data, error;
        
        // 2. Try view first, with fallback to base table
        console.log('[WeeklyPlanService.getPlan] 🔍 Trying v_planejamento_completo view...');
        
        ({ data, error } = await supabase
            .from('v_planejamento_completo')
            .select('*')
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana', semana)
            .order('dia_semana', { ascending: true }));
        
        // Fallback to base table if view fails
        if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
            console.warn('[WeeklyPlanService.getPlan] ⚠️ View not available, using base table');
            
            ({ data, error } = await supabase
                .from('planejamento_semanal')
                .select(\`
                    *,
                    usuario_plano_treino!inner(protocolo_treinamento_id)
                \`)
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .eq('usuario_plano_treino.status', 'ativo')
                .order('dia_semana', { ascending: true }));
        }
        
        if (error) {
            console.error('[WeeklyPlanService.getPlan] ❌ Database error:', error);
            return this.getFromLocal(userId); // Last resort: cache
        }
        
        if (!data || data.length === 0) {
            console.log('[WeeklyPlanService.getPlan] ❌ No data found for current week');
            return null;
        }
        
        // 3. Convert to app format with robust field handling
        const plan = {};
        console.log('[WeeklyPlanService.getPlan] 🔍 DADOS DO BANCO:', data);
        
        data.forEach(dia => {
            const jsDay = this.dbToDay(dia.dia_semana);
            
            // Robust field mapping with multiple fallbacks
            let tipo_atividade = dia.tipo_atividade || dia.tipo || 'folga';
            
            // Clean up problematic values
            if (!tipo_atividade || 
                tipo_atividade === 'undefined' || 
                tipo_atividade === 'null' || 
                tipo_atividade.trim() === '') {
                tipo_atividade = 'folga';
            }
            
            const planoDia = {
                tipo: tipo_atividade,
                categoria: tipo_atividade,
                tipo_atividade: tipo_atividade,
                numero_treino: dia.numero_treino,
                concluido: Boolean(dia.concluido),
                protocolo_id: dia.protocolo_treinamento_id || 
                             dia.usuario_plano_treino?.protocolo_treinamento_id
            };
            
            console.log(\`[WeeklyPlanService.getPlan] 📊 CONVERTENDO - Dia \${jsDay}:\`, {
                original: dia,
                convertido: planoDia
            });
            
            plan[jsDay] = planoDia;
        });
        
        // 4. Validate plan before returning
        if (!this.validatePlanData(plan)) {
            console.warn('[WeeklyPlanService.getPlan] ⚠️ Plan validation failed');
            return null;
        }
        
        // 5. Save to cache
        this.saveToLocal(userId, plan);
        
        return plan;
        
    } catch (error) {
        console.error('[WeeklyPlanService.getPlan] ❌ Unexpected error:', error);
        const cachedFallback = this.getFromLocal(userId);
        if (cachedFallback && this.validatePlanData(cachedFallback)) {
            return cachedFallback;
        }
        return null;
    }
}

// ADD THIS NEW VALIDATION METHOD:
static validatePlanData(plan) {
    if (!plan || typeof plan !== 'object') {
        return false;
    }
    
    // Check if plan has valid structure
    const hasValidDays = Object.keys(plan).some(day => {
        const dayData = plan[day];
        return dayData && 
               dayData.tipo && 
               dayData.tipo !== 'undefined' && 
               dayData.tipo !== 'null' &&
               dayData.tipo.trim() !== '';
    });
    
    return hasValidDays;
}
`);

// DASHBOARD FIX:
console.log(`
🖥️ DASHBOARD COMPATIBILITY FIX:

// In dashboard.js, update the carregarIndicadoresSemana function:
// Replace lines 144-147 with this more robust field handling:

if (diaPlan) {
    // More robust field handling with multiple fallbacks
    let tipoTreino = diaPlan.tipo_atividade || diaPlan.tipo || diaPlan.categoria || '';
    
    // Clean up problematic values
    if (!tipoTreino || 
        tipoTreino === 'undefined' || 
        tipoTreino === 'null' || 
        tipoTreino.trim() === '') {
        tipoTreino = 'folga';
    }
    
    // Continue with switch statement...
    switch(tipoTreino.toLowerCase()) {
        // ... rest of switch logic
    }
}
`);

// ERROR MONITORING:
console.log(`
📊 ADD ERROR MONITORING:

// Add this monitoring function to track data flow issues:
function monitorDataFlowHealth() {
    const currentUser = AppState.get('currentUser');
    if (!currentUser) return;
    
    WeeklyPlanService.getPlan(currentUser.id, false)
        .then(plan => {
            if (!plan) {
                console.warn('🚨 DATA FLOW ISSUE: No plan data available');
                showNotification('No weekly plan found. Please configure your planning.', 'warning');
            } else {
                console.log('✅ Data flow healthy:', Object.keys(plan).length, 'days configured');
            }
        })
        .catch(error => {
            console.error('🚨 DATA FLOW ERROR:', error);
            showNotification('Error loading weekly plan: ' + error.message, 'error');
        });
}

// Call this function on dashboard load
window.monitorDataFlowHealth = monitorDataFlowHealth;
`);

// TESTING COMMANDS:
console.log(`
🧪 TESTING COMMANDS:

// Run these in browser console to test fixes:

// 1. Test view existence
await supabase.from('v_planejamento_completo').select('*').limit(1);

// 2. Test base table access
await supabase.from('planejamento_semanal').select('*').limit(5);

// 3. Test WeeklyPlanService
const currentUser = AppState.get('currentUser');
const plan = await WeeklyPlanService.getPlan(currentUser.id, false);
console.log('Plan result:', plan);

// 4. Test dashboard rendering
carregarIndicadoresSemana();
`);

console.log(`
✅ IMPLEMENTATION PRIORITY:

1. 🚨 HIGH: Run the SQL commands to create/fix the view
2. 🔧 HIGH: Update WeeklyPlanService.getPlan() method  
3. 💻 MEDIUM: Update dashboard field handling
4. 📊 LOW: Add error monitoring

After implementing these fixes, the Supabase data should appear correctly on the home screen.
`);

// Export for easy access
window.showDataFlowFix = () => {
    console.log('See console output above for complete fix instructions');
};

console.log('💡 All fixes documented above. Implement in order of priority.');