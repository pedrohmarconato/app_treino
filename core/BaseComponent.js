// core/BaseComponent.js
// Classe base para componentes com ciclo de vida bem definido

export class BaseComponent {
    constructor(elementId) {
        this.elementId = elementId;
        this.element = null;
        this.isInitialized = false;
        this.isMounted = false;
        this.children = new Map();
        this.eventListeners = [];
        this.intervals = [];
        this.timeouts = [];
    }
    
    /**
     * Inicializa o componente (verifica dependências)
     */
    async initialize() {
        console.log(`[${this.constructor.name}] Initializing...`);
        
        try {
            await this.checkDependencies();
            this.isInitialized = true;
            console.log(`[${this.constructor.name}] ✅ Initialized`);
        } catch (error) {
            console.error(`[${this.constructor.name}] ❌ Initialization failed:`, error);
            throw error;
        }
    }
    
    /**
     * Monta o componente no DOM
     */
    async mount() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        console.log(`[${this.constructor.name}] Mounting...`);
        
        try {
            // Aguardar elemento estar disponível
            this.element = await this.waitForElement(this.elementId);
            
            // Chamar hook de montagem
            await this.onMount();
            
            // Montar componentes filhos
            await this.mountChildren();
            
            this.isMounted = true;
            console.log(`[${this.constructor.name}] ✅ Mounted`);
        } catch (error) {
            console.error(`[${this.constructor.name}] ❌ Mount failed:`, error);
            throw error;
        }
    }
    
    /**
     * Desmonta o componente e limpa recursos
     */
    async unmount() {
        if (!this.isMounted) return;
        
        console.log(`[${this.constructor.name}] Unmounting...`);
        
        try {
            // Desmontar filhos primeiro
            await this.unmountChildren();
            
            // Chamar hook de desmontagem
            await this.onUnmount();
            
            // Limpar recursos
            this.cleanup();
            
            this.isMounted = false;
            this.element = null;
            
            console.log(`[${this.constructor.name}] ✅ Unmounted`);
        } catch (error) {
            console.error(`[${this.constructor.name}] ❌ Unmount error:`, error);
        }
    }
    
    /**
     * Aguarda elemento aparecer no DOM
     */
    async waitForElement(selector, timeout = 5000) {
        const startTime = Date.now();
        
        // Se já é um elemento, retornar
        if (selector instanceof HTMLElement) {
            return selector;
        }
        
        console.log(`[${this.constructor.name}] Waiting for element: ${selector}`);
        
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`[${this.constructor.name}] ✅ Element found: ${selector}`);
                return element;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error(`Element ${selector} not found after ${timeout}ms`);
    }
    
    /**
     * Busca elemento dentro do componente
     */
    querySelector(selector) {
        if (!this.element) {
            console.warn(`[${this.constructor.name}] Component not mounted, cannot query: ${selector}`);
            return null;
        }
        return this.element.querySelector(selector);
    }
    
    /**
     * Busca múltiplos elementos dentro do componente
     */
    querySelectorAll(selector) {
        if (!this.element) {
            console.warn(`[${this.constructor.name}] Component not mounted, cannot query: ${selector}`);
            return [];
        }
        return Array.from(this.element.querySelectorAll(selector));
    }
    
    /**
     * Adiciona event listener com tracking automático
     */
    addEventListener(target, event, handler, options) {
        const element = typeof target === 'string' ? this.querySelector(target) : target;
        
        if (!element) {
            console.warn(`[${this.constructor.name}] Cannot add listener, element not found`);
            return;
        }
        
        element.addEventListener(event, handler, options);
        this.eventListeners.push({ element, event, handler, options });
    }
    
    /**
     * Cria interval com tracking automático
     */
    setInterval(handler, delay) {
        const intervalId = setInterval(handler, delay);
        this.intervals.push(intervalId);
        return intervalId;
    }
    
    /**
     * Cria timeout com tracking automático
     */
    setTimeout(handler, delay) {
        const timeoutId = setTimeout(handler, delay);
        this.timeouts.push(timeoutId);
        return timeoutId;
    }
    
    /**
     * Registra componente filho
     */
    registerChild(name, component) {
        this.children.set(name, component);
    }
    
    /**
     * Monta todos os componentes filhos
     */
    async mountChildren() {
        for (const [name, child] of this.children) {
            try {
                await child.mount();
            } catch (error) {
                console.error(`[${this.constructor.name}] Failed to mount child ${name}:`, error);
            }
        }
    }
    
    /**
     * Desmonta todos os componentes filhos
     */
    async unmountChildren() {
        for (const [name, child] of this.children) {
            try {
                await child.unmount();
            } catch (error) {
                console.error(`[${this.constructor.name}] Failed to unmount child ${name}:`, error);
            }
        }
    }
    
    /**
     * Limpa todos os recursos
     */
    cleanup() {
        // Remover event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
        
        // Limpar intervals
        this.intervals.forEach(clearInterval);
        this.intervals = [];
        
        // Limpar timeouts
        this.timeouts.forEach(clearTimeout);
        this.timeouts = [];
        
        // Limpar filhos
        this.children.clear();
    }
    
    /**
     * Atualiza elemento do DOM com valor
     */
    updateElement(selector, value) {
        const element = this.querySelector(selector);
        if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
    }
    
    /**
     * Mostra ou esconde elemento
     */
    toggleElement(selector, show) {
        const element = this.querySelector(selector);
        if (element) {
            element.style.display = show ? '' : 'none';
        }
    }
    
    /**
     * Adiciona ou remove classe
     */
    toggleClass(selector, className, add) {
        const element = this.querySelector(selector);
        if (element) {
            if (add) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        }
    }
    
    // ===== HOOKS PARA OVERRIDE =====
    
    /**
     * Verifica dependências necessárias
     */
    async checkDependencies() {
        // Override em subclasses
    }
    
    /**
     * Executado quando componente é montado
     */
    async onMount() {
        // Override em subclasses
    }
    
    /**
     * Executado quando componente é desmontado
     */
    async onUnmount() {
        // Override em subclasses
    }
}

export default BaseComponent;