const cron = require('node-cron');
const { sendYearlySummaryToDiscord } = require('./utils');

// Schedule the cron job to run at midnight on the first day of each month
cron.schedule('0 0 1 * *', () => {
    sendYearlySummaryToDiscord().catch(console.error);
}, {
    scheduled: true,
    timezone: 'UTC'
});

console.log('Cron job scheduled to send yearly summary on the first day of each month.'); 