/* ============================================================
   AI Mistake Analyzer — kho quy luật lỗi sai (错题本)
   ------------------------------------------------------------
   Mỗi pattern = một quy luật lỗi phổ biến của người Việt học
   tiếng Trung: hàm test() nhận diện câu sai, fix() sinh câu sửa.
   Analyzer chạy tuần tự qua các pattern (thứ tự trong mảng),
   một câu có thể dính nhiều quy luật cùng lúc.
   ============================================================ */

export type MistakeType = 'grammar' | 'particle' | 'measure' | 'order'

export const TYPE_META: Record<
  MistakeType,
  { label: string; emoji: string; cls: string; color: string }
> = {
  grammar: {
    label: 'Ngữ pháp',
    emoji: '📐',
    cls: 'bg-[var(--pastel-pink)] text-[#8a4a63] ring-[#f3c4d3]',
    color: '#e8737f',
  },
  particle: {
    label: 'Trợ từ',
    emoji: '🧩',
    cls: 'bg-[var(--pastel-lilac)] text-[#6d5a94] ring-[#e2d6f0]',
    color: '#8b7fc4',
  },
  measure: {
    label: 'Lượng từ',
    emoji: '🍚',
    cls: 'bg-[var(--pastel-butter)] text-[#8a6a1f] ring-[#f2e2b8]',
    color: '#f0b429',
  },
  order: {
    label: 'Trật tự từ',
    emoji: '🔀',
    cls: 'bg-[var(--pastel-sky)] text-[#46688f] ring-[#cfe0ef]',
    color: '#6d93bd',
  },
}

/* ---------- quy luật lỗi ---------- */

export type ErrorPattern = {
  id: string
  type: MistakeType
  topic: string // Chủ đề
  issue: string // Vấn đề (mô tả ngắn)
  knowledge: string[] // Kiến thức liên quan (dùng để tổng hợp quy luật)
  level: string
  explain: string // Giải thích dài
  flip?: boolean // đổi 我 → 你 (hỏi người đối diện)
  test: (s: string) => boolean
  fix: (s: string) => string
}

const VERB = '去|来|吃|喝|看|买|卖|学|做|写|说|听|读|见|找|开|关|跑|走|唱|洗|用'
const PLACES = '大学|家|学校|北京|上海|食堂|图书馆|宿舍|商店|超市|公司|医院|银行|教室|公园|中国|越南|饭店|咖啡店'
const CLS_CHARS = '个本只条件双辆杯瓶碗块支张场棵副朵封部台把节首座根片'

/* Lượng từ đúng cho danh từ hay bị gắn chung với 个 */
export const CLASSIFIER_MAP: Record<string, string> = {
  面条: '碗', 米饭: '碗', 米线: '碗',
  书: '本', 书本: '本', 词典: '本',
  裤子: '条', 裙子: '条', 鱼: '条', 毛巾: '条', 新闻: '条', 河: '条',
  啤酒: '瓶', 可乐: '瓶', 矿泉水: '瓶',
  水: '杯', 茶: '杯', 咖啡: '杯', 牛奶: '杯', 果汁: '杯',
  衬衫: '件', 外套: '件', 毛衣: '件', 衣服: '件',
  鞋: '双', 鞋子: '双', 袜子: '双', 手套: '双', 筷子: '双',
  眼镜: '副',
  照片: '张', 纸: '张', 桌子: '张', 床: '张', 票: '张', 地图: '张',
  车: '辆', 自行车: '辆', 汽车: '辆', 出租车: '辆', 摩托车: '辆',
  花: '朵', 树: '棵',
  狗: '只', 猫: '只', 鸟: '只', 老虎: '只',
  手机: '部', 电话: '部',
  电脑: '台', 电视: '台',
  电影: '场', 雨: '场', 比赛: '场',
  信: '封',
  铅笔: '支', 笔: '支', 牙膏: '支',
  香蕉: '根', 油条: '根',
  蛋糕: '块', 肥皂: '块', 手表: '块',
  刀: '把', 椅子: '把', 伞: '把',
  歌: '首', 诗: '首',
  牛: '头', 课: '节',
}

const CLS_KEYS = Object.keys(CLASSIFIER_MAP).sort((a, b) => b.length - a.length)
const CLS_RE = new RegExp(`(一|两|三|四|五|六|七|八|九|几)个(${CLS_KEYS.join('|')})`)

export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    id: 'zhengfan-tail',
    type: 'grammar',
    topic: 'Câu hỏi chính phản',
    issue: 'Kết hợp cấu trúc câu trần thuật với hình thức nghi vấn không phù hợp.',
    knowledge: ['了', 'Câu hỏi với 吗'],
    level: 'HSK 2',
    flip: true,
    explain:
      'Muốn hỏi ai đó đã làm việc gì chưa, giữ nguyên câu trần thuật và thêm 吗 ở cuối: 你 昨天 去 学校 了 吗？ Trợ từ 了 không thể đứng chung với 没有 ở cuối câu. Nếu muốn giữ hình thức chính phản, lặp động từ: 去 没 去 (không kèm 了).',
    test: (s) => /了\s*(没有|没)$/.test(s),
    fix: (s) => s.replace(/了\s*(没有|没)$/, '了吗'),
  },
  {
    id: 'zhengfan-vnv',
    type: 'grammar',
    topic: 'Câu hỏi chính phản',
    issue: 'Hình thức chính phản V 没 V bị thêm trợ từ 了.',
    knowledge: ['了', 'Câu hỏi với 吗'],
    level: 'HSK 2',
    explain:
      'Trong câu hỏi chính phản, động từ được lặp: 去 没 去、吃 没 吃、看 没 看. Trợ từ 了 phải bỏ đi — 了 chỉ dùng để báo động tác hoàn thành ở câu trần thuật.',
    test: (s) => new RegExp(`(${VERB})没\\1了`).test(s),
    fix: (s) => s.replace(new RegExp(`(没(${VERB}))了`), '$1'),
  },
  {
    id: 'mei-le',
    type: 'particle',
    topic: 'Phủ định với 了',
    issue: 'Câu phủ định với 没 (有) vẫn giữ trợ từ 了.',
    knowledge: ['了', '没有'],
    level: 'HSK 1',
    explain:
      '了 báo động tác hoàn thành (khẳng định). Khi phủ định sự việc đã xảy ra, tiếng Trung dùng 没 (有) đứng trước động từ và bỏ 了: 我 没 看 电视. Đây là điểm khác lớn so với tiếng Việt kiểu "đã … rồi".',
    test: (s) => {
      const m = s.match(/没(有)?([^了]{1,8})了/)
      return !!m && new RegExp(VERB).test(m[2] ?? '')
    },
    fix: (s) => s.replace(/了([^了]*)$/, '$1'),
  },
  {
    id: 'future-le',
    type: 'particle',
    topic: '了 với tương lai',
    issue: 'Dùng 了 cho hành động chưa xảy ra (thời gian tương lai).',
    knowledge: ['了'],
    level: 'HSK 2',
    explain:
      '了 là trợ từ động tác hoàn thành, không phải "dấu quá khứ". Hành động ở tương lai (明天、下周、明年、以后…) chưa hoàn thành nên không dùng 了: 我 明天 去 北京.',
    test: (s) => /(明天|后天|下周|下个星期|下星期|下个月|明年|以后|将来|等会儿)/.test(s) && s.includes('了') && !s.includes('没'),
    fix: (s) => s.replace(/会了/, '会').replace(/了/, ''),
  },
  {
    id: 'habit-le',
    type: 'particle',
    topic: 'Thói quen & tần suất',
    issue: 'Dùng 了 cho thói quen lặp lại thường xuyên.',
    knowledge: ['了'],
    level: 'HSK 2',
    explain:
      'Với hành động lặp lại theo thói quen (每天、天天、常常、经常、每次、平时), câu mô tả việc hay xảy ra chứ không phải một động tác hoàn thành → bỏ 了: 我 每天 去 图书馆.',
    test: (s) => /(每天|天天|常常|经常|每次|平时|老是)/.test(s) && s.includes('了'),
    fix: (s) => s.replace(/了/, ''),
  },
  {
    id: 'er-liang',
    type: 'measure',
    topic: '二 vs 两',
    issue: 'Dùng 二 trước lượng từ khi phải dùng 两.',
    knowledge: ['两'],
    level: 'HSK 1',
    explain:
      'Khi đếm số lượng kèm lượng từ, tiếng Trung dùng 两: 两 本书、两 个人、两 杯 啤酒. 二 chỉ dùng trong số học (十二、二十二), số thứ tự (第二) và đọc số điện thoại.',
    test: (s) => new RegExp(`(?<!第)(?<![一二三四五六七八九十])二(?=[${CLS_CHARS}])`).test(s),
    fix: (s) => s.replace(new RegExp(`(?<!第)(?<![一二三四五六七八九十])二(?=[${CLS_CHARS}])`), '两'),
  },
  {
    id: 'classifier-ge',
    type: 'measure',
    topic: 'Chọn lượng từ',
    issue: 'Dùng lượng từ chung 个 cho danh từ cần lượng từ riêng.',
    knowledge: ['Lượng từ'],
    level: 'HSK 1',
    explain:
      'Mỗi danh từ đi với một lượng từ riêng theo hình dáng / đơn vị đếm: 一 碗 面条 (một bát mì), 一 本 书 (một quyển sách), 一 条 裤子 (một chiếc quần), 一 瓶 啤酒 (một chai bia). Lượng từ 个 chỉ dùng cho sự vật trung tính như 一个人、一个问题.',
    test: (s) => CLS_RE.test(s),
    fix: (s) => s.replace(CLS_RE, (_, num: string, noun: string) => `${num}${CLASSIFIER_MAP[noun]}${noun}`),
  },
  {
    id: 'place-after-verb',
    type: 'order',
    topic: 'Trạng ngữ địa điểm',
    issue: 'Đặt 在 + địa điểm sau động từ (dịch sát từ tiếng Việt).',
    knowledge: ['Trật tự trạng ngữ'],
    level: 'HSK 2',
    explain:
      'Trong câu kể đơn, trạng ngữ chỉ địa điểm đứng TRƯỚC động từ: Chủ ngữ + 在 + địa điểm + động từ + đối tượng → 我 在 大学 学习 汉语. Dạng động từ + 在 + địa điểm chỉ dùng khi nhấn mạnh vị trí kết quả (他 住 在 北京、书 放 在 桌子 上).',
    test: (s) =>
      new RegExp(`^(我|你|他|她|我们|你们|他们)[^在]{0,10}(学习|工作|吃|喝|看|买|做|写|说|听|读|用)[^在]{0,8}在(${PLACES})$`).test(s),
    fix: (s) => s.replace(new RegExp(`^(我|你|他|她|我们|你们|他们)(.+?)在(${PLACES})$`), '$1在$3$2'),
  },
  {
    id: 'gei-order',
    type: 'order',
    topic: 'Câu song đối tượng',
    issue: 'Chen vật phẩm vào giữa 给 và người nhận.',
    knowledge: ['给'],
    level: 'HSK 2',
    explain:
      'Câu có hai đối tượng theo mẫu: 给 + người nhận + vật phẩm → 我 给 他 一本书， giống cấu trúc "cho ai cái gì" của tiếng Việt.',
    test: (s) => new RegExp(`给(一[${CLS_CHARS}][^，。]{0,3})(我|你|他|她|妈妈|老师|朋友|同学)$`).test(s),
    fix: (s) => s.replace(new RegExp(`给(一[${CLS_CHARS}][^，。]{0,3})(我|你|他|她|妈妈|老师|朋友|同学)$`), '给$2$1'),
  },
  {
    id: 'svo-order',
    type: 'order',
    topic: 'Trật tự S–V–O',
    issue: 'Đặt đối tượng trước động từ.',
    knowledge: ['Trật tự từ SVO'],
    level: 'HSK 1',
    explain:
      'Câu cơ bản của tiếng Trung theo trật tự Chủ ngữ – Động từ – Đối tượng, giống tiếng Việt: 我 学习 汉语. Dạng "chủ đề – bình luận" (汉语 我 说 得 不好) chỉ dùng khi có cấu trúc đặc biệt.',
    test: (s) => /^(我|你|他|她|我们|你们|他们)(汉语|中文|英语|法语|越南语|韩语|日语)(学习|学|说|写|读|讲)$/.test(s),
    fix: (s) => s.replace(/^(我|你|他|她|我们|你们|他们)(汉语|中文|英语|法语|越南语|韩语|日语)(学习|学|说|写|读|讲)$/, '$1$3$2'),
  },
  {
    id: 'dou-position',
    type: 'order',
    topic: 'Phó từ 都',
    issue: 'Đặt 都 trước chủ ngữ.',
    knowledge: ['都'],
    level: 'HSK 2',
    explain:
      '都 là phó từ nên phải đứng sau chủ ngữ, trước động từ / tính từ: 我们 都 是 学生、他们 都 学习 汉语.',
    test: (s) => /^都(我们|你们|他们|她们|大家|我|你|他|她)/.test(s),
    fix: (s) => s.replace(/^都(我们|你们|他们|她们|大家|我|你|他|她)/, '$1都'),
  },
  {
    id: 'de-de',
    type: 'grammar',
    topic: 'Bổ ngữ trạng thái 得',
    issue: 'Nhầm 的 thay cho 得 sau động từ.',
    knowledge: ['得'],
    level: 'HSK 2',
    explain:
      'Mô tả cách thức / mức độ của hành động dùng 得: 动词 + 得 + tính từ → 他 说 得 很快. Ba chị em: 的 đứng trước danh từ (我的书)， 地 đứng trước động từ (慢慢地走)， 得 sau động từ.',
    test: (s) => /(跑|走|说|写|看|吃|学|做|唱|开|讲|读|来|去)的(很|真|太|不)/.test(s),
    fix: (s) => s.replace(/(跑|走|说|写|看|吃|学|做|唱|开|讲|读|来|去)的(很|真|太|不)/, '$1得$2'),
  },
  {
    id: 'ba-complement',
    type: 'grammar',
    topic: 'Câu chữ 把',
    issue: 'Câu 把 kết thúc bằng động từ trơ, thiếu bổ ngữ.',
    knowledge: ['把'],
    level: 'HSK 3',
    explain:
      'Công thức câu 把: 主语 + 把 + đối tượng + động từ + thành phần kết quả (了/完/好/到/在/给). Động từ không thể đứng trơ ở cuối: 我 把 作业 做 完 了.',
    test: (s) => /把([^，。？]{1,6})(学习|做|看|写|吃|喝|洗|放|买|卖|修|关|开|读|穿)$/.test(s),
    fix: (s) => s.replace(/把([^，。？]{1,6})(学习|做|看|写|吃|喝|洗|放|买|卖|修|关|开|读|穿)$/, '把$1$2完了'),
  },
]

/* ---------- lời khuyên & bài luyện theo kiến thức ---------- */

export const ADVICE_MAP: Record<string, string> = {
  了:
    '了 không phải dấu quá khứ — nó báo động tác HOÀN THÀNH. Ba quy tắc nhớ ngay: (1) phủ định quá khứ dùng 没， không kèm 了； (2) hành động tương lai (明天/下周…) không dùng 了； (3) thói quen (每天/常常) không dùng 了； hỏi "chưa" dùng 吗 hoặc V 没 V.',
  'Lượng từ':
    'Học từ vựng theo cụm 数量名 (số + lượng từ + danh từ): 一本 书、一条 裤子、一碗 面条、一瓶 啤酒. Mỗi danh từ có lượng từ riêng theo hình dáng / đơn vị — đừng mặc định dùng 个.',
  'Trật tự trạng ngữ':
    'Công thức vàng: Chủ ngữ + Thời gian + 在/从/跟 + địa điểm + Phó từ (都/只/常) + Động từ + Đối tượng. Trạng ngữ luôn đứng trước động từ.',
  两: 'Đếm đồ dùng 两 + lượng từ: 两个人、两本书. 二 chỉ xuất hiện trong 十二、二十二、第二 và khi đọc số điện thoại.',
  'Câu hỏi với 吗':
    'Câu hỏi có/không: giữ nguyên câu trần thuật + 吗 cuối câu. Nếu dùng hình thức V 没 V thì không được thêm 了.',
  没有: 'Phủ định sự việc đã xảy ra: 没 (有) + động từ, bỏ 了. Phủ định hành động hiện tại/tương lai dùng 不.',
  给: 'Câu song đối tượng: 给 + người nhận + vật phẩm (给我一本书). Đừng chen vật phẩm giữa 给 và người nhận.',
  得: 'Động từ + 得 + tính từ để nói "làm thế nào": 说得很快、跑得不慢. 的 đứng trước danh từ, 地 đứng trước động từ, 得 đứng sau động từ.',
  把: 'Câu 把 cần động từ mang "kết quả": 把 + đối tượng + động từ + 完/好/到/在/了. Đừng kết thúc bằng động từ trơ.',
  都: '都 là phó từ — luôn đứng sau chủ ngữ, trước động từ: 我们都是学生.',
  'Trật tự từ SVO': 'Nhớ trật tự Chủ ngữ – Động từ – Đối tượng, giống tiếng Việt: 我学习汉语.',
}

export const DRILLS: Record<string, { emoji: string; label: string }[]> = {
  了: [
    { emoji: '🧩', label: 'Ôn nhanh trợ từ 了 · 10 câu' },
    { emoji: '📝', label: 'Chữa lỗi 了 · đề HSK 2' },
    { emoji: '🎤', label: 'Luyện nói: nhà hàng (了 với 完)' },
  ],
  'Lượng từ': [
    { emoji: '🍚', label: 'Flashcard 20 lượng từ' },
    { emoji: '📝', label: 'Điền lượng từ · HSK 1–2' },
    { emoji: '🎤', label: 'Luyện nói: mua sắm' },
  ],
  'Trật tự trạng ngữ': [
    { emoji: '🔀', label: 'Sắp xếp câu · trạng ngữ địa điểm' },
    { emoji: '📖', label: 'Bài 在 + địa điểm' },
    { emoji: '🎤', label: 'Luyện nói: hỏi đường' },
  ],
  两: [
    { emoji: '2️⃣', label: 'Bài tập 两 vs 二' },
    { emoji: '🃏', label: 'Flashcard số đếm' },
  ],
  'Câu hỏi với 吗': [{ emoji: '❓', label: 'Câu hỏi 吗 & V 没 V' }],
  没有: [{ emoji: '🚫', label: 'Phủ định 没 vs 不' }],
  给: [{ emoji: '🎁', label: 'Câu song đối tượng với 给' }],
  得: [{ emoji: '🏃', label: 'Bổ ngữ trạng thái 得' }],
  把: [{ emoji: '🧺', label: 'Câu chữ 把 · HSK 3' }],
  都: [{ emoji: '👥', label: 'Vị trí phó từ 都/也/只' }],
  'Trật tự từ SVO': [{ emoji: '🔤', label: 'Sắp xếp trật tự S–V–O' }],
}
export const DEFAULT_DRILLS: { emoji: string; label: string }[] = [
  { emoji: '📝', label: 'Làm bài tập ôn HSK' },
  { emoji: '🃏', label: 'Xem lại flashcard đã quên' },
]

/* ---------- câu ví dụ để thử nhanh ---------- */

export const EXAMPLE_SENTENCES = [
  '我昨天去学校了没有。',
  '我想吃一个面条。',
  '我学习汉语在大学。',
  '我买了二本书。',
  '我每天去了图书馆。',
  '我要一个啤酒。',
]

/* ---------- dữ liệu demo hạt giống ----------
   Đúng theo kịch bản: sau 10 bài tập —
   7 lỗi về 了 · 4 lỗi lượng từ · 3 lỗi trật tự trạng ngữ */

export const SEED_SENTENCES: { raw: string; daysAgo: number }[] = [
  { raw: '我昨天去学校了没有。', daysAgo: 18 },
  { raw: '你去没去了食堂？', daysAgo: 17 },
  { raw: '我明天去了北京。', daysAgo: 15 },
  { raw: '我下周会见了老师。', daysAgo: 13 },
  { raw: '我没有看电视了。', daysAgo: 11 },
  { raw: '我每天去了图书馆。', daysAgo: 9 },
  { raw: '他做完作业了没有。', daysAgo: 7 },
  { raw: '我想吃一个面条。', daysAgo: 6 },
  { raw: '我买了二本书。', daysAgo: 5 },
  { raw: '他穿一个裤子。', daysAgo: 4 },
  { raw: '我要一个啤酒。', daysAgo: 3 },
  { raw: '我学习汉语在大学。', daysAgo: 2 },
  { raw: '我吃饭在食堂。', daysAgo: 1 },
  { raw: '我给一本书他。', daysAgo: 0 },
]
