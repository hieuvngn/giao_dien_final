/* Kiểm tra in PDF của #/create-file — tái hiện lỗi "in ra mất chữ".
   Dùng Playwright (global) + Chromium; mỗi combo = 1 PDF A4 (printBackground).
   Chạy: NODE_PATH=/home/z/.npm-global/lib/node_modules node scripts/test-print-pdf.js */
const { chromium } = require('playwright')
const { execSync } = require('child_process')
const fs = require('fs')

const OUT = '/tmp/print-test'
fs.mkdirSync(OUT, { recursive: true })

/* các combo: tên → payload localStorage (nkhn.ws.cfg) */
const combos = [
  {
    name: 'classic-default',
    payload: { cfg: { layout: 'std', paper: 'tian', cols: 8, rows: 6, repeat: 3, showPinyin: true, showStroke: true }, wordsInput: '你好\n谢谢\n学习', activeTpl: 'classic' },
  },
  {
    name: 'rainbow-colorful',
    payload: { cfg: { layout: 'std', paper: 'square', cols: 6, rows: 6, repeat: 3, colorful: true, showPinyin: true }, wordsInput: '你好 谢谢 学习 汉语', activeTpl: 'rainbow' },
  },
  {
    name: 'calligraphy-plum-bigchar',
    payload: { cfg: { layout: 'bigchar', paper: 'square', rows: 4, traceCells: 8, bg: 'plum', showStroke: true, showPinyin: false }, wordsInput: '福 春 和 龍', activeTpl: 'calligraphy-art' },
  },
  {
    name: 'free-lines-flow-cream',
    payload: { cfg: { layout: 'flow', paper: 'line', cols: 12, rows: 8, bg: 'cream', showPinyin: false }, para: '今天天气很好，我们去学校学习汉语。', activeTpl: 'calligraphy-paper' },
  },
  {
    name: 'big-grid-13x10-story',
    payload: { cfg: { layout: 'flow', paper: 'square', cols: 13, rows: 10, showPinyin: false }, para: '我们一家人都喜欢学习中文，每天都练习写汉字。', activeTpl: 'story' },
  },
  {
    name: 'custom-dark-bg',
    payload: { cfg: { layout: 'std', paper: 'square', cols: 6, rows: 6, repeat: 3, bg: 'custom', customColor: '#22304a', showPinyin: true }, wordsInput: '你好 学习', activeTpl: 'custom-dark' },
  },
  {
    name: 'stroke-focus',
    payload: { cfg: { layout: 'stroke', paper: 'square', cols: 6, rows: 7, repeat: 4, showStroke: true }, wordsInput: '学习\n汉语\n谢谢', activeTpl: 'stroke-focus' },
  },
]

;(async () => {
  const browser = await chromium.launch()
  for (const c of combos) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
    await ctx.addInitScript((p) => {
      localStorage.setItem('nkhn.ws.cfg', JSON.stringify(p))
    }, c.payload)
    const page = await ctx.newPage()
    await page.goto('http://localhost:3000/#/create-file', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    /* ảnh màn hình (preview) để đối chiếu */
    await page.screenshot({ path: `${OUT}/${c.name}-screen.png` })

    /* PDF giống "Save as PDF" + Background graphics bật */
    await page.pdf({
      path: `${OUT}/${c.name}.pdf`,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    })
    await ctx.close()
    console.log('done:', c.name)
  }
  await browser.close()

  /* chuyển từng PDF thành ảnh đầu tiên để kiểm tra */
  for (const c of combos) {
    try {
      execSync(`pdftoppm -r 55 -jpeg -jpegopt quality=70 -f 1 -l 1 "${OUT}/${c.name}.pdf" "${OUT}/${c.name}-pdf"`)
    } catch (e) {
      console.log('pdftoppm fail', c.name, e.message)
    }
  }
  console.log('ALL DONE')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
