const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');

// Token from BotFather
const token = '7237691387:AAF6oiOfTYvgHoi40SxXNs30cyWuAIIHOAY';

// Initializing Bot
const bot = new TelegramBot(token, { polling: true });

// Handling /start Command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Send the initial greeting message
  await bot.sendMessage(chatId, 'Hello Senpai! Here are some popular anime recommendations you can try:');

  const recommendations = [
    'Naruto',
    'One Piece',
    'Attack on Titan',
    'My Hero Academia',
    'Demon Slayer',
    'Jujutsu Kaisen',
    'Tokyo Revengers',
    'Hunter x Hunter',
    'Fullmetal Alchemist: Brotherhood',
    'Death Note'
  ];

  for (const anime of recommendations) {
    const searchUrl = `https://www.gogoanime3.co/search.html?keyword=${encodeURIComponent(anime)}`;
    try {
      const searchResponse = await axios.get(searchUrl);
      const $ = cheerio.load(searchResponse.data);
      const animeLink = $('p.name a').attr('href');
      const imageUrl = $('.last_episodes .img img').first().attr('src');
      
      if (animeLink && imageUrl) {
        const animeUrl = `https://www.gogoanime3.co${animeLink}`;
        const inlineKeyboard = [{
          text: anime,
          url: animeUrl
        }];
        
        await bot.sendPhoto(chatId, imageUrl, {
          reply_markup: {
            inline_keyboard: [inlineKeyboard]
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching details for ${anime}:`, error);
    }
  }

  // Prompt user to send anime name
  bot.sendMessage(chatId, "Please send me the name of an anime you wish to see.");
});

// Function to fetch anime suggestions based on user input
const getAnimeSuggestions = async (query) => {
  const searchUrl = `https://www.gogoanime3.co/search.html?keyword=${encodeURIComponent(query)}`;
  console.log(`Fetching search results from: ${searchUrl}`);

  try {
    const searchResponse = await axios.get(searchUrl);
    const $ = cheerio.load(searchResponse.data);
    const suggestions = [];
    $('.last_episodes .img a').each((i, element) => {
      const title = $(element).attr('title');
      const link = `https://www.gogoanime3.co${$(element).attr('href')}`;
      const imageUrl = $(element).find('img').attr('src');
      suggestions.push({ title, link, imageUrl });
    });

    console.log('Suggestions fetched:', suggestions); // Debugging

    if (suggestions.length === 0) {
      return 'No suggestions found. Please try another query.';
    }

    return suggestions;
  } catch (error) {
    console.error('Error fetching anime suggestions:', error);
    return 'Error fetching suggestions. Please try again later.';
  }
};

// Handle Incoming Messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const animeTitle = msg.text;

  // Ignore messages starting with '/' to avoid processing commands like /start
  if (animeTitle.startsWith('/')) {
    return;
  }

  console.log(`Received anime title: ${animeTitle}`);

  // Fetch anime suggestions based on the input
  const suggestions = await getAnimeSuggestions(animeTitle);

  // If suggestions are found, create buttons for them
  if (Array.isArray(suggestions)) {
    suggestions.forEach(async (suggestion) => {
      console.log('Sending photo with URL:', suggestion.imageUrl); // Debugging
      const inlineKeyboard = [{
        text: suggestion.title,
        url: suggestion.link
      }];

      try {
        await bot.sendPhoto(chatId, suggestion.imageUrl, {
          reply_markup: {
            inline_keyboard: [inlineKeyboard]
          }
        });
      } catch (error) {
        console.error('Error sending photo:', error);
      }
    });
  } else {
    bot.sendMessage(chatId, suggestions); // Send the error message from getAnimeSuggestions
  }
});

console.log('Bot is running...');
