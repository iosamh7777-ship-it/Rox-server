/**
 * This script starts both the web server and the Discord bot
 * for deployment on Railway or other hosting platforms.
 */
require('dotenv').config();

console.log('Starting Rox Services...');

// 1. Start Web Server
console.log('🚀 Launching Web Server...');
require('./server.js');

// 2. Start Discord Bot (optional delay if needed)
setTimeout(() => {
    console.log('🤖 Launching Discord Bot...');
    require('./bot.js');
}, 5000);
