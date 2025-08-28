/**
 * 📋 MODAL DE QUESTIONÁRIO - User Questionnaire Modal
 *
 * FUNÇÃO: Interface modal para coleta de dados iniciais de novos usuários.
 *
 * RESPONSABILIDADES:
 * - Renderizar questionário completo com validações
 * - Coletar dados pessoais, objetivos e preferências de treino
 * - Validar campos obrigatórios e restrições
 * - Integrar com sistema de autenticação
 * - Aplicar estilização moderna seguindo paleta do projeto
 *
 * CAMPOS DO QUESTIONÁRIO:
 * - Nome (pré-preenchido se disponível)
 * - Gênero (masculino, feminino, outro)
 * - Data de nascimento
 * - Peso e altura
 * - Lesões (checkbox + lista + descrição)
 * - Experiência em treino
 * - Tempo de treino (slider 0-20 anos)
 * - Objetivo principal
 * - Dias de treino na semana
 * - Tempo por treino
 * - Preferências (cardio, alongamento)
 */

export default class QuestionnaireModal {
  constructor() {
    this.modal = null;
    this.resolve = null;
    this.reject = null;
    this.currentStep = 1;
    this.totalSteps = 4;
    this.formData = {};
    this.user = null;
  }

  /**
   * Exibir modal e retornar Promise com resultado
   * @param {Object} user - Dados do usuário autenticado
   */
  async show(user = null) {
    return new Promise(async (resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.user = user;

      // Verificar se usuário está autenticado
      if (!user) {
        this.reject(new Error('Usuário deve estar autenticado'));
        return;
      }

      // 🆕 CARREGAR DADOS EXISTENTES PARA EDIÇÃO
      try {
        console.log('[QuestionnaireModal] 🔍 Verificando questionário existente...');
        const { obterQuestionario } = await import('../services/questionnaireService.js');
        const dadosExistentes = await obterQuestionario(user.id);

        if (dadosExistentes) {
          console.log('[QuestionnaireModal] ✅ Dados existentes encontrados, modo edição');
          this.isEditMode = true;
          this.preencherDadosExistentes(dadosExistentes);
        } else {
          console.log('[QuestionnaireModal] 📝 Modo novo questionário');
          this.isEditMode = false;
          // Pré-preencher apenas nome se disponível
          if (user.nome) {
            this.formData.nome = user.nome;
          }
        }
      } catch (error) {
        console.warn('[QuestionnaireModal] ⚠️ Erro ao carregar dados existentes:', error);
        this.isEditMode = false;
        // Pré-preencher nome se disponível
        if (user.nome) {
          this.formData.nome = user.nome;
        }
      }

      this.render();
      this.bindEvents();

      // Track evento abertura questionário
      if (window.trackEvent) {
        window.trackEvent('questionnaire_modal_opened', {
          timestamp: Date.now(),
          user_id: user.id,
          user_name: user.nome,
          edit_mode: this.isEditMode,
        });
      }
    });
  }

  /**
   * Preencher dados existentes para modo edição
   * @param {Object} dados - Dados existentes do questionário
   */
  preencherDadosExistentes(dados) {
    console.log('[QuestionnaireModal] 📋 Preenchendo dados existentes:', Object.keys(dados));

    // Dados pessoais
    this.formData.nome = dados.nome || '';
    this.formData.genero = dados.genero || '';

    // Separar data de nascimento
    if (dados.data_nascimento) {
      const date = new Date(dados.data_nascimento);
      this.formData.dia = date.getDate();
      this.formData.mes = date.getMonth() + 1;
      this.formData.ano = date.getFullYear();
    }

    this.formData.peso = dados.peso || '';
    this.formData.altura = dados.altura || '';

    // Saúde e lesões
    this.formData.possui_lesao = dados.possui_lesao || false;
    this.formData.tipos_lesao = dados.tipos_lesao || [];
    this.formData.descricao_lesoes = dados.descricao_lesoes || '';

    // Experiência e objetivos
    this.formData.experiencia = dados.experiencia || '';
    this.formData.tempo_treino = dados.tempo_treino || 0;
    this.formData.objetivo = dados.objetivo || '';

    // Preferências de treino
    this.formData.dias_treino = dados.dias_treino || [];
    this.formData.tempo_por_treino = dados.tempo_por_treino || '';
    this.formData.incluir_cardio = dados.incluir_cardio || false;
    this.formData.incluir_alongamento = dados.incluir_alongamento || false;

    console.log('[QuestionnaireModal] ✅ Dados preenchidos para edição');
  }

  /**
   * Renderizar HTML do modal
   */
  render() {
    const modalHTML = `
            <div id="questionnaire-modal-overlay" class="modal-overlay questionnaire-overlay" role="dialog" aria-labelledby="questionnaire-title" aria-modal="true">
                <div class="modal-container questionnaire-container">
                    <div class="modal-header">
                        <h2 id="questionnaire-title">${this.isEditMode ? 'Editar seu Perfil' : 'Vamos conhecer você melhor!'}</h2>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
                        </div>
                        <span class="progress-text">Etapa ${this.currentStep} de ${this.totalSteps}</span>
                        <button type="button" class="modal-close" aria-label="Fechar modal" title="Fechar">&times;</button>
                    </div>
                    
                    <form id="questionnaire-form" class="modal-body questionnaire-body" novalidate>
                        ${this.renderCurrentStep()}
                    </form>
                    
                    <div class="modal-footer questionnaire-footer">
                        <button type="button" class="btn-secondary" id="prev-btn" ${this.currentStep === 1 ? 'style="visibility: hidden;"' : ''}>
                            ← Anterior
                        </button>
                        <button type="button" class="btn-primary" id="next-btn">
                            <span class="btn-text">${this.currentStep === this.totalSteps ? 'Finalizar' : 'Próximo →'}</span>
                            <span class="btn-loading" style="display:none;">⏳ Salvando...</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('questionnaire-modal-overlay');

    // Foco automático após renderização
    setTimeout(() => {
      const firstInput = this.modal.querySelector('input, select, textarea');
      if (firstInput && !firstInput.disabled) {
        firstInput.focus();
      }
    }, 100);
  }

  /**
   * Renderizar etapa atual do questionário
   */
  renderCurrentStep() {
    switch (this.currentStep) {
      case 1:
        return this.renderStep1(); // Dados pessoais
      case 2:
        return this.renderStep2(); // Saúde e lesões
      case 3:
        return this.renderStep3(); // Experiência e objetivos
      case 4:
        return this.renderStep4(); // Preferências de treino
      default:
        return '';
    }
  }

  /**
   * Etapa 1: Dados Pessoais
   */
  renderStep1() {
    return `
            <div class="step-content" data-step="1">
                <h3 class="step-title">📝 Dados Pessoais</h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="nome">Nome *</label>
                        <input type="text" 
                               id="nome" 
                               name="nome" 
                               required 
                               maxlength="50" 
                               value="${this.formData.nome || ''}"
                               placeholder="Digite seu nome completo">
                        <div class="error-message" data-field="nome"></div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="genero">Gênero *</label>
                        <select id="genero" name="genero" required>
                            <option value="">Selecione seu gênero</option>
                            <option value="masculino" ${this.formData.genero === 'masculino' ? 'selected' : ''}>Masculino</option>
                            <option value="feminino" ${this.formData.genero === 'feminino' ? 'selected' : ''}>Feminino</option>
                            <option value="outro" ${this.formData.genero === 'outro' ? 'selected' : ''}>Outro</option>
                        </select>
                        <div class="error-message" data-field="genero"></div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="data_nascimento">Data de Nascimento *</label>
                        <div class="date-inputs">
                            <select id="dia" name="dia" required>
                                <option value="">Dia</option>
                                ${Array.from({ length: 31 }, (_, i) => i + 1)
                                  .map(
                                    (day) =>
                                      `<option value="${day}" ${this.formData.dia == day ? 'selected' : ''}>${day}</option>`
                                  )
                                  .join('')}
                            </select>
                            <select id="mes" name="mes" required>
                                <option value="">Mês</option>
                                ${[
                                  'Janeiro',
                                  'Fevereiro',
                                  'Março',
                                  'Abril',
                                  'Maio',
                                  'Junho',
                                  'Julho',
                                  'Agosto',
                                  'Setembro',
                                  'Outubro',
                                  'Novembro',
                                  'Dezembro',
                                ]
                                  .map(
                                    (month, index) =>
                                      `<option value="${index + 1}" ${this.formData.mes == index + 1 ? 'selected' : ''}>${month}</option>`
                                  )
                                  .join('')}
                            </select>
                            <select id="ano" name="ano" required>
                                <option value="">Ano</option>
                                ${Array.from(
                                  { length: 100 },
                                  (_, i) => new Date().getFullYear() - i
                                )
                                  .map(
                                    (year) =>
                                      `<option value="${year}" ${this.formData.ano == year ? 'selected' : ''}>${year}</option>`
                                  )
                                  .join('')}
                            </select>
                        </div>
                        <div class="error-message" data-field="data_nascimento"></div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group half-width">
                        <label for="peso">Peso (kg) *</label>
                        <input type="number" 
                               id="peso" 
                               name="peso" 
                               required 
                               min="20" 
                               max="300" 
                               step="0.1"
                               value="${this.formData.peso || ''}"
                               placeholder="Ex: 70.5">
                        <div class="error-message" data-field="peso"></div>
                    </div>
                    
                    <div class="form-group half-width">
                        <label for="altura">Altura (cm) *</label>
                        <input type="number" 
                               id="altura" 
                               name="altura" 
                               required 
                               min="100" 
                               max="250"
                               value="${this.formData.altura || ''}"
                               placeholder="Ex: 175">
                        <div class="error-message" data-field="altura"></div>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * Etapa 2: Saúde e Lesões
   */
  renderStep2() {
    return `
            <div class="step-content" data-step="2">
                <h3 class="step-title">🏥 Saúde e Lesões</h3>
                
                <div class="form-group">
                    <label class="checkbox-container">
                        <input type="checkbox" 
                               id="possui_lesao" 
                               name="possui_lesao" 
                               ${this.formData.possui_lesao ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="checkbox-text">Possuo alguma lesão ou limitação física</span>
                    </label>
                </div>
                
                <div id="lesoes-section" class="lesoes-section" style="display: ${this.formData.possui_lesao ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>Tipos de lesão:</label>
                        <div class="checkbox-grid">
                            ${[
                              'joelho',
                              'ombro',
                              'costas',
                              'tornozelo',
                              'punho',
                              'quadril',
                              'tendinite',
                            ]
                              .map(
                                (lesao) => `
                                <label class="checkbox-container small">
                                    <input type="checkbox" 
                                           name="tipos_lesao" 
                                           value="${lesao}"
                                           ${this.formData.tipos_lesao?.includes(lesao) ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span class="checkbox-text">${lesao.charAt(0).toUpperCase() + lesao.slice(1)}</span>
                                </label>
                            `
                              )
                              .join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="descricao_lesoes">Descrição detalhada das lesões:</label>
                        <textarea id="descricao_lesoes" 
                                  name="descricao_lesoes" 
                                  rows="4" 
                                  maxlength="500"
                                  placeholder="Descreva suas lesões, limitações ou cuidados especiais que devemos considerar...">${this.formData.descricao_lesoes || ''}</textarea>
                        <div class="char-counter">
                            <span id="char-count">${(this.formData.descricao_lesoes || '').length}</span>/500
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * Etapa 3: Experiência e Objetivos
   */
  renderStep3() {
    return `
            <div class="step-content" data-step="3">
                <h3 class="step-title">🎯 Experiência e Objetivos</h3>
                
                <div class="form-group">
                    <label for="experiencia">Experiência em treino *</label>
                    <select id="experiencia" name="experiencia" required>
                        <option value="">Selecione sua experiência</option>
                        <option value="iniciante" ${this.formData.experiencia === 'iniciante' ? 'selected' : ''}>
                            Iniciante (pouca ou nenhuma experiência)
                        </option>
                        <option value="intermediario" ${this.formData.experiencia === 'intermediario' ? 'selected' : ''}>
                            Intermediário (1-3 anos de treino)
                        </option>
                        <option value="avancado" ${this.formData.experiencia === 'avancado' ? 'selected' : ''}>
                            Avançado (mais de 3 anos de treino)
                        </option>
                    </select>
                    <div class="error-message" data-field="experiencia"></div>
                </div>
                
                <div class="form-group">
                    <label for="tempo_treino">Há quantos anos treina?</label>
                    <div class="slider-container">
                        <input type="range" 
                               id="tempo_treino" 
                               name="tempo_treino" 
                               min="0" 
                               max="20" 
                               step="0.5"
                               value="${this.formData.tempo_treino || 0}">
                        <div class="slider-labels">
                            <span>0 anos</span>
                            <span id="tempo-display">${this.formData.tempo_treino || 0} anos</span>
                            <span>20+ anos</span>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="objetivo">Objetivo principal *</label>
                    <div class="radio-grid">
                        ${[
                          {
                            value: 'hipertrofia',
                            label: '💪 Hipertrofia',
                            desc: 'Ganhar massa muscular',
                          },
                          {
                            value: 'emagrecimento',
                            label: '🔥 Emagrecimento',
                            desc: 'Perder peso e gordura',
                          },
                          { value: 'forca', label: '🏋️ Força', desc: 'Aumentar força máxima' },
                          {
                            value: 'resistencia',
                            label: '🏃 Resistência',
                            desc: 'Melhorar condicionamento',
                          },
                          {
                            value: 'condicionamento',
                            label: '⚡ Condicionamento Geral',
                            desc: 'Saúde e bem-estar',
                          },
                        ]
                          .map(
                            (obj) => `
                            <label class="radio-card ${this.formData.objetivo === obj.value ? 'selected' : ''}">
                                <input type="radio" 
                                       name="objetivo" 
                                       value="${obj.value}" 
                                       ${this.formData.objetivo === obj.value ? 'checked' : ''} 
                                       required>
                                <div class="radio-content">
                                    <span class="radio-title">${obj.label}</span>
                                    <span class="radio-desc">${obj.desc}</span>
                                </div>
                            </label>
                        `
                          )
                          .join('')}
                    </div>
                    <div class="error-message" data-field="objetivo"></div>
                </div>
            </div>
        `;
  }

  /**
   * Etapa 4: Preferências de Treino
   */
  renderStep4() {
    return `
            <div class="step-content" data-step="4">
                <h3 class="step-title">📅 Preferências de Treino</h3>
                
                <div class="form-group">
                    <label>Dias de treino na semana *</label>
                    <div class="days-grid">
                        ${[
                          { value: 'segunda', label: 'SEG' },
                          { value: 'terca', label: 'TER' },
                          { value: 'quarta', label: 'QUA' },
                          { value: 'quinta', label: 'QUI' },
                          { value: 'sexta', label: 'SEX' },
                          { value: 'sabado', label: 'SÁB' },
                          { value: 'domingo', label: 'DOM' },
                        ]
                          .map(
                            (day) => `
                            <label class="day-card ${this.formData.dias_treino?.includes(day.value) ? 'selected' : ''}">
                                <input type="checkbox" 
                                       name="dias_treino" 
                                       value="${day.value}"
                                       ${this.formData.dias_treino?.includes(day.value) ? 'checked' : ''}>
                                <span class="day-label">${day.label}</span>
                            </label>
                        `
                          )
                          .join('')}
                    </div>
                    <div class="error-message" data-field="dias_treino"></div>
                    <div class="selected-days-info">
                        <span id="days-count">${this.formData.dias_treino?.length || 0}</span> dias selecionados
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="tempo_por_treino">Tempo por treino *</label>
                    <div class="radio-row">
                        ${[
                          { value: '30', label: '30 min' },
                          { value: '45', label: '45 min' },
                          { value: '60', label: '60 min' },
                          { value: '90', label: '90 min' },
                        ]
                          .map(
                            (time) => `
                            <label class="radio-button ${this.formData.tempo_por_treino === time.value ? 'selected' : ''}">
                                <input type="radio" 
                                       name="tempo_por_treino" 
                                       value="${time.value}"
                                       ${this.formData.tempo_por_treino === time.value ? 'checked' : ''} 
                                       required>
                                <span class="radio-label">${time.label}</span>
                            </label>
                        `
                          )
                          .join('')}
                    </div>
                    <div class="error-message" data-field="tempo_por_treino"></div>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-container">
                        <input type="checkbox" 
                               id="incluir_cardio" 
                               name="incluir_cardio" 
                               ${this.formData.incluir_cardio ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="checkbox-text">🏃‍♂️ Incluir cardio no treino</span>
                    </label>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-container">
                        <input type="checkbox" 
                               id="incluir_alongamento" 
                               name="incluir_alongamento" 
                               ${this.formData.incluir_alongamento ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="checkbox-text">🧘‍♀️ Incluir alongamento no treino</span>
                    </label>
                </div>
            </div>
        `;
  }

  /**
   * Vincular eventos do modal
   */
  bindEvents() {
    // ESC para fechar
    this.handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.handleKeydown);

    // Botão fechar
    this.modal.querySelector('.modal-close').addEventListener('click', () => this.close(null));

    // Botões navegação
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.addEventListener('click', () => this.previousStep());
    nextBtn.addEventListener('click', () => this.nextStep());

    // Eventos específicos da etapa atual
    this.bindStepEvents();
  }

  /**
   * Vincular eventos específicos da etapa
   */
  bindStepEvents() {
    switch (this.currentStep) {
      case 2:
        // Toggle seção de lesões
        const possuiLesao = document.getElementById('possui_lesao');
        const lesoesSection = document.getElementById('lesoes-section');

        possuiLesao.addEventListener('change', (e) => {
          lesoesSection.style.display = e.target.checked ? 'block' : 'none';
          if (!e.target.checked) {
            // Limpar campos de lesão se desmarcado
            const checkboxes = lesoesSection.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((cb) => (cb.checked = false));
            document.getElementById('descricao_lesoes').value = '';
          }
        });

        // Contador de caracteres
        const textarea = document.getElementById('descricao_lesoes');
        const charCount = document.getElementById('char-count');
        textarea.addEventListener('input', (e) => {
          charCount.textContent = e.target.value.length;
        });
        break;

      case 3:
        // Slider tempo de treino
        const slider = document.getElementById('tempo_treino');
        const display = document.getElementById('tempo-display');

        slider.addEventListener('input', (e) => {
          const years = parseFloat(e.target.value);
          display.textContent = years === 20 ? '20+ anos' : `${years} anos`;
        });

        // Radio cards para objetivos
        const radioCards = document.querySelectorAll('.radio-card');
        radioCards.forEach((card) => {
          card.addEventListener('click', () => {
            radioCards.forEach((c) => c.classList.remove('selected'));
            card.classList.add('selected');
            card.querySelector('input').checked = true;
          });
        });
        break;

      case 4:
        // Days selection
        const dayCards = document.querySelectorAll('.day-card');
        const daysCount = document.getElementById('days-count');

        dayCards.forEach((card) => {
          card.addEventListener('click', () => {
            const checkbox = card.querySelector('input');
            checkbox.checked = !checkbox.checked;
            card.classList.toggle('selected', checkbox.checked);

            // Atualizar contador
            const selectedDays = document.querySelectorAll('.day-card input:checked').length;
            daysCount.textContent = selectedDays;
          });
        });

        // Radio buttons tempo
        const radioButtons = document.querySelectorAll('.radio-button');
        radioButtons.forEach((button) => {
          button.addEventListener('click', () => {
            radioButtons.forEach((b) => b.classList.remove('selected'));
            button.classList.add('selected');
            button.querySelector('input').checked = true;
          });
        });
        break;
    }
  }

  /**
   * Avançar para próxima etapa
   */
  async nextStep() {
    // Coletar e validar dados da etapa atual
    if (!this.validateCurrentStep()) {
      return;
    }

    this.collectCurrentStepData();

    if (this.currentStep === this.totalSteps) {
      // Finalizar questionário
      await this.submitQuestionnaire();
    } else {
      // Próxima etapa
      this.currentStep++;
      this.updateModal();
    }
  }

  /**
   * Voltar para etapa anterior
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.collectCurrentStepData();
      this.currentStep--;
      this.updateModal();
    }
  }

  /**
   * Atualizar modal para nova etapa
   */
  updateModal() {
    // Atualizar conteúdo
    const body = this.modal.querySelector('.modal-body');
    body.innerHTML = this.renderCurrentStep();

    // Atualizar barra de progresso
    const progressFill = this.modal.querySelector('.progress-fill');
    const progressText = this.modal.querySelector('.progress-text');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
    progressText.textContent = `Etapa ${this.currentStep} de ${this.totalSteps}`;

    // Atualizar botões
    prevBtn.style.visibility = this.currentStep === 1 ? 'hidden' : 'visible';
    nextBtn.querySelector('.btn-text').textContent =
      this.currentStep === this.totalSteps ? 'Finalizar' : 'Próximo →';

    // Rebind eventos
    this.bindStepEvents();

    // Foco no primeiro campo
    setTimeout(() => {
      const firstInput = this.modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput && !firstInput.disabled) {
        firstInput.focus();
      }
    }, 100);
  }

  /**
   * Coletar dados da etapa atual
   */
  collectCurrentStepData() {
    const form = document.getElementById('questionnaire-form');
    const formData = new FormData(form);

    // Processar dados específicos da etapa
    switch (this.currentStep) {
      case 1:
        this.formData.nome = formData.get('nome');
        this.formData.genero = formData.get('genero');
        this.formData.dia = formData.get('dia');
        this.formData.mes = formData.get('mes');
        this.formData.ano = formData.get('ano');
        this.formData.peso = formData.get('peso');
        this.formData.altura = formData.get('altura');
        break;

      case 2:
        this.formData.possui_lesao = formData.get('possui_lesao') === 'on';
        this.formData.tipos_lesao = formData.getAll('tipos_lesao');
        this.formData.descricao_lesoes = formData.get('descricao_lesoes');
        break;

      case 3:
        this.formData.experiencia = formData.get('experiencia');
        this.formData.tempo_treino = formData.get('tempo_treino');
        this.formData.objetivo = formData.get('objetivo');
        break;

      case 4:
        this.formData.dias_treino = formData.getAll('dias_treino');
        this.formData.tempo_por_treino = formData.get('tempo_por_treino');
        this.formData.incluir_cardio = formData.get('incluir_cardio') === 'on';
        this.formData.incluir_alongamento = formData.get('incluir_alongamento') === 'on';
        break;
    }
  }

  /**
   * Validar etapa atual
   */
  validateCurrentStep() {
    let isValid = true;
    this.clearErrors();

    switch (this.currentStep) {
      case 1:
        isValid = this.validateStep1();
        break;
      case 2:
        isValid = this.validateStep2();
        break;
      case 3:
        isValid = this.validateStep3();
        break;
      case 4:
        isValid = this.validateStep4();
        break;
    }

    return isValid;
  }

  /**
   * Validar etapa 1
   */
  validateStep1() {
    let isValid = true;

    // Nome
    const nome = document.getElementById('nome').value.trim();
    if (!nome) {
      this.showFieldError('nome', 'Nome é obrigatório');
      isValid = false;
    } else if (nome.length < 2) {
      this.showFieldError('nome', 'Nome deve ter pelo menos 2 caracteres');
      isValid = false;
    }

    // Gênero
    const genero = document.getElementById('genero').value;
    if (!genero) {
      this.showFieldError('genero', 'Selecione seu gênero');
      isValid = false;
    }

    // Data nascimento
    const dia = document.getElementById('dia').value;
    const mes = document.getElementById('mes').value;
    const ano = document.getElementById('ano').value;

    if (!dia || !mes || !ano) {
      this.showFieldError('data_nascimento', 'Data de nascimento completa é obrigatória');
      isValid = false;
    } else {
      // Validar data válida
      const data = new Date(ano, mes - 1, dia);
      if (data.getDate() != dia || data.getMonth() != mes - 1 || data.getFullYear() != ano) {
        this.showFieldError('data_nascimento', 'Data inválida');
        isValid = false;
      } else {
        // Validar idade
        const idade = new Date().getFullYear() - ano;
        if (idade < 13) {
          this.showFieldError('data_nascimento', 'Idade mínima: 13 anos');
          isValid = false;
        } else if (idade > 100) {
          this.showFieldError('data_nascimento', 'Idade máxima: 100 anos');
          isValid = false;
        }
      }
    }

    // Peso
    const peso = parseFloat(document.getElementById('peso').value);
    if (!peso || peso < 20 || peso > 300) {
      this.showFieldError('peso', 'Peso deve estar entre 20 e 300 kg');
      isValid = false;
    }

    // Altura
    const altura = parseFloat(document.getElementById('altura').value);
    if (!altura || altura < 100 || altura > 250) {
      this.showFieldError('altura', 'Altura deve estar entre 100 e 250 cm');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Validar etapa 2
   */
  validateStep2() {
    let isValid = true;

    const possuiLesao = document.getElementById('possui_lesao').checked;

    if (possuiLesao) {
      const tiposLesao = document.querySelectorAll('input[name="tipos_lesao"]:checked');
      const descricao = document.getElementById('descricao_lesoes').value.trim();

      if (tiposLesao.length === 0 && !descricao) {
        this.showError('Se você possui lesões, selecione os tipos ou descreva-as.');
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Validar etapa 3
   */
  validateStep3() {
    let isValid = true;

    // Experiência
    const experiencia = document.getElementById('experiencia').value;
    if (!experiencia) {
      this.showFieldError('experiencia', 'Selecione sua experiência em treino');
      isValid = false;
    }

    // Objetivo
    const objetivo = document.querySelector('input[name="objetivo"]:checked');
    if (!objetivo) {
      this.showFieldError('objetivo', 'Selecione seu objetivo principal');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Validar etapa 4
   */
  validateStep4() {
    let isValid = true;

    // Dias de treino
    const diasSelecionados = document.querySelectorAll('input[name="dias_treino"]:checked');
    if (diasSelecionados.length === 0) {
      this.showFieldError('dias_treino', 'Selecione pelo menos um dia de treino');
      isValid = false;
    }

    // Tempo por treino
    const tempoPorTreino = document.querySelector('input[name="tempo_por_treino"]:checked');
    if (!tempoPorTreino) {
      this.showFieldError('tempo_por_treino', 'Selecione o tempo por treino');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Submeter questionário completo
   */
  async submitQuestionnaire() {
    const nextBtn = document.getElementById('next-btn');
    const btnText = nextBtn.querySelector('.btn-text');
    const btnLoading = nextBtn.querySelector('.btn-loading');

    // Estado loading
    nextBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
      // Preparar dados finais
      const questionnaireData = {
        user_id: this.user.id,
        ...this.formData,
        data_nascimento: `${this.formData.ano}-${String(this.formData.mes).padStart(2, '0')}-${String(this.formData.dia).padStart(2, '0')}`,
        created_at: new Date().toISOString(),
      };

      // Aqui você integraria com o serviço para salvar os dados
      // const resultado = await salvarQuestionario(questionnaireData);

      // Simular salvamento
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Sucesso
      this.showSuccess('Questionário salvo com sucesso!');

      setTimeout(() => {
        this.close(questionnaireData);
      }, 1000);
    } catch (error) {
      console.error('[QuestionnaireModal] Erro ao salvar:', error);
      this.showError('Erro ao salvar questionário. Tente novamente.');

      // Restaurar botão
      nextBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  /**
   * Mostrar erro em campo específico
   */
  showFieldError(field, message) {
    const errorDiv = document.querySelector(`[data-field="${field}"]`);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  /**
   * Limpar erros
   */
  clearErrors() {
    const errorDivs = this.modal.querySelectorAll('.error-message');
    errorDivs.forEach((div) => {
      div.textContent = '';
      div.style.display = 'none';
    });
  }

  /**
   * Mostrar erro geral
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * Mostrar sucesso
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * Mostrar toast notification
   */
  showToast(message, type = 'error') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    const styles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '10001',
      padding: '12px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '300px',
      background: type === 'error' ? '#f44336' : '#4caf50',
      color: 'white',
      animation: 'slideInRight 0.3s ease',
    };

    Object.assign(toast.style, styles);
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  /**
   * Manipular teclas
   */
  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close(null);
    }
  }

  /**
   * Fechar modal
   */
  close(result) {
    if (this.modal) {
      this.modal.remove();
    }

    document.removeEventListener('keydown', this.handleKeydown);

    if (this.resolve) {
      this.resolve(result);
    }
  }
}
