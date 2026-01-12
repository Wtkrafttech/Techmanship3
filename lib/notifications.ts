
export const sendTelegramNotification = async (botToken: string, chatId: string, message: string) => {
  if (!botToken || !chatId) return { success: false, error: 'Telegram config missing' };

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.description || 'Telegram API Error');
    
    return { success: true };
  } catch (err: any) {
    console.error('Telegram Notification Failed:', err);
    return { success: false, error: err.message };
  }
};
