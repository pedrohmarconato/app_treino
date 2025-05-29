// Arquivo principal que exporta todos os templates
import { modalPlanejamentoTemplate } from './modals.js';
window.modalPlanejamentoTemplate = modalPlanejamentoTemplate;
import { loginTemplate, loginStyles } from './login.js';
import { homeTemplate, homeStyles } from './home.js';
import { workoutTemplate, workoutStyles } from './workout.js';
import OrderWeekPage, { orderWeekStyles } from './OrderWeekPage.js';

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
        case 'orderWeek':
            containerEl.innerHTML = '';
            const root = document.createElement('div');
            root.id = 'order-week-root';
            containerEl.appendChild(root);
            // Renderização básica sem React: injeta HTML da OrderWeekPage diretamente
            root.innerHTML = `<div id="order-week-page"></div>`;
            window.renderOrderWeekPage && window.renderOrderWeekPage('order-week-page');
            break;
        default:
            console.error(`Template ${templateName} não encontrado`);
    }
}

// Função para adicionar páginas customizadas ao DOM
export function addCustomPages() {
    // Placeholder para futuras páginas customizadas
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
        ${orderWeekStyles}
    `;
    
    document.head.appendChild(styleElement);
}

// Função para inicializar o sistema de templates
export function initTemplates() {
    // Injeta os estilos dos templates
    injectTemplateStyles();
    
    // Renderiza a tela inicial (login)
    renderTemplate('login');
}

// Exporta templates individuais para uso direto
export {
    loginTemplate,
    homeTemplate,
    workoutTemplate,
    workoutStyles,
};