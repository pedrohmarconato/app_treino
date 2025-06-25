/**
 * Carrossel Infinito de Semana de Treino
 */

class WeekCarouselInfinite {
    constructor() {
        this.carousel = null;
        this.currentIndex = 0;
        this.days = [];
        this.isAnimating = false;
        this.dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    }

    init() {
        // Adiciona classe de snapping e smooth scroll caso não exista
        if (!document.getElementById('week-carousel-style-enhanced')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'week-carousel-style-enhanced';
            styleTag.textContent = `
                #week-carousel {
                    scroll-snap-type: x mandatory;
                    scroll-behavior: smooth;
                    overflow-x: auto;
                }
                #week-carousel .carousel-day {
                    scroll-snap-align: center;
                }
            `;
            document.head.appendChild(styleTag);
        }
        console.log('[WeekCarousel] Iniciando carrossel...');
        this.carousel = document.getElementById('week-carousel');
        if (!this.carousel) {
            console.log('[WeekCarousel] Elemento week-carousel não encontrado, aguardando...');
            // Caso ainda não exista, observa o DOM até aparecer
            const observer = new MutationObserver((mutations, obs) => {
                const el = document.getElementById('week-carousel');
                if (el) {
                    console.log('[WeekCarousel] Elemento week-carousel encontrado!');
                    obs.disconnect();
                    this.carousel = el;
                    this.init(); // reinicializa agora que o elemento existe
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            return;
        }

        console.log('[WeekCarousel] Elemento encontrado, gerando dias...');
        // Gera os dias da semana
        this.generateDays();
        
        console.log('[WeekCarousel] Renderizando carrossel...');
        // Renderiza o carrossel
        this.render();
        
        console.log('[WeekCarousel] Centralizando no dia atual...');
        // Centraliza no dia atual
        this.centerOnToday();
        
        console.log('[WeekCarousel] Atualizando dots...');

        // Escuta scroll para detectar dia central após interação manual
        this.setupScrollListener();
        // Atualiza os dots
        this.updateDots();
        
        console.log('[WeekCarousel] ✅ Carrossel inicializado com sucesso!');
    }

    generateDays() {
        const today = new Date();
        const currentDayOfWeek = today.getDay();
        
        // Gera 7 dias da semana atual (domingo a sábado)
        this.days = [];
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayOfWeek);
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const isToday = date.toDateString() === today.toDateString();
            const isCompleted = date < today && !isToday;
            
            this.days.push({
                date,
                dayNumber: date.getDate(),
                dayName: this.dayNames[date.getDay()],
                isToday,
                isCompleted,
                workoutType: this.getWorkoutType(date.getDay()),
                index: i
            });
        }
    }

    getWorkoutType(dayOfWeek) {
        // Simulação de tipos de treino - substituir com dados reais
        // Mapear dias da semana para grupos musculares padrão do app
        const workouts = ['peito', 'costas', 'pernas', 'ombros', 'bracos', 'cardio', 'descanso'];
        return workouts[dayOfWeek];
    }

    render() {
        if (!this.carousel) return;

        this.carousel.innerHTML = '';
        
        // Renderiza apenas 7 dias
        this.days.forEach((day, index) => {
            const dayElement = this.createDayElement(day, index);
            this.carousel.appendChild(dayElement);
        });
    }

    createDayElement(day, index) {
        const div = document.createElement('div');
        div.className = `carousel-day ${day.isToday ? 'current' : ''} ${day.isCompleted ? 'completed' : ''}`;
        div.dataset.index = index;
        
        div.innerHTML = `
            <div class="day-number">${day.dayNumber}</div>
            <div class="day-name">${day.dayName}</div>
            <div class="day-workout-icon">
                ${this.getWorkoutIcon(day.workoutType)}
            </div>
        `;
        
        div.addEventListener('click', () => this.selectDay(index));
        
        return div;
    }

    getWorkoutIcon(type) {
        if (typeof window.getWorkoutIcon === 'function') {
            return window.getWorkoutIcon(type, 'small');
        }
        // Fallback simples caso util não esteja carregado
        return `<span>${type}</span>`;
    }

    centerOnToday() {
        const todayIndex = this.days.findIndex(day => day.isToday);
        if (todayIndex !== -1) {
            this.scrollToIndex(todayIndex, false);
        }
    }

    selectDay(index) {
        if (this.isAnimating) return;
        
        // Remove current de todos
        document.querySelectorAll('.carousel-day').forEach(el => {
            el.classList.remove('current');
        });
        
        // Adiciona current ao selecionado
        const selectedDay = document.querySelector(`.carousel-day[data-index="${index}"]`);
        if (selectedDay) {
            selectedDay.classList.add('current');
            this.scrollToIndex(index);
            
            // Integrar com handleDayClick para mostrar detalhes do treino
            const dayData = this.days[index];
            if (dayData && typeof window.handleDayClick === 'function') {
                // Calcular o índice do dia baseado na data
                const today = new Date();
                const dayDate = dayData.date;
                const diffTime = dayDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const dayIndex = today.getDay() + diffDays;
                
                // Chamar handleDayClick com o índice correto e status de completado
                window.handleDayClick(dayIndex, dayData.isCompleted || false);
            }
        }
    }

    scrollToIndex(index, animate = true) {
        if (!this.carousel) return;

        const items = this.carousel.querySelectorAll('.carousel-day');
        if (!items[index]) return;
        const dayElement = items[index];
        const containerRect = this.carousel.getBoundingClientRect();
        const dayRect = dayElement.getBoundingClientRect();

        // Calcula deslocamento necessário para centralizar
        const scrollPosition = this.carousel.scrollLeft + dayRect.left - containerRect.left - (containerRect.width / 2) + (dayRect.width / 2);

        if (animate) {
            this.isAnimating = true;
            this.carousel.scrollTo({ left: scrollPosition, behavior: 'smooth' });
            // Libera flag após animação aproximada (depende do device)
            setTimeout(() => { this.isAnimating = false; }, 600);
        } else {
            this.carousel.scrollLeft = scrollPosition;
        }

        this.currentIndex = index;
        this.updateDots();
    }

    /**
     * Adiciona listener de scroll para identificar o item mais próximo do centro
     * e marcá-lo como current, garantindo consistência mesmo quando o usuário
     * rola manualmente.
     */
    setupScrollListener() {
        if (!this.carousel) return;
        // Evita múltiplos listeners
        if (this._scrollListenerAttached) return;
        this._scrollListenerAttached = true;
        let debounce;
        this.carousel.addEventListener('scroll', () => {
            if (this.isAnimating) return;
            if (debounce) clearTimeout(debounce);
            debounce = setTimeout(() => {
                const center = this.carousel.scrollLeft + (this.carousel.offsetWidth / 2);
                const items = Array.from(this.carousel.querySelectorAll('.carousel-day'));
                let closestIdx = 0;
                let minDist = Infinity;
                items.forEach((el, idx) => {
                    const elCenter = el.offsetLeft + (el.offsetWidth / 2);
                    const dist = Math.abs(center - elCenter);
                    if (dist < minDist) {
                        minDist = dist;
                        closestIdx = idx;
                    }
                });
                if (closestIdx !== this.currentIndex) {
                    // Não chama scrollToIndex para evitar recursão, apenas atualiza estado
                    this.currentIndex = closestIdx;
                    // Atualiza classe visual
                    items.forEach(el => el.classList.remove('current'));
                    if (items[closestIdx]) items[closestIdx].classList.add('current');
                    this.updateDots();
                }
            }, 100);
        }, { passive: true });
    }

    updateDots() {
        const dotsContainer = document.getElementById('carousel-dots');
        if (!dotsContainer) return;
        
        dotsContainer.innerHTML = '';
        
        // Cria apenas 7 dots (uma semana)
        const startIndex = Math.floor(this.currentIndex / 7) * 7;
        for (let i = 0; i < 7; i++) {
            const dot = document.createElement('div');
            dot.className = `carousel-dot ${startIndex + i === this.currentIndex ? 'active' : ''}`;
            dot.addEventListener('click', () => this.selectDay(startIndex + i));
            dotsContainer.appendChild(dot);
        }
    }
}

// Função de navegação global
window.navigateCarousel = function(direction) {
    if (!window.weekCarouselInfinite || window.weekCarouselInfinite.isAnimating) return;
    
    const newIndex = window.weekCarouselInfinite.currentIndex + direction;
    if (newIndex >= 0 && newIndex < window.weekCarouselInfinite.days.length) {
        window.weekCarouselInfinite.selectDay(newIndex);
    }
};

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.weekCarouselInfinite = new WeekCarouselInfinite();
    window.weekCarouselInfinite.init();
});

// Re-inicializa quando a home for carregada
window.addEventListener('homeLoaded', () => {
    if (window.weekCarouselInfinite) {
        window.weekCarouselInfinite.init();
    }
});
