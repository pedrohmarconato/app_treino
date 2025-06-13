// icons.js - Sistema de Ícones Customizados para App Treino
// Substitui completamente o uso de emojis por SVGs otimizados

export const AppIcons = {
    // Tipos de Treino
    workouts: {
        peito: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M12 2L6 7V10C6 16 12 21 12 21C12 21 18 16 18 10V7L12 2Z" />
            <path d="M9 12H15" />
            <path d="M12 9V15" />
        </svg>`,
        
        costas: `<svg class="app-icon" viewBox="0 0 24 24">
            <rect x="6" y="4" width="12" height="16" rx="2" />
            <path d="M9 8L12 11L15 8" />
            <path d="M9 13L12 16L15 13" />
        </svg>`,
        
        pernas: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M10 2V10C10 11 9 12 8 12C7 12 6 11 6 10V8" />
            <path d="M14 2V10C14 11 15 12 16 12C17 12 18 11 18 10V8" />
            <path d="M10 12V22" />
            <path d="M14 12V22" />
            <circle cx="10" cy="7" r="1" />
            <circle cx="14" cy="7" r="1" />
        </svg>`,
        
        ombros: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M12 6C12 6 8 4 4 4C4 4 4 8 6 10L12 12L18 10C20 8 20 4 20 4C16 4 12 6 12 6Z" />
            <line x1="12" y1="12" x2="12" y2="20" />
        </svg>`,
        
        bracos: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M7 5C7 4 8 3 9 3C10 3 11 4 11 5V12L13 10L15 12C15 12 16 13 16 14V19C16 20 15 21 14 21H10C9 21 8 20 8 19V14" />
            <circle cx="9" cy="5" r="2" />
        </svg>`,
        
        cardio: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M22 12H18L15 21L9 3L6 12H2" />
        </svg>`,
        
        core: `<svg class="app-icon" viewBox="0 0 24 24">
            <rect x="8" y="6" width="8" height="12" rx="1" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="16" y2="14" />
            <line x1="12" y1="6" x2="12" y2="18" />
        </svg>`,
        
        descanso: `<svg class="app-icon partial-fill" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79z" />
        </svg>`
    },
    
    // Estados e Ações
    actions: {
        play: `<svg class="app-icon filled" viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>`,
        
        pause: `<svg class="app-icon" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
        </svg>`,
        
        stop: `<svg class="app-icon" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
        </svg>`,
        
        check: `<svg class="app-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12L11 14L15 10" />
        </svg>`,
        
        checkFilled: `<svg class="app-icon filled" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12L11 14L15 10" stroke="var(--bg-primary)" fill="none" />
        </svg>`,
        
        progress: `<svg class="app-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2C6.5 2 2 6.5 2 12" stroke-dasharray="5 5" />
        </svg>`,
        
        timer: `<svg class="app-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9V13L15 16" />
            <path d="M9 1H15" />
        </svg>`,
        
        repeat: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M17 1L21 5L17 9" />
            <path d="M3 11V9C3 5 7 1 11 1H21" />
            <path d="M7 23L3 19L7 15" />
            <path d="M21 13V15C21 19 17 23 13 23H3" />
        </svg>`,
        
        weight: `<svg class="app-icon" viewBox="0 0 24 24">
            <rect x="6" y="11" width="12" height="2" />
            <rect x="3" y="8" width="3" height="8" rx="1" />
            <rect x="18" y="8" width="3" height="8" rx="1" />
            <rect x="8" y="9" width="2" height="6" />
            <rect x="14" y="9" width="2" height="6" />
        </svg>`,
        
        edit: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M11 4H4C3 4 2 5 2 6V20C2 21 3 22 4 22H18C19 22 20 21 20 20V13" />
            <path d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" />
        </svg>`,
        
        add: `<svg class="app-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
        </svg>`,
        
        remove: `<svg class="app-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
        </svg>`,
        
        close: `<svg class="app-icon" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>`
    },
    
    // Conquistas e Gamificação
    achievements: {
        trophy: `<svg class="app-icon filled" viewBox="0 0 24 24">
            <path d="M7 2H17C18 2 19 3 19 4V7C19 9 17 11 15 11H9C7 11 5 9 5 7V4C5 3 6 2 7 2Z" />
            <path d="M12 11V17" />
            <path d="M9 17H15" />
            <path d="M10 21H14" />
        </svg>`,
        
        star: `<svg class="app-icon filled" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>`,
        
        fire: `<svg class="app-icon partial-fill" viewBox="0 0 24 24">
            <path d="M19 12C19 18 15 22 12 22C9 22 5 18 5 12C5 8 7 2 12 2C12 5 15 5 15 9C15 9 19 8 19 12Z" />
        </svg>`,
        
        target: `<svg class="app-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>`,
        
        medal: `<svg class="app-icon filled" viewBox="0 0 24 24">
            <path d="M12 15C15.87 15 19 11.87 19 8C19 4.13 15.87 1 12 1C8.13 1 5 4.13 5 8C5 11.87 8.13 15 12 15Z" />
            <path d="M8 14L7 23L12 20L17 23L16 14" stroke="var(--accent-green)" fill="none" />
        </svg>`,
        
        crown: `<svg class="app-icon filled" viewBox="0 0 24 24">
            <path d="M5 16L3 7L8 10L12 4L16 10L21 7L19 16H5Z" />
            <rect x="5" y="18" width="14" height="3" />
        </svg>`
    },
    
    // Navegação e Interface
    navigation: {
        home: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M3 12L5 10V20C5 21 6 22 7 22H17C18 22 19 21 19 20V10L21 12L12 3L3 12Z" />
            <path d="M9 22V12H15V22" />
        </svg>`,
        
        calendar: `<svg class="app-icon" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <rect x="8" y="14" width="2" height="2" />
            <rect x="14" y="14" width="2" height="2" />
        </svg>`,
        
        stats: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20V14" />
        </svg>`,
        
        profile: `<svg class="app-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21C20 17 16 14 12 14C8 14 4 17 4 21" />
        </svg>`,
        
        settings: `<svg class="app-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1V6M12 18V23M4.22 4.22L7.05 7.05M16.95 16.95L19.78 19.78M1 12H6M18 12H23M4.22 19.78L7.05 16.95M16.95 7.05L19.78 4.22" />
        </svg>`,
        
        notification: `<svg class="app-icon" viewBox="0 0 24 24">
            <path d="M18 8C18 6.4 17.4 5 16.3 3.9C15.2 2.8 13.6 2 12 2C10.4 2 8.8 2.8 7.7 3.9C6.6 5 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
            <path d="M13.73 21C13.5 21.5 13 22 12.5 22.2C12 22.4 11.5 22.4 11 22.2C10.5 22 10 21.5 9.73 21" />
        </svg>`,
        
        back: `<svg class="app-icon" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>`,
        
        forward: `<svg class="app-icon" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>`
    },
    
    // Feedback e Status
    feedback: {
        success: `<svg class="app-icon icon-success filled" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12L11 14L15 10" stroke="var(--bg-primary)" fill="none" />
        </svg>`,
        
        warning: `<svg class="app-icon icon-warning" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18C1.64 18.33 1.64 18.67 1.82 19C2 19.33 2.34 19.5 2.69 19.5H21.31C21.66 19.5 22 19.33 22.18 19C22.36 18.67 22.36 18.33 22.18 18L13.71 3.86C13.53 3.53 13.19 3.36 12.84 3.36C12.49 3.36 12.15 3.53 11.97 3.86H10.29Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>`,
        
        error: `<svg class="app-icon icon-error" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>`,
        
        info: `<svg class="app-icon icon-info" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>`
    }
};

// Funções auxiliares para uso dos ícones
export function getWorkoutIcon(type, size = 'medium', animated = false) {
    const normalizedType = type.toLowerCase().replace(/[^\w]/g, '');
    const icon = AppIcons.workouts[normalizedType] || AppIcons.workouts.peito;
    
    // Adicionar classes de tamanho e animação
    const sizeClass = size === 'small' ? 'icon-small' : size === 'large' ? 'icon-large' : '';
    const animClass = animated ? 'icon-bounce' : '';
    
    return icon
        .replace('class="app-icon"', `class="app-icon ${sizeClass} ${animClass}"`)
        .trim();
}

export function getActionIcon(action, state = 'default') {
    const icon = AppIcons.actions[action] || AppIcons.actions.play;
    
    // Adicionar classes de estado
    const stateClass = state === 'active' ? 'icon-active' : state === 'disabled' ? 'icon-disabled' : '';
    
    return icon
        .replace('class="app-icon"', `class="app-icon ${stateClass}"`)
        .trim();
}

export function getAchievementIcon(type, animated = true) {
    const icon = AppIcons.achievements[type] || AppIcons.achievements.star;
    
    // Achievements geralmente têm animações
    const animClass = animated ? 'icon-pulse icon-active' : '';
    
    return icon
        .replace('class="app-icon"', `class="app-icon ${animClass}"`)
        .trim();
}

export function getNavigationIcon(nav, isActive = false) {
    const icon = AppIcons.navigation[nav] || AppIcons.navigation.home;
    
    // Navegação ativa tem estilo diferente
    const activeClass = isActive ? 'icon-active' : '';
    
    return icon
        .replace('class="app-icon"', `class="app-icon ${activeClass}"`)
        .trim();
}

// Mapeamento de tipos de treino para ícones
export const workoutTypeMap = {
    'A': 'peito',
    'B': 'costas', 
    'C': 'pernas',
    'D': 'ombros',
    'E': 'bracos',
    'Cardio': 'cardio',
    'Core': 'core',
    'Descanso': 'descanso',
    'Rest': 'descanso'
};

// Função para converter tipo de treino em ícone
export function getIconForWorkoutType(workoutType) {
    const iconType = workoutTypeMap[workoutType] || 'peito';
    return getWorkoutIcon(iconType);
}

// Exportação default com todos os ícones e funções
export default {
    icons: AppIcons,
    getWorkoutIcon,
    getActionIcon,
    getAchievementIcon,
    getNavigationIcon,
    getIconForWorkoutType,
    workoutTypeMap
};