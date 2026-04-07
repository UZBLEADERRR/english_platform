import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN!);
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://english-platform.railway.app';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '';

// /start command
bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const startParam = ctx.match; // referral code
  
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

    // Track referral
    if (startParam) {
      const { data: refLink } = await supabase.from('referral_links').select('*').eq('code', startParam).single();
      if (refLink) {
        await supabase.from('referral_links').update({ registrations: (refLink.registrations || 0) + 1 }).eq('id', refLink.id);
      }
    }
  }

  const keyboard = new InlineKeyboard()
    .webApp('📚 Ilovani ochish', WEBAPP_URL)
    .row()
    .text('⭐ Premium olish', 'buy_premium')
    .text('💎 Ultra olish', 'buy_ultra');

  await ctx.reply(
    `🎓 *English Learning Platform*\n\nSalom, ${ctx.from?.first_name}! Ingliz tilini o'rganishni boshlaymizmi?\n\n📚 Grammatika, Reading, Writing, Listening, Speaking\n🎬 Filmlar va komikslar\n🤖 AI o'qituvchi\n📝 Grammar Checker\n\nPastdagi tugmani bosib ilovani oching!`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

// Premium/Ultra purchase flow
bot.callbackQuery('buy_premium', async (ctx) => {
  await handleBuyFlow(ctx, 'premium', '29,000');
});

bot.callbackQuery('buy_ultra', async (ctx) => {
  await handleBuyFlow(ctx, 'ultra', '49,000');
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
    `💰 *${plan.toUpperCase()} - ${price} so'm/oy*\n\nQuyidagi kartaga to'lovni amalga oshiring:\n\n${cardText}\n\n✅ To'lov qilganingizdan so'ng, *screenshot* yuboring shu chatga.\n\nYoki ilovadan to'lov qiling: ${WEBAPP_URL}/pricing`,
    { parse_mode: 'Markdown' }
  );
  
  // Set user state to waiting for screenshot
  await supabase.from('users').update({ referred_by: `pending_${plan}` }).eq('telegram_id', ctx.from?.id);
}

// Handle photo uploads (payment screenshots)
bot.on('message:photo', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
  if (!user) return;

  // Get the largest photo
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const file = await ctx.api.getFile(photo.file_id);
  const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

  // Determine plan from pending state or default to premium
  let plan = 'premium';
  if (user.referred_by?.startsWith('pending_')) {
    plan = user.referred_by.replace('pending_', '');
    await supabase.from('users').update({ referred_by: user.referral_code ? undefined : null }).eq('id', user.id);
  }

  // Save payment
  const { data: payment } = await supabase.from('payments').insert({
    user_id: user.id,
    plan,
    amount: plan === 'ultra' ? 49000 : 29000,
    screenshot_url: fileUrl,
    status: 'pending',
  }).select().single();

  await ctx.reply('✅ To\'lovingiz qabul qilindi va admin tekshirmoqda. Tez orada javob beramiz! ⏳');

  // Notify admin
  if (ADMIN_CHAT_ID) {
    const adminKeyboard = new InlineKeyboard()
      .text('✅ Tasdiqlash', `approve_${payment?.id}`)
      .text('❌ Rad etish', `reject_${payment?.id}`);

    try {
      // Forward the screenshot to admin
      await ctx.api.sendPhoto(ADMIN_CHAT_ID, photo.file_id, {
        caption: `💰 *Yangi to'lov*\n\n👤 ${ctx.from?.first_name} (@${ctx.from?.username})\n🆔 TG: ${telegramId}\n📦 Paket: *${plan.toUpperCase()}*\n💵 Summa: ${plan === 'ultra' ? '49,000' : '29,000'} so'm`,
        parse_mode: 'Markdown',
        reply_markup: adminKeyboard,
      });
    } catch (e) {
      console.error('Failed to notify admin:', e);
    }
  }
});

// Admin approve/reject callbacks
bot.callbackQuery(/^approve_(.+)$/, async (ctx) => {
  const paymentId = ctx.match![1];
  
  const { data: payment } = await supabase.from('payments').select('*').eq('id', paymentId).single();
  if (!payment) return ctx.answerCallbackQuery('To\'lov topilmadi');

  // Update payment
  await supabase.from('payments').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', paymentId);
  
  // Update user subscription
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  await supabase.from('users').update({ subscription: payment.plan, subscription_expires_at: expiresAt.toISOString() }).eq('id', payment.user_id);

  // Notify user
  const { data: user } = await supabase.from('users').select('telegram_id').eq('id', payment.user_id).single();
  if (user) {
    try {
      await ctx.api.sendMessage(user.telegram_id, `🎉 To'lovingiz tasdiqlandi!\n\n✅ Sizning *${payment.plan.toUpperCase()}* paketingiz faollashtirildi.\n📅 Amal qilish muddati: 1 oy\n\nIlovani oching va barcha premium kontentdan foydalaning! 🚀`, { parse_mode: 'Markdown' });
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

// /premium command
bot.command('premium', async (ctx) => {
  await handleBuyFlow(ctx, 'premium', '29,000');
});

bot.command('ultra', async (ctx) => {
  await handleBuyFlow(ctx, 'ultra', '49,000');
});

// /status command
bot.command('status', async (ctx) => {
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', ctx.from?.id).single();
  if (!user) return ctx.reply('Avval /start bosing');
  
  const sub = user.subscription === 'ultra' ? '💎 Ultra' : user.subscription === 'premium' ? '⭐ Premium' : '🆓 Free';
  await ctx.reply(`📊 *Sizning hisobingiz*\n\n${sub}\n🤖 AI xabarlar bugun: ${user.ai_messages_today}\n💰 Jami AI kredit: ${user.ai_credits_used}`, { parse_mode: 'Markdown' });
});

// Start bot
bot.start();
console.log('🤖 Bot started!');
