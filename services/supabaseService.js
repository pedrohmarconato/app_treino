// js/services/supabaseService.js
// Centraliza a conexão e queries básicas do Supabase

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
                console.log(`[query] Aplicando filtro eq: ${key} = ${value}`);
                q = q.eq(key, value);
            });
        }
        
        if (options.order) {
            q = q.order(options.order.column, { ascending: options.order.ascending ?? true });
        }
        if (options.limit) q = q.limit(options.limit);
        if (options.single) q = q.single();
        
        console.log(`[query] Executando query na tabela ${table}...`);
        const { data, error } = await q;
        
        if (error) {
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