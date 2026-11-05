/* ============================================================
   templates.ts — bộ 24 MẪU GIẤY tập viết theo 6 nhóm
   Tham chiếu logic của xiehanzi.com/tao-vo-tap-viet:
   mỗi mẫu là 1 "preset" gồm bố cục + kiểu ô + số dòng + tuỳ
   chọn hiển thị (phiên âm / nghĩa / thứ tự nét / chữ gợi ý) +
   nền giấy; một số mẫu kèm sẵn danh sách từ hoặc đoạn văn.
   ============================================================ */

export type PaperType = 'tian' | 'mi' | 'square' | 'line'
export type PaperBg = 'white' | 'cream' | 'pink' | 'mint' | 'butter' | 'plum' | 'bamboo' | 'custom'
export type LayoutMode = 'std' | 'info' | 'flow' | 'radical' | 'stroke' | 'bigchar'
export type LineColor = 'pink' | 'gray' | 'blue' | 'red'
export type TplLevel = 'coban' | 'socap' | 'trungcap' | 'nangcao'
export type GroupId = 'nentaang' | 'kinhdien' | 'tuvung' | 'cauondoan' | 'chuyende' | 'thuphap'
export type RadFilter = 'all' | '1-2' | '3-4' | '5-6' | '7+'

/* ---------- cấu hình đầy đủ của 1 trang vở ---------- */

export type SheetCfg = {
  layout: LayoutMode
  paper: PaperType
  cols: number
  rows: number
  repeat: number
  practiceCells: number
  practiceRows: number
  traceCells: number
  showPinyin: boolean
  showMeaning: boolean
  showStroke: boolean
  fadeModel: boolean
  modelCell: boolean
  colorful: boolean
  bg: PaperBg
  customColor: string
  lineColor: LineColor
  showHeader: boolean
  sheetTitle: string
  footerText: string
  wmOn: boolean
  wmText: string
}

export const DEFAULT_CFG: SheetCfg = {
  layout: 'std',
  paper: 'tian',
  cols: 8,
  rows: 6,
  repeat: 3,
  practiceCells: 4,
  practiceRows: 1,
  traceCells: 8,
  showPinyin: true,
  showMeaning: true,
  showStroke: false,
  fadeModel: false,
  modelCell: true,
  colorful: false,
  bg: 'white',
  customColor: '#ffffff',
  lineColor: 'pink',
  showHeader: true,
  sheetTitle: '',
  footerText: '',
  wmOn: true,
  wmText: 'Nhật ký Hán ngữ',
}

/* ---------- tiêu đề đầu trang theo bố cục ---------- */

export const SHEET_HEAD: Record<LayoutMode, { vi: string; cn: string; color: string }> = {
  std: { vi: 'Tập viết chữ Hán', cn: '练字本', color: '#e88aa6' },
  info: { vi: 'Bảng thông tin từ vựng', cn: '信息表', color: '#46688f' },
  flow: { vi: 'Tập chép văn bản', cn: '课文', color: '#3f6b50' },
  radical: { vi: 'Luyện viết bộ thủ', cn: '部首练习', color: '#c07a2c' },
  stroke: { vi: 'Luyện viết theo thứ tự nét', cn: '笔顺练习', color: '#d2495f' },
  bigchar: { vi: 'Ô chữ lớn', cn: '大字格', color: '#46688f' },
}

/* ---------- nền giấy (màu phẳng / hoạ tiết / tuỳ chỉnh) ---------- */

export const BACKDROPS: { id: PaperBg; label: string; cn: string; bg: string }[] = [
  { id: 'white', label: 'Trắng tinh', cn: '白', bg: '#ffffff' },
  { id: 'cream', label: 'Kem vintage', cn: '米', bg: '#fffdf4' },
  { id: 'pink', label: 'Hồng đào', cn: '粉', bg: '#fff4f7' },
  { id: 'mint', label: 'Xanh mint', cn: '青', bg: '#f0f8f2' },
  { id: 'butter', label: 'Vàng bơ', cn: '黄', bg: '#fff8e4' },
  {
    id: 'plum',
    label: 'Hoa mai',
    cn: '梅',
    bg: 'radial-gradient(circle, rgba(232,138,166,0.22) 0 2px, transparent 2.7px) 0 0/26px 26px repeat, radial-gradient(circle, rgba(240,180,41,0.18) 0 1.6px, transparent 2.3px) 13px 13px/26px 26px repeat, #fff8ef',
  },
  {
    id: 'bamboo',
    label: 'Tre trúc',
    cn: '竹',
    bg: 'repeating-linear-gradient(90deg, rgba(63,107,80,0.09) 0 3px, transparent 3px 24px), #f0f8f2',
  },
]

export const LINE_COLORS: { id: LineColor; label: string; line: string; guide: string }[] = [
  { id: 'pink', label: 'Hồng pastel', line: '#ecc2cf', guide: '#f2ccd6' },
  { id: 'gray', label: 'Xám chì', line: '#c9c2bb', guide: '#ddd6cf' },
  { id: 'blue', label: 'Xanh dương', line: '#b9cfe6', guide: '#d3e2f1' },
  { id: 'red', label: 'Đỏ luyện viết', line: '#e6b3ab', guide: '#f0cdc5' },
]

/* bảng màu cho mẫu "Luyện tập đầy màu sắc" */
export const RAINBOW_CELLS = ['#fcd7e2', '#fdeec9', '#d9efdc', '#d7e7f5', '#e6dcf4', '#fbe3d1']

/* ---------- bộ thủ: lọc theo số nét ---------- */

export const STROKE_RANGES: { id: RadFilter; label: string; test: (s: number) => boolean }[] = [
  { id: 'all', label: 'Tất cả', test: () => true },
  { id: '1-2', label: '1–2 nét', test: (s) => s <= 2 },
  { id: '3-4', label: '3–4 nét', test: (s) => s >= 3 && s <= 4 },
  { id: '5-6', label: '5–6 nét', test: (s) => s >= 5 && s <= 6 },
  { id: '7+', label: '7+ nét', test: (s) => s >= 7 },
]

export const MAX_WORDS = 200
export const PRINT_CAP = 20

/* ---------- nhóm mẫu ---------- */

export const TEMPLATE_GROUPS: { id: GroupId; name: string; desc: string }[] = [
  { id: 'nentaang', name: 'Nền tảng', desc: 'Nét cơ bản, thứ tự nét, bộ thủ' },
  { id: 'kinhdien', name: 'Kinh điển', desc: 'Các mẫu quen thuộc nhất trong lớp học' },
  { id: 'tuvung', name: 'Từ vựng', desc: 'Từ ghép, học theo bộ đề' },
  { id: 'cauondoan', name: 'Câu và đoạn', desc: 'Đoạn văn, viết tự do, câu chuyện' },
  { id: 'chuyende', name: 'Chuyên đề', desc: 'Thi cử, viết tên, luyện hằng ngày' },
  { id: 'thuphap', name: 'Thư pháp', desc: 'Giấy truyền thống, tre trúc' },
]

export const TEMPLATE_LEVELS: { id: TplLevel; label: string; chip: string }[] = [
  { id: 'coban', label: 'Cơ bản', chip: 'bg-[var(--pastel-mint)] text-[#3f6b50]' },
  { id: 'socap', label: 'Sơ cấp', chip: 'bg-[var(--pastel-sky)] text-[#46688f]' },
  { id: 'trungcap', label: 'Trung cấp', chip: 'bg-[var(--pastel-butter)] text-[#8a6a1f]' },
  { id: 'nangcao', label: 'Nâng cao', chip: 'bg-[var(--pastel-pink)] text-[#8a4a63]' },
]

/* ---------- 24 mẫu giấy ---------- */

export type Template = {
  id: string
  icon: string
  name: string
  desc: string
  tags: string[]
  level: TplLevel
  group: GroupId
  cfg: Partial<SheetCfg>
  presetWords?: string[]
  presetPara?: string
}

export const TEMPLATES: Template[] = [
  /* ===== Nền tảng (3) ===== */
  {
    id: 'one-stroke',
    icon: '一丨',
    name: 'Luyện nét cơ bản',
    desc: 'Tập các nét cơ bản của chữ Hán: 一 丨 丿 ㇏ 乙 — nền tảng để viết đẹp.',
    tags: ['Nét cơ bản', 'Ô lớn', 'Sơ sơ dễ dễ'],
    level: 'coban',
    group: 'nentaang',
    cfg: { layout: 'bigchar', paper: 'square', rows: 5, traceCells: 10, showStroke: true, showPinyin: true },
    presetWords: ['一', '二', '三', '十', '人', '口', '大', '小'],
  },
  {
    id: 'radical-study',
    icon: '江你',
    name: 'Làm chữ bộ thủ',
    desc: 'Học và luyện viết các bộ thủ phổ biến nhất. Hiểu cấu trúc chữ Hán.',
    tags: ['Bộ thủ phổ biến', 'Màu sắc phân biệt'],
    level: 'socap',
    group: 'nentaang',
    cfg: { layout: 'radical', paper: 'mi', colorful: true, practiceRows: 2, showPinyin: true },
  },
  {
    id: 'stroke-focus',
    icon: '龍鳳',
    name: 'Tập trung thứ tự nét',
    desc: 'Nhấn mạnh thứ tự nét viết. Lý tưởng cho chữ phức tạp.',
    tags: ['Chữ phức tạp', 'Thứ tự nét chi tiết'],
    level: 'nangcao',
    group: 'nentaang',
    cfg: { layout: 'stroke', paper: 'square', cols: 6, rows: 7, repeat: 4, showStroke: true },
    presetWords: ['学习', '汉语', '谢谢', '朋友', '时间'],
  },

  /* ===== Kinh điển (6) ===== */
  {
    id: 'classic',
    icon: '学',
    name: 'Truyền thống kinh điển',
    desc: 'Mẫu phổ biến nhất — phù hợp cho học sinh mới bắt đầu.',
    tags: ['Thứ tự nét', 'Phiên âm'],
    level: 'coban',
    group: 'kinhdien',
    cfg: { layout: 'std', paper: 'tian', cols: 8, rows: 6, repeat: 3, showPinyin: true, showStroke: true },
  },
  {
    id: 'beginner-big',
    icon: '大',
    name: 'Ô lớn cho người mới',
    desc: 'Ô chữ to, ít chữ mỗi trang — thoải mái nhất cho người mới.',
    tags: ['Ô lớn', 'Thoải mái'],
    level: 'coban',
    group: 'kinhdien',
    cfg: { layout: 'std', paper: 'square', cols: 4, rows: 4, repeat: 2, showPinyin: true },
  },
  {
    id: 'info-sheet',
    icon: '长月',
    name: 'Bảng thông tin chi tiết',
    desc: 'Hiển thị đầy đủ nghĩa, phiên âm kèm ô luyện — như sách giáo khoa.',
    tags: ['Thông tin đầy đủ', 'Bảng rõ ràng'],
    level: 'socap',
    group: 'kinhdien',
    cfg: { layout: 'info', paper: 'square', rows: 6, practiceCells: 4, showPinyin: true, showMeaning: true },
  },
  {
    id: 'rainbow',
    icon: '红黄',
    name: 'Luyện tập đầy màu sắc',
    desc: 'Mỗi chữ một màu vuông! Giúp phân biệt và ghi nhớ tốt hơn.',
    tags: ['Cầu vồng', 'Vui tươi'],
    level: 'coban',
    group: 'kinhdien',
    cfg: { layout: 'std', paper: 'square', cols: 6, rows: 6, repeat: 3, colorful: true, showPinyin: true },
  },
  {
    id: 'minimal',
    icon: '简约',
    name: 'Tối giản hiện đại',
    desc: 'Thiết kế tối giản, tập trung cao độ. Cho người nghiêm túc.',
    tags: ['Tối giản', 'Tập trung'],
    level: 'trungcap',
    group: 'kinhdien',
    cfg: { layout: 'std', paper: 'square', cols: 8, rows: 8, repeat: 4, showPinyin: false, lineColor: 'gray' },
  },
  {
    id: 'tian-classic',
    icon: '田',
    name: 'Giấy 田字格 cổ điển',
    desc: 'Ô 田字格 quen thuộc nhất — ngang dọc giữa ô để cân chữ.',
    tags: ['田字格', 'Chuẩn lớp học'],
    level: 'coban',
    group: 'kinhdien',
    cfg: { layout: 'std', paper: 'tian', cols: 9, rows: 7, repeat: 3, showPinyin: true },
  },

  /* ===== Từ vựng (5) ===== */
  {
    id: 'compound',
    icon: '词语',
    name: 'Luyện ghép từ',
    desc: 'Tập viết từ ghép. Học từ vựng trong ngữ cảnh thực tế.',
    tags: ['Từ ghép', 'Ngữ cảnh'],
    level: 'trungcap',
    group: 'tuvung',
    cfg: { layout: 'std', paper: 'tian', cols: 6, rows: 6, repeat: 3, showPinyin: true },
    presetWords: ['学习', '工作', '生活', '朋友', '时间', '世界', '中国', '汉语', '学校', '老师'],
  },
  {
    id: 'hsk2',
    icon: '你好',
    name: 'Từ ghép HSK 2 cơ bản',
    desc: '20 từ ghép HSK 2 phổ biến nhất. Lý tưởng cho học sinh tiểu học.',
    tags: ['HSK 2', 'Từ ghép phổ biến'],
    level: 'socap',
    group: 'tuvung',
    cfg: { layout: 'std', paper: 'tian', cols: 6, rows: 7, repeat: 3, showPinyin: true },
    presetWords: [
      '你好', '谢谢', '再见', '老师', '学生', '朋友', '学校', '今天', '明天', '上午',
      '下午', '喜欢', '可以', '看见', '说话', '香蕉', '苹果', '水果', '椅子', '桌子',
    ],
  },
  {
    id: 'hsk4',
    icon: '学问',
    name: 'Từ ghép HSK 4 học thuật',
    desc: '15 từ ghép học thuật HSK 4. Dành cho người học trung cấp.',
    tags: ['HSK 4', 'Học thuật'],
    level: 'trungcap',
    group: 'tuvung',
    cfg: { layout: 'std', paper: 'square', cols: 6, rows: 7, repeat: 3, showPinyin: true },
    presetWords: ['文化', '经济', '社会', '发展', '科技', '教育', '影响', '经验', '责任', '环境', '机会', '目标', '态度', '方法', '结果'],
  },
  {
    id: 'daily-words',
    icon: '早安',
    name: 'Từ ghép sinh hoạt hàng ngày',
    desc: '10 từ ghép sinh hoạt hàng ngày. Dễ học, dễ nhớ cho người mới bắt đầu.',
    tags: ['Sinh hoạt hàng ngày', 'Dễ học'],
    level: 'coban',
    group: 'tuvung',
    cfg: { layout: 'std', paper: 'tian', cols: 5, rows: 6, repeat: 4, showPinyin: true },
    presetWords: ['早安', '晚安', '吃饭', '喝水', '上班', '下班', '买菜', '做饭', '洗澡', '睡觉'],
  },
  {
    id: 'pinyin-hint',
    icon: '音',
    name: 'Viết theo phiên âm',
    desc: 'Chỉ có phiên âm — bạn tự viết chữ vào ô trống để tự kiểm tra.',
    tags: ['Tự viết', 'Ghi nhớ'],
    level: 'socap',
    group: 'tuvung',
    cfg: { layout: 'std', paper: 'square', cols: 6, rows: 6, repeat: 4, modelCell: false, showPinyin: true },
    presetWords: ['你好', '谢谢', '再见', '学生', '老师', '喜欢'],
  },

  /* ===== Câu và đoạn (3) ===== */
  {
    id: 'square-text',
    icon: '今天',
    name: 'Văn bản ô vuông',
    desc: 'Viết đoạn văn với hướng dẫn ô vuông. Vừa tự do vừa có cấu trúc.',
    tags: ['Đoạn văn', 'Ô nhỏ'],
    level: 'nangcao',
    group: 'cauondoan',
    cfg: { layout: 'flow', paper: 'square', cols: 12, rows: 9, showPinyin: false },
  },
  {
    id: 'free-lines',
    icon: '自由',
    name: 'Tập viết tự do',
    desc: 'Chỉ có kẻ ngang, không có ô vuông. Như viết trên vở thật.',
    tags: ['Tự do', 'Thực tế'],
    level: 'nangcao',
    group: 'cauondoan',
    cfg: { layout: 'flow', paper: 'line', cols: 12, rows: 8, showPinyin: false },
  },
  {
    id: 'story',
    icon: '故事',
    name: 'Chế độ câu chuyện',
    desc: 'Luyện viết câu chuyện dài. Nhiều chữ, ô nhỏ, giống sách thật.',
    tags: ['Câu chuyện', 'Gọn gàng'],
    level: 'trungcap',
    group: 'cauondoan',
    cfg: { layout: 'flow', paper: 'square', cols: 13, rows: 10, showPinyin: false },
  },

  /* ===== Chuyên đề (4) ===== */
  {
    id: 'daily4',
    icon: '天地',
    name: 'Luyện tập hàng ngày (4 ô)',
    desc: 'Template đơn giản để tập mỗi ngày. Chỉ 4 chữ, dễ hoàn thành.',
    tags: ['Đơn giản', 'Hàng ngày'],
    level: 'coban',
    group: 'chuyende',
    cfg: { layout: 'std', paper: 'tian', cols: 4, rows: 2, repeat: 2, showPinyin: true },
    presetWords: ['你好', '谢谢', '再见', '喜欢'],
  },
  {
    id: 'exam-prep',
    icon: '考试',
    name: 'Chuẩn bị thi',
    desc: 'Format giống bài thi thật. Ô nhỏ, nhiều chữ, tập trung cao.',
    tags: ['Giống thi thật', 'Ô nhỏ'],
    level: 'trungcap',
    group: 'chuyende',
    cfg: { layout: 'std', paper: 'square', cols: 10, rows: 9, repeat: 3, showPinyin: false },
    presetWords: ['学校', '写字', '上课', '同学', '作业', '考试', '汉语', '词典', '语法', '生词'],
  },
  {
    id: 'hsk-exam',
    icon: '汉语',
    name: 'Luyện thi HSK',
    desc: 'Chuyên dụng cho kỳ thi HSK. Format chuẩn, nghiêm túc.',
    tags: ['HSK chuẩn', 'Chuyên nghiệp'],
    level: 'trungcap',
    group: 'chuyende',
    cfg: { layout: 'std', paper: 'tian', cols: 9, rows: 8, repeat: 3, showPinyin: false, wmOn: true },
    presetWords: ['学习', '考试', '练习', '听写', '阅读', '语法', '汉字', '拼音'],
  },
  {
    id: 'my-name',
    icon: '名',
    name: 'Viết tên của bạn',
    desc: 'Dành riêng để luyện viết tên bạn hoặc làm quà cho người thân.',
    tags: ['Tên riêng', 'Quà tặng'],
    level: 'coban',
    group: 'chuyende',
    cfg: { layout: 'bigchar', paper: 'square', rows: 4, traceCells: 6, showStroke: true, showPinyin: true },
    presetWords: [],
  },

  /* ===== Thư pháp (3) ===== */
  {
    id: 'calligraphy-art',
    icon: '書法',
    name: 'Thư pháp nghệ thuật',
    desc: 'Nền hoa mai đẹp mắt, không khí thiền định. Dễ tạo tác phẩm.',
    tags: ['Thiền 🧘', 'Hoa mai 🌸'],
    level: 'nangcao',
    group: 'thuphap',
    cfg: { layout: 'bigchar', paper: 'square', rows: 4, traceCells: 8, bg: 'plum', showStroke: true, showPinyin: false },
    presetWords: ['福', '春', '和', '龍'],
  },
  {
    id: 'calligraphy-paper',
    icon: '傳統',
    name: 'Giấy truyền thống',
    desc: 'Texture giấy Trung Quốc cổ 🏮. Cảm giác như viết trên giấy thật.',
    tags: ['Truyền thống 🏮', 'Texture giấy'],
    level: 'nangcao',
    group: 'thuphap',
    cfg: { layout: 'flow', paper: 'line', cols: 12, rows: 8, bg: 'cream', showPinyin: false, wmOn: true },
  },
  {
    id: 'calligraphy-green',
    icon: '竹',
    name: 'Tre trúc thanh mát',
    desc: 'Nền xanh tre trúc dịu mắt — hợp những buổi luyện dài.',
    tags: ['Thiền 🧘', 'Tre trúc 🎋'],
    level: 'nangcao',
    group: 'thuphap',
    cfg: { layout: 'bigchar', paper: 'square', rows: 4, traceCells: 8, bg: 'bamboo', showStroke: true, showPinyin: false },
    presetWords: ['竹', '林', '风', '静'],
  },

  /* ===== +1 gọn nhẹ ===== */
  {
    id: 'compact',
    icon: '密',
    name: 'Ô chữ nhỏ gọn',
    desc: 'Nhiều ô mỗi trang, tiết kiệm giấy cho danh sách từ dài.',
    tags: ['Tiết kiệm', 'Ô nhỏ'],
    level: 'trungcap',
    group: 'kinhdien',
    cfg: { layout: 'std', paper: 'square', cols: 12, rows: 10, repeat: 2, showPinyin: false },
  },
]

/* 6 mẫu gợi ý trên trang tham khảo: 学 大 一 简 你 红 */
export const SUGGESTED_IDS = ['classic', 'beginner-big', 'one-stroke', 'minimal', 'hsk2', 'rainbow']

export function bgCssOf(cfg: SheetCfg): string {
  if (cfg.bg === 'custom') return cfg.customColor || '#ffffff'
  return BACKDROPS.find((b) => b.id === cfg.bg)?.bg ?? '#ffffff'
}

/* Độ sáng tương đối (0 đen → 1 trắng) của màu hex */
function hexLuminance(hex: string): number {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/* Nền trang tối hay sáng → quyết định màu mực của chữ ngoài ô
   (đầu trang, chân trang, watermark). Lấy màu phẳng CUỐI CÙNG
   trong chuỗi nền (nền gradient luôn khai báo màu gốc ở cuối). */
export function pageBgTone(cfg: SheetCfg): 'dark' | 'light' {
  if (cfg.bg === 'custom') {
    return hexLuminance(cfg.customColor || '#ffffff') < 0.46 ? 'dark' : 'light'
  }
  const hexes = bgCssOf(cfg).match(/#[0-9a-fA-F]{3,6}/g) ?? []
  const base = hexes[hexes.length - 1] ?? '#ffffff'
  return hexLuminance(base) < 0.46 ? 'dark' : 'light'
}
