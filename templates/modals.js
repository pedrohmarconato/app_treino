export const modalPlanejamentoTemplate = () => `
    <div id="modalPlanejamento" class="modal" style="display: none;">
        <div class="modal-content modal-planejamento-content">
            <div class="modal-header">
                <h2>📅 Planejamento Semanal</h2>
                <span class="close" onclick="fecharModalPlanejamento()">&times;</span>
            </div>
            
            <div class="modal-body">
                <div class="planejamento-container">
                    <!-- Lista de Treinos Disponíveis -->
                    <div class="treinos-disponiveis">
                        <h3>Treinos Disponíveis</h3>
                        <div id="listaTreinosDisponiveis" class="lista-treinos">
                            <!-- Treinos serão carregados aqui -->
                        </div>
                    </div>
                    
                    <!-- Calendário Semanal -->
                    <div class="calendario-semanal">
                        <h3>Semana Atual</h3>
                        <div class="dias-semana">
                            <div class="dia-slot" data-dia="1">
                                <h4>Segunda</h4>
                                <div class="drop-zone" data-dia="1">
                                    <span class="placeholder">Arraste um treino aqui</span>
                                </div>
                            </div>
                            <div class="dia-slot" data-dia="2">
                                <h4>Terça</h4>
                                <div class="drop-zone" data-dia="2">
                                    <span class="placeholder">Arraste um treino aqui</span>
                                </div>
                            </div>
                            <div class="dia-slot" data-dia="3">
                                <h4>Quarta</h4>
                                <div class="drop-zone" data-dia="3">
                                    <span class="placeholder">Arraste um treino aqui</span>
                                </div>
                            </div>
                            <div class="dia-slot" data-dia="4">
                                <h4>Quinta</h4>
                                <div class="drop-zone" data-dia="4">
                                    <span class="placeholder">Arraste um treino aqui</span>
                                </div>
                            </div>
                            <div class="dia-slot" data-dia="5">
                                <h4>Sexta</h4>
                                <div class="drop-zone" data-dia="5">
                                    <span class="placeholder">Arraste um treino aqui</span>
                                </div>
                            </div>
                            <div class="dia-slot" data-dia="6">
                                <h4>Sábado</h4>
                                <div class="drop-zone" data-dia="6">
                                    <span class="placeholder">Arraste um treino aqui</span>
                                </div>
                            </div>
                            <div class="dia-slot" data-dia="0">
                                <h4>Domingo</h4>
                                <div class="drop-zone" data-dia="0">
                                    <span class="placeholder">Arraste um treino aqui</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="fecharModalPlanejamento()">Cancelar</button>
                    <button class="btn-primary" onclick="salvarPlanejamentoSemanal()">Salvar Planejamento</button>
                </div>
            </div>
        </div>
    </div>
`;

export default {};