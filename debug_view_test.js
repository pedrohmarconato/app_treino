// Quick script to test v_planejamento_completo view
import { supabase } from './services/supabaseService.js';

async function testView() {
    try {
        console.log('🔍 Testing v_planejamento_completo view...');
        
        // Test if view exists and what fields it returns
        const { data, error } = await supabase
            .from('v_planejamento_completo')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ View test failed:', error);
            return false;
        }
        
        console.log('✅ View exists! Sample record:');
        console.log(data?.[0] || 'No data');
        
        // Test specific fields we expect
        if (data && data.length > 0) {
            const fields = Object.keys(data[0]);
            console.log('📋 Available fields:', fields);
            
            // Check for important fields
            const expectedFields = ['usuario_id', 'ano', 'semana', 'dia_semana', 'tipo_atividade', 'numero_treino', 'concluido'];
            const missingFields = expectedFields.filter(field => !fields.includes(field));
            
            if (missingFields.length > 0) {
                console.warn('⚠️ Missing expected fields:', missingFields);
            } else {
                console.log('✅ All expected fields present');
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('💥 Error testing view:', error);
        return false;
    }
}

// Also test regular planejamento_semanal table
async function testTable() {
    try {
        console.log('🔍 Testing planejamento_semanal table...');
        
        const { data, error } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .limit(5);
            
        if (error) {
            console.error('❌ Table test failed:', error);
            return false;
        }
        
        console.log('✅ Table exists! Records found:', data?.length || 0);
        
        if (data && data.length > 0) {
            console.log('📋 Sample record:', data[0]);
        }
        
        return true;
        
    } catch (error) {
        console.error('💥 Error testing table:', error);
        return false;
    }
}

// Export for browser console
window.testView = testView;
window.testTable = testTable;

console.log('💡 Run testView() or testTable() in console to test database access');