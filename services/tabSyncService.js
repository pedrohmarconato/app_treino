// Serviço de Sincronização entre Abas
class TabSyncService {
    constructor() {
        this.TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.MASTER_KEY = 'workout_master_tab';
        this.HEARTBEAT_KEY = 'workout_tab_heartbeat';
        this.HEARTBEAT_INTERVAL = 5000; // 5 segundos
        this.MASTER_TIMEOUT = 10000; // 10 segundos
        
        this.isMaster = false;
        this.channel = null;
        this.heartbeatTimer = null;
        this.callbacks = new Map();
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa o serviço
     */
    init() {
        try {
            // Criar canal de broadcast
            this.channel = new BroadcastChannel('workout_sync');
            
            // Configurar listeners
            this.setupListeners();
            
            // Tentar se tornar master
            this.attemptBecomeMaster();
            
            // Iniciar heartbeat
            this.startHeartbeat();
            
            console.log('[TabSync] Inicializado:', this.TAB_ID);
        } catch (error) {
            console.warn('[TabSync] BroadcastChannel não suportado:', error);
            // Fallback: sempre considerar como master se não há suporte
            this.isMaster = true;
        }
    }
    
    /**
     * Configura listeners
     */
    setupListeners() {
        // Listener do BroadcastChannel
        if (this.channel) {
            this.channel.onmessage = (event) => {
                this.handleMessage(event.data);
            };
        }
        
        // Listener de storage para detectar mudanças
        window.addEventListener('storage', (event) => {
            if (event.key === this.MASTER_KEY) {
                this.checkMasterStatus();
            }
        });
        
        // Listener para quando a aba fecha
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    /**
     * Tenta se tornar a aba master
     */
    attemptBecomeMaster() {
        const currentMaster = this.getCurrentMaster();
        
        if (!currentMaster || this.isMasterExpired(currentMaster)) {
            // Não há master ou expirou
            this.becomeMaster();
        } else {
            // Já existe um master ativo
            this.isMaster = false;
            console.log('[TabSync] Master existente:', currentMaster.id);
        }
    }
    
    /**
     * Se torna a aba master
     */
    becomeMaster() {
        const masterData = {
            id: this.TAB_ID,
            timestamp: Date.now()
        };
        
        localStorage.setItem(this.MASTER_KEY, JSON.stringify(masterData));
        this.isMaster = true;
        
        console.log('[TabSync] Esta aba é agora MASTER');
        
        // Notificar outras abas
        this.broadcast({
            type: 'MASTER_CHANGED',
            masterId: this.TAB_ID
        });
    }
    
    /**
     * Verifica status do master
     */
    checkMasterStatus() {
        const currentMaster = this.getCurrentMaster();
        
        if (!currentMaster || this.isMasterExpired(currentMaster)) {
            // Master expirou, tentar assumir
            if (!this.isMaster) {
                this.attemptBecomeMaster();
            }
        } else if (currentMaster.id === this.TAB_ID && !this.isMaster) {
            // Esta aba foi promovida a master
            this.isMaster = true;
            console.log('[TabSync] Promovido a MASTER');
        } else if (currentMaster.id !== this.TAB_ID && this.isMaster) {
            // Outra aba assumiu como master
            this.isMaster = false;
            console.log('[TabSync] Rebaixado - novo master:', currentMaster.id);
        }
    }
    
    /**
     * Obtém dados do master atual
     */
    getCurrentMaster() {
        try {
            const data = localStorage.getItem(this.MASTER_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Verifica se o master expirou
     */
    isMasterExpired(masterData) {
        if (!masterData || !masterData.timestamp) return true;
        
        const age = Date.now() - masterData.timestamp;
        return age > this.MASTER_TIMEOUT;
    }
    
    /**
     * Inicia heartbeat
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.isMaster) {
                // Atualizar timestamp do master
                const masterData = {
                    id: this.TAB_ID,
                    timestamp: Date.now()
                };
                localStorage.setItem(this.MASTER_KEY, JSON.stringify(masterData));
            }
            
            // Verificar status periodicamente
            this.checkMasterStatus();
        }, this.HEARTBEAT_INTERVAL);
    }
    
    /**
     * Envia mensagem via broadcast
     */
    broadcast(message) {
        if (!this.channel) return;
        
        try {
            this.channel.postMessage({
                ...message,
                senderId: this.TAB_ID,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('[TabSync] Erro ao enviar broadcast:', error);
        }
    }
    
    /**
     * Processa mensagem recebida
     */
    handleMessage(message) {
        // Ignorar próprias mensagens
        if (message.senderId === this.TAB_ID) return;
        
        console.log('[TabSync] Mensagem recebida:', message.type);
        
        // Executar callbacks registrados
        const callbacks = this.callbacks.get(message.type) || [];
        callbacks.forEach(callback => {
            try {
                callback(message);
            } catch (error) {
                console.error('[TabSync] Erro em callback:', error);
            }
        });
        
        // Processar tipos específicos
        switch (message.type) {
            case 'STATE_SAVED':
                if (!this.isMaster) {
                    // Aba slave deve recarregar estado
                    this.handleStateSaved(message);
                }
                break;
                
            case 'OFFLINE_SYNC_COMPLETED':
                // Todas as abas devem atualizar status
                this.handleSyncCompleted(message);
                break;
        }
    }
    
    /**
     * Registra callback para tipo de mensagem
     */
    on(type, callback) {
        if (!this.callbacks.has(type)) {
            this.callbacks.set(type, []);
        }
        this.callbacks.get(type).push(callback);
    }
    
    /**
     * Remove callback
     */
    off(type, callback) {
        const callbacks = this.callbacks.get(type) || [];
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
    
    /**
     * Manipula evento de estado salvo
     */
    handleStateSaved(message) {
        console.log('[TabSync] Estado salvo em outra aba, recarregando...');
        
        // Recarregar estado do localStorage
        if (window.workoutStateManager) {
            const estado = window.workoutStateManager.recuperarEstadoCompleto();
            window.workoutStateManager.restaurarEstado(estado);
        }
    }
    
    /**
     * Manipula evento de sincronização concluída
     */
    handleSyncCompleted(message) {
        console.log('[TabSync] Sincronização offline concluída');
        
        // Atualizar UI se necessário
        if (window.showNotification) {
            window.showNotification('Dados sincronizados com sucesso', 'success');
        }
    }
    
    /**
     * Verifica se pode realizar ação (apenas master)
     */
    canPerformAction(action) {
        if (!this.isMaster) {
            console.warn(`[TabSync] Apenas a aba master pode ${action}`);
            return false;
        }
        return true;
    }
    
    /**
     * Notifica sobre ação realizada
     */
    notifyAction(type, data = {}) {
        this.broadcast({
            type,
            data,
            isMaster: this.isMaster
        });
    }
    
    /**
     * Limpa recursos ao fechar aba
     */
    cleanup() {
        // Parar heartbeat
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        
        // Se for master, liberar
        if (this.isMaster) {
            localStorage.removeItem(this.MASTER_KEY);
            
            // Notificar outras abas
            this.broadcast({
                type: 'MASTER_RELEASED',
                masterId: this.TAB_ID
            });
        }
        
        // Fechar canal
        if (this.channel) {
            this.channel.close();
        }
        
        console.log('[TabSync] Cleanup concluído');
    }
    
    /**
     * Status atual para debug
     */
    getStatus() {
        const master = this.getCurrentMaster();
        
        return {
            tabId: this.TAB_ID,
            isMaster: this.isMaster,
            currentMaster: master?.id || 'none',
            masterAge: master ? Date.now() - master.timestamp : null,
            isExpired: master ? this.isMasterExpired(master) : true
        };
    }
}

// Exportar instância única
export const tabSyncService = new TabSyncService();

// Expor globalmente para debug
window.tabSyncService = tabSyncService;

export default TabSyncService;