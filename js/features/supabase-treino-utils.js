// Utilitário para buscar opções de treino dinâmicas do Supabase
import { supabase } from '../services/supabaseClient.js';

/**
 * Busca os grupos musculares únicos da tabela exercicios no Supabase
 * Retorna um array de objetos no formato { nome: '...' }
 * Adiciona manualmente a opção 'Folga'.
 */
export async function buscarOpcoesDeTreino() {
  const { data, error } = await supabase.from('exercicios').select('grupo_muscular');

  if (error) {
    console.error('Erro ao buscar grupos musculares:', error);
    return [{ nome: 'Folga' }];
  }

  // Extrai e filtra valores únicos
  const grupos = Array.from(new Set((data || []).map((e) => e.grupo_muscular).filter(Boolean)));
  const opcoes = grupos.map((grupo) => ({ nome: grupo }));
  opcoes.push({ nome: 'Folga' });
  return opcoes;
}
