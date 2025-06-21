# 🎭 Modal Components - Guia Completo

## Visão Geral

Sistema de modais WCAG 2.2 compliant implementado para o sistema de persistência de treino. Todos os modais seguem padrões de acessibilidade rigorosos com focus trap, keyboard navigation e ARIA labels adequados.

## 🏗️ Arquitetura dos Modais

### Padrões Implementados
- **WCAG 2.2 AA Compliance**: Todos os modais seguem diretrizes de acessibilidade
- **Focus Trap**: Navegação por teclado contida dentro do modal
- **ESC Key Handling**: Fechamento via tecla ESC obrigatório
- **ARIA Integration**: Labels, roles e descriptions apropriados
- **Overlay Management**: Background overlay com click-to-close opcional

### Estrutura Base
```html
<div class="modal-overlay" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modal-title">Título do Modal</h2>
            <button class="btn-close" aria-label="Fechar modal"></button>
        </div>
        <div class="modal-body">
            <p id="modal-description">Conteúdo do modal</p>
        </div>
        <div class="modal-actions">
            <!-- Botões de ação -->
        </div>
    </div>
</div>
```

## 💾 SaveExitModal

### Descrição
Modal de confirmação exibido quando o usuário tenta navegar durante um treino ativo. Oferece três opções: salvar e sair, sair sem salvar, ou cancelar.

### Funcionalidades
- **Proteção de Dados**: Previne perda acidental de progresso
- **Preview do Treino**: Mostra informações do treino atual
- **Três Ações Claras**: Opções bem definidas para o usuário
- **Auto-save Option**: Permite salvar automaticamente antes de sair

### Implementação

#### Constructor
```javascript
const modal = new SaveExitModal(workoutState, options = {});
```

**Parâmetros:**
- `workoutState` (Object): Estado atual do treino
  - `currentWorkout`: Dados do treino
  - `exerciciosExecutados`: Lista de exercícios executados
  - `startTime`: Timestamp de início
  - `currentExerciseIndex`: Índice do exercício atual

- `options` (Object): Configurações opcionais
  - `enableAutoSave` (Boolean): Habilita auto-save (default: true)
  - `showProgress` (Boolean): Mostra progresso do treino (default: true)
  - `confirmationRequired` (Boolean): Requer confirmação dupla (default: false)

#### Método Principal

##### `show()`
Exibe o modal e retorna Promise com a decisão do usuário.

**Retorna:** `Promise<String>`

**Possíveis valores:**
- `'save-exit'`: Usuário escolheu salvar e sair
- `'exit-no-save'`: Usuário escolheu sair sem salvar  
- `'cancel'`: Usuário cancelou a ação

**Exemplo de uso:**
```javascript
const workoutState = await TreinoCacheService.getWorkoutState();
const modal = new SaveExitModal(workoutState);

try {
    const decision = await modal.show();
    
    switch (decision) {
        case 'save-exit':
            console.log('Salvando e saindo...');
            await TreinoCacheService.saveWorkoutState(workoutState, true);
            AppState.markDataAsSaved();
            navigateToHome();
            break;
            
        case 'exit-no-save':
            console.log('Saindo sem salvar...');
            await TreinoCacheService.clearWorkoutState();
            AppState.endWorkoutSession();
            navigateToHome();
            break;
            
        case 'cancel':
            console.log('Operação cancelada pelo usuário');
            // Permanecer na tela atual
            break;
    }
} catch (error) {
    console.error('Erro no modal:', error);
    // Fallback: usar confirm nativo
    const proceed = confirm('Deseja realmente sair? Dados não salvos serão perdidos.');
    if (proceed) navigateToHome();
}
```

### Estrutura HTML Gerada

```html
<div class="modal-overlay save-exit-modal" role="dialog" aria-labelledby="save-exit-title" aria-describedby="save-exit-description">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="save-exit-title">Treino em Andamento</h2>
            <button class="btn-close" aria-label="Fechar modal de confirmação">✕</button>
        </div>
        
        <div class="modal-body">
            <div class="warning-icon">⚠️</div>
            <p id="save-exit-description">
                Você tem um treino em andamento. O que deseja fazer?
            </p>
            
            <div class="workout-preview">
                <h3>Treino Atual</h3>
                <div class="preview-item">
                    <strong>Nome:</strong> <span class="workout-name">Treino A - Peito e Tríceps</span>
                </div>
                <div class="preview-item">
                    <strong>Progresso:</strong> <span class="workout-progress">3/8 exercícios</span>
                </div>
                <div class="preview-item">
                    <strong>Tempo:</strong> <span class="workout-time">25 minutos</span>
                </div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="btn-primary save-exit-btn" data-action="save-exit">
                <span class="btn-icon">💾</span>
                <span class="btn-text">Salvar e Sair</span>
            </button>
            
            <button class="btn-danger exit-no-save-btn" data-action="exit-no-save">
                <span class="btn-icon">🚫</span>
                <span class="btn-text">Sair sem Salvar</span>
            </button>
            
            <button class="btn-secondary cancel-btn" data-action="cancel">
                <span class="btn-icon">↩️</span>
                <span class="btn-text">Cancelar</span>
            </button>
        </div>
    </div>
</div>
```

### Acessibilidade

#### ARIA Attributes
- `role="dialog"`: Identifica como diálogo modal
- `aria-labelledby="save-exit-title"`: Título do modal
- `aria-describedby="save-exit-description"`: Descrição do conteúdo
- `aria-label` em botões: Descrições claras para screen readers

#### Keyboard Navigation
- **Tab/Shift+Tab**: Navegação entre elementos focusáveis
- **ESC**: Fecha modal (equivale a cancelar)
- **Enter/Space**: Ativa botão focado
- **Focus Trap**: Navegação contida dentro do modal

#### Focus Management
1. **Foco inicial**: No primeiro botão (Salvar e Sair)
2. **Navegação circular**: Último elemento volta ao primeiro
3. **Restauração**: Foco retorna ao elemento que abriu o modal

## 🔄 SessionRecoveryModal

### Descrição
Modal exibido no startup da aplicação quando detectada sessão de treino não finalizada. Permite ao usuário recuperar, descartar ou cancelar a recuperação.

### Funcionalidades
- **Detecção Automática**: Verifica sessão ao carregar aplicação
- **Preview Detalhado**: Mostra detalhes da sessão encontrada
- **Validação de Integridade**: Verifica se dados não estão corrompidos
- **TTL Verification**: Confirma se sessão não expirou

### Implementação

#### Constructor
```javascript
const modal = new SessionRecoveryModal(sessionData, options = {});
```

**Parâmetros:**
- `sessionData` (Object): Dados da sessão encontrada
  - `currentWorkout`: Workout em andamento
  - `exerciciosExecutados`: Exercícios já executados
  - `startTime`: Quando o treino começou
  - `metadata`: Informações de cache (savedAt, appVersion, etc.)

- `options` (Object): Configurações
  - `showTimestamp` (Boolean): Mostra quando foi salvo (default: true)
  - `showProgress` (Boolean): Mostra progresso detalhado (default: true)
  - `allowCancel` (Boolean): Permite cancelar sem escolher (default: true)

#### Método Principal

##### `show()`
Exibe modal de recuperação e retorna decisão do usuário.

**Retorna:** `Promise<String>`

**Possíveis valores:**
- `'recover'`: Recuperar sessão e continuar treino
- `'discard'`: Descartar dados e começar novo treino
- `'cancel'`: Cancelar operação (mantém cache intacto)

**Exemplo de uso:**
```javascript
// Verificar recovery no startup
const sessionData = await NavigationGuard.checkForRecovery();

if (sessionData) {
    const modal = new SessionRecoveryModal(sessionData);
    
    try {
        const decision = await modal.show();
        
        switch (decision) {
            case 'recover':
                console.log('Recuperando sessão...');
                AppState.set('isWorkoutActive', true);
                AppState.set('hasUnsavedData', true);
                
                // Restaurar estado da aplicação
                const workoutState = await TreinoCacheService.getWorkoutState();
                if (workoutState) {
                    restoreWorkoutExecution(workoutState);
                    navigateToWorkout();
                }
                break;
                
            case 'discard':
                console.log('Descartando sessão...');
                await TreinoCacheService.clearWorkoutState();
                AppState.endWorkoutSession();
                navigateToHome();
                break;
                
            case 'cancel':
                console.log('Cancelado pelo usuário');
                // Manter cache intacto, usuário pode recuperar depois
                navigateToHome();
                break;
        }
    } catch (error) {
        console.error('Erro no recovery modal:', error);
        // Fallback: limpar cache em caso de erro
        await TreinoCacheService.clearWorkoutState();
        navigateToHome();
    }
}
```

### Estrutura HTML Gerada

```html
<div class="modal-overlay session-recovery-modal" role="alertdialog" aria-labelledby="recovery-title" aria-describedby="recovery-description">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="recovery-title">Sessão de Treino Encontrada</h2>
            <button class="btn-close" aria-label="Fechar modal de recuperação">✕</button>
        </div>
        
        <div class="modal-body">
            <div class="recovery-icon">🔄</div>
            <p id="recovery-description">
                Encontramos uma sessão de treino não finalizada. Deseja continuar de onde parou?
            </p>
            
            <div class="session-preview">
                <h3>Detalhes da Sessão</h3>
                
                <div class="preview-grid">
                    <div class="preview-item">
                        <span class="item-label">Treino:</span>
                        <span class="item-value workout-name">Treino B - Costas e Bíceps</span>
                    </div>
                    
                    <div class="preview-item">
                        <span class="item-label">Progresso:</span>
                        <span class="item-value workout-progress">5/10 exercícios (50%)</span>
                    </div>
                    
                    <div class="preview-item">
                        <span class="item-label">Tempo decorrido:</span>
                        <span class="item-value workout-duration">18 minutos</span>
                    </div>
                    
                    <div class="preview-item">
                        <span class="item-label">Última atividade:</span>
                        <span class="item-value last-activity">há 2 horas</span>
                    </div>
                </div>
                
                <div class="exercises-preview">
                    <h4>Exercícios Executados</h4>
                    <ul class="exercises-list">
                        <li class="exercise-item completed">
                            ✅ Puxada Alta - 4 séries
                        </li>
                        <li class="exercise-item completed">
                            ✅ Remada Curvada - 3 séries
                        </li>
                        <li class="exercise-item in-progress">
                            🔄 Rosca Direta - 2/4 séries
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="data-info">
                <small class="text-muted">
                    Sessão salva automaticamente • Dados válidos • Sem corrupção detectada
                </small>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="btn-primary recover-btn" data-action="recover">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">Recuperar Treino</span>
            </button>
            
            <button class="btn-danger discard-btn" data-action="discard">
                <span class="btn-icon">🗑️</span>
                <span class="btn-text">Começar Novo</span>
            </button>
            
            <button class="btn-secondary cancel-btn" data-action="cancel">
                <span class="btn-icon">↩️</span>
                <span class="btn-text">Cancelar</span>
            </button>
        </div>
    </div>
</div>
```

### Preview Generation
O modal gera automaticamente preview dos dados da sessão:

```javascript
generatePreview(sessionData) {
    const { currentWorkout, exerciciosExecutados, startTime, metadata } = sessionData;
    
    // Calcular progresso
    const totalExercises = currentWorkout.exercicios?.length || 0;
    const completedExercises = exerciciosExecutados?.length || 0;
    const progress = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
    
    // Calcular tempo decorrido
    const elapsed = Date.now() - startTime;
    const timeElapsed = this.formatDuration(Math.round(elapsed / 60000));
    
    // Calcular tempo desde última atividade
    const lastActivity = metadata?.savedAt ? 
        this.formatRelativeTime(new Date(metadata.savedAt)) : 
        'Desconhecido';
    
    return {
        workoutName: currentWorkout?.nome || 'Treino sem nome',
        progress: `${completedExercises}/${totalExercises} exercícios (${progress}%)`,
        timeElapsed,
        lastActivity,
        exercisesList: this.generateExercisesList(exerciciosExecutados, currentWorkout)
    };
}
```

## 📋 DisposicaoInicioModal

### Descrição
Modal de disposição exibido antes do início do treino para coletar feedback sobre o estado do usuário.

### Funcionalidades
- **Escala de Energia**: 0-5 para nível de energia atual
- **Radio Group**: Seleção única obrigatória
- **Validação**: Não permite continuar sem seleção
- **Persistência**: Salva valor em pre_workout

### Implementação

#### Constructor
```javascript
const modal = new DisposicaoInicioModal(options = {});
```

#### Método Principal

##### `show()`
Exibe modal e retorna valor selecionado.

**Retorna:** `Promise<Number>` - Valor de 0-5 da escala de energia

**Exemplo de uso:**
```javascript
const modal = new DisposicaoInicioModal();
const energia = await modal.show();

// Salvar no banco de dados
await salvarPreWorkout(userId, energia);

// Iniciar treino com contexto de energia
iniciarTreinoComEnergia(energia);
```

### Estrutura das Opções

```javascript
const opcoes = [
    { value: 0, label: 'Exausto', description: 'Sem energia nenhuma' },
    { value: 1, label: 'Muito Cansado', description: 'Difícil treinar' },
    { value: 2, label: 'Pouca Energia', description: 'Treino leve' },
    { value: 3, label: 'Normal', description: 'Energia normal' },
    { value: 4, label: 'Animado', description: 'Pronto para treinar' },
    { value: 5, label: 'Máxima Energia', description: 'Vou dar tudo!' }
];
```

## 🎨 Styling e CSS

### Classes CSS Principais

#### Modal Overlay
```css
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
}
```

#### Modal Content
```css
.modal-content {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-modal);
    animation: modalAppear 0.3s ease;
}
```

#### Botões de Ação
```css
.modal-actions {
    display: flex;
    gap: 12px;
    padding: 24px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.modal-actions .btn-primary {
    background: var(--accent-green);
    color: var(--bg-primary);
}

.modal-actions .btn-danger {
    background: var(--accent-red);
    color: white;
}
```

### Animações

#### Entrada do Modal
```css
@keyframes modalAppear {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}
```

#### Loading States
```css
.modal-loading {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-secondary);
}

.modal-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-top: 2px solid var(--accent-green);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
```

## 🔧 Configuração e Personalização

### Configurações Globais

```javascript
// Configurar comportamento dos modais
ModalConfig.setup({
    closeOnOverlayClick: false,  // Para modais críticos
    escapeToClose: true,         // ESC sempre fecha
    focusFirstButton: true,      // Foco no primeiro botão
    animationDuration: 300,      // Duração das animações
    zIndex: 10000               // Z-index base
});
```

### Temas Personalizados

```css
/* Tema escuro (padrão) */
.modal-overlay.dark-theme {
    --modal-bg: #101010;
    --modal-text: #ffffff;
    --modal-border: #333333;
}

/* Tema claro (opcional) */
.modal-overlay.light-theme {
    --modal-bg: #ffffff;
    --modal-text: #000000;
    --modal-border: #e0e0e0;
}
```

## 🧪 Testing

### Testes de Acessibilidade

```javascript
// Verificar conformidade WCAG 2.2
await testModalAccessibility('SaveExitModal');
await testModalAccessibility('SessionRecoveryModal');
await testModalAccessibility('DisposicaoInicioModal');

// Verificar navegação por teclado
await testKeyboardNavigation(modalElement);

// Verificar focus trap
await testFocusTrap(modalElement);
```

### Testes de Funcionalidade

```javascript
// Testar fluxos completos
const saveExitTest = async () => {
    const modal = new SaveExitModal(mockWorkoutData);
    const decision = await modal.show();
    assert(decision === 'save-exit');
};

const recoveryTest = async () => {
    const modal = new SessionRecoveryModal(mockSessionData);
    const result = await modal.show();
    assert(result === 'recover');
};
```

## 🚨 Error Handling

### Padrões de Erro

Todos os modais implementam error handling robusto:

1. **Try/Catch Blocks**: Operações protegidas
2. **Fallback Modals**: confirm() nativo em caso de falha
3. **Validation**: Entrada do usuário sempre validada
4. **Cleanup**: Recursos limpos em caso de erro

### Exemplo de Error Handling

```javascript
class SaveExitModal {
    async show() {
        try {
            return await this.showModal();
        } catch (error) {
            console.error('Modal error:', error);
            
            // Fallback para confirm nativo
            const proceed = confirm('Deseja realmente sair?');
            return proceed ? 'exit-no-save' : 'cancel';
        } finally {
            this.cleanup();
        }
    }
}
```

## 🎯 Best Practices

### Desenvolvimento
1. **Sempre implementar focus trap** para acessibilidade
2. **Usar ARIA labels** apropriados
3. **Validar entrada** do usuário
4. **Limpar recursos** ao fechar modal
5. **Testar com screen readers**

### UX Design
1. **Ações claras** e bem rotuladas
2. **Preview de dados** quando relevante  
3. **Confirmação dupla** para ações destrutivas
4. **Feedback visual** durante operações
5. **Escape hatches** sempre disponíveis

### Performance
1. **Lazy loading** de modais pesados
2. **Reuse instances** quando possível
3. **Cleanup event listeners** adequadamente
4. **Optimize animations** para 60fps
5. **Cache DOM queries** dentro do modal

---

**Nota**: Este sistema de modais é parte integrante do sistema de persistência e deve ser usado em conjunto com NavigationGuard e TreinoCacheService para funcionalidade completa.