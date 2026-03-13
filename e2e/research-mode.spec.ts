import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { ensureTestUser, TEST_FRESH_EMAIL } from './helpers/test-accounts';
import { injectSession } from './helpers/auth';
import { answerCard, clickNext, completeResearchOnboarding } from './helpers/game-actions';

const supabaseUrl = process.env.TEST_SUPABASE_URL!;
const serviceKey = process.env.TEST_SUPABASE_SERVICE_KEY!;

test.describe('Research Mode', () => {
  let freshUser: Awaited<ReturnType<typeof ensureTestUser>>;

  test.beforeAll(async () => {
    freshUser = await ensureTestUser(TEST_FRESH_EMAIL);
  });

  test('answer is server-verified and stored in database', async ({ page }) => {
    await injectSession(page, supabaseUrl, freshUser.accessToken, freshUser.refreshToken);
    await page.goto('/');

    const researchButton = page.getByRole('button', { name: /research mode/i });
    await expect(researchButton).toBeVisible({ timeout: 15_000 });

    const cardsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/cards/research'),
      { timeout: 30_000 },
    );
    await researchButton.click();
    await cardsResponse;

    // Complete onboarding (intro + tutorial) for first-time user
    await completeResearchOnboarding(page);

    // Answer a real research card
    const checkData = await answerCard(page);

    // Verify server-side check returned correct structure
    expect(checkData).toHaveProperty('correct');
    expect(checkData).toHaveProperty('isPhishing');
    expect(checkData).toHaveProperty('pointsEarned');
    expect(checkData).toHaveProperty('streak');
    expect(checkData).toHaveProperty('explanation');
    expect(typeof checkData.correct).toBe('boolean');
    expect(typeof checkData.isPhishing).toBe('boolean');

    // Advance to next card to confirm game loop works
    await clickNext(page);

    // Second card's confidence selector should appear
    const confidence2 = page.getByRole('button', { name: /certain|likely|guessing/i }).first();
    await expect(confidence2).toBeVisible({ timeout: 10_000 });
  });

  test('each card produces exactly one /check call', async ({ page }) => {
    await injectSession(page, supabaseUrl, freshUser.accessToken, freshUser.refreshToken);
    await page.goto('/');

    let checkCount = 0;
    page.on('response', (resp) => {
      if (resp.url().includes('/api/cards/check')) checkCount++;
    });

    const researchButton = page.getByRole('button', { name: /research mode/i });
    await expect(researchButton).toBeVisible({ timeout: 15_000 });

    const cardsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/cards/research'),
      { timeout: 30_000 },
    );
    await researchButton.click();
    await cardsResponse;

    await completeResearchOnboarding(page);
    await answerCard(page);

    // Exactly one check call per answered card
    expect(checkCount).toBe(1);
  });

  test('answers are persisted to the database', async ({ page }) => {
    await injectSession(page, supabaseUrl, freshUser.accessToken, freshUser.refreshToken);
    await page.goto('/');

    // Get player's answer count before playing
    const db = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: player } = await db
      .from('players')
      .select('id')
      .eq('auth_id', freshUser.id)
      .single();

    const { count: beforeCount } = await db
      .from('answers')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', player?.id)
      .eq('game_mode', 'research');

    // Play one card
    const researchButton = page.getByRole('button', { name: /research mode/i });
    await expect(researchButton).toBeVisible({ timeout: 15_000 });

    const cardsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/cards/research'),
      { timeout: 30_000 },
    );
    await researchButton.click();
    await cardsResponse;

    await completeResearchOnboarding(page);
    await answerCard(page);

    // Wait for the answer to be persisted (client sends to /api/answers after feedback)
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/answers') && resp.status() === 200,
      { timeout: 15_000 },
    ).catch(() => null); // Answer logging is fire-and-forget, may not always arrive

    // Give the DB a moment to process
    await page.waitForTimeout(2_000);

    // Verify answer count increased
    const { count: afterCount } = await db
      .from('answers')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', player?.id)
      .eq('game_mode', 'research');

    expect((afterCount ?? 0)).toBeGreaterThan(beforeCount ?? 0);
  });
});
