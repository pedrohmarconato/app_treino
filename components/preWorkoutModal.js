// components/preWorkoutModal.js
// Modal simples de pré-treino para coletar nível de energia (Likert 1-5)

export class PreWorkoutModal {
    // Exibe o modal e resolve a Promise com o valor (1-5)
    static exibir () {
        return new Promise(resolve => {
            // Já existe? remover para evitar duplicado
            const existente = document.getElementById('modal-pre-workout');
            if (existente) existente.remove();

            const overlay = document.createElement('div');
            overlay.id = 'modal-pre-workout';
            overlay.className = 'modal-overlay pre-workout-modal';
            overlay.innerHTML = this._html();
            document.body.appendChild(overlay);

            // Botões escala
            overlay.querySelectorAll('.likert-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // limpar seleção anterior
                    overlay.querySelectorAll('.likert-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    overlay.dataset.valorSelecionado = btn.dataset.value;
                    overlay.querySelector('#btn-iniciar-treino').disabled = false;
                });
            });

            // Botão iniciar treino
            overlay.querySelector('#btn-iniciar-treino').addEventListener('click', () => {
                const valor = parseInt(overlay.dataset.valorSelecionado || '0');
                limpar();
                resolve(isNaN(valor) ? null : valor);
            });

            // Fechar com ESC ou click fora
            const fechar = () => { limpar(); resolve(null); };
            overlay.addEventListener('click', e => { if (e.target === overlay) fechar(); });
            document.addEventListener('keydown', escHandler);

            function escHandler (e) { if (e.key === 'Escape') fechar(); }
            function limpar () {
                document.removeEventListener('keydown', escHandler);
                overlay.remove();
            }
        });
    }

    static _html () {
        // Estilos básicos inline para evitar dependência externa
        return `
            <style>
                .modal-overlay.pre-workout-modal {position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px;box-sizing:border-box;backdrop-filter:blur(8px);opacity:1 !important;transition:none;}
                .pre-workout-container {background:var(--bg-card);border-radius:var(--radius-lg);max-width:480px;width:100%;padding:32px;text-align:center;box-shadow:var(--shadow-card);} 
                .pre-workout-container h2 {margin:0 0 24px;font-size:1.8rem;color:var(--text-primary);}
                .likert-row {display:flex;justify-content:space-between;gap:8px;margin-bottom:24px;}
                .likert-btn {flex:1;padding:14px 0;border:2px solid var(--border-light);border-radius:10px;background:var(--bg-elevated);color:var(--text-secondary);font-weight:600;cursor:pointer;transition:var(--transition);} 
                .likert-btn:hover {border-color:var(--accent-green);color:var(--accent-green);}
                .likert-btn.selected {background:var(--neon-primary);color:var(--bg-primary);border-color:var(--neon-primary);box-shadow:0 0 15px var(--accent-green-glow);}
                #btn-iniciar-treino {padding:14px 24px;border:none;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--neon-primary) 0%, #0470dc 100%);color:var(--bg-primary);font-weight:700;font-size:1rem;cursor:pointer;transition:var(--transition);width:100%;box-shadow:0 4px 20px var(--accent-green-glow);}
                #btn-iniciar-treino:hover:not(:disabled) {transform:translateY(-2px);box-shadow:0 8px 30px var(--accent-green-glow);} #btn-iniciar-treino:disabled {opacity:.5;cursor:not-allowed;}
            </style>
            <div class="pre-workout-container" onclick="event.stopPropagation()">
                <h2>Como está sua energia hoje?</h2>
                <div class="likert-row">
                    ${[1,2,3,4,5].map(v=>`<button class="likert-btn" data-value="${v}">${v}</button>`).join('')}
                </div>
                <button id="btn-iniciar-treino" disabled>Iniciar Treino</button>
            </div>
        `;
    }
}

export default PreWorkoutModal;
