/**
 * 🎯 SISTEMA DE ÍCONES - Icons Utils
 * 
 * FUNÇÃO: Centralizar e padronizar todos os ícones SVG usados na aplicação.
 * 
 * RESPONSABILIDADES:
 * - Fornecer ícones SVG otimizados para cada tipo de treino e ação
 * - Substituir emojis por ícones consistentes e profissionais
 * - Organizar ícones por categoria (treinos, ações, status, grupos musculares)
 * - Garantir acessibilidade com labels e roles adequados
 * - Manter tamanhos e estilos consistentes em toda aplicação
 * - Fornecer variações (preenchido, outline, colored)
 * 
 * CATEGORIAS DE ÍCONES:
 * - Treinos: A (peito), B (costas), C (pernas), D (ombros/braços)
 * - Ações: play, pause, stop, next, previous, settings
 * - Status: completed, pending, failed, loading
 * - Grupos Musculares: biceps, triceps, peito, costas, pernas, etc.
 * - Interface: menu, close, edit, save, delete
 * 
 * PADRÕES:
 * - SVGs inline para performance (sem requisições HTTP)
 * - Viewbox 24x24 para consistência
 * - Cores CSS customizáveis via currentColor
 * - Stroke-width padrão de 2px para melhor legibilidade
 * 
 * USO: getWorkoutIcon(), getActionIcon(), getMuscleIcon()
 */

export const AppIcons = {
    // Tipos de Treino - Design Flat Moderno baseado em pesquisa 2024
    workouts: {
        peito: `<svg class="app-icon workout-icon" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 4C14 4 12 5 11 7C10 9 10 12 10 14C10 18 13 22 16 24C19 22 22 18 22 14C22 12 22 9 21 7C20 5 18 4 16 4Z" opacity="0.8"/>
            <rect x="12" y="10" width="8" height="2" rx="1"/>
            <rect x="12" y="14" width="8" height="2" rx="1"/>
            <circle cx="16" cy="8" r="1.5"/>
        </svg>`,
        
        costas: `<svg class="app-icon workout-icon" viewBox="0 0 32 32" fill="currentColor">
            <path d="M12 6C11 6 10 7 10 8V24C10 25 11 26 12 26H20C21 26 22 25 22 24V8C22 7 21 6 20 6H12Z" opacity="0.8"/>
            <path d="M14 10L16 12L18 10" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.6"/>
            <path d="M14 15L16 17L18 15" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.6"/>
            <circle cx="13" cy="8" r="1"/>
            <circle cx="19" cy="8" r="1"/>
        </svg>`,
        
        pernas: `<svg class="app-icon workout-icon" viewBox="0 0 32 32" fill="currentColor">
            <ellipse cx="13" cy="8" rx="2" ry="6" opacity="0.8"/>
            <ellipse cx="19" cy="8" rx="2" ry="6" opacity="0.8"/>
            <rect x="12" y="14" width="2" height="14" rx="1"/>
            <rect x="18" y="14" width="2" height="14" rx="1"/>
            <circle cx="13" cy="26" r="2" opacity="0.6"/>
            <circle cx="19" cy="26" r="2" opacity="0.6"/>
        </svg>`,
        
        ombros: `<svg class="app-icon workout-icon" viewBox="0 0 32 32" fill="currentColor">
            <circle cx="16" cy="6" r="2"/>
            <ellipse cx="8" cy="12" rx="4" ry="3" opacity="0.8"/>
            <ellipse cx="24" cy="12" rx="4" ry="3" opacity="0.8"/>
            <rect x="15" y="16" width="2" height="12" rx="1"/>
            <path d="M12 18L10 20" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M20 18L22 20" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>`,
        
        bracos: `<svg class="app-icon workout-icon" viewBox="0 0 32 32" fill="currentColor">
            <circle cx="12" cy="6" r="2"/>
            <ellipse cx="12" cy="14" rx="2.5" ry="6" opacity="0.8"/>
            <ellipse cx="20" cy="16" rx="2" ry="4" opacity="0.8"/>
            <rect x="11" y="20" width="2" height="8" rx="1"/>
            <circle cx="20" cy="22" r="1.5"/>
        </svg>`,
        
        cardio: `<svg class="app-icon workout-icon" viewBox="0 0 32 32" fill="currentColor">
            <path d="M28 16H24L21 26L11 6L8 16H4" stroke="currentColor" stroke-width="2.5" fill="none"/>
            <circle cx="16" cy="8" r="1.5"/>
            <path d="M10 10L14 14" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
            <path d="M18 14L22 10" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
        </svg>`,
        
        core: `<svg class="app-icon workout-icon" viewBox="0 0 32 32" fill="currentColor">
            <rect x="12" y="10" width="8" height="12" rx="3" opacity="0.8"/>
            <rect x="13" y="13" width="6" height="1.5" rx="0.5"/>
            <rect x="13" y="16" width="6" height="1.5" rx="0.5"/>
            <rect x="13" y="19" width="6" height="1.5" rx="0.5"/>
            <circle cx="16" cy="6" r="1.5"/>
        </svg>`,
        
        descanso: `<svg class="app-icon workout-icon rest-icon" viewBox="0 0 32 32" fill="currentColor">
            <path d="M26 16.79A10 10 0 1 1 15.21 6A8 8 0 0 0 26 16.79z" opacity="0.3"/>
            <path d="M16 10V16L20 20" stroke="currentColor" stroke-width="2" fill="none"/>
            <circle cx="10" cy="10" r="1"/>
            <circle cx="22" cy="10" r="1"/>
            <circle cx="10" cy="22" r="1"/>
            <path d="M20 6C20 6 22 8 22 10" stroke="currentColor" stroke-width="1" fill="none" opacity="0.5"/>
        </svg>`
    },
    
    // Grupos Musculares (baseado no muscles icon pack)
    muscles: {
        peito: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <path d="M12 2C14 2 16 3 17 5L19 8C20 10 20 12 19 14L17 17C16 19 14 20 12 20C10 20 8 19 7 17L5 14C4 12 4 10 5 8L7 5C8 3 10 2 12 2Z" stroke-width="2" fill="none"/>
            <path d="M9 8C9 8 10 10 12 10C14 10 15 8 15 8" stroke-width="2" fill="none"/>
            <circle cx="8" cy="9" r="1" fill="currentColor"/>
            <circle cx="16" cy="9" r="1" fill="currentColor"/>
        </svg>`,
        
        costas: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <path d="M12 2L8 4V8L6 10V14L8 16V20L12 22L16 20V16L18 14V10L16 8V4L12 2Z" stroke-width="2" fill="none"/>
            <line x1="12" y1="2" x2="12" y2="22" stroke-width="2"/>
            <path d="M8 8C8 8 10 9 12 9C14 9 16 8 16 8" stroke-width="2" fill="none"/>
        </svg>`,
        
        pernas: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <path d="M9 2H11V10L9 12V22H7V12L9 10V2Z" stroke-width="2" fill="none"/>
            <path d="M13 2H15V10L17 12V22H15V12L13 10V2Z" stroke-width="2" fill="none"/>
            <circle cx="8" cy="17" r="2" stroke-width="2" fill="none"/>
            <circle cx="16" cy="17" r="2" stroke-width="2" fill="none"/>
        </svg>`,
        
        ombros: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <path d="M4 8C4 6 6 4 8 4H16C18 4 20 6 20 8V10C20 12 18 14 16 14H8C6 14 4 12 4 10V8Z" stroke-width="2" fill="none"/>
            <circle cx="8" cy="9" r="2" stroke-width="2" fill="none"/>
            <circle cx="16" cy="9" r="2" stroke-width="2" fill="none"/>
            <line x1="12" y1="14" x2="12" y2="20" stroke-width="2"/>
        </svg>`,
        
        biceps: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <path d="M8 4C8 4 10 2 12 2C14 2 16 4 16 4V12C16 12 14 14 12 14C10 14 8 12 8 12V4Z" stroke-width="2" fill="none"/>
            <path d="M10 8C10 8 11 10 12 10C13 10 14 8 14 8" stroke-width="2" fill="none"/>
            <line x1="12" y1="14" x2="12" y2="22" stroke-width="2"/>
            <path d="M10 20L12 22L14 20" stroke-width="2" fill="none"/>
        </svg>`,
        
        triceps: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <path d="M12 2V10C10 10 8 12 8 14V22H10V14C10 13 11 12 12 12C13 12 14 13 14 14V22H16V14C16 12 14 10 12 10V2" stroke-width="2" fill="none"/>
            <circle cx="12" cy="6" r="2" stroke-width="2" fill="none"/>
            <path d="M9 18H15" stroke-width="2" fill="none"/>
        </svg>`,
        
        gluteos: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <path d="M8 4C8 4 8 8 10 10C11 11 12 11 12 11C12 11 13 11 14 10C16 8 16 4 16 4C16 4 18 6 18 10C18 14 16 16 14 18L12 20L10 18C8 16 6 14 6 10C6 6 8 4 8 4Z" stroke-width="2" fill="none"/>
            <circle cx="10" cy="8" r="1" fill="currentColor"/>
            <circle cx="14" cy="8" r="1" fill="currentColor"/>
        </svg>`,
        
        abdomen: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <rect x="8" y="4" width="8" height="16" rx="2" stroke-width="2" fill="none"/>
            <line x1="8" y1="8" x2="16" y2="8" stroke-width="2"/>
            <line x1="8" y1="12" x2="16" y2="12" stroke-width="2"/>
            <line x1="8" y1="16" x2="16" y2="16" stroke-width="2"/>
            <line x1="12" y1="4" x2="12" y2="20" stroke-width="1" opacity="0.5"/>
        </svg>`,
        
        panturrilha: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <path d="M10 2V10C8 10 6 12 6 14C6 16 8 18 10 18V22H14V18C16 18 18 16 18 14C18 12 16 10 14 10V2" stroke-width="2" fill="none"/>
            <ellipse cx="12" cy="14" rx="4" ry="3" stroke-width="2" fill="none"/>
        </svg>`,
        
        antebraco: `<svg class="app-icon muscle-icon" viewBox="0 0 24 24">
            <path d="M10 2L8 8V16L10 22H14L16 16V8L14 2H10Z" stroke-width="2" fill="none"/>
            <path d="M10 8C10 8 11 10 12 10C13 10 14 8 14 8" stroke-width="2" fill="none"/>
            <line x1="10" y1="14" x2="14" y2="14" stroke-width="2"/>
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
        </svg>`,
        
        chart: `<svg class="app-icon" viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <path d="M3 19L3 9" stroke-width="2" stroke-linecap="round"/>
            <path d="M8 19L8 6" stroke-width="2" stroke-linecap="round"/>
            <path d="M13 19L13 12" stroke-width="2" stroke-linecap="round"/>
            <path d="M18 19L18 15" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 19L21 19" stroke-width="2" stroke-linecap="round"/>
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

// Função para obter ícone de grupo muscular
export function getMuscleIcon(muscle, size = 'medium') {
    const normalizedMuscle = muscle.toLowerCase().replace(/[^\w]/g, '');
    const icon = AppIcons.muscles[normalizedMuscle] || AppIcons.muscles.peito;
    
    // Adicionar classes de tamanho
    const sizeClass = size === 'small' ? 'icon-small' : size === 'large' ? 'icon-large' : '';
    
    return icon
        .replace('class="app-icon muscle-icon"', `class="app-icon muscle-icon ${sizeClass}"`)
        .trim();
}

// Exportação default com todos os ícones e funções
export default {
    icons: AppIcons,
    getWorkoutIcon,
    getActionIcon,
    getAchievementIcon,
    getNavigationIcon,
    getIconForWorkoutType,
    getMuscleIcon,
    workoutTypeMap
};

// Também expor globalmente para scripts não-modulares
if (typeof window !== 'undefined') {
    window.getWorkoutIcon = getWorkoutIcon;
    window.getIconForWorkoutType = getIconForWorkoutType;
    window.workoutTypeMap = workoutTypeMap;
}