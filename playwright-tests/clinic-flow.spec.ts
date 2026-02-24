import { test, expect } from '@playwright/test';

test.describe('SDMED Sys - Fluxo Completo de Atendimento', () => {

    test('Secretária agenda e Médico atende', async ({ page }) => {
        // Capturar logs do console
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
            }
        });

        // 1. Login como Secretária
        await page.goto('/login');
        await page.fill('input[name="username"]', 'secretary@sdmed.com');
        await page.fill('input[name="password"]', 'Test@123456');
        await page.click('button[type="submit"]');

        // Esperar carregar e navegar para o dashboard
        await page.waitForURL(/.*secretary/, { timeout: 20000 });
        await page.goto('/secretary/dashboard');

        await expect(page.locator('h1')).toContainText('Painel Operacional do Dia', { timeout: 20000 });
        await page.screenshot({ path: 'test-results/01-secretary-dashboard.png' });

        // 2. Adicionar Novo Atendimento (Walk-in)
        await page.click('button:has-text("Novo Atendimento")');

        // Esperar o modal abrir
        const modalTitle = page.locator('h3:has-text("Registrar Novo Atendimento")');
        await expect(modalTitle).toBeVisible({ timeout: 15000 });

        // Buscar paciente
        await page.fill('input[placeholder="Nome ou CPF..."]', 'Andre Maia');

        // Selecionar o resultado na lista
        const resultItem = page.locator('div[class*="searchResultItem"]', { hasText: 'Andre Maia' }).first();
        await expect(resultItem).toBeVisible({ timeout: 20000 });
        await resultItem.click();

        // Verificar se o paciente foi selecionado (o modal deve mudar)
        await expect(page.locator('text=Paciente selecionado: Andre Maia')).toBeVisible({ timeout: 10000 });

        // Selecionar o Médico Correto (Dr. Test Automation)
        await page.selectOption('select', '74817a06-4d74-4534-b5f6-75f6a3b9c709');
        await page.screenshot({ path: 'test-results/02-modal-filled.png' });

        // Clicar em Adicionar à Fila
        const submitBtn = page.locator('button:has-text("Adicionar à Fila")');
        await submitBtn.click();

        // IMPORTANTE: Esperar o modal FECHAR. Se não fechar, algo falhou.
        await expect(modalTitle).not.toBeVisible({ timeout: 20000 });
        await page.screenshot({ path: 'test-results/03-after-submit.png' });

        // Verificar se o paciente apareceu no Kanban/Lista em uma coluna específica (Aguardando)
        // O h3 da coluna "Aguardando" deve ter um contador ou estar acima do card.
        // Vamos procurar pelo card que NÃO está no dropdown de busca.
        const patientCard = page.locator('div[class*="card"]', { hasText: 'Andre Maia' }).first();
        await expect(patientCard).toBeVisible({ timeout: 20000 });
    });

    test('Médico atende o paciente', async ({ page }) => {
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
            }
        });

        // 1. Login como Médico
        await page.goto('/login');
        await page.fill('input[name="username"]', 'doctor@sdmed.com');
        await page.fill('input[name="password"]', 'Test@123456');
        await page.click('button[type="submit"]');

        // Esperar redirecionamento
        await page.waitForURL(/.*doctor/, { timeout: 20000 });

        // Navegar para a Fila do Médico
        await page.goto('/doctor/queue');
        await page.screenshot({ path: 'test-results/04-doctor-queue.png' });

        // Verificar se há pacientes na fila
        const patientCard = page.locator('div[class*="opsCard"]', { hasText: 'Andre Maia' }).first();
        await expect(patientCard).toBeVisible({ timeout: 30000 });

        // Localizar botões dentro do card
        const callBtn = patientCard.locator('button:has-text("Chamar")');
        const startBtn = patientCard.locator('button:has-text("Atender")');

        if (await callBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await callBtn.click();
            await page.screenshot({ path: 'test-results/05-after-call.png' });
        }

        await expect(startBtn).toBeVisible({ timeout: 20000 });
        await startBtn.click();

        // 2. Preencher Prontuário
        await expect(page.locator('text=ATENDIMENTO CLÍNICO')).toBeVisible({ timeout: 25000 });
        await page.screenshot({ path: 'test-results/06-consultation.png' });

        await page.fill('textarea[placeholder*="Descreva o motivo"]', 'E2E Test: Paciente com sintomas leves.');
        await page.fill('textarea[placeholder*="Indique as impressões"]', 'E2E Test: Observação.');
        await page.fill('textarea[placeholder*="Descreva a conduta"]', 'E2E Test: Finalizado via script.');

        // 3. Finalizar
        page.once('dialog', dialog => dialog.accept());
        await page.click('button:has-text("Finalizar Atendimento")');

        // Verificar se voltou para a fila
        await expect(page).toHaveURL(/.*queue/, { timeout: 20000 });
        await page.screenshot({ path: 'test-results/07-after-finish.png' });
    });
});
