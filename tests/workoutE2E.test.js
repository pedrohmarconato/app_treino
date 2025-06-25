// Teste E2E para Fluxo Completo de Treino
import { test, expect } from '@playwright/test';

test.describe('Fluxo Completo de Treino', () => {
    test.beforeEach(async ({ page }) => {
        // Navegar para aplicação
        await page.goto('http://localhost:3000');
        
        // Limpar localStorage
        await page.evaluate(() => localStorage.clear());
    });
    
    test('iniciar → sair → voltar → finalizar', async ({ page }) => {
        // 1. INICIAR TREINO
        // Aguardar dashboard carregar
        await page.waitForSelector('.dashboard-container');
        
        // Clicar no card de treino do dia
        await page.click('.workout-card');
        
        // Aguardar tela de treino
        await page.waitForSelector('#workout-screen');
        
        // Verificar que exercício foi carregado
        const exerciseName = await page.textContent('.exercise-name');
        expect(exerciseName).toBeTruthy();
        
        // 2. COMPLETAR ALGUMAS SÉRIES
        // Preencher primeira série
        await page.fill('#peso-0', '50');
        await page.fill('#rep-0', '12');
        await page.click('#serie-0 .btn-confirm-series');
        
        // Aguardar confirmação visual
        await page.waitForSelector('#serie-0.completed');
        
        // Preencher segunda série
        await page.fill('#peso-1', '50');
        await page.fill('#rep-1', '10');
        await page.click('#serie-1 .btn-confirm-series');
        
        // Verificar que cronômetro apareceu
        await page.waitForSelector('#rest-timer-overlay', { state: 'visible' });
        
        // Pular descanso
        await page.click('.btn-skip-rest');
        
        // 3. SIMULAR SAÍDA (RECARREGAR PÁGINA)
        await page.reload();
        
        // 4. VERIFICAR MODAL DE RECUPERAÇÃO
        await page.waitForSelector('.recovery-modal');
        
        // Verificar informações no modal
        const seriesInfo = await page.textContent('.info-value');
        expect(seriesInfo).toContain('2 séries');
        
        // 5. ESCOLHER CONTINUAR
        await page.click('button:has-text("Continuar de Onde Parei")');
        
        // Verificar que voltou para tela de treino
        await page.waitForSelector('#workout-screen');
        
        // Verificar que séries anteriores estão marcadas como completadas
        const serie1Completed = await page.locator('#serie-0').evaluate(el => 
            el.classList.contains('completed')
        );
        expect(serie1Completed).toBe(true);
        
        const serie2Completed = await page.locator('#serie-1').evaluate(el => 
            el.classList.contains('completed')
        );
        expect(serie2Completed).toBe(true);
        
        // 6. COMPLETAR TREINO
        // Completar última série
        await page.fill('#peso-2', '45');
        await page.fill('#rep-2', '8');
        await page.click('#serie-2 .btn-confirm-series');
        
        // Avançar para próximo exercício ou finalizar
        const hasNextButton = await page.locator('button:has-text("Próximo")').count();
        if (hasNextButton > 0) {
            await page.click('button:has-text("Próximo")');
            
            // Aguardar loading
            await page.waitForSelector('.exercise-loading', { state: 'visible' });
            await page.waitForSelector('.exercise-loading', { state: 'hidden' });
        }
        
        // 7. FINALIZAR TREINO
        // Aguardar modal de conclusão
        await page.waitForSelector('#workout-completion', { timeout: 30000 });
        
        // Clicar em finalizar
        await page.click('button:has-text("Finalizar Treino")');
        
        // Aguardar notificação de sucesso
        await page.waitForSelector('.notification-success:has-text("Treino finalizado")');
        
        // Verificar que voltou para dashboard
        await page.waitForSelector('.dashboard-container');
        
        // 8. VERIFICAR QUE CACHE FOI LIMPO
        const cacheData = await page.evaluate(() => {
            return {
                execucoes: localStorage.getItem('treino_execucoes_temp'),
                estado: localStorage.getItem('treino_estado_temp'),
                unified: localStorage.getItem('treino_unified_state')
            };
        });
        
        expect(cacheData.execucoes).toBeNull();
        expect(cacheData.estado).toBeNull();
        expect(cacheData.unified).toBeNull();
    });
    
    test('escolher começar novo treino descarta cache', async ({ page }) => {
        // Simular treino em andamento
        await page.evaluate(() => {
            const mockData = {
                execucoes: [
                    { exercicio_id: 'ex1', serie_numero: 1, peso_utilizado: 50 }
                ],
                timestamp: Date.now() - 3600000 // 1 hora atrás
            };
            localStorage.setItem('treino_unified_state', JSON.stringify(mockData));
        });
        
        // Navegar para treino
        await page.goto('http://localhost:3000/treino');
        
        // Aguardar modal de recuperação
        await page.waitForSelector('.recovery-modal');
        
        // Clicar em começar novo
        await page.click('button:has-text("Começar Novo Treino")');
        
        // Confirmar no dialog
        await page.on('dialog', dialog => dialog.accept());
        
        // Verificar que iniciou treino limpo
        await page.waitForSelector('#workout-screen');
        
        // Verificar que não há séries completadas
        const completedSeries = await page.locator('.serie-row.completed').count();
        expect(completedSeries).toBe(0);
    });
    
    test('sincronização offline funciona corretamente', async ({ page, context }) => {
        // Iniciar treino
        await page.goto('http://localhost:3000/treino');
        
        // Completar uma série
        await page.fill('#peso-0', '60');
        await page.fill('#rep-0', '10');
        await page.click('#serie-0 .btn-confirm-series');
        
        // Simular offline
        await context.setOffline(true);
        
        // Tentar finalizar treino
        await page.click('button:has-text("Finalizar Treino")');
        
        // Verificar notificação de offline
        await page.waitForSelector('.notification:has-text("Sem conexão")');
        
        // Verificar que dados estão na fila
        const pendingData = await page.evaluate(() => {
            const data = localStorage.getItem('pendingSyncData');
            return data ? JSON.parse(data) : null;
        });
        expect(pendingData).toBeTruthy();
        expect(pendingData.length).toBeGreaterThan(0);
        
        // Voltar online
        await context.setOffline(false);
        
        // Aguardar sincronização automática
        await page.waitForSelector('.notification:has-text("sincronizado")', {
            timeout: 10000
        });
        
        // Verificar que fila foi limpa
        const pendingAfterSync = await page.evaluate(() => {
            const data = localStorage.getItem('pendingSyncData');
            return data ? JSON.parse(data) : [];
        });
        expect(pendingAfterSync.length).toBe(0);
    });
});