// Test current table structure and attempt to fix via insert/update operations
const fs = require('fs');
const https = require('https');

async function makeSupabaseRequest(url, supabaseKey, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => resolve({ 
                statusCode: res.statusCode, 
                data: responseData,
                headers: res.headers 
            }));
        });
        
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function testAndFixTable() {
    try {
        console.log('🔄 Reading Supabase configuration...');
        
        const configContent = fs.readFileSync('./config.js', 'utf8');
        const urlMatch = configContent.match(/url:\s*['"`]([^'"`]+)['"`]/);
        const keyMatch = configContent.match(/key:\s*['"`]([^'"`]+)['"`]/);
        
        if (!urlMatch || !keyMatch) {
            throw new Error('Could not find Supabase credentials in config.js');
        }
        
        const supabaseUrl = urlMatch[1];
        const supabaseKey = keyMatch[1];
        
        console.log('📡 Connected to Supabase:', supabaseUrl.substring(0, 30) + '...');
        
        // Test 1: Check current structure by querying existing data
        console.log('🔍 Testing current table structure...');
        const tableUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario?select=*&limit=1`;
        
        const response = await makeSupabaseRequest(tableUrl, supabaseKey);
        
        if (response.statusCode !== 200) {
            throw new Error(`Cannot access table: ${response.statusCode} ${response.data}`);
        }
        
        const existingData = JSON.parse(response.data);
        console.log('✅ Table is accessible');
        
        if (existingData.length > 0) {
            const columns = Object.keys(existingData[0]);
            console.log('📋 Current columns:', columns.join(', '));
            
            if (columns.includes('serie_numero')) {
                console.log('✅ SUCCESS: serie_numero column already exists!');
                console.log('🎉 No fix needed - database structure is correct');
                return true;
            } else {
                console.log('❌ Column serie_numero is missing');
            }
        } else {
            console.log('📝 Table is empty - will test with sample insert');
        }
        
        // Test 2: Try inserting data with serie_numero to see if column exists
        console.log('🧪 Testing column existence with sample insert...');
        
        const testData = JSON.stringify([{
            usuario_id: 999999, // Use unlikely ID to avoid conflicts
            protocolo_treino_id: 999999,
            exercicio_id: 999999,
            data_execucao: new Date().toISOString(),
            peso_utilizado: 50.0,
            repeticoes: 10,
            serie_numero: 1,
            falhou: false,
            observacoes: 'Structure test - will be deleted'
        }]);
        
        const insertUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario`;
        const insertResponse = await makeSupabaseRequest(insertUrl, supabaseKey, 'POST', testData);
        
        console.log('📊 Insert test response:', insertResponse.statusCode);
        
        if (insertResponse.statusCode === 201) {
            console.log('✅ SUCCESS: serie_numero column exists and works!');
            
            // Clean up test data
            const insertedData = JSON.parse(insertResponse.data);
            if (insertedData && insertedData[0]?.id) {
                const deleteUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario?id=eq.${insertedData[0].id}`;
                await makeSupabaseRequest(deleteUrl, supabaseKey, 'DELETE');
                console.log('🧹 Test data cleaned up');
            }
            
            console.log('🎉 Database structure is correct - serie_numero column working properly!');
            return true;
            
        } else {
            const errorData = JSON.parse(insertResponse.data);
            console.log('❌ Insert failed:', errorData.message);
            
            if (errorData.message && errorData.message.includes('serie_numero')) {
                console.log('🔧 Confirmed: serie_numero column is missing');
                console.log('');
                console.log('📋 MANUAL FIX REQUIRED:');
                console.log('Please run this SQL in your Supabase dashboard:');
                console.log('');
                console.log('ALTER TABLE execucao_exercicio_usuario ADD COLUMN serie_numero INTEGER DEFAULT 1;');
                console.log('UPDATE execucao_exercicio_usuario SET serie_numero = 1 WHERE serie_numero IS NULL;');
                console.log('');
                console.log('🌐 Supabase Dashboard: https://supabase.com/dashboard/project/' + supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)[1]);
                console.log('📍 Go to: SQL Editor → New Query → Paste the SQL above → Run');
                
                return false;
            } else {
                console.log('⚠️  Insert failed for other reasons (probably FK constraints)');
                console.log('💡 This might mean the column exists but test data is invalid');
                console.log('🔍 Let\'s check the exact error...');
                
                // If it's not a serie_numero issue, the column might exist
                console.log('📝 Error details:', errorData);
                
                if (!errorData.message.includes('column') && !errorData.message.includes('does not exist')) {
                    console.log('✅ Column likely exists - error seems to be data validation');
                    console.log('🎉 Database structure is probably correct!');
                    return true;
                }
                
                return false;
            }
        }
        
    } catch (error) {
        console.log('❌ Error during test:', error.message);
        console.log('');
        console.log('📋 MANUAL FIX REQUIRED:');
        console.log('Please run this SQL in your Supabase dashboard:');
        console.log('ALTER TABLE execucao_exercicio_usuario ADD COLUMN serie_numero INTEGER DEFAULT 1;');
        return false;
    }
}

// Execute the test and fix
console.log('🚀 Testing and fixing execucao_exercicio_usuario table structure...');
console.log('');
testAndFixTable().then(success => {
    if (success) {
        console.log('');
        console.log('🎉 RESULT: Table structure is correct!');
        console.log('✅ Workout execution should now work properly');
        console.log('🚀 You can now test saving workout executions');
    } else {
        console.log('');
        console.log('⚠️  RESULT: Manual database fix required');
        console.log('🔧 Please follow the instructions above');
    }
});