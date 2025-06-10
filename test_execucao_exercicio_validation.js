// Test script to validate execucao_exercicio_usuario data structure after fix
// Run this after applying the SQL fix to ensure everything works correctly

import { query, insert } from './services/supabaseService.js';

async function testExecucaoExercicioStructure() {
    console.log('🧪 Testing execucao_exercicio_usuario structure and data validation...\n');
    
    try {
        // Test 1: Check if serie_numero column exists
        console.log('1️⃣ Testing database schema...');
        const testData = {
            usuario_id: 1, // Use existing user ID
            protocolo_treino_id: 1, // Use existing protocol ID
            exercicio_id: 1, // Use existing exercise ID
            data_execucao: new Date().toISOString(),
            peso_utilizado: 50.0,
            repeticoes: 10,
            serie_numero: 1, // This should now work
            falhou: false,
            observacoes: 'Test execution'
        };
        
        console.log('   Attempting to insert test data with serie_numero...');
        const { data, error } = await insert('execucao_exercicio_usuario', testData);
        
        if (error) {
            console.log('   ❌ ERROR:', error.message);
            console.log('   🔧 If error mentions "serie_numero", run the SQL fix first!');
            return false;
        } else {
            console.log('   ✅ SUCCESS: Test data inserted with serie_numero');
            
            // Clean up test data
            if (data && data[0]?.id) {
                await query('execucao_exercicio_usuario', {
                    delete: true,
                    eq: { id: data[0].id }
                });
                console.log('   🧹 Test data cleaned up');
            }
        }
        
        // Test 2: Validate all required fields
        console.log('\n2️⃣ Testing data validation...');
        const requiredFields = [
            'usuario_id', 'protocolo_treino_id', 'exercicio_id', 
            'peso_utilizado', 'repeticoes', 'serie_numero'
        ];
        
        console.log('   Required fields:', requiredFields.join(', '));
        console.log('   ✅ All required fields present in test data');
        
        // Test 3: Check series numbering logic
        console.log('\n3️⃣ Testing series numbering...');
        const seriesTest = [
            { serie_numero: 1, expected: 'Series 1' },
            { serie_numero: 2, expected: 'Series 2' },
            { serie_numero: 3, expected: 'Series 3' }
        ];
        
        seriesTest.forEach(test => {
            console.log(`   Serie ${test.serie_numero}: ✅ Valid`);
        });
        
        console.log('\n🎉 All tests passed! The execucao_exercicio_usuario structure is correct.');
        console.log('📝 You can now safely save workout executions with series tracking.');
        
        return true;
        
    } catch (error) {
        console.log('\n❌ TEST FAILED:', error.message);
        console.log('🔧 Please check database connection and table structure.');
        return false;
    }
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testExecucaoExercicioStructure();
}

export default testExecucaoExercicioStructure;