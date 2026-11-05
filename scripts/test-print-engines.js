/* Đo rendering print-media trên Firefox & WebKit (page.pdf chỉ chạy Chromium).
   So sánh: screenshot media screen vs media print của cùng Sheet.
   Chạy: NODE_PATH=/home/z/.npm-global/lib/node_modules node scripts/test-print-engines.js */
const { chromium, firefox, webkit } = require('playwright')
const fs = require('fs')

const OUT = '/tmp/print-engines'
fs.mkdirSync(OUT, { recursive: true })

/* combo tiêu biểu: classic (showStroke) + pinyin-hint (modelCell off) + fade */
const payloads = {
  classic: { cfg: { layout: 'std', paper: 'tian', cols: 8, rows: 6, repeat: 3, showPinyin: true, showStroke: true }, wordsInput: '你好\n谢谢', activeTpl: 'classic' },
  pinyinHint: { cfg: { layout: 'std', paper: 'square', cols: 6, rows: 6, repeat: 4, modelCell: false, showPinyin: true }, wordsInput: '你好 谢谢', activeTpl: 'pinyin-hint' },
}

async function testEngine(name, launcher) {
  let browser
  try {
    browser = await launcher.launch()
  } catch (e) {
    console.log(`${name}: LAUNCH FAIL — ${String(e.message).split('\n')[0]}`)
    return
  }
  for (const [key, p] of Object.entries(payloads)) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
    await ctx.addInitScript((pl) => localStorage.setItem('nkhn.ws.cfg', JSON.stringify(pl)), p)
    const page = await ctx.newPage()
    try {
      await page.goto('http://localhost:3000/#/create-file', { waitUntil: 'networkidle' })
      await page.waitForTimeout(2200)
      /* scroll preview vào giữa màn hình */
      await page.evaluate(() => document.querySelector('.aspect-\\[210\\/297\\]')?.scrollIntoView({ block: 'center' }))
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${OUT}/${name}-${key}-screen.png` })
      /* media print */
      await page.emulateMedia({ media: 'print' })
      await page.waitForTimeout(900)
      await page.screenshot({ path: `${OUT}/${name}-${key}-print.png` })
      await page.emulateMedia({ media: 'screen' })
      console.log(`${name}-${key}: ok`)
    } catch (e) {
      console.log(`${name}-${key}: ERR ${String(e.message).split('\n')[0]}`)
    }
    await ctx.close()
  }
  await browser.close()
}

;(async () => {
  await testEngine('firefox', firefox)
  await testEngine('webkit', webkit)
  console.log('DONE')
})()
