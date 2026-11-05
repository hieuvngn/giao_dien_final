/* Đợt 2: các combo còn lại của #/create-file */
const { chromium } = require('playwright')
const { execSync } = require('child_process')
const fs = require('fs')

const OUT = '/tmp/print-test2'
fs.mkdirSync(OUT, { recursive: true })

const combos = [
  {
    name: 'info-sheet',
    payload: { cfg: { layout: 'info', paper: 'square', rows: 6, practiceCells: 4, showPinyin: true, showMeaning: true }, wordsInput: '你好\n谢谢\n学习\n时间', activeTpl: 'info-sheet' },
  },
  {
    name: 'radical-study-colorful',
    payload: { cfg: { layout: 'radical', paper: 'mi', colorful: true, practiceRows: 2, showPinyin: true }, activeTpl: 'radical-study' },
  },
  {
    name: 'pinyin-hint-modelcell-off',
    payload: { cfg: { layout: 'std', paper: 'square', cols: 6, rows: 6, repeat: 4, modelCell: false, showPinyin: true }, wordsInput: '你好 谢谢 再见', activeTpl: 'pinyin-hint' },
  },
  {
    name: 'fade-model-on',
    payload: { cfg: { layout: 'std', paper: 'mi', cols: 8, rows: 6, repeat: 3, fadeModel: true, showPinyin: true }, wordsInput: '学习 汉语', activeTpl: 'fade' },
  },
  {
    name: 'max-grid-14x12',
    payload: { cfg: { layout: 'std', paper: 'square', cols: 14, rows: 12, repeat: 1, showPinyin: false }, wordsInput: '一二三四五六七八九十', activeTpl: 'max' },
  },
  {
    name: 'minimal-gray',
    payload: { cfg: { layout: 'std', paper: 'square', cols: 8, rows: 8, repeat: 4, showPinyin: false, lineColor: 'gray' }, wordsInput: '大小 多少 上下', activeTpl: 'minimal' },
  },
  {
    name: 'bigchar-trace12-dark-custom',
    payload: { cfg: { layout: 'bigchar', paper: 'line', rows: 4, traceCells: 12, bg: 'custom', customColor: '#3a2d36', showStroke: false, showPinyin: true }, wordsInput: '永 春', activeTpl: 'bigdark' },
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
    await page.waitForTimeout(2200)
    await page.screenshot({ path: `${OUT}/${c.name}-screen.png` })
    await page.pdf({ path: `${OUT}/${c.name}.pdf`, format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } })
    await ctx.close()
    console.log('done:', c.name)
  }
  await browser.close()
  for (const c of combos) {
    try {
      execSync(`pdftoppm -r 55 -jpeg -jpegopt quality=70 -f 1 -l 1 "${OUT}/${c.name}.pdf" "${OUT}/${c.name}-pdf"`)
    } catch (e) {
      console.log('pdftoppm fail', c.name)
    }
  }
  console.log('ALL DONE')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
