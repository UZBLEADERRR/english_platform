import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN!);
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://english-platform.railway.app';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '';

// ───── Helpers ─────

/** Generate a random 6-digit login code */
function generateLoginCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Fetch dynamic prices from pricing_config table */
async function getPrices(): Promise<{ premium: number; ultra: number }> {
  const { data } = await supabase.from('pricing_config').select('*');
  let premium = 29000, ultra = 49000;
  if (data) {
    const p = data.find((x: any) => x.id === 'premium');
    const u = data.find((x: any) => x.id === 'ultra');
    if (p) premium = p.price;
    if (u) ultra = u.price;
  }
  return { premium, ultra };
}

/** Build keyboard based on user subscription */
function buildMainKeyboard(subscription: string | null): InlineKeyboard {
  const kb = new InlineKeyboard()
    .webApp('📚 Ilovani ochish', WEBAPP_URL)
    .row()
    .text('🔑 Kirish kodi olish', 'get_login_code');

  if (!subscription || subscription === 'free') {
    kb.row()
      .text('⭐ Premium olish', 'buy_premium')
      .text('💎 Ultra olish', 'buy_ultra');
  } else if (subscription === 'premium') {
    kb.row()
      .text('💎 Ultra ga upgrade', 'buy_ultra');
  }
  // Ultra users don't see any buy buttons

  return kb;
}

// ───── /start command ─────
bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const startParam = ctx.match;
  
  // Handle movie code: /start movie_XXXXX
  if (startParam && startParam.startsWith('movie_')) {
    const movieCode = startParam.replace('movie_', '');
    const { data: movie } = await supabase
      .from('movies')
      .select('*')
      .eq('telegram_code', movieCode)
      .single();
    
    if (movie) {
      const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
      if (movie.is_locked && (!user || (user.subscription !== 'premium' && user.subscription !== 'ultra'))) {
        return ctx.reply('🔒 Bu kino faqat Premium/Ultra foydalanuvchilar uchun. Ilovadan Premium sotib oling!');
      }
      
      if (movie.telegram_file_id) {
        try {
          await ctx.replyWithVideo(movie.telegram_file_id, {
            caption: `🎬 *${movie.title}*\n\n${movie.description || ''}`,
            parse_mode: 'Markdown',
          });
          return;
        } catch (e) {
          console.error('Failed to send movie by file_id:', e);
        }
      }
      
      await ctx.reply(`🎬 *${movie.title}*\n\n${movie.description || ''}\n\n⚠️ Bu kino hali bot serveriga yuklanmagan. Admin yuklashi kerak.`, { parse_mode: 'Markdown' });
      return;
    } else {
      await ctx.reply('❌ Kino topilmadi. Kod xato bo\'lishi mumkin.');
      return;
    }
  }

  // Register or update user
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (!user) {
    const refCode = `ref_${telegramId}_${Date.now().toString(36)}`;
    const { data: newUser } = await supabase.from('users').insert({
      telegram_id: telegramId,
      username: ctx.from?.username,
      first_name: ctx.from?.first_name,
      last_name: ctx.from?.last_name,
      referral_code: refCode,
      referred_by: startParam || null,
    }).select().single();
    user = newUser;

    if (startParam) {
      const { data: refLink } = await supabase.from('referral_links').select('*').eq('code', startParam).single();
      if (refLink) {
        await supabase.from('referral_links').update({ registrations: (refLink.registrations || 0) + 1 }).eq('id', refLink.id);
      }
    }
  }

  // Onboarding steps
  if (!user.age || user.bot_state === 'WAITING_AGE') {
    await supabase.from('users').update({ bot_state: 'WAITING_AGE' }).eq('id', user.id);
    return ctx.reply('Iltimos, yoshingizni kiriting (faqat raqam, masalan: 20):');
  } else if (!user.gender || user.bot_state === 'WAITING_GENDER') {
    await supabase.from('users').update({ bot_state: 'WAITING_GENDER' }).eq('id', user.id);
    const keyboard = new InlineKeyboard().text('Erkak', 'gender_m').text('Ayol', 'gender_f');
    return ctx.reply('Iltimos, jinsingizni tanlang:', { reply_markup: keyboard });
  } else if (!user.address || user.bot_state === 'WAITING_ADDRESS') {
    await supabase.from('users').update({ bot_state: 'WAITING_ADDRESS' }).eq('id', user.id);
    return ctx.reply('Iltimos, manzilingizni kiriting (Masalan: Toshkent shahar):');
  }

  // ── Generate login code ──
  const code = generateLoginCode();
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 min

  await supabase.from('login_codes').upsert({
    user_id: user.id,
    telegram_id: telegramId,
    code,
    expires_at: expiresAt.toISOString(),
  }, { onConflict: 'user_id' });

  // ── Build keyboard based on subscription ──
  const keyboard = buildMainKeyboard(user.subscription);

  const subLabel = user.subscription === 'ultra' ? '💎 Ultra' : user.subscription === 'premium' ? '⭐ Premium' : '🆓 Free';
  let expiryText = '';
  if (user.subscription_expires_at && user.subscription !== 'free') {
    const exp = new Date(user.subscription_expires_at);
    expiryText = `\n📅 Muddat: ${exp.toLocaleDateString('uz-UZ')}`;
  }

  await ctx.reply(
    `🎓 *English Learning Platform*\n\n` +
    `Salom, ${ctx.from?.first_name}!\n\n` +
    `🆔 Sizning ID: \`${telegramId}\`\n` +
    `🔑 Kirish kodi: \`${code}\`\n` +
    `⏱ Kod 3 daqiqa amal qiladi\n\n` +
    `📦 Tarif: ${subLabel}${expiryText}\n\n` +
    `Ilovaga kirish uchun yuqoridagi ID va kodni kiriting yoki pastdagi tugmani bosing!`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

// ───── Login code button ─────
bot.callbackQuery('get_login_code', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
  if (!user) return ctx.answerCallbackQuery('Avval /start bosing');

  const code = generateLoginCode();
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

  await supabase.from('login_codes').upsert({
    user_id: user.id,
    telegram_id: telegramId,
    code,
    expires_at: expiresAt.toISOString(),
  }, { onConflict: 'user_id' });

  await ctx.answerCallbackQuery();
  await ctx.reply(
    `🔑 *Yangi kirish kodi*\n\n` +
    `🆔 ID: \`${telegramId}\`\n` +
    `🔐 Kod: \`${code}\`\n\n` +
    `⏱ Bu kod *3 daqiqa* amal qiladi.\n` +
    `Ilovaga kirishda ID va kodni kiriting.`,
    { parse_mode: 'Markdown' }
  );
});

// ───── Registration steps ─────
bot.on('message:text', async (ctx, next) => {
  const telegramId = ctx.from?.id;
  if (!telegramId || ctx.message.text.startsWith('/')) return next();
  
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
  if (!user || !user.bot_state) return next();

  if (user.bot_state === 'WAITING_AGE') {
    const age = parseInt(ctx.message.text);
    if (isNaN(age)) return ctx.reply('Iltimos, yoshingizni raqamda kiriting:');
    
    const { error } = await supabase.from('users').update({ 
      age, 
      bot_state: 'WAITING_GENDER' 
    }).eq('id', user.id);
    
    if (error) {
      console.error('[Bot] Supabase update age error:', error);
      return ctx.reply('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    }

    const keyboard = new InlineKeyboard().text('Erkak', 'gender_m').text('Ayol', 'gender_f');
    return ctx.reply('Iltimos, jinsingizni tanlang:', { reply_markup: keyboard });
  }

  if (user.bot_state === 'WAITING_ADDRESS') {
    await supabase.from('users').update({ address: ctx.message.text, bot_state: null }).eq('id', user.id);
    
    const keyboard = buildMainKeyboard(user.subscription);

    return ctx.reply(
      `🎓 *Rahmat!* Ma'lumotlaringiz saqlandi.\n\nIngliz tilini o'rganishni boshlaymizmi? Pastdagi tugmani bosib ilovani oching!`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }
  
  return next();
});

bot.callbackQuery(/^gender_(m|f)$/, async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  const gender = ctx.match![1] === 'm' ? 'Erkak' : 'Ayol';
  await supabase.from('users').update({ gender, bot_state: 'WAITING_ADDRESS' }).eq('telegram_id', telegramId);
  await ctx.answerCallbackQuery('Jins saqlandi');
  await ctx.reply('Iltimos, manzilingizni kiriting (Masalan: Toshkent shahar):');
});

// ───── Purchase flow with dynamic pricing ─────
bot.callbackQuery('buy_premium', async (ctx) => {
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', ctx.from?.id).single();
  if (user?.subscription === 'ultra') {
    return ctx.answerCallbackQuery('Sizda allaqachon Ultra tarif mavjud!');
  }
  if (user?.subscription === 'premium') {
    return ctx.answerCallbackQuery('Sizda allaqachon Premium tarif mavjud!');
  }
  const prices = await getPrices();
  await handleBuyFlow(ctx, 'premium', prices.premium.toLocaleString());
});

bot.callbackQuery('buy_ultra', async (ctx) => {
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', ctx.from?.id).single();
  if (user?.subscription === 'ultra') {
    return ctx.answerCallbackQuery('Sizda allaqachon Ultra tarif mavjud!');
  }
  const prices = await getPrices();
  await handleBuyFlow(ctx, 'ultra', prices.ultra.toLocaleString());
});

async function handleBuyFlow(ctx: any, plan: string, price: string) {
  const { data: cards } = await supabase.from('payment_cards').select('*').eq('is_active', true);
  
  let cardText = '';
  if (cards && cards.length > 0) {
    cardText = cards.map(c => `💳 *${c.card_number}*\n👤 ${c.card_holder}\n🏦 ${c.bank_name}`).join('\n\n');
  } else {
    cardText = '⚠️ To\'lov kartalari hali sozlanmagan';
  }

  await ctx.answerCallbackQuery();
  await ctx.reply(
    `💰 *${plan.toUpperCase()} - ${price} so'm/oy*\n\nQuyidagi kartaga to'lovni amalga oshiring:\n\n${cardText}\n\n✅ To'lov qilganingizdan so'ng, *screenshot* yuboring shu chatga.\n\nYoki ilovadan to'lov qiling: t.me/Teacher_Tuxum_Bot/User`,
    { parse_mode: 'Markdown' }
  );
  
  await supabase.from('users').update({ referred_by: `pending_${plan}` }).eq('telegram_id', ctx.from?.id);
}

// ───── Photo uploads (payment screenshots) ─────
bot.on('message:photo', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
  if (!user) return;

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const file = await ctx.api.getFile(photo.file_id);
  const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

  let plan = 'premium';
  if (user.referred_by?.startsWith('pending_')) {
    plan = user.referred_by.replace('pending_', '');
    await supabase.from('users').update({ referred_by: user.referral_code ? undefined : null }).eq('id', user.id);
  }

  const prices = await getPrices();
  const amount = plan === 'ultra' ? prices.ultra : prices.premium;

  const { data: payment } = await supabase.from('payments').insert({
    user_id: user.id,
    plan,
    amount,
    screenshot_url: fileUrl,
    status: 'pending',
  }).select().single();

  await ctx.reply('✅ To\'lovingiz qabul qilindi va admin tekshirmoqda. Tez orada javob beramiz! ⏳');

  if (ADMIN_CHAT_ID) {
    const adminKeyboard = new InlineKeyboard()
      .text('✅ Tasdiqlash', `approve_${payment?.id}`)
      .text('❌ Rad etish', `reject_${payment?.id}`);

    try {
      await ctx.api.sendPhoto(ADMIN_CHAT_ID, photo.file_id, {
        caption: `💰 *Yangi to'lov*\n\n👤 ${ctx.from?.first_name} (@${ctx.from?.username})\n🆔 TG: ${telegramId}\n📦 Paket: *${plan.toUpperCase()}*\n💵 Summa: ${amount.toLocaleString()} so'm`,
        parse_mode: 'Markdown',
        reply_markup: adminKeyboard,
      });
    } catch (e) {
      console.error('Failed to notify admin:', e);
    }
  }
});

// ───── Admin approve/reject ─────
bot.callbackQuery(/^approve_(.+)$/, async (ctx) => {
  const paymentId = ctx.match![1];
  
  const { data: payment } = await supabase.from('payments').select('*').eq('id', paymentId).single();
  if (!payment) return ctx.answerCallbackQuery('To\'lov topilmadi');

  await supabase.from('payments').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', paymentId);
  
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  await supabase.from('users').update({ 
    subscription: payment.plan, 
    subscription_expires_at: expiresAt.toISOString() 
  }).eq('id', payment.user_id);

  const { data: user } = await supabase.from('users').select('telegram_id').eq('id', payment.user_id).single();
  if (user) {
    try {
      const keyboard = buildMainKeyboard(payment.plan);
      await ctx.api.sendMessage(user.telegram_id, 
        `🎉 To'lovingiz tasdiqlandi!\n\n✅ Sizning *${payment.plan.toUpperCase()}* paketingiz faollashtirildi.\n📅 Amal qilish muddati: 1 oy\n\nIlovani oching va barcha premium kontentdan foydalaning! 🚀`, 
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    } catch {}
  }

  await ctx.answerCallbackQuery('✅ Tasdiqlandi');
  const oldCaption = (ctx.callbackQuery?.message as any)?.caption || "To'lov so'rovi";
  await ctx.editMessageCaption({ caption: oldCaption + '\n\n✅ TASDIQLANGAN', parse_mode: 'Markdown' });
});

bot.callbackQuery(/^reject_(.+)$/, async (ctx) => {
  const paymentId = ctx.match![1];
  await supabase.from('payments').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', paymentId);

  const { data: payment } = await supabase.from('payments').select('*, users(telegram_id)').eq('id', paymentId).single();
  if (payment?.users?.telegram_id) {
    try {
      await ctx.api.sendMessage(payment.users.telegram_id, '❌ To\'lovingiz rad etildi. Iltimos to\'g\'ri screenshot yuboring yoki admin bilan bog\'laning.');
    } catch {}
  }

  await ctx.answerCallbackQuery('❌ Rad etildi');
  const oldCaption = (ctx.callbackQuery?.message as any)?.caption || "To'lov so'rovi";
  await ctx.editMessageCaption({ caption: oldCaption + '\n\n❌ RAD ETILGAN', parse_mode: 'Markdown' });
});

// ───── Admin: Upload movie video with #kino_CODE ─────
bot.on('message:video', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Check if admin
  if (telegramId.toString() !== ADMIN_CHAT_ID) {
    return; // Ignore non-admin video uploads
  }

  const caption = ctx.message.caption || '';
  const match = caption.match(/#kino_(\S+)/);
  
  if (match) {
    const movieCode = match[1];
    const fileId = ctx.message.video.file_id;
    
    const { data: movie, error } = await supabase
      .from('movies')
      .update({ telegram_file_id: fileId })
      .eq('telegram_code', movieCode)
      .select()
      .single();
    
    if (movie) {
      await ctx.reply(`✅ Kino saqlandi!\n\n🎬 *${movie.title}*\n📝 Kod: \`${movieCode}\`\n\nEndi userlar "Telegramda ko'rish" tugmasini bosganida bu kino ularga jo'natiladi.`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(`❌ "${movieCode}" kodli kino topilmadi bazada.\n\nAvval admin panelda kinoni qo'shing va telegram kodi sifatida \`${movieCode}\` kiriting.`, { parse_mode: 'Markdown' });
    }
  } else {
    // Admin sent video without #kino_ caption
    await ctx.reply('ℹ️ Kinoni saqlash uchun video tagiga izoh qilib `#kino_KODINGIZ` yozing.\n\nMasalan: `#kino_venom3`', { parse_mode: 'Markdown' });
  }
});

// ───── /premium, /ultra, /status ─────
bot.command('premium', async (ctx) => {
  const prices = await getPrices();
  await handleBuyFlow(ctx, 'premium', prices.premium.toLocaleString());
});

bot.command('ultra', async (ctx) => {
  const prices = await getPrices();
  await handleBuyFlow(ctx, 'ultra', prices.ultra.toLocaleString());
});

bot.command('status', async (ctx) => {
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', ctx.from?.id).single();
  if (!user) return ctx.reply('Avval /start bosing');
  
  const sub = user.subscription === 'ultra' ? '💎 Ultra' : user.subscription === 'premium' ? '⭐ Premium' : '🆓 Free';
  let expiryText = '';
  if (user.subscription_expires_at && user.subscription !== 'free') {
    const exp = new Date(user.subscription_expires_at);
    expiryText = `\n📅 Tugash sanasi: ${exp.toLocaleDateString('uz-UZ')}`;
  }
  await ctx.reply(`📊 *Sizning hisobingiz*\n\n${sub}${expiryText}\n🤖 AI xabarlar bugun: ${user.ai_messages_today}\n💰 Jami AI kredit: ${user.ai_credits_used}`, { parse_mode: 'Markdown' });
});

// ───── Subscription expiry reminder (runs every 6 hours) ─────
async function checkExpiringSubscriptions() {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find users whose subscription expires in exactly 3 days (± 1 day window)
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    const { data: expiringUsers } = await supabase
      .from('users')
      .select('*')
      .in('subscription', ['premium', 'ultra'])
      .gte('subscription_expires_at', threeDaysStart.toISOString())
      .lte('subscription_expires_at', threeDaysEnd.toISOString());

    if (expiringUsers) {
      for (const user of expiringUsers) {
        // Check if we already sent a reminder today
        const lastReminder = user.last_expiry_reminder ? new Date(user.last_expiry_reminder) : null;
        if (lastReminder && lastReminder >= today) continue; // Already reminded today

        try {
          const sub = user.subscription === 'ultra' ? '💎 Ultra' : '⭐ Premium';
          const prices = await getPrices();
          const price = user.subscription === 'ultra' ? prices.ultra : prices.premium;
          
          await bot.api.sendMessage(user.telegram_id,
            `⏰ *Eslatma!*\n\n` +
            `Sizning ${sub} tarifingiz *3 kun*dan keyin tugaydi.\n\n` +
            `💰 Yangilash narxi: ${price.toLocaleString()} so'm/oy\n\n` +
            `Tarifni uzaytirish uchun to'lov qiling va screenshotni shu chatga yuboring!`,
            { parse_mode: 'Markdown' }
          );

          await supabase.from('users').update({ 
            last_expiry_reminder: new Date().toISOString() 
          }).eq('id', user.id);
        } catch (e) {
          console.error('Failed to send reminder to', user.telegram_id, e);
        }
      }
    }

    // Also expire overdue subscriptions
    const { data: expiredUsers } = await supabase
      .from('users')
      .select('*')
      .in('subscription', ['premium', 'ultra'])
      .lt('subscription_expires_at', today.toISOString());

    if (expiredUsers) {
      for (const user of expiredUsers) {
        await supabase.from('users').update({ subscription: 'free' }).eq('id', user.id);
        try {
          await bot.api.sendMessage(user.telegram_id,
            `⚠️ Sizning tarifingiz tugadi.\n\nYangilash uchun /premium yoki /ultra buyruqlarini yuboring.`
          );
        } catch {}
      }
    }
  } catch (e) {
    console.error('Expiry check error:', e);
  }
}

// Run expiry check every 6 hours
setInterval(checkExpiringSubscriptions, 6 * 60 * 60 * 1000);
// Also run once on startup after 10 seconds
setTimeout(checkExpiringSubscriptions, 10000);

// ───── Start bot ─────
bot.start();
console.log('🤖 Bot started!');
