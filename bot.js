require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');

// ———————————————————
// تنظیمات اصلی
// ———————————————————

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

if (!BOT_TOKEN) {
  throw new Error('❌ BOT_TOKEN در متغیرهای محیطی تنظیم نشده است.');
}

const bot = new Telegraf(BOT_TOKEN);

// تنظیمات کانال‌ها
const CHANNELS = {
  sher: {
    id: '@sher_khoub',
    name: 'کانال شعر خوب نوش',
    signature: 'شعر خوب نوش جان کن ❤️🌹🌸'
  },
  ahlolbeyt: {
    id: '@ahlolbeytmedia',
    name: 'کانال اهل البیت',
    signature: 'عشق به اهل بیت ❤️\n\n📌 @ahlolbeytmedia'
  },
  sex: {
    id: '@sexzanashuoei',
    name: 'عاشقانه های زناشویی',
    signature: 'خوش رابطه باشید ❤️\n\n📌 @sexzanashuoei',
    sticker: 'CAACAgIAAxkBAAEL2kRl7LQx9s7q5JZ9m3y5s1r7u8u57AAC7gQAAnlcTRg3rAcIu58V3DQE'
  }
};

// کانال پیش‌فرض
let TARGET_CHANNEL = CHANNELS.sher;

// ———————————————————
// وب‌سرور (فقط برای Render — بدون این، خطای پورت می‌دهد)
// ———————————————————
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send(`
    <h3>ربات مدیریت چندکاناله فعال است</h3>
    <p><b>کانال مقصد فعلی:</b> ${TARGET_CHANNEL.name}</p>
    <p><b>توکن:</b> ${BOT_TOKEN.slice(0, 10)}...</p>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 وب‌سرور در پورت ${PORT} فعال است (فقط برای Render)`);
});

// ———————————————————
// دستور /start و دکمه‌ها
// ———————————————————
bot.start((ctx) => {
  const current = TARGET_CHANNEL === CHANNELS.sher ? '📢 شعر' : 
                  TARGET_CHANNEL === CHANNELS.ahlolbeyt ? '🕌 اهل بیت' : '❤️ عاشقانه';

  ctx.replyWithHTML(
    `سلام دوست عزیز 🌸\n\n🎯 کانال مقصد فعلی: <b>${current}</b>\n\nبرای تغییر کانال مقصد، یکی از دکمه‌های زیر را لمس کنید:`,
    {
      reply_markup: {
        keyboard: [
          [{ text: '📢 کانال شعر خوب نوش' }],
          [{ text: '🕌 کانال اهل البیت' }],
          [{ text: '❤️ کانال عاشقانه های زناشویی' }]
        ],
        resize_keyboard: true
      }
    }
  );
});

// ———————————————————
// انتخاب کانال‌ها
// ———————————————————
bot.hears('📢 کانال شعر خوب نوش', (ctx) => {
  TARGET_CHANNEL = CHANNELS.sher;
  ctx.replyWithHTML(
    `✅ کانال مقصد تغییر کرد:\n\n<b>📢 ${CHANNELS.sher.name}</b>\n\n📌 حالا هر پیامی که بفرستی، به <code>${CHANNELS.sher.id}</code> ارسال می‌شود.`,
    { reply_markup: { remove_keyboard: true } }
  );
});

bot.hears('🕌 کانال اهل البیت', (ctx) => {
  TARGET_CHANNEL = CHANNELS.ahlolbeyt;
  ctx.replyWithHTML(
    `✅ کانال مقصد تغییر کرد:\n\n<b>🕌 ${CHANNELS.ahlolbeyt.name}</b>\n\n📌 حالا هر پیامی که بفرستی، به <code>${CHANNELS.ahlolbeyt.id}</code> ارسال می‌شود.`,
    { reply_markup: { remove_keyboard: true } }
  );
});

bot.hears('❤️ کانال عاشقانه های زناشویی', (ctx) => {
  TARGET_CHANNEL = CHANNELS.sex;
  ctx.replyWithHTML(
    `✅ کانال مقصد تغییر کرد:\n\n<b>❤️ ${CHANNELS.sex.name}</b>\n\n📌 حالا هر پیامی که بفرستی، به <code>${CHANNELS.sex.id}</code> ارسال می‌شود.`,
    { reply_markup: { remove_keyboard: true } }
  );
});

// ———————————————————
// تابع پاک‌سازی متن
// ———————————————————
function cleanText(text) {
  if (!text) return '';
  let cleaned = text
    .split('\n')
    .filter(line => {
      const lower = line.trim().toLowerCase();
      return (
        !lower.includes('via @') &&
        !lower.includes('from @') &&
        !lower.includes('فوروارد از @') &&
        !lower.includes('ارسال شده از @') &&
        !lower.includes('forwarded from @') &&
        !lower.includes('به وسیله @')
      );
    })
    .join('\n')
    .trim();

  // حذف لینک‌های اینستاگرام
  cleaned = cleaned.replace(/https?:\/\/(www\.)?instagram\.com\/[^\s]+/g, '').trim();
  cleaned = cleaned.replace(/https?:\/\/instagr\.am\/[^\s]+/g, '').trim();

  // حذف آیدی‌ها مگر کانال‌های مجاز
  cleaned = cleaned.replace(/@([a-zA-Z][a-zA-Z0-9_]{3,30})/g, (match) => {
    return [CHANNELS.sher.id, CHANNELS.ahlolbeyt.id, CHANNELS.sex.id].includes(match) ? match : '';
  });

  return cleaned.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}

// ———————————————————
// دریافت پیام و ارسال به کانال مقصد
// ———————————————————
bot.on('message', async (ctx) => {
  const fromId = ctx.from.id;

  if (fromId !== ADMIN_ID) {
    return ctx.reply('❌ فقط مدیر مجاز است.');
  }

  const text = ctx.message.text;
  if (['📢 کانال شعر خوب نوش', '🕌 کانال اهل البیت', '❤️ کانال عاشقانه های زناشویی'].includes(text)) {
    return;
  }

  try {
    const caption = ctx.message.caption || '';
    const text = ctx.message.text || '';

    const cleanedCaption = cleanText(caption);
    const cleanedTextOnly = cleanText(text);

    if (ctx.message.text) {
      const finalText = cleanedTextOnly + '\n\n' + TARGET_CHANNEL.signature;
      await ctx.telegram.sendMessage(TARGET_CHANNEL.id, finalText, {
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });
    } 
    else if (ctx.message.photo) {
      const photo = ctx.message.photo.pop();
      const finalCaption = (cleanedCaption + '\n\n' + TARGET_CHANNEL.signature).trim();
      await ctx.telegram.sendPhoto(TARGET_CHANNEL.id, photo.file_id, {
        caption: finalCaption,
        parse_mode: 'HTML'
      });
    } 
    else if (ctx.message.video) {
      const finalCaption = (cleanedCaption + '\n\n' + TARGET_CHANNEL.signature).trim();
      await ctx.telegram.sendVideo(TARGET_CHANNEL.id, ctx.message.video.file_id, {
        caption: finalCaption,
        parse_mode: 'HTML'
      });
    } 
    else if (ctx.message.document) {
      const finalCaption = (cleanedCaption + '\n\n' + TARGET_CHANNEL.signature).trim();
      await ctx.telegram.sendDocument(TARGET_CHANNEL.id, ctx.message.document.file_id, {
        caption: finalCaption,
        parse_mode: 'HTML'
      });
    } 
    else if (ctx.message.audio) {
      const finalCaption = (cleanedCaption + '\n\n' + TARGET_CHANNEL.signature).trim();
      await ctx.telegram.sendAudio(TARGET_CHANNEL.id, ctx.message.audio.file_id, {
        caption: finalCaption,
        parse_mode: 'HTML'
      });
    } 
    else if (ctx.message.animation) {
      const finalCaption = (cleanedCaption + '\n\n' + TARGET_CHANNEL.signature).trim();
      await ctx.telegram.sendAnimation(TARGET_CHANNEL.id, ctx.message.animation.file_id, {
        caption: finalCaption,
        parse_mode: 'HTML'
      });
    } 
    else if (ctx.message.voice) {
      const finalCaption = (cleanedCaption + '\n\n' + TARGET_CHANNEL.signature).trim();
      await ctx.telegram.sendVoice(TARGET_CHANNEL.id, ctx.message.voice.file_id, {
        caption: finalCaption,
        parse_mode: 'HTML'
      });
    } 
    else if (ctx.message.sticker) {
      await ctx.telegram.sendSticker(TARGET_CHANNEL.id, ctx.message.sticker.file_id);
      await ctx.telegram.sendMessage(TARGET_CHANNEL.id, TARGET_CHANNEL.signature, {
        parse_mode: 'HTML'
      });
    } 
    else {
      return ctx.reply('⚠️ نوع محتوا پشتیبانی نمی‌شود.');
    }

    // ارسال استیکر قلب قرمز برای کانال عاشقانه
    if (TARGET_CHANNEL.id === '@sexzanashuoei' && TARGET_CHANNEL.sticker) {
      await ctx.telegram.sendSticker(TARGET_CHANNEL.id, TARGET_CHANNEL.sticker);
    }

    await ctx.reply(`✅ پیام به کانال "${TARGET_CHANNEL.name}" ارسال شد.`);
  } catch (err) {
    console.error('Error:', err);
    await ctx.reply(`❌ خطا: ${err.description || 'ارسال نشد.'}`);
  }
});

// ———————————————————
// راه‌اندازی ربات
// ———————————————————
bot.launch().then(() => {
  console.log('🤖 ربات فعال شد.');
  console.log('🎯 کانال پیش‌فرض:', TARGET_CHANNEL.id);
});

process.on('SIGINT', () => bot.stop('SIGINT'));
process.on('SIGTERM', () => bot.stop('SIGTERM'));
