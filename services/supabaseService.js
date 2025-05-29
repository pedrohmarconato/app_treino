// js/services/supabaseService.js
// Centraliza a conexão e queries básicas do Supabase

const supabase = window.supabase.createClient(
    window.SUPABASE_CONFIG.url, 
    window.SUPABASE_CONFIG.key
);

export { supabase };

// Funções auxiliares para queries comuns
export async function query(table, options = {}) {
    try {
        let query = supabase.from(table);
        
        if (options.select) query = query.select(options.select);
        if (options.eq) {
            Object.entries(options.eq).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        if (options.order) {
            query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
        }
        if (options.limit) query = query.limit(options.limit);
        if (options.single) query = query.single();
        
        const { data, error } = await query;
        
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error(`Erro ao consultar ${table}:`, error);
        return { data: null, error };
    }
}

export async function insert(table, data) {
    try {
        const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select();
        
        if (error) throw error;
        return { data: result, error: null };
    } catch (error) {
        console.error(`Erro ao inserir em ${table}:`, error);
        return { data: null, error };
    }
}

export async function update(table, id, data) {
    try {
        const { data: result, error } = await supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return { data: result, error: null };
    } catch (error) {
        console.error(`Erro ao atualizar ${table}:`, error);
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