// Direct database fix using existing project structure
// This script reads the config and executes the SQL fix

const fs = require('fs');
const https = require('https');

async function executeDatabaseFix() {
    try {
        console.log('🔄 Reading Supabase configuration...');
        
        // Read config.js file
        const configContent = fs.readFileSync('./config.js', 'utf8');
        
        // Extract Supabase URL and key from config
        const urlMatch = configContent.match(/url:\s*['"`]([^'"`]+)['"`]/);
        const keyMatch = configContent.match(/key:\s*['"`]([^'"`]+)['"`]/);
        
        if (!urlMatch || !keyMatch) {
            throw new Error('Could not find Supabase credentials in config.js');
        }
        
        const supabaseUrl = urlMatch[1];
        const supabaseKey = keyMatch[1];
        
        console.log('📡 Supabase URL:', supabaseUrl.substring(0, 30) + '...');
        console.log('🔑 API Key found:', supabaseKey.substring(0, 20) + '...');
        
        // Construct the REST API URL for executing SQL
        const restUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
        
        // SQL to add the column
        const sqlCommand = `
            -- Add serie_numero column to execucao_exercicio_usuario table
            ALTER TABLE execucao_exercicio_usuario 
            ADD COLUMN IF NOT EXISTS serie_numero INTEGER DEFAULT 1;
            
            -- Add comment for documentation
            COMMENT ON COLUMN execucao_exercicio_usuario.serie_numero IS 'Número da série/set executado (1, 2, 3...)';
            
            -- Update existing records to have serie_numero = 1
            UPDATE execucao_exercicio_usuario 
            SET serie_numero = 1 
            WHERE serie_numero IS NULL;
            
            -- Add constraint to ensure serie_numero is positive
            ALTER TABLE execucao_exercicio_usuario 
            ADD CONSTRAINT IF NOT EXISTS execucao_exercicio_usuario_serie_numero_positive 
            CHECK (serie_numero > 0);
        `;
        
        console.log('🔧 Executing SQL to add serie_numero column...');
        console.log('📝 SQL Command:');
        console.log(sqlCommand);
        
        // Make HTTP request to Supabase REST API
        const postData = JSON.stringify({ query: sqlCommand });
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const response = await new Promise((resolve, reject) => {
            const req = https.request(restUrl, options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, data }));
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
        
        console.log('📊 Response Status:', response.statusCode);
        console.log('📊 Response Data:', response.data);
        
        if (response.statusCode === 200 || response.statusCode === 204) {
            console.log('✅ SQL executed successfully!');
            console.log('🎉 The serie_numero column has been added to execucao_exercicio_usuario');
            
            // Now test the structure
            console.log('🔍 Testing table structure...');
            await testTableStructure(supabaseUrl, supabaseKey);
            
        } else {
            console.log('❌ SQL execution failed');
            console.log('⚠️  You may need to run the SQL manually in Supabase dashboard');
            console.log('📋 Manual SQL to run:');
            console.log('ALTER TABLE execucao_exercicio_usuario ADD COLUMN serie_numero INTEGER DEFAULT 1;');
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('🔧 Please run the SQL manually in Supabase dashboard:');
        console.log('ALTER TABLE execucao_exercicio_usuario ADD COLUMN serie_numero INTEGER DEFAULT 1;');
        console.log('UPDATE execucao_exercicio_usuario SET serie_numero = 1 WHERE serie_numero IS NULL;');
    }
}

async function testTableStructure(supabaseUrl, supabaseKey) {
    try {
        const testUrl = `${supabaseUrl}/rest/v1/execucao_exercicio_usuario?select=*&limit=1`;
        
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            }
        };
        
        const response = await new Promise((resolve, reject) => {
            const req = https.request(testUrl, options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, data }));
            });
            
            req.on('error', reject);
            req.end();
        });
        
        if (response.statusCode === 200) {
            const data = JSON.parse(response.data);
            console.log('✅ Table accessible');
            
            if (data.length > 0) {
                const columns = Object.keys(data[0]);
                console.log('📋 Table columns:', columns.join(', '));
                
                if (columns.includes('serie_numero')) {
                    console.log('✅ SUCCESS: serie_numero column is present!');
                } else {
                    console.log('❌ serie_numero column still missing');
                }
            } else {
                console.log('📝 Table is empty, cannot verify column structure');
            }
        } else {
            console.log('⚠️  Could not verify table structure');
        }
        
    } catch (error) {
        console.log('⚠️  Table structure test failed:', error.message);
    }
}

// Execute the fix
console.log('🚀 Starting database fix for serie_numero column...');
executeDatabaseFix();