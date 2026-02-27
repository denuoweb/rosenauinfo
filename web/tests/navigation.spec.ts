import { test, expect } from '@playwright/test'

const routes = ['/', '/about', '/projects', '/resume', '/contact'] as const
const forbiddenSnippets = [
  /Add a blurb/i,
  /admin panel/i,
  /管理画面/,
  /Upload the English resume/i,
  /Firestore の public\/home\.blurb_ja/i
]

test.describe('Public navigation guardrails', () => {
  test('routes render without placeholders and no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 780 })

    for (const path of routes) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      for (const snippet of forbiddenSnippets) {
        await expect(page.locator('body')).not.toContainText(snippet)
      }

      const hasOverflow = await page.evaluate(() => {
        const scrollWidth = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth
        )
        return scrollWidth > window.innerWidth + 1
      })
      expect(hasOverflow, `Horizontal overflow detected on ${path}`).toBeFalsy()
    }
  })
})
