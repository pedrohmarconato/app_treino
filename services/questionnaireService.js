/**
 * 📋 SERVIÇO DE QUESTIONÁRIO - Questionnaire Service
 *
 * FUNÇÃO: Gerenciar salvamento e recuperação de dados do questionário de usuários.
 *
 * RESPONSABILIDADES:
 * - Salvar dados do questionário no Supabase
 * - Verificar se usuário já preencheu questionário
 * - Recuperar dados do questionário do usuário
 * - Atualizar dados existentes
 * - Validar dados antes de salvar
 */

/**
 * Salvar dados do questionário no banco
 * @param {Object} questionnaireData - Dados do questionário
 * @returns {Promise<Object>} Resultado da operação
 */
export async function salvarQuestionario(questionnaireData) {
  try {
    console.log('[QuestionnaireService] 💾 Salvando questionário:', questionnaireData);

    // Verificar se Supabase está disponível
    if (!window.supabase) {
      throw new Error('Supabase não está disponível');
    }

    // Preparar dados para inserção
    const dadosParaSalvar = {
      user_id: questionnaireData.user_id,
      nome: questionnaireData.nome,
      genero: questionnaireData.genero,
      data_nascimento: questionnaireData.data_nascimento,
      peso: parseFloat(questionnaireData.peso),
      altura: parseInt(questionnaireData.altura),
      possui_lesao: questionnaireData.possui_lesao || false,
      tipos_lesao: questionnaireData.tipos_lesao || [],
      descricao_lesoes: questionnaireData.descricao_lesoes || null,
      experiencia: questionnaireData.experiencia,
      tempo_treino: parseFloat(questionnaireData.tempo_treino) || 0,
      objetivo: questionnaireData.objetivo,
      dias_treino: questionnaireData.dias_treino || [],
      tempo_por_treino: parseInt(questionnaireData.tempo_por_treino),
      incluir_cardio: questionnaireData.incluir_cardio || false,
      incluir_alongamento: questionnaireData.incluir_alongamento || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[QuestionnaireService] 🔍 Dados preparados:', dadosParaSalvar);

    // Verificar se já existe questionário para este usuário
    const { data: existente, error: errorVerificar } = await window.supabase
      .from('user_questionnaire')
      .select('id, created_at')
      .eq('user_id', questionnaireData.user_id)
      .single();

    if (errorVerificar && errorVerificar.code !== 'PGRST116') {
      console.error(
        '[QuestionnaireService] ❌ Erro ao verificar questionário existente:',
        errorVerificar
      );
      throw errorVerificar;
    }

    let resultado;

    if (existente) {
      // Atualizar registro existente
      console.log('[QuestionnaireService] 🔄 Atualizando questionário existente...');
      const { data, error } = await window.supabase
        .from('user_questionnaire')
        .update(dadosParaSalvar)
        .eq('user_id', questionnaireData.user_id)
        .select()
        .single();

      if (error) {
        console.error('[QuestionnaireService] ❌ Erro ao atualizar:', error);
        throw error;
      }

      resultado = data;
    } else {
      // Inserir novo registro
      console.log('[QuestionnaireService] ➕ Criando novo questionário...');
      const { data, error } = await window.supabase
        .from('user_questionnaire')
        .insert(dadosParaSalvar)
        .select()
        .single();

      if (error) {
        console.error('[QuestionnaireService] ❌ Erro ao inserir:', error);
        throw error;
      }

      resultado = data;
    }

    console.log('[QuestionnaireService] ✅ Questionário salvo com sucesso:', resultado.id);

    return {
      success: true,
      data: resultado,
      isUpdate: !!existente,
    };
  } catch (error) {
    console.error('[QuestionnaireService] ❌ Erro ao salvar questionário:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
      details: error,
    };
  }
}

/**
 * Verificar se usuário já preencheu questionário
 * @param {number} userId - ID do usuário
 * @returns {Promise<boolean>} True se já preencheu
 */
export async function verificarQuestionarioExistente(userId) {
  try {
    console.log('[QuestionnaireService] 🔍 Verificando questionário para usuário:', userId);

    if (!window.supabase) {
      console.warn('[QuestionnaireService] ⚠️ Supabase não disponível');
      return false;
    }

    const { data, error } = await window.supabase
      .from('user_questionnaire')
      .select('id, created_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Registro não encontrado
        console.log('[QuestionnaireService] ℹ️ Questionário não existe para usuário:', userId);
        return false;
      }

      console.error('[QuestionnaireService] ❌ Erro ao verificar questionário:', error);
      return false;
    }

    console.log(
      '[QuestionnaireService] ✅ Questionário existe para usuário:',
      userId,
      'desde',
      data.created_at
    );
    return true;
  } catch (error) {
    console.error('[QuestionnaireService] ❌ Erro na verificação:', error);
    return false;
  }
}

/**
 * Recuperar dados do questionário do usuário
 * @param {number} userId - ID do usuário
 * @returns {Promise<Object|null>} Dados do questionário ou null
 */
export async function obterQuestionario(userId) {
  try {
    console.log('[QuestionnaireService] 📋 Obtendo questionário para usuário:', userId);

    if (!window.supabase) {
      throw new Error('Supabase não está disponível');
    }

    const { data, error } = await window.supabase
      .from('user_questionnaire')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[QuestionnaireService] ℹ️ Questionário não encontrado para usuário:', userId);
        return null;
      }

      console.error('[QuestionnaireService] ❌ Erro ao obter questionário:', error);
      throw error;
    }

    console.log('[QuestionnaireService] ✅ Questionário obtido com sucesso');
    return data;
  } catch (error) {
    console.error('[QuestionnaireService] ❌ Erro ao obter questionário:', error);
    throw error;
  }
}

/**
 * Excluir questionário do usuário
 * @param {number} userId - ID do usuário
 * @returns {Promise<Object>} Resultado da operação
 */
export async function excluirQuestionario(userId) {
  try {
    console.log('[QuestionnaireService] 🗑️ Excluindo questionário do usuário:', userId);

    if (!window.supabase) {
      throw new Error('Supabase não está disponível');
    }

    const { error } = await window.supabase
      .from('user_questionnaire')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[QuestionnaireService] ❌ Erro ao excluir questionário:', error);
      throw error;
    }

    console.log('[QuestionnaireService] ✅ Questionário excluído com sucesso');

    return {
      success: true,
      message: 'Questionário excluído com sucesso',
    };
  } catch (error) {
    console.error('[QuestionnaireService] ❌ Erro ao excluir questionário:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

/**
 * Validar dados do questionário
 * @param {Object} data - Dados para validar
 * @returns {Object} Resultado da validação
 */
export function validarDadosQuestionario(data) {
  const erros = {};

  // Validações obrigatórias
  if (!data.user_id) {
    erros.user_id = 'ID do usuário é obrigatório';
  }

  if (!data.nome || data.nome.trim().length < 2) {
    erros.nome = 'Nome deve ter pelo menos 2 caracteres';
  }

  if (!data.genero || !['masculino', 'feminino', 'outro'].includes(data.genero)) {
    erros.genero = 'Gênero deve ser masculino, feminino ou outro';
  }

  if (!data.data_nascimento) {
    erros.data_nascimento = 'Data de nascimento é obrigatória';
  }

  if (!data.peso || data.peso < 20 || data.peso > 300) {
    erros.peso = 'Peso deve estar entre 20 e 300 kg';
  }

  if (!data.altura || data.altura < 100 || data.altura > 250) {
    erros.altura = 'Altura deve estar entre 100 e 250 cm';
  }

  if (!data.experiencia || !['iniciante', 'intermediario', 'avancado'].includes(data.experiencia)) {
    erros.experiencia = 'Experiência deve ser iniciante, intermediario ou avancado';
  }

  if (
    !data.objetivo ||
    !['hipertrofia', 'emagrecimento', 'forca', 'resistencia', 'condicionamento'].includes(
      data.objetivo
    )
  ) {
    erros.objetivo = 'Objetivo é obrigatório';
  }

  if (!data.dias_treino || !Array.isArray(data.dias_treino) || data.dias_treino.length === 0) {
    erros.dias_treino = 'Pelo menos um dia de treino deve ser selecionado';
  }

  if (
    !data.tempo_por_treino ||
    !['30', '45', '60', '90'].includes(data.tempo_por_treino.toString())
  ) {
    erros.tempo_por_treino = 'Tempo por treino deve ser 30, 45, 60 ou 90 minutos';
  }

  const temErros = Object.keys(erros).length > 0;

  return {
    valido: !temErros,
    erros: temErros ? erros : null,
  };
}

/**
 * Obter estatísticas do questionário
 * @param {number} userId - ID do usuário
 * @returns {Promise<Object>} Estatísticas calculadas
 */
export async function obterEstatisticas(userId) {
  try {
    const dados = await obterQuestionario(userId);

    if (!dados) {
      return null;
    }

    // Calcular IMC
    const imc = dados.peso / Math.pow(dados.altura / 100, 2);

    // Classificar IMC
    let classificacaoIMC;
    if (imc < 18.5) classificacaoIMC = 'Abaixo do peso';
    else if (imc < 25) classificacaoIMC = 'Peso normal';
    else if (imc < 30) classificacaoIMC = 'Sobrepeso';
    else classificacaoIMC = 'Obesidade';

    // Calcular idade
    const nascimento = new Date(dados.data_nascimento);
    const hoje = new Date();
    const idade = hoje.getFullYear() - nascimento.getFullYear();

    // Frequência semanal
    const frequenciaSemanal = dados.dias_treino ? dados.dias_treino.length : 0;

    // Volume semanal (minutos)
    const volumeSemanal = frequenciaSemanal * parseInt(dados.tempo_por_treino);

    return {
      imc: parseFloat(imc.toFixed(1)),
      classificacaoIMC,
      idade,
      frequenciaSemanal,
      volumeSemanal,
      temLesoes: dados.possui_lesao,
      quantidadeLesoes: dados.tipos_lesao ? dados.tipos_lesao.length : 0,
      experiencia: dados.experiencia,
      objetivo: dados.objetivo,
      incluiCardio: dados.incluir_cardio,
      incluiAlongamento: dados.incluir_alongamento,
    };
  } catch (error) {
    console.error('[QuestionnaireService] ❌ Erro ao calcular estatísticas:', error);
    throw error;
  }
}

// Disponibilizar funções globalmente para compatibilidade
if (typeof window !== 'undefined') {
  window.QuestionnaireService = {
    salvarQuestionario,
    verificarQuestionarioExistente,
    obterQuestionario,
    excluirQuestionario,
    validarDadosQuestionario,
    obterEstatisticas,
  };
}

export default {
  salvarQuestionario,
  verificarQuestionarioExistente,
  obterQuestionario,
  excluirQuestionario,
  validarDadosQuestionario,
  obterEstatisticas,
};
