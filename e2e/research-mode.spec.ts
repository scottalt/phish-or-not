import { test, expect } from '@playwright/test';
import { ensureTestUser, TEST_FRESH_EMAIL } from './helpers/test-accounts';
import { injectSession } from './helpers/auth';

const supabaseUrl = process.env.TEST_SUPABASE_URL!;

test.describe('Research Mode', () => {
  let freshUser: Awaited<ReturnType<typeof ensureTestUser>>;

  test.beforeAll(async () => {
    freshUser = await ensureTestUser(TEST_FRESH_EMAIL);
  });

  test('full research flow: intro → tutorial → answer card → feedback → summary', async ({ page }) => {
    await injectSession(page, supabaseUrl, freshUser.accessToken, freshUser.refreshToken);
    await page.goto('/');

    // Should see RESEARCH MODE button (fresh user, not graduated)
    const researchButton = page.getByRole('button', { name: /research mode/i });
    await expect(researchButton).toBeVisible({ timeout: 15_000 });

    // Set up response listener BEFORE clicking
    const cardsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/cards/research'),
      { timeout: 30_000 },
    );
    await researchButton.click();

    // Research intro screen (first time) — click "BEGIN RESEARCH"
    const beginButton = page.getByRole('button', { name: /begin/i });
    if (await beginButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await beginButton.click();
    }

    // Tutorial screen (first time research player) — must complete the mini-game:
    // 1. Select confidence, 2. Click answer, 3. Click "GOT IT"
    const tutorialConfidence = page.getByRole('button', { name: /certain|likely|guessing/i }).first();
    if (await tutorialConfidence.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await tutorialConfidence.click();

      // Answer the tutorial card
      const tutorialPhishing = page.getByRole('button', { name: /phishing/i });
      await expect(tutorialPhishing).toBeVisible({ timeout: 3_000 });
      await tutorialPhishing.click();

      // Complete tutorial
      const gotItButton = page.getByRole('button', { name: /got it/i });
      await expect(gotItButton).toBeVisible({ timeout: 3_000 });
      await gotItButton.click();
    }

    // Wait for cards response
    await cardsResponse;

    // Now on the actual game card — select confidence first
    const confidenceButton = page.getByRole('button', { name: /certain|likely|guessing/i }).first();
    await expect(confidenceButton).toBeVisible({ timeout: 10_000 });
    await confidenceButton.click();

    // Now phishing/legit buttons appear
    const phishingButton = page.getByRole('button', { name: /phishing/i });
    const legitButton = page.getByRole('button', { name: /legit/i });
    await expect(phishingButton.or(legitButton)).toBeVisible({ timeout: 5_000 });

    // Set up check listener BEFORE clicking
    const checkResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/cards/check'),
      { timeout: 15_000 },
    );
    await phishingButton.click();

    // Wait for server-side answer check
    const checkData = await (await checkResponse).json();

    // Verify server returned expected fields
    expect(checkData).toHaveProperty('correct');
    expect(checkData).toHaveProperty('isPhishing');
    expect(checkData).toHaveProperty('pointsEarned');
    expect(checkData).toHaveProperty('streak');
    expect(checkData).toHaveProperty('explanation');

    // Feedback screen should be visible
    await expect(page.getByText(/correct|incorrect/i)).toBeVisible({ timeout: 5_000 });

    // Click next to proceed (force click to bypass animation stability check)
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeVisible({ timeout: 5_000 });
    await nextButton.click({ force: true });

    // Second card should load — select confidence first
    const confidenceButton2 = page.getByRole('button', { name: /certain|likely|guessing/i }).first();
    await expect(confidenceButton2).toBeVisible({ timeout: 10_000 });
  });

  test('server-side answer verification rejects re-checking same card', async ({ page }) => {
    await injectSession(page, supabaseUrl, freshUser.accessToken, freshUser.refreshToken);
    await page.goto('/');

    let checkCount = 0;
    page.on('response', (resp) => {
      if (resp.url().includes('/api/cards/check')) checkCount++;
    });

    const researchButton = page.getByRole('button', { name: /research mode/i });
    await expect(researchButton).toBeVisible({ timeout: 15_000 });

    // Set up response listener BEFORE clicking
    const cardsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/cards/research'),
      { timeout: 30_000 },
    );
    await researchButton.click();

    // Dismiss intro if shown
    const beginButton = page.getByRole('button', { name: /begin/i });
    if (await beginButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await beginButton.click();
    }

    // Complete tutorial if shown
    const tutorialConfidence = page.getByRole('button', { name: /certain|likely|guessing/i }).first();
    if (await tutorialConfidence.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await tutorialConfidence.click();
      const tutorialPhishing = page.getByRole('button', { name: /phishing/i });
      await expect(tutorialPhishing).toBeVisible({ timeout: 3_000 });
      await tutorialPhishing.click();
      const gotItButton = page.getByRole('button', { name: /got it/i });
      await expect(gotItButton).toBeVisible({ timeout: 3_000 });
      await gotItButton.click();
    }

    await cardsResponse;

    // Select confidence first, then answer
    const confidenceButton = page.getByRole('button', { name: /certain|likely|guessing/i }).first();
    await expect(confidenceButton).toBeVisible({ timeout: 10_000 });
    await confidenceButton.click();

    const phishingButton = page.getByRole('button', { name: /phishing/i });
    await expect(phishingButton).toBeVisible({ timeout: 5_000 });

    const checkResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/cards/check'),
      { timeout: 15_000 },
    );
    await phishingButton.click();

    await checkResponse;

    // Each card should only produce ONE check call
    expect(checkCount).toBe(1);
  });
});
