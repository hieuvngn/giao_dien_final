/* Test nhanh engine phân tích lỗi — chạy: bun scripts/test-mistakes.ts */
import { analyzeSentence, buildConclusion, buildSeedRecords, glossSentence, segment } from '../src/components/mistakes/mistake-engine'

let pass = 0
let fail = 0

function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) {
    pass++
    console.log(`✓ ${name}`)
  } else {
    fail++
    console.log(`✗ ${name}\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`)
  }
}

const correctedOf = (s: string) => analyzeSentence(s).issues.map((i) => i.corrected)

// 1. Ví dụ gốc của user
const r1 = analyzeSentence('我昨天去学校了没有。')
check('user example: 1 lỗi', r1.issues.length, 1)
check('user example: câu sửa', correctedOf('我昨天去学校了没有。'), ['你昨天去学校了吗？'])
check('user example: loại lỗi', r1.issues[0]?.type, 'grammar')
check('user example: chủ đề', r1.issues[0]?.topic, 'Câu hỏi chính phản')
check('user example: kiến thức', r1.issues[0]?.knowledge, ['了', 'Câu hỏi với 吗'])
check('user example: điểm sửa', r1.issues[0]?.spot, { a: '没有', b: '吗' })

// 2. Các quy luật còn lại
check('lượng từ 面条', correctedOf('我想吃一个面条。'), ['我想吃一碗面条。'])
check('lượng từ 啤酒', correctedOf('我要一个啤酒。'), ['我要一瓶啤酒。'])
check('lượng từ 裤子', correctedOf('他穿一个裤子。'), ['他穿一条裤子。'])
check('二 → 两', correctedOf('我买了二本书。'), ['我买了两本书。'])
check('trạng ngữ địa điểm', correctedOf('我学习汉语在大学。'), ['我在大学学习汉语。'])
check('trạng ngữ 食堂', correctedOf('我吃饭在食堂。'), ['我在食堂吃饭。'])
check('V没V了', correctedOf('你去没去了食堂？'), ['你去没去食堂？'])
check('tương lai + 了', correctedOf('我明天去了北京。'), ['我明天去北京。'])
check('会见了', correctedOf('我下周会见了老师。'), ['我下周会见老师。'])
check('phủ định + 了', correctedOf('我没有看电视了。'), ['我没有看电视。'])
check('thói quen + 了', correctedOf('我每天去了图书馆。'), ['我每天去图书馆。'])
check('了没有 (他)', correctedOf('他做完作业了没有。'), ['他做完作业了吗？'])
check('câu 把', correctedOf('我把作业做。'), ['我把作业做完了。'])
check('的 → 得', correctedOf('我跑的很快。'), ['我跑得很快。'])
check('都 trước chủ ngữ', correctedOf('都我们学习汉语。'), ['我们都学习汉语。'])
check('song đối tượng 给', correctedOf('我给一本书他。'), ['我给他一本书。'])
check('SVO', correctedOf('我汉语学习。'), ['我学习汉语。'])

// 3. Câu đúng → không lỗi
check('câu đúng: 了吗', analyzeSentence('你昨天去学校了吗？').issues.length, 0)
check('câu đúng: 我给他一本书。', analyzeSentence('我给他一本书。').issues.length, 0)
check('câu đúng: 我在大学学习汉语。', analyzeSentence('我在大学学习汉语。').issues.length, 0)
check('câu đúng: 两本书', analyzeSentence('我买了两本书。').issues.length, 0)
check('câu đúng: 十二块', analyzeSentence('这十二块钱是我的。').issues.length, 0)
check('câu đúng: 没有 + 钱', analyzeSentence('我没有钱了。').issues.length, 0)
check('câu đúng: 住在北京', analyzeSentence('我住在北京。').issues.length, 0)

// 4. Nhiều lỗi trong 1 câu
const multi = analyzeSentence('我想一个啤酒了没有。')
check('2 lỗi trong 1 câu', multi.issues.length, 2)

// 5. Seed + kết luận
const seeds = buildSeedRecords()
check('14 lỗi seed', seeds.length, 14)
const con = buildConclusion(seeds)
check('top kiến thức = 了', con.top?.key, '了')
check('了 xuất hiện 7 lần', con.top?.count, 7)
check('了 chiếm 50%', con.top?.pct, 50)
check('headline', con.headline, 'Bạn đang gặp vấn đề với cách sử dụng 了')
check('mức độ rõ rệt', con.strength, 'rõ rệt')
const byType = Object.fromEntries(con.byType.map((t) => [t.type, t.count]))
check('theo loại: grammar=3 particle=4 measure=4 order=3', [byType.grammar, byType.particle, byType.measure, byType.order], [3, 4, 4, 3])
check('advice có nội dung', con.advice.includes('了'), true)
check('drills có 3 mục', con.drills.length, 3)

// 6. Gloss pinyin / nghĩa
const g1 = glossSentence('你昨天去学校了吗')
console.log('  gloss pinyin:', g1?.pinyin)
check('gloss có pinyin bạn', (g1?.pinyin ?? '').startsWith('nǐ'), true)
check('gloss vi đầy đủ', g1?.vi?.includes('Bạn'), true)
const g2 = glossSentence('我想吃一碗面条')
console.log('  gloss pinyin:', g2?.pinyin)
check('gloss 碗 có trong pinyin', g2?.pinyin.includes('wǎn'), true)

// 7. Tách từ
check('segment 4-token', segment('我想吃面条').map((t) => t.cn), ['我', '想', '吃', '面条'])

console.log(`\n=== ${pass} pass / ${fail} fail ===`)
if (fail > 0) process.exit(1)
