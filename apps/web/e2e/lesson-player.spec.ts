import { expect, test } from '@playwright/test'

test.describe('lesson player', () => {
  test('C09/C10 L1 anima bits y Step/Reset cambian frame', async ({ page }) => {
    await page.goto('/lessons/bitwise-basics')
    await expect(page.getByRole('heading', { name: 'Bitwise Basics' })).toBeVisible()
    await expect(page.getByTestId('frame-indicator')).toHaveText('Frame 1/2')

    await page.getByTestId('btn-step').click()
    await expect(page.getByTestId('frame-indicator')).toHaveText('Frame 2/2')
    await expect(page.locator('.bit-cell--on').first()).toBeVisible()

    await page.getByTestId('btn-reset').click()
    await expect(page.getByTestId('frame-indicator')).toHaveText('Frame 1/2')
  })

  test('C11 completar step persiste tras refresh', async ({ page }) => {
    await page.goto('/lessons/bitwise-basics')
    await page.getByTestId('btn-complete').click()
    await expect(page.getByTestId('step-completed')).toBeVisible()

    await page.reload()
    await expect(page.getByTestId('step-completed')).toBeVisible()
    await expect(page.getByTestId('step-nav-step-and')).toContainText('Hecho')
  })

  test('C12 L2 stub abre plantilla sin romper player', async ({ page }) => {
    await page.goto('/lessons/registers-and-memory')
    await expect(
      page.getByRole('heading', { name: 'Registers & Memory (plantilla)' }),
    ).toBeVisible()
    await expect(page.getByTestId('placeholder-panel')).toBeVisible()
    await expect(page.getByTestId('btn-complete')).toBeVisible()
  })
})
