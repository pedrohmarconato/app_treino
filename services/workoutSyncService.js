// services/workoutSyncService.js
// Responsável por garantir o envio das sessões de treino finalizadas para o backend
// quando houver conectividade. Mantém fila no localStorage para funcionar offline.
import { supabase } from './supabaseService.js';

export default class WorkoutSyncService {
  constructor() {
    this.QUEUE_KEY = 'workoutSessionsQueue_v1';

    // Tenta sincronizar assim que voltar a ficar online
    window.addEventListener('online', () => {
      this.syncPending();
    });

    // Opcional: tentar logo na inicialização da aplicação
    this.syncPending();
  }

  _loadQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.QUEUE_KEY) || '[]');
    } catch (e) {
      console.error('[WorkoutSync] Erro ao ler fila', e);
      return [];
    }
  }

  _saveQueue(queue) {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('[WorkoutSync] Erro ao salvar fila', e);
    }
  }

  /**
   * Coloca uma sessão na fila de envio.
   * @param {Object} session
   */
  enqueue(session) {
    const queue = this._loadQueue();
    queue.push(session);
    this._saveQueue(queue);
    console.log(`[WorkoutSync] Sessão enfileirada. Total pendentes: ${queue.length}`);
  }

  /**
   * Tenta enviar a sessão imediatamente; se falhar, entra na fila.
   * @param {Object} session
   * @returns {Promise<boolean>} true se enviada com sucesso
   */
  async trySendOrQueue(session) {
    const ok = await this._sendSession({
      ...session,
      session_id: crypto.randomUUID(),
    });
    if (!ok) {
      this.enqueue(session);
    }
    return ok;
  }

  async _sendSession(session) {
    if (!navigator.onLine) {
      console.warn('[WorkoutSync] Offline, adiando envio');
      return false;
    }

    try {
      // 1. Insere avaliações no planejamento_semanal
      if (session.avaliacoes) {
        const { error: planningError } = await supabase.from('planejamento_semanal').upsert(
          {
            usuario_id: session.user_id,
            semana: session.semana,
            pre_workout: session.avaliacoes.pre,
            post_workout: session.avaliacoes.post,
          },
          { onConflict: 'usuario_id,semana' }
        );

        if (planningError) throw planningError;
      }

      // 2. Insere execuções individuais
      if (session.exercicios?.length > 0) {
        const exercisesToInsert = session.exercicios.flatMap((ex) =>
          ex.series.map((serie) => ({
            usuario_id: session.user_id,
            exercicio_id: ex.id,
            repeticoes: serie.reps,
            peso_utilizado: serie.carga,
            data_execucao: new Date().toISOString(),
            session_id: session.session_id,
          }))
        );

        const { error: exercisesError } = await supabase
          .from('execucao_exercicio_usuario')
          .insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;
      }

      return true;
    } catch (error) {
      console.error('[WorkoutSync] Error:', error);
      return false;
    }
  }

  /**
   * Percorre fila e tenta reenviar todas.
   */
  async syncPending() {
    const queue = this._loadQueue();
    if (!queue.length) return;

    console.log(`[WorkoutSync] Tentando sincronizar ${queue.length} sessões pendentes...`);
    const remaining = [];
    for (const session of queue) {
      const ok = await this._sendSession(session);
      if (!ok) {
        remaining.push(session);
      }
    }

    this._saveQueue(remaining);
    console.log(`[WorkoutSync] Sincronização concluída. Restantes: ${remaining.length}`);
  }
}

// Singleton export
export const workoutSyncService = new WorkoutSyncService();
