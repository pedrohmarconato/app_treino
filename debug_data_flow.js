// Comprehensive debug script for Supabase data flow issues
import { supabase } from './services/supabaseService.js';
import WeeklyPlanService from './services/weeklyPlanningService.js';

async function debugDataFlow() {
    console.log('🔍 COMPREHENSIVE DATA FLOW DEBUG STARTING...');
    console.log('═'.repeat(60));
    
    const issues = [];
    
    try {
        // 1. Test if v_planejamento_completo view exists
        console.log('1️⃣ Testing v_planejamento_completo view...');
        
        const { data: viewData, error: viewError } = await supabase
            .from('v_planejamento_completo')
            .select('*')
            .limit(1);
            
        if (viewError) {
            console.error('❌ View does not exist or has error:', viewError);
            issues.push('CRITICAL: v_planejamento_completo view missing or broken');
            
            // Check if it's just a missing view
            if (viewError.code === 'PGRST116' || viewError.message.includes('relation "v_planejamento_completo" does not exist')) {
                console.log('📋 View does not exist. Checking base table...');
                
                const { data: tableData, error: tableError } = await supabase
                    .from('planejamento_semanal')
                    .select('*')
                    .limit(1);
                    
                if (tableError) {
                    console.error('❌ Base table planejamento_semanal also has issues:', tableError);
                    issues.push('CRITICAL: planejamento_semanal table missing or broken');
                } else {
                    console.log('✅ Base table exists with fields:', Object.keys(tableData?.[0] || {}));
                    issues.push('WARNING: v_planejamento_completo view missing, falling back to base table');
                }
            }
        } else {
            console.log('✅ View exists! Fields available:', Object.keys(viewData?.[0] || {}));
        }
        
        // 2. Test user data existence
        console.log('\n2️⃣ Testing user data...');
        
        const { data: users, error: userError } = await supabase
            .from('usuarios')
            .select('id, nome')
            .limit(5);
            
        if (userError || !users || users.length === 0) {
            console.error('❌ No users found:', userError);
            issues.push('CRITICAL: No users in database');
            return issues;
        }
        
        const testUserId = users[0].id;
        console.log(`✅ Found ${users.length} users. Testing with user: ${users[0].nome} (ID: ${testUserId})`);
        
        // 3. Test current week calculation
        console.log('\n3️⃣ Testing week calculation...');
        
        const { ano, semana } = WeeklyPlanService.getCurrentWeek();
        console.log(`📅 Current week: ${ano}-W${semana}`);
        
        // 4. Test if user has any planning data
        console.log('\n4️⃣ Testing user planning data...');
        
        const { data: userPlanning, error: planError } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', testUserId)
            .eq('ano', ano)
            .eq('semana', semana);
            
        if (planError) {
            console.error('❌ Error fetching user planning:', planError);
            issues.push('ERROR: Cannot fetch user planning data');
        } else if (!userPlanning || userPlanning.length === 0) {
            console.warn('⚠️ No planning data for current week');
            issues.push('WARNING: No planning data for current week');
            
            // Check if user has ANY planning data
            const { data: anyPlanning, error: anyError } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('usuario_id', testUserId)
                .limit(5);
                
            if (anyError) {
                console.error('❌ Error checking any planning data:', anyError);
                issues.push('ERROR: Cannot check any planning data');
            } else if (!anyPlanning || anyPlanning.length === 0) {
                console.warn('⚠️ User has NO planning data at all');
                issues.push('WARNING: User has no planning data whatsoever');
            } else {
                console.log(`📋 User has ${anyPlanning.length} planning records, but none for current week`);
                console.log('Sample planning data:', anyPlanning[0]);
            }
        } else {
            console.log(`✅ Found ${userPlanning.length} planning records for current week`);
            console.log('Planning data:', userPlanning);
        }
        
        // 5. Test field mapping issues
        console.log('\n5️⃣ Testing field mapping...');
        
        if (userPlanning && userPlanning.length > 0) {
            const sampleRecord = userPlanning[0];
            console.log('Sample record fields:', Object.keys(sampleRecord));
            
            // Check for field inconsistencies
            const fields = ['tipo_atividade', 'categoria', 'tipo'];
            fields.forEach(field => {
                if (sampleRecord.hasOwnProperty(field)) {
                    console.log(`✅ Field ${field}:`, sampleRecord[field]);
                } else {
                    console.warn(`⚠️ Missing field: ${field}`);
                }
            });
            
            // Check if tipo_atividade has the expected values
            const tipoAtividade = sampleRecord.tipo_atividade;
            if (!tipoAtividade) {
                issues.push('WARNING: tipo_atividade is null/empty');
            } else {
                console.log(`📋 tipo_atividade value: "${tipoAtividade}"`);
                
                // Check for common values
                const commonValues = ['folga', 'cardio', 'peito', 'costas', 'pernas', 'ombro', 'braço'];
                if (!commonValues.some(val => tipoAtividade.toLowerCase().includes(val.toLowerCase()))) {
                    issues.push(`WARNING: Unexpected tipo_atividade value: "${tipoAtividade}"`);
                }
            }
        }
        
        // 6. Test WeeklyPlanService.getPlan() directly
        console.log('\n6️⃣ Testing WeeklyPlanService.getPlan()...');
        
        const planResult = await WeeklyPlanService.getPlan(testUserId, false);
        
        if (!planResult) {
            console.warn('⚠️ WeeklyPlanService.getPlan() returned null');
            issues.push('WARNING: WeeklyPlanService.getPlan() returns null');
        } else {
            console.log('✅ WeeklyPlanService.getPlan() returned data');
            console.log('Plan structure:', Object.keys(planResult));
            
            // Check each day
            for (let day = 0; day < 7; day++) {
                const dayPlan = planResult[day];
                if (dayPlan) {
                    console.log(`Day ${day}:`, {
                        tipo: dayPlan.tipo,
                        categoria: dayPlan.categoria,
                        tipo_atividade: dayPlan.tipo_atividade,
                        numero_treino: dayPlan.numero_treino
                    });
                } else {
                    console.log(`Day ${day}: No data`);
                }
            }
        }
        
        // 7. Test dashboard data loading
        console.log('\n7️⃣ Testing dashboard data flow...');
        
        // Simulate what dashboard.js does
        const currentUser = { id: testUserId, nome: users[0].nome };
        console.log('Simulating dashboard load for user:', currentUser);
        
        // Test the exact query the dashboard makes
        try {
            const dashboardPlan = await WeeklyPlanService.getPlan(currentUser.id);
            console.log('Dashboard plan result:', dashboardPlan);
            
            if (!dashboardPlan) {
                issues.push('ERROR: Dashboard cannot load plan data');
            }
        } catch (error) {
            console.error('❌ Dashboard plan loading error:', error);
            issues.push(`ERROR: Dashboard plan loading failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('💥 CRITICAL ERROR during debug:', error);
        issues.push(`CRITICAL: Debug script failed: ${error.message}`);
    }
    
    // 8. Summary
    console.log('\n📋 SUMMARY OF ISSUES FOUND:');
    console.log('═'.repeat(60));
    
    if (issues.length === 0) {
        console.log('✅ No issues found! Data flow appears to be working correctly.');
    } else {
        issues.forEach((issue, index) => {
            const icon = issue.startsWith('CRITICAL') ? '🚨' : 
                        issue.startsWith('ERROR') ? '❌' : '⚠️';
            console.log(`${icon} ${index + 1}. ${issue}`);
        });
    }
    
    return issues;
}

// Test if view needs to be created
async function checkIfViewNeedsCreation() {
    console.log('\n🔧 Checking if view needs to be created...');
    
    try {
        // Try to access the view
        const { data, error } = await supabase
            .from('v_planejamento_completo')
            .select('*')
            .limit(1);
            
        if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
            console.log('📋 View does not exist. Here\'s what should be created:');
            console.log(`
CREATE VIEW v_planejamento_completo AS
SELECT 
    ps.*,
    upt.protocolo_treinamento_id,
    pt.nome as protocolo_nome
FROM planejamento_semanal ps
LEFT JOIN usuario_plano_treino upt ON ps.usuario_id = upt.usuario_id AND upt.status = 'ativo'
LEFT JOIN protocolos_treinamento pt ON upt.protocolo_treinamento_id = pt.id;
            `);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error checking view:', error);
        return false;
    }
}

// Export functions for browser console
window.debugDataFlow = debugDataFlow;
window.checkIfViewNeedsCreation = checkIfViewNeedsCreation;

console.log('💡 Run debugDataFlow() in console to start comprehensive debugging');
console.log('💡 Run checkIfViewNeedsCreation() to check if view needs to be created');