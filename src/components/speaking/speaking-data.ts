/* ============================================================
   Dữ liệu hội thoại luyện nói cùng AI (phần A)
   3 tình huống: Gọi món · Đi mua sắm · Phỏng vấn xin việc
   ------------------------------------------------------------
   Mỗi tình huống có 2 cấp độ:
   - beginner: hội thoại đơn giản (HSK 1–3), AI đọc chậm
   - advanced: hội thoại nâng cao (HSK 4–6), câu phức, lỗi tinh tế
   Mỗi bước có các biến thể câu trả lời: câu chuẩn (excellent),
   lỗi thường gặp kèm AI đề xuất + giải thích (fair), và biến thể khác.
   ============================================================ */

export type Tier = 'beginner' | 'advanced'

export type Rating = 'excellent' | 'good' | 'fair'

export type AnswerVariant = {
  cn: string
  pinyin: string
  vi: string
  rating: Rating
  /* AI đề xuất câu tự nhiên hơn (hiển thị khi rating !== 'excellent' hoặc có lỗi nhỏ) */
  suggestCn?: string
  suggestPinyin?: string
  suggestVi?: string
  /* Giải thích ngữ pháp / cách dùng */
  explain?: string
}

export type DialogueStep = {
  aiCn: string
  aiPinyin: string
  aiVi: string
  answers: AnswerVariant[]
}

export type Dialogue = {
  tier: Tier
  hskLabel: string
  steps: DialogueStep[]
}

export type ScenarioTone = 'pink' | 'butter' | 'mint' | 'sky' | 'lilac' | 'peach'

export type Scenario = {
  id: string
  emoji: string
  name: string
  cn: string
  desc: string
  tone: ScenarioTone
  dialogues: Record<Tier, Dialogue>
}

/* ================= 1 · Gọi món tại nhà hàng ================= */

export const RESTAURANT: Scenario = {
  id: 'restaurant',
  emoji: '🍜',
  name: 'Gọi món tại nhà hàng',
  cn: '点餐',
  desc: 'Vào quán gọi mì, chọn đồ uống và lịch sự cảm ơn phục vụ.',
  tone: 'pink',
  dialogues: {
    beginner: {
      tier: 'beginner',
      hskLabel: 'HSK 1–2',
      steps: [
        {
          aiCn: '你好！欢迎光临，请问你想吃点什么？',
          aiPinyin: 'Nǐ hǎo! Huānyíng guānglín, qǐngwèn nǐ xiǎng chī diǎn shénme?',
          aiVi: 'Xin chào! Chào mừng quý khách, bạn muốn ăn gì nào?',
          answers: [
            {
              cn: '我想吃一碗面条。',
              pinyin: 'Wǒ xiǎng chī yì wǎn miàntiáo.',
              vi: 'Tôi muốn ăn một bát mì.',
              rating: 'excellent',
            },
            {
              cn: '我想吃一个面条。',
              pinyin: 'Wǒ xiǎng chī yí gè miàntiáo.',
              vi: 'Tôi muốn ăn một (cái) mì.',
              rating: 'fair',
              suggestCn: '我想吃一碗面条。',
              suggestPinyin: 'Wǒ xiǎng chī yì wǎn miàntiáo.',
              suggestVi: 'Tôi muốn ăn một bát mì.',
              explain:
                'Trong tiếng Trung, 面条 (mì sợi) thường dùng lượng từ 碗 (bát) khi nói về một bát mì — nên nói 一碗面条, không nói 一个面条.',
            },
            { cn: '我要米饭。', pinyin: 'Wǒ yào mǐfàn.', vi: 'Cho tôi cơm.', rating: 'good' },
          ],
        },
        {
          aiCn: '好的，一碗面条。你要喝点什么？',
          aiPinyin: 'Hǎo de, yì wǎn miàntiáo. Nǐ yào hē diǎn shénme?',
          aiVi: 'Được, một bát mì. Bạn muốn uống gì không?',
          answers: [
            { cn: '我要一杯茶。', pinyin: 'Wǒ yào yì bēi chá.', vi: 'Cho tôi một cốc trà.', rating: 'excellent' },
            {
              cn: '我要水。',
              pinyin: 'Wǒ yào shuǐ.',
              vi: 'Cho tôi nước.',
              rating: 'good',
              suggestCn: '我要一杯水。',
              suggestPinyin: 'Wǒ yào yì bēi shuǐ.',
              suggestVi: 'Cho tôi một cốc nước.',
              explain: 'Thêm lượng từ 杯 (cốc) khiến câu tự nhiên và rõ ràng hơn: 一杯水.',
            },
            { cn: '不用，谢谢。', pinyin: 'Bú yòng, xièxie.', vi: 'Không cần, cảm ơn.', rating: 'good' },
          ],
        },
        {
          aiCn: '好的，请稍等，马上就来。',
          aiPinyin: 'Hǎo de, qǐng shāo děng, mǎshàng jiù lái.',
          aiVi: 'Vâng, bạn chờ chút nhé, món sẽ ra ngay.',
          answers: [
            { cn: '谢谢！', pinyin: 'Xièxie!', vi: 'Cảm ơn!', rating: 'excellent' },
            { cn: '好的，谢谢您。', pinyin: 'Hǎo de, xièxie nín.', vi: 'Vâng, cảm ơn anh/chị.', rating: 'excellent' },
            {
              cn: '不客气。',
              pinyin: 'Bú kèqi.',
              vi: 'Không có gì.',
              rating: 'fair',
              suggestCn: '谢谢！',
              suggestPinyin: 'Xièxie!',
              suggestVi: 'Cảm ơn!',
              explain: '不客气 là câu ĐÁP LẠI lời cảm ơn. Là khách, bạn nên nói 谢谢 (cảm ơn) nhé.',
            },
          ],
        },
      ],
    },
    advanced: {
      tier: 'advanced',
      hskLabel: 'HSK 4–6',
      steps: [
        {
          aiCn: '欢迎光临！里边请，几位？想用点儿什么？',
          aiPinyin: 'Huānyíng guānglín! Lǐbian qǐng, jǐ wèi? Xiǎng yòng diǎnr shénme?',
          aiVi: 'Chào mừng quý khách! Mời vào trong, mấy vị? Muốn dùng gì ạ?',
          answers: [
            {
              cn: '两位。请给我们一份菜单。',
              pinyin: 'Liǎng wèi. Qǐng gěi wǒmen yí fèn càidān.',
              vi: 'Hai người ạ. Cho chúng tôi một thực đơn.',
              rating: 'excellent',
            },
            {
              cn: '菜单。',
              pinyin: 'Càidān.',
              vi: 'Thực đơn.',
              rating: 'fair',
              suggestCn: '麻烦您，请给我们一份菜单。',
              suggestPinyin: 'Máfan nín, qǐng gěi wǒmen yí fèn càidān.',
              suggestVi: 'Phiền anh/chị cho chúng tôi một thực đơn.',
              explain:
                'Ở nhà hàng nên nói câu đầy đủ và lịch sự: 麻烦您，请给我们一份菜单 — thêm từ lịch sự và lượng từ 份.',
            },
            { cn: '我看看菜单，谢谢。', pinyin: 'Wǒ kànkan càidān, xièxie.', vi: 'Cho tôi xem thực đơn với, cảm ơn.', rating: 'good' },
          ],
        },
        {
          aiCn: '这是菜单。今天的招牌菜是红烧鱼，你们要不要试试？',
          aiPinyin: 'Zhè shì càidān. Jīntiān de zhāopái cài shì hóngshāo yú, nǐmen yào bu yào shìshi?',
          aiVi: 'Đây là thực đơn. Món đặc biệt hôm nay là cá kho tương — hai bạn có muốn thử không?',
          answers: [
            {
              cn: '好啊，就来一份红烧鱼吧。',
              pinyin: 'Hǎo a, jiù lái yí fèn hóngshāo yú ba.',
              vi: 'Được đó, cho một phần cá kho tương nhé.',
              rating: 'excellent',
            },
            {
              cn: '这个鱼辣不辣？我不太能吃辣。',
              pinyin: 'Zhège yú là bu là? Wǒ bú tài néng chī là.',
              vi: 'Cá này có cay không? Tôi không ăn được cay lắm.',
              rating: 'excellent',
            },
            {
              cn: '我们要一个红烧鱼。',
              pinyin: 'Wǒmen yào yí gè hóngshāo yú.',
              vi: 'Chúng tôi muốn một (cái) cá kho.',
              rating: 'fair',
              suggestCn: '我们来一份红烧鱼。',
              suggestPinyin: 'Wǒmen lái yí fèn hóngshāo yú.',
              suggestVi: 'Cho chúng tôi một phần cá kho tương.',
              explain:
                'Với món ăn, người Trung thường dùng 来一份… hoặc 点一份… (lượng từ 份) thay vì 一个.',
            },
          ],
        },
        {
          aiCn: '好的，鱼里的辣椒给你们少放一点儿。饮料要什么？',
          aiPinyin: 'Hǎo de, yú lǐ de làjiāo gěi nǐmen shǎo fàng yìdiǎnr. Yǐnliào yào shénme?',
          aiVi: 'Được, trong cá tôi sẽ cho ít ớt lại. Còn nước uống thì sao ạ?',
          answers: [
            { cn: '来一壶热茶吧，谢谢。', pinyin: 'Lái yì hú rè chá ba, xièxie.', vi: 'Cho một ấm trà nóng nhé, cảm ơn.', rating: 'excellent' },
            {
              cn: '一瓶汽水。',
              pinyin: 'Yì píng qìshuǐ.',
              vi: 'Một chai nước ngọt.',
              rating: 'good',
              suggestCn: '请给我们来一瓶汽水。',
              suggestPinyin: 'Qǐng gěi wǒmen lái yì píng qìshuǐ.',
              suggestVi: 'Làm ơn cho chúng tôi một chai nước ngọt.',
              explain: 'Câu đầy đủ 请给我们来一瓶… vừa lịch sự vừa rõ ràng hơn là chỉ đọc tên món.',
            },
            { cn: '不用了，上菜以后再说吧。', pinyin: 'Bú yòng le, shàng cài yǐhòu zài shuō ba.', vi: 'Thôi không cần, để khi lên món tính tiếp.', rating: 'good' },
          ],
        },
      ],
    },
  },
}

/* ================= 2 · Đi mua sắm ================= */

export const SHOPPING: Scenario = {
  id: 'shopping',
  emoji: '🛍️',
  name: 'Đi mua sắm',
  cn: '购物',
  desc: 'Chọn áo len, hỏi giá và mặc cả như người bản xứ.',
  tone: 'butter',
  dialogues: {
    beginner: {
      tier: 'beginner',
      hskLabel: 'HSK 1–2',
      steps: [
        {
          aiCn: '你好！欢迎，你想买什么？',
          aiPinyin: 'Nǐ hǎo! Huānyíng, nǐ xiǎng mǎi shénme?',
          aiVi: 'Xin chào! Chào mừng, bạn muốn mua gì?',
          answers: [
            { cn: '我想买一件毛衣。', pinyin: 'Wǒ xiǎng mǎi yí jiàn máoyī.', vi: 'Tôi muốn mua một cái áo len.', rating: 'excellent' },
            {
              cn: '我想买毛衣。',
              pinyin: 'Wǒ xiǎng mǎi máoyī.',
              vi: 'Tôi muốn mua áo len.',
              rating: 'fair',
              suggestCn: '我想买一件毛衣。',
              suggestPinyin: 'Wǒ xiǎng mǎi yí jiàn máoyī.',
              suggestVi: 'Tôi muốn mua một cái áo len.',
              explain: 'Quần áo dùng lượng từ 件 — 一件毛衣 tự nhiên hơn là chỉ nói 毛衣 không.',
            },
            { cn: '我要买这个。', pinyin: 'Wǒ yào mǎi zhège.', vi: 'Tôi mua cái này.', rating: 'good' },
          ],
        },
        {
          aiCn: '这件毛衣一百五十块。',
          aiPinyin: 'Zhè jiàn máoyī yìbǎi wǔshí kuài.',
          aiVi: 'Cái áo len này một trăm năm mươi tệ.',
          answers: [
            { cn: '太贵了！可以便宜一点吗？', pinyin: 'Tài guì le! Kěyǐ piányi yìdiǎn ma?', vi: 'Đắt quá! Giảm giá chút được không?', rating: 'excellent' },
            { cn: '好的，我要了。', pinyin: 'Hǎo de, wǒ yào le.', vi: 'Được, tôi lấy cái này.', rating: 'excellent' },
            {
              cn: '很贵。',
              pinyin: 'Hěn guì.',
              vi: 'Đắt quá.',
              rating: 'fair',
              suggestCn: '太贵了，能便宜一点儿吗？',
              suggestPinyin: 'Tài guì le, néng piányi yìdiǎnr ma?',
              suggestVi: 'Đắt quá, bớt giá một chút được không ạ?',
              explain:
                'Khi mặc cả hãy nói 太贵了！能便宜一点儿吗？ — cấu trúc 太…了 và câu hỏi 能…吗 tự nhiên hơn nhiều.',
            },
          ],
        },
        {
          aiCn: '好，给你便宜十块，一百四，好吗？',
          aiPinyin: 'Hǎo, gěi nǐ piányi shí kuài, yìbǎi sì, hǎo ma?',
          aiVi: 'Được, bớt cho mười tệ, còn một trăm bốn nhé?',
          answers: [
            { cn: '好的，谢谢！', pinyin: 'Hǎo de, xièxie!', vi: 'Được rồi, cảm ơn!', rating: 'excellent' },
            { cn: '我要两个，可以再便宜一点吗？', pinyin: 'Wǒ yào liǎng gè, kěyǐ zài piányi yìdiǎn ma?', vi: 'Tôi lấy hai cái, giảm thêm chút nữa được không?', rating: 'excellent' },
            {
              cn: '给你钱。',
              pinyin: 'Gěi nǐ qián.',
              vi: 'Tiền đây.',
              rating: 'good',
              suggestCn: '好的，给您钱。',
              suggestPinyin: 'Hǎo de, gěi nín qián.',
              suggestVi: 'Vâng, tiền của anh/chị đây.',
              explain: 'Thêm 好的 và đổi 你 thành 您 (lịch sự) khi đưa tiền: 好的，给您钱.',
            },
          ],
        },
      ],
    },
    advanced: {
      tier: 'advanced',
      hskLabel: 'HSK 4–6',
      steps: [
        {
          aiCn: '欢迎光临！您想看点什么？这件外套是新款。',
          aiPinyin: 'Huānyíng guānglín! Nín xiǎng kàn diǎn shénme? Zhè jiàn wàitào shì xīn kuǎn.',
          aiVi: 'Chào mừng quý khách! Quý khách muốn xem gì? Chiếc áo khoác này là mẫu mới.',
          answers: [
            {
              cn: '我想看看那件外套，能试穿一下吗？',
              pinyin: 'Wǒ xiǎng kànkan nà jiàn wàitào, néng shìchuān yíxià ma?',
              vi: 'Tôi muốn xem chiếc áo khoác kia, thử mặc được không ạ?',
              rating: 'excellent',
            },
            {
              cn: '这个多少钱？',
              pinyin: 'Zhège duōshao qián?',
              vi: 'Cái này bao nhiêu tiền?',
              rating: 'good',
              suggestCn: '请问，这件外套多少钱？',
              suggestPinyin: 'Qǐngwèn, zhè jiàn wàitào duōshao qián?',
              suggestVi: 'Cho hỏi, chiếc áo khoác này bao nhiêu tiền ạ?',
              explain: 'Thêm 请问 và gọi tên món đồ kèm lượng từ 件 giúp câu hỏi lịch sự, chuyên nghiệp hơn.',
            },
            { cn: '那件毛衣。', pinyin: 'Nà jiàn máoyī.', vi: 'Cái áo len kia.', rating: 'good' },
          ],
        },
        {
          aiCn: '这件外套三百八，现在打八折。您穿多大号？',
          aiPinyin: 'Zhè jiàn wàitào sānbǎi bā, xiànzài dǎ bā zhé. Nín chuān duō dà hào?',
          aiVi: 'Áo khoác này ba trăm tám, giờ đang giảm còn 80%. Anh/chị mặc cỡ nào?',
          answers: [
            {
              cn: '我穿M号。有没有大一点的？',
              pinyin: 'Wǒ chuān M hào. Yǒu méiyǒu dà yìdiǎn de?',
              vi: 'Tôi mặc cỡ M. Có cỡ lớn hơn một chút không?',
              rating: 'excellent',
            },
            { cn: '我穿L号，就要这件吧。', pinyin: 'Wǒ chuān L hào, jiù yào zhè jiàn ba.', vi: 'Tôi mặc cỡ L, lấy chiếc này luôn.', rating: 'excellent' },
            {
              cn: '太贵了。',
              pinyin: 'Tài guì le.',
              vi: 'Đắt quá.',
              rating: 'fair',
              suggestCn: '能不能便宜一点儿？我真的很喜欢这件。',
              suggestPinyin: 'Néng bu néng piányi yìdiǎnr? Wǒ zhēn de hěn xǐhuan zhè jiàn.',
              suggestVi: 'Bớt giá một chút được không? Tôi rất thích chiếc này mà.',
              explain: 'Sau 太贵了 nên đưa ra đề nghị cụ thể: 能不能便宜一点儿？ — đó mới là cách mặc cả tự nhiên.',
            },
          ],
        },
        {
          aiCn: '好的，给您拿一件新的。需要袋子吗？',
          aiPinyin: 'Hǎo de, gěi nín ná yí jiàn xīn de. Xūyào dàizi ma?',
          aiVi: 'Vâng, tôi lấy cho quý khách chiếc mới. Cần túi không ạ?',
          answers: [
            { cn: '麻烦您给我一个袋子，谢谢！', pinyin: 'Máfan nín gěi wǒ yí gè dàizi, xièxie!', vi: 'Phiền anh/chị cho tôi một cái túi, cảm ơn!', rating: 'excellent' },
            { cn: '不用了，谢谢，我有袋子。', pinyin: 'Bú yòng le, xièxie, wǒ yǒu dàizi.', vi: 'Không cần đâu ạ, cảm ơn, tôi có túi rồi.', rating: 'excellent' },
            {
              cn: '要。',
              pinyin: 'Yào.',
              vi: 'Cần.',
              rating: 'fair',
              suggestCn: '麻烦给我一个袋子吧。',
              suggestPinyin: 'Máfan gěi wǒ yí gè dàizi ba.',
              suggestVi: 'Phiền cho tôi một cái túi nhé.',
              explain: 'Trả lời một chữ 要 nghe hơi cụt — thêm 麻烦给我一个…吧 sẽ mềm mại, lịch sự hơn.',
            },
          ],
        },
      ],
    },
  },
}

/* ================= 3 · Phỏng vấn xin việc ================= */

export const INTERVIEW: Scenario = {
  id: 'interview',
  emoji: '💼',
  name: 'Phỏng vấn xin việc',
  cn: '面试',
  desc: 'Tự giới thiệu, nêu lý do ứng tuyển và thương lượng mức lương.',
  tone: 'sky',
  dialogues: {
    beginner: {
      tier: 'beginner',
      hskLabel: 'HSK 2–3',
      steps: [
        {
          aiCn: '你好！请坐。你叫什么名字？',
          aiPinyin: 'Nǐ hǎo! Qǐng zuò. Nǐ jiào shénme míngzi?',
          aiVi: 'Xin chào! Mời ngồi. Bạn tên gì?',
          answers: [
            { cn: '你好，我叫王明。', pinyin: 'Nǐ hǎo, wǒ jiào Wáng Míng.', vi: 'Xin chào, tôi tên Vương Minh.', rating: 'excellent' },
            {
              cn: '王明。',
              pinyin: 'Wáng Míng.',
              vi: 'Vương Minh.',
              rating: 'good',
              suggestCn: '你好，我叫王明。',
              suggestPinyin: 'Nǐ hǎo, wǒ jiào Wáng Míng.',
              suggestVi: 'Xin chào, tôi tên Vương Minh.',
              explain: 'Trong phỏng vấn, hãy chào trước rồi nói 我叫… — câu trả lời trọn vẹn, chuyên nghiệp hơn.',
            },
            {
              cn: '我王明。',
              pinyin: 'Wǒ Wáng Míng.',
              vi: 'Tôi Vương Minh.',
              rating: 'fair',
              suggestCn: '你好，我叫王明。',
              suggestPinyin: 'Nǐ hǎo, wǒ jiào Wáng Míng.',
              suggestVi: 'Xin chào, tôi tên Vương Minh.',
              explain: 'Câu thiếu động từ 叫: phải nói 我叫王明 (tôi tên là…) chứ không phải 我王明.',
            },
          ],
        },
        {
          aiCn: '你是学生吗？你学什么专业？',
          aiPinyin: 'Nǐ shì xuésheng ma? Nǐ xué shénme zhuānyè?',
          aiVi: 'Bạn là sinh viên à? Bạn học chuyên ngành gì?',
          answers: [
            { cn: '是，我是大学生，我学中文。', pinyin: 'Shì, wǒ shì dàxuésheng, wǒ xué Zhōngwén.', vi: 'Vâng, tôi là sinh viên, tôi học tiếng Trung.', rating: 'excellent' },
            { cn: '我学中文。', pinyin: 'Wǒ xué Zhōngwén.', vi: 'Tôi học tiếng Trung.', rating: 'good' },
            {
              cn: '不是。',
              pinyin: 'Bú shì.',
              vi: 'Không phải.',
              rating: 'fair',
              suggestCn: '我以前是学生，现在想找一份兼职工作。',
              suggestPinyin: 'Wǒ yǐqián shì xuésheng, xiànzài xiǎng zhǎo yí fèn jiānzhí gōngzuò.',
              suggestVi: 'Trước đây tôi là sinh viên, giờ tôi muốn tìm một công việc bán thời gian.',
              explain: 'Trả lời có/không nên kèm giải thích ngắn — nhà tuyển dụng muốn nghe bối cảnh của bạn.',
            },
          ],
        },
        {
          aiCn: '你为什么想来我们这儿工作？',
          aiPinyin: 'Nǐ wèi shénme xiǎng lái wǒmen zhèr gōngzuò?',
          aiVi: 'Tại sao bạn muốn làm việc ở đây?',
          answers: [
            {
              cn: '因为我喜欢说中文，我想天天用中文。',
              pinyin: 'Yīnwèi wǒ xǐhuan shuō Zhōngwén, wǒ xiǎng tiāntiān yòng Zhōngwén.',
              vi: 'Vì tôi thích nói tiếng Trung, tôi muốn dùng nó mỗi ngày.',
              rating: 'excellent',
            },
            {
              cn: '我喜欢你们公司。',
              pinyin: 'Wǒ xǐhuan nǐmen gōngsī.',
              vi: 'Tôi thích công ty của các bạn.',
              rating: 'good',
              suggestCn: '因为我很喜欢贵公司的文化，也想在这里学习成长。',
              suggestPinyin: 'Yīnwèi wǒ hěn xǐhuan guì gōngsī de wénhuà, yě xiǎng zài zhèlǐ xuéxí chéngzhǎng.',
              suggestVi: 'Vì tôi rất thích văn hoá quý công ty, và cũng muốn học hỏi, trưởng thành ở đây.',
              explain: 'Dùng 贵公司 (quý công ty) thay cho 你们公司 nghe chuyên nghiệp hơn; nêu thêm lý do cụ thể.',
            },
            {
              cn: '我需要钱。',
              pinyin: 'Wǒ xūyào qián.',
              vi: 'Tôi cần tiền.',
              rating: 'fair',
              suggestCn: '因为这个工作和我的专业很合适。',
              suggestPinyin: 'Yīnwèi zhège gōngzuò hé wǒ de zhuānyè hěn héshì.',
              suggestVi: 'Vì công việc này rất phù hợp với chuyên môn của tôi.',
              explain: 'Đừng nói 我需要钱 — hãy nhấn mạnh sự PHÙ HỢP: 工作和我的专业很合适.',
            },
          ],
        },
      ],
    },
    advanced: {
      tier: 'advanced',
      hskLabel: 'HSK 4–6',
      steps: [
        {
          aiCn: '请坐。我们看过你的简历，能简单介绍一下你最近的工作经验吗？',
          aiPinyin: 'Qǐng zuò. Wǒmen kàn guo nǐ de jiǎnlì, néng jiǎndān jièshào yíxià nǐ zuìjìn de gōngzuò jīngyàn ma?',
          aiVi: 'Mời ngồi. Chúng tôi đã xem CV của bạn, bạn giới thiệu ngắn gọn về kinh nghiệm làm việc gần đây được không?',
          answers: [
            {
              cn: '好的。过去两年我在一家外贸公司做市场专员，负责东南亚市场。',
              pinyin: 'Hǎo de. Guòqù liǎng nián wǒ zài yì jiā wàimào gōngsī zuò shìchǎng zhuānyuán, fùzé Dōngnányà shìchǎng.',
              vi: 'Được ạ. Hai năm qua tôi làm chuyên viên marketing tại một công ty ngoại thương, phụ trách thị trường Đông Nam Á.',
              rating: 'excellent',
            },
            {
              cn: '我工作过两年。',
              pinyin: 'Wǒ gōngzuò guo liǎng nián.',
              vi: 'Tôi đã làm việc hai năm.',
              rating: 'fair',
              suggestCn: '我有两年的市场营销经验，主要负责社交媒体运营。',
              suggestPinyin: 'Wǒ yǒu liǎng nián de shìchǎng yíngxiāo jīngyàn, zhǔyào fùzé shèhuì méitǐ yùnyíng.',
              suggestVi: 'Tôi có hai năm kinh nghiệm marketing, chủ yếu phụ trách vận hành mạng xã hội.',
              explain:
                'Dùng cấu trúc 有…年…经验 và nói rõ vị trí + trách nhiệm — câu trả lời sẽ có trọng lượng hơn nhiều.',
            },
            { cn: '我在一家公司做过销售。', pinyin: 'Wǒ zài yì jiā gōngsī zuò guo xiāoshòu.', vi: 'Tôi từng làm sales ở một công ty.', rating: 'good' },
          ],
        },
        {
          aiCn: '你觉得自己最大的优势是什么？为什么我们要录用你？',
          aiPinyin: 'Nǐ juéde zìjǐ zuì dà de yōushì shì shénme? Wèi shénme wǒmen yào lùyòng nǐ?',
          aiVi: 'Bạn thấy ưu điểm lớn nhất của mình là gì? Tại sao chúng tôi nên tuyển bạn?',
          answers: [
            {
              cn: '我熟悉中越两国的市场文化，而且学习能力强，能很快适应新环境。',
              pinyin: 'Wǒ shúxī Zhōng-Yuè liǎng guó de shìchǎng wénhuà, érqiě xuéxí nénglì qiáng, néng hěn kuài shìyìng xīn huánjìng.',
              vi: 'Tôi am hiểu văn hoá thị trường Trung–Việt, khả năng học tốt, thích nghi với môi trường mới rất nhanh.',
              rating: 'excellent',
            },
            {
              cn: '我很努力工作。',
              pinyin: 'Wǒ hěn nǔlì gōngzuò.',
              vi: 'Tôi làm việc rất chăm chỉ.',
              rating: 'fair',
              suggestCn: '我的专业能力与这个职位非常匹配，而且我具有很强的团队合作精神。',
              suggestPinyin: 'Wǒ de zhuānyè nénglì yǔ zhège zhíwèi fēicháng pǐpèi, érqiě wǒ jùyǒu hěn qiáng de tuánduì hézuò jīngshén.',
              suggestVi: 'Năng lực chuyên môn của tôi rất phù hợp với vị trí này, và tôi có tinh thần làm việc nhóm mạnh mẽ.',
              explain: 'Nói ưu điểm phải GẮN VỚI CÔNG VIỆC: năng lực khớp vị trí + kỹ năng cụ thể (làm việc nhóm, giao tiếp…).',
            },
            { cn: '我会中文和英语，沟通能力不错。', pinyin: 'Wǒ huì Zhōngwén hé Yīngyǔ, gōutōng nénglì bú cuò.', vi: 'Tôi biết tiếng Trung và tiếng Anh, giao tiếp khá tốt.', rating: 'good' },
          ],
        },
        {
          aiCn: '那你对薪资有什么期望？',
          aiPinyin: 'Nà nǐ duì xīnzī yǒu shénme qīwàng?',
          aiVi: 'Vậy bạn kỳ vọng thế nào về mức lương?',
          answers: [
            {
              cn: '我希望月薪在一千五到两千美元之间，具体可以再商量。',
              pinyin: 'Wǒ xīwàng yuèxīn zài yìqiān wǔ dào liǎngqiān Měiyuán zhī jiān, jùtǐ kěyǐ zài shāngliang.',
              vi: 'Tôi mong lương tháng trong khoảng 1.500–2.000 USD, chi tiết có thể thương lượng thêm.',
              rating: 'excellent',
            },
            {
              cn: '都可以，听公司的。',
              pinyin: 'Dōu kěyǐ, tīng gōngsī de.',
              vi: 'Cái nào cũng được, theo công ty.',
              rating: 'good',
              suggestCn: '我尊重公司的薪酬体系，但也希望薪资能和我的经验相匹配。',
              suggestPinyin: 'Wǒ zūnzhòng gōngsī de xīnchóu tǐxì, dàn yě xīwàng xīnzī néng hé wǒ de jīngyàn xiāng pǐpèi.',
              suggestVi: 'Tôi tôn trọng hệ thống lương của công ty, nhưng cũng mong mức lương tương xứng với kinh nghiệm của mình.',
              explain: 'Nên thể hiện tư thế: tôn trọng công ty NHƯNG mong lương tương xứng với 经验 — không nên bỏ trắng quyền trả giá.',
            },
            {
              cn: '我想要很多钱。',
              pinyin: 'Wǒ xiǎng yào hěn duō qián.',
              vi: 'Tôi muốn nhiều tiền.',
              rating: 'fair',
              suggestCn: '希望薪资能与我的能力和经验相匹配。',
              suggestPinyin: 'Xīwàng xīnzī néng yǔ wǒ de nénglì hé jīngyàn xiāng pǐpèi.',
              suggestVi: 'Mong rằng mức lương sẽ tương xứng với năng lực và kinh nghiệm của tôi.',
              explain: '我想要很多钱 nghe thiếu chuyên nghiệp — hãy nói mong mức lương 相匹配 (tương xứng) với năng lực.',
            },
          ],
        },
      ],
    },
  },
}
