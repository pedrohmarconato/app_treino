// Fix script for Supabase data flow issues
import { supabase } from './services/supabaseService.js';

async function fixDataFlowIssues() {
    console.log('🔧 FIXING DATA FLOW ISSUES...');
    console.log('═'.repeat(50));
    
    const fixes = [];
    
    try {
        // 1. Check if view exists and create fallback
        console.log('1️⃣ Checking v_planejamento_completo view...');
        
        const { data: viewTest, error: viewError } = await supabase
            .from('v_planejamento_completo')
            .select('*')
            .limit(1);
            
        if (viewError && (viewError.code === 'PGRST116' || viewError.message.includes('does not exist'))) {
            console.log('❌ View does not exist. Creating alternative...');
            
            // Since we can't create views from the client, provide SQL
            console.log('📋 REQUIRED SQL TO RUN IN DATABASE:');
            console.log(`
CREATE OR REPLACE VIEW v_planejamento_completo AS
SELECT 
    ps.*,
    upt.protocolo_treinamento_id,
    pt.nome as protocolo_nome,
    pt.dias_por_semana,
    pt.total_treinos
FROM planejamento_semanal ps
LEFT JOIN usuario_plano_treino upt 
    ON ps.usuario_id = upt.usuario_id 
    AND upt.status = 'ativo'
LEFT JOIN protocolos_treinamento pt 
    ON upt.protocolo_treinamento_id = pt.id;
            `);
            fixes.push('MANUAL: Create v_planejamento_completo view in database');
        } else {
            console.log('✅ View exists and is accessible');
        }
        
        // 2. Check and fix field mapping in WeeklyPlanService
        console.log('\n2️⃣ Analyzing field mapping issues...');
        
        // Test with a known user
        const { data: users } = await supabase
            .from('usuarios')
            .select('id, nome')
            .limit(1);
            
        if (users && users.length > 0) {
            const testUserId = users[0].id;
            
            // Check current data structure
            const { data: planData } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('usuario_id', testUserId)
                .limit(1);
                
            if (planData && planData.length > 0) {
                const sample = planData[0];
                console.log('Sample planning record fields:', Object.keys(sample));
                
                // Check if tipo_atividade exists and has valid values
                if (!sample.hasOwnProperty('tipo_atividade')) {
                    console.error('❌ tipo_atividade field missing from planejamento_semanal');
                    fixes.push('CRITICAL: Add tipo_atividade field to planejamento_semanal table');
                } else if (!sample.tipo_atividade || sample.tipo_atividade.trim() === '') {
                    console.warn('⚠️ tipo_atividade field is empty');
                    fixes.push('WARNING: tipo_atividade values are empty - check data insertion');
                } else {
                    console.log('✅ tipo_atividade field exists with value:', sample.tipo_atividade);
                }
                
                // Check for common field mapping issues
                const problematicValues = ['undefined', 'null', '', null, undefined];
                if (problematicValues.includes(sample.tipo_atividade)) {
                    console.warn('⚠️ tipo_atividade has problematic value:', sample.tipo_atividade);
                    fixes.push('WARNING: Clean up tipo_atividade values in database');
                }
            }
        }
        
        // 3. Check error handling in WeeklyPlanService
        console.log('\n3️⃣ Checking error handling...');
        
        // Test with non-existent user
        const fakeUserId = 99999;
        const resultFakeUser = await testWeeklyPlanService(fakeUserId);
        
        if (resultFakeUser !== null) {
            console.warn('⚠️ Service should return null for non-existent user but returned:', resultFakeUser);
            fixes.push('WARNING: Improve error handling for non-existent users');
        } else {
            console.log('✅ Service correctly returns null for non-existent user');
        }
        
        // 4. Create a patched version of WeeklyPlanService.getPlan
        console.log('\n4️⃣ Creating improved getPlan function...');
        
        const improvedGetPlan = createImprovedGetPlan();
        fixes.push('CODE: Use improved getPlan function (see console output)');
        
        // 5. Test dashboard compatibility
        console.log('\n5️⃣ Testing dashboard compatibility...');
        
        if (users && users.length > 0) {
            const testUserId = users[0].id;
            const planForDashboard = await testDashboardCompatibility(testUserId);
            
            if (planForDashboard) {
                console.log('✅ Dashboard compatibility test passed');
            } else {
                console.warn('⚠️ Dashboard compatibility issues detected');
                fixes.push('WARNING: Dashboard may not display data correctly');
            }
        }
        
    } catch (error) {
        console.error('💥 Error during fix process:', error);
        fixes.push(`ERROR: Fix process failed: ${error.message}`);
    }
    
    // Summary
    console.log('\n📋 FIXES NEEDED:');
    console.log('═'.repeat(50));
    
    if (fixes.length === 0) {
        console.log('✅ No fixes needed! System appears to be working correctly.');
    } else {
        fixes.forEach((fix, index) => {
            const icon = fix.startsWith('CRITICAL') ? '🚨' : 
                        fix.startsWith('ERROR') ? '❌' : 
                        fix.startsWith('WARNING') ? '⚠️' : 
                        fix.startsWith('MANUAL') ? '🔧' : '💡';
            console.log(`${icon} ${index + 1}. ${fix}`);
        });
    }
    
    return fixes;
}

// Test WeeklyPlanService with fallback logic
async function testWeeklyPlanService(userId) {
    try {
        // Try with view first
        let { data, error } = await supabase
            .from('v_planejamento_completo')
            .select('*')
            .eq('usuario_id', userId)
            .limit(1);
            
        if (error) {
            console.log('View failed, trying base table...');
            
            // Fallback to base table
            ({ data, error } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('usuario_id', userId)
                .limit(1));
        }
        
        if (error || !data || data.length === 0) {
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error('Error in testWeeklyPlanService:', error);
        return null;
    }
}

// Create improved getPlan function
function createImprovedGetPlan() {
    console.log('📝 Improved getPlan function:');
    
    const improvedCode = `
// Improved WeeklyPlanService.getPlan with better error handling
static async getPlan(userId, useCache = true) {
    console.log('[WeeklyPlanService.getPlan] 🔍 INICIANDO busca do plano para usuário:', userId);
    const { ano, semana } = this.getCurrentWeek();
    console.log('[WeeklyPlanService.getPlan] 📅 Buscando plano para semana:', { ano, semana });
    
    // Validate inputs
    if (!userId || isNaN(userId)) {
        console.error('[WeeklyPlanService.getPlan] ❌ Invalid userId:', userId);
        return null;
    }
    
    // 1. Try cache first (if enabled)
    if (useCache) {
        const cached = this.getFromLocal(userId);
        if (cached) {
            console.log('[WeeklyPlanService.getPlan] ✅ Using cached data');
            return cached;
        }
    }
    
    try {
        // 2. Try view first, fallback to base table
        let data, error;
        
        console.log('[WeeklyPlanService.getPlan] 🔍 Trying v_planejamento_completo view...');
        ({ data, error } = await supabase
            .from('v_planejamento_completo')
            .select('*')
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana', semana)
            .order('dia_semana', { ascending: true }));
        
        // If view fails, try base table
        if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
            console.warn('[WeeklyPlanService.getPlan] ⚠️ View not available, using base table');
            
            ({ data, error } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .order('dia_semana', { ascending: true }));
        }
        
        if (error) {
            console.error('[WeeklyPlanService.getPlan] ❌ Database error:', error);
            return this.getFromLocal(userId); // Fallback to cache
        }
        
        if (!data || data.length === 0) {
            console.log('[WeeklyPlanService.getPlan] ❌ No data found for current week');
            return null;
        }
        
        // 3. Convert to app format with better field handling
        const plan = {};
        console.log('[WeeklyPlanService.getPlan] 🔍 DADOS DO BANCO:', data);
        
        data.forEach(dia => {
            const jsDay = this.dbToDay(dia.dia_semana);
            
            // Better field mapping with fallbacks
            const tipo_atividade = dia.tipo_atividade || dia.tipo || 'folga';
            
            const planoDia = {
                tipo: tipo_atividade,
                categoria: tipo_atividade, 
                tipo_atividade: tipo_atividade, // Keep original field
                numero_treino: dia.numero_treino,
                concluido: dia.concluido || false,
                protocolo_id: dia.protocolo_treinamento_id || dia.protocolo_id
            };
            
            console.log(\`[WeeklyPlanService.getPlan] 📊 CONVERTENDO - Dia \${jsDay} (DB: \${dia.dia_semana}):\`, {
                original: dia,
                convertido: planoDia
            });
            
            plan[jsDay] = planoDia;
        });
        
        // 4. Validate plan before returning
        const isValidPlan = Object.keys(plan).length > 0 && 
                           Object.values(plan).some(day => day.tipo && day.tipo !== 'undefined');
        
        if (!isValidPlan) {
            console.warn('[WeeklyPlanService.getPlan] ⚠️ Plan appears invalid, returning null');
            return null;
        }
        
        // 5. Save to cache
        this.saveToLocal(userId, plan);
        
        return plan;
        
    } catch (error) {
        console.error('[WeeklyPlanService.getPlan] ❌ Unexpected error:', error);
        return this.getFromLocal(userId); // Fallback to cache
    }
}`;
    
    console.log(improvedCode);
    return improvedCode;
}

// Test dashboard compatibility
async function testDashboardCompatibility(userId) {
    try {
        console.log('Testing dashboard data flow...');
        
        // Simulate what dashboard expects
        const weekPlan = await testWeeklyPlanService(userId);
        
        if (!weekPlan) {
            console.warn('❌ No plan data available for dashboard');
            return false;
        }
        
        // Test field access patterns from dashboard
        const sampleDay = weekPlan[0];
        if (sampleDay) {
            const tipoTreino = sampleDay.tipo_atividade || sampleDay.tipo || '';
            
            if (!tipoTreino || tipoTreino === 'undefined' || tipoTreino === 'null') {
                console.warn('❌ Dashboard will not display correctly - missing tipo data');
                return false;
            }
            
            console.log('✅ Dashboard compatibility test passed');
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Dashboard compatibility test error:', error);
        return false;
    }
}

// Export for browser console
window.fixDataFlowIssues = fixDataFlowIssues;
window.testWeeklyPlanService = testWeeklyPlanService;

console.log('💡 Run fixDataFlowIssues() in console to start fixing data flow issues');