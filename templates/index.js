// Arquivo principal que exporta todos os templates
import { loginTemplate, loginStyles } from './login.js';
import { homeTemplate, homeStyles } from './home.js';
import { workoutTemplate, exerciseItemTemplate, seriesItemTemplate, workoutStyles } from './workout.js';
import { weekPlanningModalTemplate, modalStyles } from './modals.js';

// Função para renderizar um template no DOM
export function renderTemplate(templateName, container = 'app') {
    const containerEl = typeof container === 'string' 
        ? document.getElementById(container) 
        : container;
    
    if (!containerEl) {
        console.error(`Container ${container} não encontrado`);
        return;
    }
    
    switch(templateName) {
        case 'login':
            containerEl.innerHTML = loginTemplate();
            break;
        case 'home':
            containerEl.innerHTML = homeTemplate();
            break;
        case 'workout':
            containerEl.innerHTML = workoutTemplate();
            break;
        default:
            console.error(`Template ${templateName} não encontrado`);
    }
}

// Função para adicionar modais ao DOM
export function addModals() {
    // Verifica se o modal já existe antes de adicionar
    if (!document.getElementById('modal-planejamento')) {
        document.body.insertAdjacentHTML('beforeend', weekPlanningModalTemplate());
    }
}

// Função para injetar estilos específicos dos templates
export function injectTemplateStyles() {
    const styleId = 'template-styles';
    
    // Remove estilos anteriores se existirem
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
        existingStyles.remove();
    }
    
    // Cria novo elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        ${loginStyles}
        ${homeStyles}
        ${workoutStyles}
        ${modalStyles}
    `;
    
    document.head.appendChild(styleElement);
}

// Função para inicializar o sistema de templates
export function initTemplates() {
    // Injeta os estilos dos templates
    injectTemplateStyles();
    
    // Adiciona os modais ao DOM
    addModals();
    
    // Renderiza a tela inicial (login)
    renderTemplate('login');
}

// Exporta templates individuais para uso direto
export {
    loginTemplate,
    homeTemplate,
    workoutTemplate,
    exerciseItemTemplate,
    seriesItemTemplate,
    weekPlanningModalTemplate
};