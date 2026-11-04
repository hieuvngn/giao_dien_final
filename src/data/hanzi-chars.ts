/* ============================================================
   Ngân hàng chữ Hán luyện viết + bộ từ cho "Kiểm tra trí nhớ".
   Route: #/writing
   - HANZI_CHARS: 62 chữ thường gặp (HSK 1–3 + bộ nét cơ bản),
     đầy đủ pinyin / nghĩa tiếng Việt / chủ đề để nhóm thẻ chọn chữ.
   - HANZI_WORDS: từ vựng 1–2 chữ cho chế độ ③ — dữ liệu nét của
     từng ký tự lấy từ public/hanzi-data (9.575 ký tự, đủ dùng).
   ============================================================ */

export type HanziCharEntry = {
  char: string
  pinyin: string
  vi: string
  level: 'Cơ bản' | 'HSK 1' | 'HSK 2' | 'HSK 3'
  topic: string
}

export const HANZI_CHARS: HanziCharEntry[] = [
  /* --- chữ kinh điển luyện nét --- */
  { char: '永', pinyin: 'yǒng', vi: 'Vĩnh viễn — chữ 8 nét kinh điển để luyện các nét cơ bản', level: 'Cơ bản', topic: 'Kinh điển' },

  /* --- chào hỏi --- */
  { char: '好', pinyin: 'hǎo', vi: 'Tốt', level: 'HSK 1', topic: 'Chào hỏi' },
  { char: '谢', pinyin: 'xiè', vi: 'Cảm ơn', level: 'HSK 1', topic: 'Chào hỏi' },
  { char: '再', pinyin: 'zài', vi: 'Lần nữa, lại', level: 'HSK 1', topic: 'Chào hỏi' },
  { char: '见', pinyin: 'jiàn', vi: 'Gặp', level: 'HSK 1', topic: 'Chào hỏi' },

  /* --- đại từ --- */
  { char: '我', pinyin: 'wǒ', vi: 'Tôi, tớ', level: 'HSK 1', topic: 'Đại từ' },
  { char: '你', pinyin: 'nǐ', vi: 'Bạn', level: 'HSK 1', topic: 'Đại từ' },
  { char: '他', pinyin: 'tā', vi: 'Anh ấy', level: 'HSK 1', topic: 'Đại từ' },
  { char: '她', pinyin: 'tā', vi: 'Cô ấy', level: 'HSK 1', topic: 'Đại từ' },
  { char: '们', pinyin: 'men', vi: 'Hậu tố số nhiều (我们 = chúng tôi)', level: 'HSK 1', topic: 'Đại từ' },

  /* --- con người --- */
  { char: '人', pinyin: 'rén', vi: 'Người', level: 'HSK 1', topic: 'Con người' },
  { char: '爱', pinyin: 'ài', vi: 'Yêu', level: 'HSK 1', topic: 'Con người' },
  { char: '生', pinyin: 'shēng', vi: 'Sinh ra, sống', level: 'HSK 2', topic: 'Con người' },
  { char: '老', pinyin: 'lǎo', vi: 'Già, lâu năm', level: 'HSK 2', topic: 'Con người' },

  /* --- trường học --- */
  { char: '学', pinyin: 'xué', vi: 'Học', level: 'HSK 1', topic: 'Trường học' },
  { char: '习', pinyin: 'xí', vi: 'Luyện tập, rèn luyện', level: 'HSK 1', topic: 'Trường học' },
  { char: '师', pinyin: 'shī', vi: 'Thầy, người dạy', level: 'HSK 2', topic: 'Trường học' },
  { char: '同', pinyin: 'tóng', vi: 'Cùng, giống nhau', level: 'HSK 2', topic: 'Trường học' },
  { char: '校', pinyin: 'xiào', vi: 'Trường học', level: 'HSK 2', topic: 'Trường học' },
  { char: '书', pinyin: 'shū', vi: 'Sách', level: 'HSK 1', topic: 'Trường học' },
  { char: '字', pinyin: 'zì', vi: 'Chữ', level: 'HSK 2', topic: 'Trường học' },
  { char: '问', pinyin: 'wèn', vi: 'Hỏi', level: 'HSK 1', topic: 'Trường học' },
  { char: '题', pinyin: 'tí', vi: 'Đề, vấn đề', level: 'HSK 3', topic: 'Trường học' },

  /* --- quan hệ --- */
  { char: '朋', pinyin: 'péng', vi: 'Bạn (thành từ 朋友)', level: 'HSK 1', topic: 'Quan hệ' },
  { char: '友', pinyin: 'yǒu', vi: 'Bạn bè', level: 'HSK 1', topic: 'Quan hệ' },

  /* --- nơi chốn --- */
  { char: '中', pinyin: 'zhōng', vi: 'Trong, giữa', level: 'HSK 1', topic: 'Nơi chốn' },
  { char: '国', pinyin: 'guó', vi: 'Nước, quốc gia', level: 'HSK 1', topic: 'Nơi chốn' },
  { char: '家', pinyin: 'jiā', vi: 'Nhà, gia đình', level: 'HSK 1', topic: 'Nơi chốn' },
  { char: '门', pinyin: 'mén', vi: 'Cửa', level: 'HSK 1', topic: 'Nơi chốn' },
  { char: '上', pinyin: 'shàng', vi: 'Trên', level: 'HSK 1', topic: 'Nơi chốn' },
  { char: '下', pinyin: 'xià', vi: 'Dưới', level: 'HSK 1', topic: 'Nơi chốn' },

  /* --- thời gian --- */
  { char: '时', pinyin: 'shí', vi: 'Thời gian, giờ', level: 'HSK 2', topic: 'Thời gian' },
  { char: '间', pinyin: 'jiān', vi: 'Giữa, khoảng', level: 'HSK 2', topic: 'Thời gian' },
  { char: '明', pinyin: 'míng', vi: 'Sáng, (ngày) mai', level: 'HSK 1', topic: 'Thời gian' },
  { char: '天', pinyin: 'tiān', vi: 'Trời, ngày', level: 'HSK 1', topic: 'Thời gian' },
  { char: '星', pinyin: 'xīng', vi: 'Ngôi sao', level: 'HSK 2', topic: 'Thời gian' },
  { char: '期', pinyin: 'qī', vi: 'Kỳ, giai đoạn', level: 'HSK 2', topic: 'Thời gian' },
  { char: '月', pinyin: 'yuè', vi: 'Trăng, tháng', level: 'HSK 1', topic: 'Thời gian' },
  { char: '日', pinyin: 'rì', vi: 'Mặt trời, ngày', level: 'HSK 1', topic: 'Thời gian' },

  /* --- ăn uống --- */
  { char: '吃', pinyin: 'chī', vi: 'Ăn', level: 'HSK 1', topic: 'Ăn uống' },
  { char: '喝', pinyin: 'hē', vi: 'Uống', level: 'HSK 1', topic: 'Ăn uống' },
  { char: '茶', pinyin: 'chá', vi: 'Trà', level: 'HSK 2', topic: 'Ăn uống' },
  { char: '饭', pinyin: 'fàn', vi: 'Cơm, bữa ăn', level: 'HSK 1', topic: 'Ăn uống' },

  /* --- đồ vật --- */
  { char: '电', pinyin: 'diàn', vi: 'Điện', level: 'HSK 1', topic: 'Đồ vật' },
  { char: '影', pinyin: 'yǐng', vi: 'Bóng, hình ảnh', level: 'HSK 3', topic: 'Đồ vật' },
  { char: '车', pinyin: 'chē', vi: 'Xe', level: 'HSK 1', topic: 'Đồ vật' },

  /* --- hành động --- */
  { char: '去', pinyin: 'qù', vi: 'Đi (đến)', level: 'HSK 1', topic: 'Hành động' },
  { char: '来', pinyin: 'lái', vi: 'Đến', level: 'HSK 1', topic: 'Hành động' },
  { char: '说', pinyin: 'shuō', vi: 'Nói', level: 'HSK 1', topic: 'Hành động' },
  { char: '话', pinyin: 'huà', vi: 'Lời nói', level: 'HSK 2', topic: 'Hành động' },
  { char: '写', pinyin: 'xiě', vi: 'Viết', level: 'HSK 1', topic: 'Hành động' },
  { char: '看', pinyin: 'kàn', vi: 'Nhìn, xem, đọc', level: 'HSK 1', topic: 'Hành động' },

  /* --- thiên nhiên --- */
  { char: '山', pinyin: 'shān', vi: 'Núi', level: 'HSK 1', topic: 'Thiên nhiên' },
  { char: '水', pinyin: 'shuǐ', vi: 'Nước', level: 'HSK 1', topic: 'Thiên nhiên' },
  { char: '火', pinyin: 'huǒ', vi: 'Lửa', level: 'HSK 1', topic: 'Thiên nhiên' },
  { char: '木', pinyin: 'mù', vi: 'Gỗ, cây', level: 'Cơ bản', topic: 'Thiên nhiên' },
  { char: '金', pinyin: 'jīn', vi: 'Vàng, kim loại', level: 'Cơ bản', topic: 'Thiên nhiên' },
  { char: '土', pinyin: 'tǔ', vi: 'Đất', level: 'Cơ bản', topic: 'Thiên nhiên' },

  /* --- cơ thể --- */
  { char: '口', pinyin: 'kǒu', vi: 'Miệng', level: 'Cơ bản', topic: 'Cơ thể' },
  { char: '手', pinyin: 'shǒu', vi: 'Tay', level: 'HSK 2', topic: 'Cơ thể' },
  { char: '心', pinyin: 'xīn', vi: 'Tim, trái tim', level: 'HSK 2', topic: 'Cơ thể' },

  /* --- kích thước --- */
  { char: '大', pinyin: 'dà', vi: 'Lớn', level: 'HSK 1', topic: 'Kích thước' },
  { char: '小', pinyin: 'xiǎo', vi: 'Nhỏ', level: 'HSK 1', topic: 'Kích thước' },
]

export type HanziWordEntry = {
  id: string
  cn: string
  pinyin: string
  vi: string
  level: 'Dễ' | 'Vừa'
}

export const HANZI_WORDS: HanziWordEntry[] = [
  { id: 'w-xuexi', cn: '学习', pinyin: 'xuéxí', vi: 'Học tập', level: 'Dễ' },
  { id: 'w-xuesheng', cn: '学生', pinyin: 'xuéshēng', vi: 'Học sinh', level: 'Dễ' },
  { id: 'w-laoshi', cn: '老师', pinyin: 'lǎoshī', vi: 'Thầy cô giáo', level: 'Dễ' },
  { id: 'w-tongxue', cn: '同学', pinyin: 'tóngxué', vi: 'Bạn cùng lớp', level: 'Dễ' },
  { id: 'w-xuexiao', cn: '学校', pinyin: 'xuéxiào', vi: 'Trường học', level: 'Vừa' },
  { id: 'w-pengyou', cn: '朋友', pinyin: 'péngyou', vi: 'Bạn bè', level: 'Dễ' },
  { id: 'w-zhongguo', cn: '中国', pinyin: 'Zhōngguó', vi: 'Trung Quốc', level: 'Dễ' },
  { id: 'w-shijian', cn: '时间', pinyin: 'shíjiān', vi: 'Thời gian', level: 'Vừa' },
  { id: 'w-mingtian', cn: '明天', pinyin: 'míngtiān', vi: 'Ngày mai', level: 'Dễ' },
  { id: 'w-xingqi', cn: '星期', pinyin: 'xīngqī', vi: 'Tuần', level: 'Vừa' },
  { id: 'w-xiexie', cn: '谢谢', pinyin: 'xièxie', vi: 'Cảm ơn', level: 'Dễ' },
  { id: 'w-zaijian', cn: '再见', pinyin: 'zàijiàn', vi: 'Tạm biệt', level: 'Dễ' },
  { id: 'w-chifan', cn: '吃饭', pinyin: 'chīfàn', vi: 'Ăn cơm', level: 'Dễ' },
  { id: 'w-hecha', cn: '喝茶', pinyin: 'hēchá', vi: 'Uống trà', level: 'Dễ' },
  { id: 'w-dianying', cn: '电影', pinyin: 'diànyǐng', vi: 'Phim điện ảnh', level: 'Vừa' },
  { id: 'w-wenti', cn: '问题', pinyin: 'wèntí', vi: 'Vấn đề, câu hỏi', level: 'Vừa' },
  { id: 'w-shuohua', cn: '说话', pinyin: 'shuōhuà', vi: 'Nói chuyện', level: 'Vừa' },
  { id: 'w-xiezi', cn: '写字', pinyin: 'xiězì', vi: 'Viết chữ', level: 'Dễ' },
  { id: 'w-kanshu', cn: '看书', pinyin: 'kànshū', vi: 'Đọc sách', level: 'Dễ' },
  { id: 'w-ren', cn: '人', pinyin: 'rén', vi: 'Người', level: 'Dễ' },
  { id: 'w-ai', cn: '爱', pinyin: 'ài', vi: 'Yêu', level: 'Dễ' },
  { id: 'w-jia', cn: '家', pinyin: 'jiā', vi: 'Gia đình', level: 'Dễ' },
  { id: 'w-hao', cn: '好', pinyin: 'hǎo', vi: 'Tốt', level: 'Dễ' },
  { id: 'w-shui', cn: '水', pinyin: 'shuǐ', vi: 'Nước', level: 'Dễ' },
  { id: 'w-huo', cn: '火', pinyin: 'huǒ', vi: 'Lửa', level: 'Dễ' },
  { id: 'w-shan', cn: '山', pinyin: 'shān', vi: 'Núi', level: 'Dễ' },
  { id: 'w-men', cn: '门', pinyin: 'mén', vi: 'Cửa', level: 'Dễ' },
]

export function findHanziChar(char: string): HanziCharEntry | undefined {
  return HANZI_CHARS.find((c) => c.char === char)
}
