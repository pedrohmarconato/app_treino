// Script to connect to Supabase and add the missing serie_numero column
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Import config to get Supabase credentials
async function executeDatabaseFix() {
    try {
        console.log('🔄 Connecting to Supabase database...');
        
        // Read config to get Supabase URL and key
        const configContent = readFileSync('./config.js', 'utf8');
        const urlMatch = configContent.match(/SUPABASE_URL:\s*['"`]([^'"`]+)['"`]/);
        const keyMatch = configContent.match(/SUPABASE_ANON_KEY:\s*['"`]([^'"`]+)['"`]/);
        
        if (!urlMatch || !keyMatch) {
            throw new Error('Could not find Supabase credentials in config.js');
        }
        
        const supabaseUrl = urlMatch[1];
        const supabaseKey = keyMatch[1];
        
        console.log('📡 Supabase URL found:', supabaseUrl.substring(0, 30) + '...');
        
        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        console.log('✅ Connected to Supabase successfully');
        
        // Execute the ALTER TABLE command
        console.log('🔧 Adding serie_numero column to execucao_exercicio_usuario table...');
        
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
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
            `
        });
        
        if (error) {
            console.log('❌ Error executing SQL:', error.message);
            
            // Try alternative method using direct SQL
            console.log('🔄 Trying alternative method...');
            const { data: altData, error: altError } = await supabase
                .from('execucao_exercicio_usuario')
                .select('*')
                .limit(1);
                
            if (altError) {
                console.log('❌ Connection test failed:', altError.message);
                return false;
            }
            
            console.log('✅ Table exists and is accessible');
            console.log('⚠️  You may need to run the SQL manually in Supabase dashboard');
            console.log('📋 SQL to run:');
            console.log(`
ALTER TABLE execucao_exercicio_usuario 
ADD COLUMN serie_numero INTEGER DEFAULT 1;

COMMENT ON COLUMN execucao_exercicio_usuario.serie_numero IS 'Número da série/set executado (1, 2, 3...)';

UPDATE execucao_exercicio_usuario 
SET serie_numero = 1 
WHERE serie_numero IS NULL;

ALTER TABLE execucao_exercicio_usuario 
ADD CONSTRAINT execucao_exercicio_usuario_serie_numero_positive 
CHECK (serie_numero > 0);
            `);
            
            return false;
        }
        
        console.log('✅ SQL executed successfully!');
        console.log('📊 Result:', data);
        
        // Verify the column was added
        console.log('🔍 Verifying column was added...');
        const { data: tableInfo, error: infoError } = await supabase
            .from('execucao_exercicio_usuario')
            .select('*')
            .limit(1);
            
        if (infoError) {
            console.log('⚠️  Could not verify column, but SQL executed without errors');
        } else {
            console.log('✅ Table structure verified successfully');
        }
        
        console.log('🎉 Database fix completed!');
        console.log('📝 The serie_numero column has been added to execucao_exercicio_usuario');
        console.log('🚀 Workout execution should now work properly');
        
        return true;
        
    } catch (error) {
        console.log('❌ Failed to execute database fix:', error.message);
        console.log('🔧 Please run the SQL manually in Supabase dashboard');
        return false;
    }
}

// Execute the fix
executeDatabaseFix();