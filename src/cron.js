const cron = require('node-cron');
const { sendYearlySummaryToDiscord, sendYearlyPaymentSummaryToDiscord } = require('./utils');
const { checkAndNotifyRecurringInvoices, checkAndNotifyRecurringInvoicesDaily } = require('./recurring');

// Schedule the yearly summary to run at midnight on the first day of each month
cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly summary...');
    await sendYearlySummaryToDiscord();
    await sendYearlyPaymentSummaryToDiscord();
}, {
    timezone: 'UTC'
});

// Schedule the daily recurring invoice check to run at midnight every day
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily recurring invoice check...');
    await checkAndNotifyRecurringInvoicesDaily();
});

console.log('Cron jobs scheduled: yearly summary (monthly), yearly payment summary (monthly), recurring invoice check (daily).'); 