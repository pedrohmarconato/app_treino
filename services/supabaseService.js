// js/services/supabaseService.js
// Centraliza a conexão e queries básicas do Supabase
// Updated: Added remove function

// Verificar se as configurações estão disponíveis
if (!window.SUPABASE_CONFIG) {
    console.error('SUPABASE_CONFIG não encontrado!');
}

console.log('Configuração Supabase:', {
    url: window.SUPABASE_CONFIG?.url,
    hasKey: !!window.SUPABASE_CONFIG?.key
});

const supabase = window.supabase.createClient(
    window.SUPABASE_CONFIG.url, 
    window.SUPABASE_CONFIG.key
);

export { supabase };

// Funções auxiliares para queries comuns
export async function query(table, options = {}) {
    console.log(`[query] Consultando tabela: ${table}`, options);
    
    try {
        let q = supabase.from(table);
        
        // Sempre usar select() primeiro
        if (options.select) {
            q = q.select(options.select);
        } else {
            q = q.select('*'); // Selecionar tudo por padrão
        }
        
        // Aplicar filtros
        if (options.eq) {
            Object.entries(options.eq).forEach(([key, value]) => {
                // Tratar valores null e undefined
                if (value === null || value === undefined || value === 'null' || value === 'undefined') {
                    console.log(`[query] Aplicando filtro is null: ${key}`);
                    q = q.is(key, null);
                } else {
                    console.log(`[query] Aplicando filtro eq: ${key} = ${value}`);
                    q = q.eq(key, value);
                }
            });
        }
        
        if (options.order) {
            q = q.order(options.order.column, { ascending: options.order.ascending ?? true });
        }
        if (options.limit) q = q.limit(options.limit);
        if (options.single) {
            q = q.single();
        } else if (options.maybeSingle) {
            q = q.maybeSingle();
        }
        
        console.log(`[query] Executando query na tabela ${table}...`);
        const { data, error } = await q;
        
        if (error) {
            // Tratar erro de "single" quando não há registros ou múltiplos (PGRST116)
            if (error.code === 'PGRST116') {
                console.warn(`[query] ⚠️ Nenhum resultado único para ${table}. Retornando null. Detalhes:`, error.message);
                return { data: null, error: null };
            }

            console.error(`[query] Erro na consulta ${table}:`, error);
            throw error;
        }
        
        console.log(`[query] Resultado da consulta ${table}:`, data);
        return { data, error: null };
    } catch (error) {
        console.error(`[query] Erro ao consultar ${table}:`, error);
        return { data: null, error };
    }
}

export async function insert(table, data) {
    try {
        console.log(`[insert] 📤 INICIANDO INSERT na tabela: ${table}`);
        console.log(`[insert] 📄 DADOS PARA INSERIR:`, JSON.stringify(data, null, 2));
        console.log(`[insert] 📊 QUANTIDADE DE REGISTROS:`, Array.isArray(data) ? data.length : 1);
        
        const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select();
        
        if (error) {
            console.error(`[insert] ❌ ERRO do Supabase na tabela ${table}:`, error);
            console.error(`[insert] 🔍 DADOS QUE CAUSARAM ERRO:`, JSON.stringify(data, null, 2));
            throw error;
        }
        
        console.log(`[insert] ✅ SUCESSO ao inserir em ${table}!`);
        console.log(`[insert] 📥 RESULTADO RETORNADO:`, JSON.stringify(result, null, 2));
        console.log(`[insert] 📈 REGISTROS INSERIDOS:`, result?.length || 0);
        
        return { data: result, error: null };
    } catch (error) {
        console.error(`[insert] ❌ ERRO CRÍTICO ao inserir em ${table}:`, error);
        console.error(`[insert] 🔍 DADOS PROBLEMÁTICOS:`, JSON.stringify(data, null, 2));
        return { data: null, error };
    }
}

export async function update(table, data, filters) {
    try {
        console.log(`[supabaseService] update chamado:`, { table, data, filters });
        
        let q = supabase.from(table).update(data);
        
        // Se filters é um número, assume que é um ID
        if (typeof filters === 'number' || typeof filters === 'string') {
            console.log(`[supabaseService] Usando ID filter:`, filters);
            q = q.eq('id', filters);
        } 
        // Se filters é um objeto, aplica os filtros
        else if (filters && typeof filters === 'object' && filters.eq) {
            console.log(`[supabaseService] Aplicando filtros .eq:`, filters.eq);
            Object.entries(filters.eq).forEach(([key, value]) => {
                q = q.eq(key, value);
            });
        } 
        // Suporte ao formato antigo (retrocompatibilidade)
        else if (filters && typeof filters === 'object') {
            console.warn('[supabaseService] Formato antigo de update detectado, use { eq: {...} }');
            console.warn('[supabaseService] Filters recebido:', filters);
            Object.entries(filters).forEach(([key, value]) => {
                if (key !== 'eq') { // Evitar processar 'eq' como coluna
                    q = q.eq(key, value);
                }
            });
        }
        // Se filters está undefined
        else {
            console.error('[supabaseService] ERRO: filters não fornecido ou inválido:', filters);
            throw new Error('Filters obrigatório para update');
        }
        
        const { data: result, error } = await q.select();
        
        if (error) throw error;
        return { data: result, error: null };
    } catch (error) {
        console.error(`[supabaseService] Erro ao atualizar ${table}:`, error);
        console.error(`[supabaseService] Parâmetros: table=${table}, data=`, data, 'filters=', filters);
        return { data: null, error };
    }
}

export async function upsert(table, data, options = {}) {
    try {
        const { data: result, error } = await supabase
            .from(table)
            .upsert(data, options)
            .select();
        
        if (error) throw error;
        return { data: result, error: null };
    } catch (error) {
        console.error(`Erro ao fazer upsert em ${table}:`, error);
        return { data: null, error };
    }
}

