/* Test case cuối: ảnh nền upload + in PDF */
const { chromium } = require('playwright')
const fs = require('fs')
const OUT = '/tmp/print-test3'
fs.mkdirSync(OUT, { recursive: true })

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  await ctx.addInitScript(() => {
    localStorage.setItem(
      'nkhn.ws.cfg',
      JSON.stringify({ cfg: { layout: 'std', paper: 'square', cols: 6, rows: 6, repeat: 2, showPinyin: true }, wordsInput: '你好 学习', activeTpl: 'imgbg' }),
    )
  })
  const page = await ctx.newPage()
  await page.goto('http://localhost:3000/#/create-file', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  /* mở Tùy chỉnh nâng cao rồi upload ảnh nền */
  await page.evaluate(() => {
    const acc = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Tùy chỉnh nâng cao'))
    if (acc && acc.getAttribute('aria-expanded') === 'false') acc.click()
  })
  await page.waitForTimeout(400)
  await page.setInputFiles('input[type=file]', '/tmp/bgimg.jpg')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/imgbg-screen.png` })
  await page.pdf({ path: `${OUT}/imgbg.pdf`, format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } })
  await browser.close()
  console.log('done')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
