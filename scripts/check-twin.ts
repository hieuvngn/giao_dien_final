import {
  computeTwinIndices,
  buildAiComment,
  overallLevel,
  estHsk,
} from '/home/z/my-project/src/components/twin/twin-data'

for (const w of [7, 30] as const) {
  const idx = computeTwinIndices(w)
  console.log(`\n=== Cửa sổ ${w} ngày ===`)
  console.log('scores:', idx.scores)
  console.log('trends:', idx.trends)
  console.log('overall:', idx.overall, '| trend:', idx.trend, '| level:', overallLevel(idx.trend).label, '| hsk:', estHsk(idx.overall))
  console.log('read vs listen:', idx.vocabReadPct, idx.vocabListenPct, '| gap:', idx.readListenGap)
  console.log('weakest:', idx.weakest, '| strongest:', idx.strongest)
  const c = buildAiComment(idx)
  console.log('--- AI comment ---')
  c.paragraphs.forEach((p) => console.log(' •', p))
  console.log('suggestions:', c.suggestions.map((s) => `${s.emoji} ${s.label} → ${s.href}`).join(' | '))
}
