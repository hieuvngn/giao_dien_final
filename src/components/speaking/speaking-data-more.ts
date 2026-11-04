/* ============================================================
   Dữ liệu hội thoại luyện nói cùng AI (phần B)
   3 tình huống: Hỏi đường · Giới thiệu bản thân · Sân bay
   + danh sách SCENARIOS tổng hợp cho trang luyện nói
   ============================================================ */

import { INTERVIEW, RESTAURANT, SHOPPING } from './speaking-data'
import type { Scenario } from './speaking-data'

/* ================= 4 · Hỏi đường ================= */

export const DIRECTIONS: Scenario = {
  id: 'directions',
  emoji: '🗺️',
  name: 'Hỏi đường',
  cn: '问路',
  desc: 'Lạc đường thì làm sao? Hỏi chỗ, ghi nhớ chỉ dẫn và cảm ơn thật ngọt.',
  tone: 'mint',
  dialogues: {
    beginner: {
      tier: 'beginner',
      hskLabel: 'HSK 1–2',
      steps: [
        {
          aiCn: '你好！你在找什么？',
          aiPinyin: 'Nǐ hǎo! Nǐ zài zhǎo shénme?',
          aiVi: 'Xin chào! Bạn đang tìm gì vậy?',
          answers: [
            { cn: '请问，银行在哪里？', pinyin: 'Qǐngwèn, yínháng zài nǎlǐ?', vi: 'Cho hỏi, ngân hàng ở đâu ạ?', rating: 'excellent' },
            {
              cn: '我要去银行。',
              pinyin: 'Wǒ yào qù yínháng.',
              vi: 'Tôi muốn đến ngân hàng.',
              rating: 'good',
              suggestCn: '请问，银行在哪儿？',
              suggestPinyin: 'Qǐngwèn, yínháng zài nǎr?',
              suggestVi: 'Cho hỏi, ngân hàng ở đâu ạ?',
              explain: 'Hỏi đường nên hỏi thẳng: 请问 + 在哪儿？ — người nghe sẽ chỉ đường cho bạn ngay.',
            },
            {
              cn: '银行？',
              pinyin: 'Yínháng?',
              vi: 'Ngân hàng?',
              rating: 'fair',
              suggestCn: '不好意思，请问银行在哪儿？',
              suggestPinyin: 'Bù hǎoyìsi, qǐngwèn yínháng zài nǎr?',
              suggestVi: 'Xin lỗi, cho hỏi ngân hàng ở đâu ạ?',
              explain: 'Một chữ thôi là chưa đủ — mở đầu bằng 不好意思，请问… khi hỏi đường rất lịch sự.',
            },
          ],
        },
        {
          aiCn: '银行？在那个商店旁边，你直走就看到了。',
          aiPinyin: 'Yínháng? Zài nàge shāngdiàn pángbiān, nǐ zhí zǒu jiù kàn dào le.',
          aiVi: 'Ngân hàng ư? Cạnh cửa hàng đó, bạn đi thẳng là thấy ngay.',
          answers: [
            { cn: '直走，对吗？谢谢！', pinyin: 'Zhí zǒu, duì ma? Xièxie!', vi: 'Đi thẳng, đúng không ạ? Cảm ơn!', rating: 'excellent' },
            { cn: '我听不懂，请再说一遍。', pinyin: 'Wǒ tīng bu dǒng, qǐng zài shuō yí biàn.', vi: 'Tôi chưa hiểu, anh/chị nói lại giúp tôi nhé.', rating: 'excellent' },
            {
              cn: '好。',
              pinyin: 'Hǎo.',
              vi: 'Được.',
              rating: 'fair',
              suggestCn: '好的，直走到商店旁边，对吗？',
              suggestPinyin: 'Hǎo de, zhí zǒu dào shāngdiàn pángbiān, duì ma?',
              suggestVi: 'Vâng, đi thẳng đến cạnh cửa hàng, đúng không ạ?',
              explain: 'Hãy nhắc lại chỉ dẫn (直走 + 到…) để xác nhận — vừa lịch sự vừa không bị lạc đường.',
            },
          ],
        },
        {
          aiCn: '对！走三分钟，银行就在你的左边。',
          aiPinyin: 'Duì! Zǒu sān fēnzhōng, yínháng jiù zài nǐ de zuǒbian.',
          aiVi: 'Đúng rồi! Đi ba phút, ngân hàng nằm bên trái bạn.',
          answers: [
            { cn: '太感谢了！', pinyin: 'Tài gǎnxiè le!', vi: 'Cảm ơn nhiều lắm!', rating: 'excellent' },
            { cn: '谢谢你，再见！', pinyin: 'Xièxie nǐ, zàijiàn!', vi: 'Cảm ơn bạn, tạm biệt!', rating: 'excellent' },
            {
              cn: '好。',
              pinyin: 'Hǎo.',
              vi: 'OK.',
              rating: 'fair',
              suggestCn: '太感谢了，您真是帮了大忙！',
              suggestPinyin: 'Tài gǎnxiè le, nín zhēn shì bāng le dà máng!',
              suggestVi: 'Cảm ơn nhiều lắm, anh/chị đã giúp tôi rất nhiều!',
              explain: 'Chỉ đáp 好 hơi lạnh nhạt — 太感谢了，帮了大忙! thể hiện lòng biết ơn đúng mực.',
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
          aiCn: '你好？看你的样子好像迷路了，需要帮忙吗？',
          aiPinyin: 'Nǐ hǎo? Kàn nǐ de yàngzi hǎoxiàng mílù le, xūyào bāngmáng ma?',
          aiVi: 'Xin chào? Nhìn bạn có vẻ bị lạc đường, cần giúp gì không?',
          answers: [
            {
              cn: '是啊，我想去博物馆，可是找不到路了。',
              pinyin: 'Shì a, wǒ xiǎng qù bówùguǎn, kěshì zhǎo bu dào lù le.',
              vi: 'Đúng vậy, tôi muốn đến bảo tàng nhưng tìm không ra đường.',
              rating: 'excellent',
            },
            { cn: '请问，去博物馆怎么走？', pinyin: 'Qǐngwèn, qù bówùguǎn zěnme zǒu?', vi: 'Cho hỏi, đến bảo tàng đi thế nào ạ?', rating: 'good' },
            {
              cn: '帮助我！',
              pinyin: 'Bāngzhù wǒ!',
              vi: 'Giúp tôi!',
              rating: 'fair',
              suggestCn: '不好意思，我迷路了，您能帮帮我吗？',
              suggestPinyin: 'Bù hǎoyìsi, wǒ mílù le, nín néng bāngbang wǒ ma?',
              suggestVi: 'Xin lỗi, tôi bị lạc rồi, anh/chị giúp tôi được không ạ?',
              explain:
                '帮助我 nghe như ra lệnh — hãy nói 我迷路了 (tôi bị lạc) + câu hỏi lịch sự 您能帮帮我吗.',
            },
          ],
        },
        {
          aiCn: '博物馆有点儿远。你坐地铁二号线，在中山公园站下车，A出口出来就是。',
          aiPinyin: 'Bówùguǎn yǒudiǎnr yuǎn. Nǐ zuò dìtiě èr hào xiàn, zài Zhōngshān Gōngyuán zhàn xiàchē, A chūkǒu chūlái jiù shì.',
          aiVi: 'Bảo tàng hơi xa. Bạn đi metro tuyến số 2, xuống ga Công viên Trung Sơn, ra lối A là tới ngay.',
          answers: [
            {
              cn: '二号线，中山公园站，A出口——我记下来了，谢谢！',
              pinyin: 'Èr hào xiàn, Zhōngshān Gōngyuán zhàn, A chūkǒu — wǒ jì xiàlái le, xièxie!',
              vi: 'Tuyến 2, ga Công viên Trung Sơn, lối A — tôi ghi nhớ rồi, cảm ơn!',
              rating: 'excellent',
            },
            {
              cn: '不好意思，您能再说一遍吗？我说汉语比较慢。',
              pinyin: 'Bù hǎoyìsi, nín néng zài shuō yí biàn ma? Wǒ shuō Hànyǔ bǐjiào màn.',
              vi: 'Xin lỗi, anh/chị nói lại giúp tôi được không? Tôi nói tiếng Trung chậm lắm.',
              rating: 'excellent',
            },
            {
              cn: '好的。',
              pinyin: 'Hǎo de.',
              vi: 'Vâng.',
              rating: 'fair',
              suggestCn: '麻烦您再说一遍，我把它记在手机上。',
              suggestPinyin: 'Máfan nín zài shuō yí biàn, wǒ bǎ tā jì zài shǒujī shàng.',
              suggestVi: 'Phiền anh/chị nói lại giúp tôi, tôi ghi vào điện thoại nhé.',
              explain: 'Chỉ đường dài thì phải xin nhắc lại và ghi lại: 把它记在手机上 — như vậy mới không quên.',
            },
          ],
        },
        {
          aiCn: '不客气！地铁站就在前面路口右转，大概三分钟就到。',
          aiPinyin: 'Bú kèqi! Dìtiě zhàn jiù zài qiánmiàn lùkǒu yòu zhuǎn, dàgài sān fēnzhōng jiù dào.',
          aiVi: 'Không có gì! Ga metro ở ngã tư phía trước, rẽ phải là đến sau khoảng ba phút.',
          answers: [
            { cn: '太谢谢您了，您真热情！', pinyin: 'Tài xièxie nín le, nín zhēn rèqíng!', vi: 'Cảm ơn anh/chị nhiều, anh/chị nhiệt tình quá!', rating: 'excellent' },
            { cn: '谢谢您的帮助，再见！', pinyin: 'Xièxie nín de bāngzhù, zàijiàn!', vi: 'Cảm ơn sự giúp đỡ của anh/chị, tạm biệt!', rating: 'excellent' },
            {
              cn: '谢谢谢谢。',
              pinyin: 'Xièxie xièxie.',
              vi: 'Cảm ơn cảm ơn.',
              rating: 'good',
              suggestCn: '谢谢您的帮助，您真是太好了！',
              suggestPinyin: 'Xièxie nín de bāngzhù, nín zhēn shì tài hǎo le!',
              suggestVi: 'Cảm ơn anh/chị đã giúp đỡ, anh/chị tốt quá!',
              explain: 'Lặp 谢谢 hai lần nghe vội vã — 谢谢您的帮助 trọn vẹn và chân thành hơn.',
            },
          ],
        },
      ],
    },
  },
}

/* ================= 5 · Giới thiệu bản thân ================= */

export const INTRO: Scenario = {
  id: 'intro',
  emoji: '👋',
  name: 'Giới thiệu bản thân',
  cn: '自我介绍',
  desc: 'Bước đầu làm quen: tên, quê quán, sở thích và dự định của bạn.',
  tone: 'lilac',
  dialogues: {
    beginner: {
      tier: 'beginner',
      hskLabel: 'HSK 1–2',
      steps: [
        {
          aiCn: '你好！你叫什么名字？',
          aiPinyin: 'Nǐ hǎo! Nǐ jiào shénme míngzi?',
          aiVi: 'Xin chào! Bạn tên gì vậy?',
          answers: [
            { cn: '你好，我叫阿安。', pinyin: 'Nǐ hǎo, wǒ jiào Ā Ān.', vi: 'Xin chào, mình tên A An.', rating: 'excellent' },
            { cn: '我叫安。', pinyin: 'Wǒ jiào Ān.', vi: 'Mình tên An.', rating: 'good' },
            {
              cn: '我的名字安。',
              pinyin: 'Wǒ de míngzi Ān.',
              vi: 'Tên của mình An.',
              rating: 'fair',
              suggestCn: '你好，我叫安。',
              suggestPinyin: 'Nǐ hǎo, wǒ jiào Ān.',
              suggestVi: 'Xin chào, mình tên An.',
              explain:
                'Giới thiệu tên tự nhiên nhất là 我叫… (tôi tên là…). Nếu dùng 我的名字 thì phải thêm 是: 我的名字是安.',
            },
          ],
        },
        {
          aiCn: '安，你好！你是哪国人？',
          aiPinyin: 'Ān, nǐ hǎo! Nǐ shì nǎ guó rén?',
          aiVi: 'An chào bạn! Bạn là người nước nào?',
          answers: [
            { cn: '我是越南人。', pinyin: 'Wǒ shì Yuènán rén.', vi: 'Mình là người Việt Nam.', rating: 'excellent' },
            { cn: '我来自越南。', pinyin: 'Wǒ láizì Yuènán.', vi: 'Mình đến từ Việt Nam.', rating: 'excellent' },
            {
              cn: '越南。',
              pinyin: 'Yuènán.',
              vi: 'Việt Nam.',
              rating: 'fair',
              suggestCn: '我是越南人。',
              suggestPinyin: 'Wǒ shì Yuènán rén.',
              suggestVi: 'Mình là người Việt Nam.',
              explain: 'Chỉ nói một từ là thiếu chủ-vị — câu đầy đủ là 我是越南人 (tôi là người…).',
            },
          ],
        },
        {
          aiCn: '你的爱好是什么？',
          aiPinyin: 'Nǐ de àihào shì shénme?',
          aiVi: 'Sở thích của bạn là gì?',
          answers: [
            { cn: '我喜欢听音乐，也喜欢打篮球。', pinyin: 'Wǒ xǐhuan tīng yīnyuè, yě xǐhuan dǎ lánqiú.', vi: 'Mình thích nghe nhạc, cũng thích chơi bóng rổ.', rating: 'excellent' },
            {
              cn: '我爱电影。',
              pinyin: 'Wǒ ài diànyǐng.',
              vi: 'Mình yêu điện ảnh.',
              rating: 'good',
              suggestCn: '我喜欢看电影。',
              suggestPinyin: 'Wǒ xǐhuan kàn diànyǐng.',
              suggestVi: 'Mình thích xem phim.',
              explain: 'Với sở thích, dùng 喜欢 + động từ (看电影 / 听音乐) tự nhiên hơn 我爱 + danh từ.',
            },
            {
              cn: '不知道。',
              pinyin: 'Bù zhīdào.',
              vi: 'Không biết nữa.',
              rating: 'fair',
              suggestCn: '我喜欢看电影，也喜欢和朋友一起吃饭。',
              suggestPinyin: 'Wǒ xǐhuan kàn diànyǐng, yě xǐhuan hé péngyou yìqǐ chīfàn.',
              suggestVi: 'Mình thích xem phim, cũng thích đi ăn cùng bạn bè.',
              explain: 'Ai cũng có sở thích mà! Hãy thử công thức 我喜欢…，也喜欢… — kể hai điều là đủ dễ thương.',
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
          aiCn: '你好，很高兴认识你。听说你刚从越南来，做个自我介绍吧。',
          aiPinyin: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ. Tīngshuō nǐ gāng cóng Yuènán lái, zuò gè zìwǒ jièshào ba.',
          aiVi: 'Xin chào, rất vui được gặp bạn. Nghe nói bạn mới từ Việt Nam sang, giới thiệu bản thân đi nào.',
          answers: [
            {
              cn: '大家好，我叫阮氏梅，来自越南河内，现在是一名大学生，学国际贸易专业。',
              pinyin: 'Dàjiā hǎo, wǒ jiào Ruǎn Shì Méi, láizì Yuènán Hénèi, xiànzài shì yì míng dàxuésheng, xué guójì màoyì zhuānyè.',
              vi: 'Xin chào mọi người, tôi là Nguyễn Thị Mai, đến từ Hà Nội Việt Nam, hiện là sinh viên ngành thương mại quốc tế.',
              rating: 'excellent',
            },
            {
              cn: '我叫梅，我是越南人。',
              pinyin: 'Wǒ jiào Méi, wǒ shì Yuènán rén.',
              vi: 'Tôi tên Mai, tôi là người Việt Nam.',
              rating: 'fair',
              suggestCn: '我叫阿梅，来自越南，很高兴认识大家！',
              suggestPinyin: 'Wǒ jiào Ā Méi, láizì Yuènán, hěn gāoxìng rènshi dàjiā!',
              suggestVi: 'Tôi là Mai, đến từ Việt Nam, rất vui được gặp mọi người!',
              explain: '自我介绍 nên đủ ý: tên + quê quán (+ nghề nghiệp) và kết thúc bằng 很高兴认识大家.',
            },
            { cn: '我叫阿梅，在大学学习。', pinyin: 'Wǒ jiào Ā Méi, zài dàxué xuéxí.', vi: 'Tôi là Mai, đang học đại học.', rating: 'good' },
          ],
        },
        {
          aiCn: '欢迎你！你为什么选择来中国留学呢？',
          aiPinyin: 'Huānyíng nǐ! Nǐ wèi shénme xuǎnzé lái Zhōngguó liúxué ne?',
          aiVi: 'Chào mừng bạn! Tại sao bạn chọn du học ở Trung Quốc?',
          answers: [
            {
              cn: '因为我从高中就开始学汉语，而且对中国的历史文化特别感兴趣。',
              pinyin: 'Yīnwèi wǒ cóng gāozhōng jiù kāishǐ xué Hànyǔ, érqiě duì Zhōngguó de lìshǐ wénhuà tèbié gǎn xìngqù.',
              vi: 'Vì tôi học tiếng Trung từ cấp ba, và đặc biệt thích thú với lịch sử, văn hoá Trung Quốc.',
              rating: 'excellent',
            },
            {
              cn: '中国很好。',
              pinyin: 'Zhōngguó hěn hǎo.',
              vi: 'Trung Quốc tốt.',
              rating: 'fair',
              suggestCn: '因为中国发展很快，我想在这里学习先进的技术和经验。',
              suggestPinyin: 'Yīnwèi Zhōngguó fāzhǎn hěn kuài, wǒ xiǎng zài zhèlǐ xuéxí xiānjìn de jìshù hé jīngyàn.',
              suggestVi: 'Vì Trung Quốc phát triển rất nhanh, tôi muốn học công nghệ và kinh nghiệm tiên tiến ở đây.',
              explain: 'Trả lời ngắn quá — hãy nêu lý do CỤ THỂ (phát triển nhanh, văn hoá, học bổng…) mới thuyết phục.',
            },
            { cn: '因为我想学好汉语，以后做翻译。', pinyin: 'Yīnwèi wǒ xiǎng xué hǎo Hànyǔ, yǐhòu zuò fānyì.', vi: 'Vì tôi muốn học giỏi tiếng Trung để sau này làm phiên dịch.', rating: 'good' },
          ],
        },
        {
          aiCn: '那你以后有什么打算？毕业以后想做什么？',
          aiPinyin: 'Nà nǐ yǐhòu yǒu shénme dǎsuàn? Bìyè yǐhòu xiǎng zuò shénme?',
          aiVi: 'Vậy sau này bạn có dự định gì? Ra trường muốn làm nghề gì?',
          answers: [
            {
              cn: '我打算先读研究生，然后回越南做中越贸易方面的工作。',
              pinyin: 'Wǒ dǎsuàn xiān dú yánjiūshēng, ránhòu huí Yuènán zuò Zhōng-Yuè màoyì fāngmiàn de gōngzuò.',
              vi: 'Tôi định học cao học trước, rồi về Việt Nam làm trong lĩnh vực thương mại Trung–Việt.',
              rating: 'excellent',
            },
            {
              cn: '我不知道。',
              pinyin: 'Wǒ bù zhīdào.',
              vi: 'Tôi chưa biết.',
              rating: 'fair',
              suggestCn: '我还在规划，不过我希望能从事和中越交流有关的工作。',
              suggestPinyin: 'Wǒ hái zài guīhuà, búguò wǒ xīwàng néng cóngshì hé Zhōng-Yuè jiāoliú yǒuguān de gōngzuò.',
              suggestVi: 'Tôi vẫn đang định hướng, nhưng mong sẽ làm việc liên quan đến giao lưu Trung–Việt.',
              explain: 'Chưa rõ hướng đi thì hãy nói 我还在规划 (vẫn đang định hướng) + một hướng lớn — đừng trả lời trống trơn.',
            },
            { cn: '我想在中国工作几年，多积累一些经验。', pinyin: 'Wǒ xiǎng zài Zhōngguó gōngzuò jǐ nián, duō jīlěi yìxiē jīngyàn.', vi: 'Tôi muốn làm việc ở Trung Quốc vài năm để tích luỹ thêm kinh nghiệm.', rating: 'good' },
          ],
        },
      ],
    },
  },
}

/* ================= 6 · Giao tiếp tại sân bay ================= */

export const AIRPORT: Scenario = {
  id: 'airport',
  emoji: '✈️',
  name: 'Giao tiếp tại sân bay',
  cn: '机场',
  desc: 'Làm thủ tục: xuất trình hộ chiếu, ký gửi hành lý, tìm cổng lên máy bay.',
  tone: 'peach',
  dialogues: {
    beginner: {
      tier: 'beginner',
      hskLabel: 'HSK 1–2',
      steps: [
        {
          aiCn: '你好，请给我看看你的机票。',
          aiPinyin: 'Nǐ hǎo, qǐng gěi wǒ kànkan nǐ de jīpiào.',
          aiVi: 'Xin chào, cho tôi xem vé máy bay của bạn.',
          answers: [
            { cn: '好的，给您。', pinyin: 'Hǎo de, gěi nín.', vi: 'Vâng, của anh/chị đây ạ.', rating: 'excellent' },
            { cn: '这是我的机票。', pinyin: 'Zhè shì wǒ de jīpiào.', vi: 'Đây là vé máy bay của tôi.', rating: 'excellent' },
            {
              cn: '给你。',
              pinyin: 'Gěi nǐ.',
              vi: 'Của bạn đây.',
              rating: 'fair',
              suggestCn: '好的，给您。',
              suggestPinyin: 'Hǎo de, gěi nín.',
              suggestVi: 'Vâng, của anh/chị đây ạ.',
              explain: 'Ở sân bay hãy dùng 您 (lịch sự) và thêm 好的: 好的，给您 — 给你 một mình nghe hơi qua loa.',
            },
          ],
        },
        {
          aiCn: '谢谢。你有大箱子吗？',
          aiPinyin: 'Xièxie. Nǐ yǒu dà xiāngzi ma?',
          aiVi: 'Cảm ơn. Bạn có vali lớn không?',
          answers: [
            { cn: '有，一个大的。', pinyin: 'Yǒu, yí gè dà de.', vi: 'Có, một cái to.', rating: 'excellent' },
            { cn: '没有，只有这个包。', pinyin: 'Méiyǒu, zhǐyǒu zhège bāo.', vi: 'Không, chỉ có cái ba lô này.', rating: 'excellent' },
            {
              cn: '一个。',
              pinyin: 'Yí gè.',
              vi: 'Một cái.',
              rating: 'good',
              suggestCn: '有一个箱子。',
              suggestPinyin: 'Yǒu yí gè xiāngzi.',
              suggestVi: 'Có một cái vali.',
              explain: 'Trả lời có/không phải có động từ: 有一个箱子 hoặc 没有 — chỉ nói 一个 là chưa đủ.',
            },
          ],
        },
        {
          aiCn: '好。你的登机口是B12。祝你旅途愉快！',
          aiPinyin: 'Hǎo. Nǐ de dēngjīkǒu shì B12. Zhù nǐ lǚtú yúkuài!',
          aiVi: 'Được rồi. Cổng lên máy bay của bạn là B12. Chúc bạn chuyến đi vui vẻ!',
          answers: [
            { cn: '谢谢，再见！', pinyin: 'Xièxie, zàijiàn!', vi: 'Cảm ơn, tạm biệt!', rating: 'excellent' },
            { cn: '谢谢！请问从这边走吗？', pinyin: 'Xièxie! Qǐngwèn cóng zhèbiān zǒu ma?', vi: 'Cảm ơn! Cho hỏi đi bên này phải không ạ?', rating: 'excellent' },
            {
              cn: '好。',
              pinyin: 'Hǎo.',
              vi: 'OK.',
              rating: 'fair',
              suggestCn: '谢谢您，祝您工作顺利！',
              suggestPinyin: 'Xièxie nín, zhù nín gōngzuò shùnlì!',
              suggestVi: 'Cảm ơn anh/chị, chúc anh/chị công việc thuận lợi!',
              explain: 'Chỉ nói 好 hơi cụt — đáp lại lời chúc bằng 谢谢您 + một lời chúc lại rất tự nhiên.',
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
          aiCn: '下一位。您好，请出示您的护照和机票。',
          aiPinyin: 'Xià yí wèi. Nín hǎo, qǐng chūshì nín de hùzhào hé jīpiào.',
          aiVi: 'Bạn tiếp theo. Xin chào, vui lòng xuất trình hộ chiếu và vé máy bay.',
          answers: [
            {
              cn: '您好，这是我的护照，我坐VN310去上海。',
              pinyin: 'Nín hǎo, zhè shì wǒ de hùzhào, wǒ zuò VN310 qù Shànghǎi.',
              vi: 'Xin chào, đây là hộ chiếu của tôi, tôi bay VN310 đi Thượng Hải.',
              rating: 'excellent',
            },
            { cn: '这是我的护照。', pinyin: 'Zhè shì wǒ de hùzhào.', vi: 'Đây là hộ chiếu của tôi.', rating: 'good' },
            {
              cn: '给你。',
              pinyin: 'Gěi nǐ.',
              vi: 'Của bạn đây.',
              rating: 'fair',
              suggestCn: '您好，给您护照。',
              suggestPinyin: 'Nín hǎo, gěi nín hùzhào.',
              suggestVi: 'Xin chào, hộ chiếu của anh/chị đây ạ.',
              explain: 'Với nhân viên sân bay hãy chào 您好 và dùng đại từ lịch sự 您: 给您护照.',
            },
          ],
        },
        {
          aiCn: '好的。你有行李要托运吗？有的话请放到传送带上。',
          aiPinyin: 'Hǎo de. Nǐ yǒu xínglǐ yào tuōyùn ma? Yǒu de huà qǐng fàng dào chuánsòngdài shàng.',
          aiVi: 'Được rồi. Bạn có hành lý ký gửi không? Nếu có vui lòng đặt lên băng chuyền.',
          answers: [
            {
              cn: '有一个箱子。这个背包我想随身带上飞机，可以吗？',
              pinyin: 'Yǒu yí gè xiāngzi. Zhège bēibāo wǒ xiǎng suíshēn dài shàng fēijī, kěyǐ ma?',
              vi: 'Có một cái vali. Còn chiếc ba lô này tôi muốn mang theo lên máy bay, được không ạ?',
              rating: 'excellent',
            },
            { cn: '没有，就这个背包。', pinyin: 'Méiyǒu, jiù zhège bēibāo.', vi: 'Không, chỉ có chiếc ba lô này thôi.', rating: 'excellent' },
            {
              cn: '一件行李。',
              pinyin: 'Yí jiàn xínglǐ.',
              vi: 'Một món hành lý.',
              rating: 'good',
              suggestCn: '有，我要托运一件行李。',
              suggestPinyin: 'Yǒu, wǒ yào tuōyùn yí jiàn xínglǐ.',
              suggestVi: 'Có, tôi cần ký gửi một món hành lý.',
              explain: 'Từ khoá sân bay: 托运 = ký gửi hành lý. Câu đầy đủ: 有，我要托运一件行李.',
            },
          ],
        },
        {
          aiCn: '可以。你的航班在B12登机口，九点四十开始登机，请提前半小时到。',
          aiPinyin: 'Kěyǐ. Nǐ de hángbān zài B12 dēngjīkǒu, jiǔ diǎn sìshí kāishǐ dēngjī, qǐng tíqián bàn xiǎoshí dào.',
          aiVi: 'Được. Chuyến của bạn ở cổng B12, 9 giờ 40 bắt đầu lên máy bay, vui lòng có mặt sớm nửa tiếng.',
          answers: [
            {
              cn: '好的，B12登机口，九点四十，我记住了。谢谢！',
              pinyin: 'Hǎo de, B12 dēngjīkǒu, jiǔ diǎn sìshí, wǒ jìzhù le. Xièxie!',
              vi: 'Vâng, cổng B12, 9 giờ 40, tôi nhớ rồi. Cảm ơn!',
              rating: 'excellent',
            },
            { cn: '谢谢！请问从这边走吗？', pinyin: 'Xièxie! Qǐngwèn cóng zhèbiān zǒu ma?', vi: 'Cảm ơn! Cho hỏi đi bên này phải không ạ?', rating: 'excellent' },
            {
              cn: '好。',
              pinyin: 'Hǎo.',
              vi: 'OK.',
              rating: 'fair',
              suggestCn: '好的，谢谢您的提醒，我马上去。',
              suggestPinyin: 'Hǎo de, xièxie nín de tíxǐng, wǒ mǎshàng qù.',
              suggestVi: 'Vâng, cảm ơn anh/chị đã nhắc nhở, tôi đi ngay đây ạ.',
              explain: 'Được nhắc nhở thì đáp 谢谢您的提醒 (cảm ơn đã nhắc) + nói rõ hành động: 我马上去.',
            },
          ],
        },
      ],
    },
  },
}

/* ================= Danh sách tổng hợp ================= */

export const SCENARIOS: Scenario[] = [RESTAURANT, SHOPPING, INTERVIEW, DIRECTIONS, INTRO, AIRPORT]
