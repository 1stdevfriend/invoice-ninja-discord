const cron = require('node-cron');
const { sendYearlySummaryToDiscord } = require('./utils');
const { checkAndNotifyRecurringInvoices, checkAndNotifyRecurringInvoicesDaily } = require('./recurring');

// Schedule the cron job to run at midnight on the first day of each month
cron.schedule('0 0 1 * *', () => {
    sendYearlySummaryToDiscord().catch(console.error);
}, {
    scheduled: true,
    timezone: 'UTC'
});

// New cron job: check for recurring invoices with next payment date within a week, daily at 1am UTC
cron.schedule('0 1 * * *', () => {
    checkAndNotifyRecurringInvoices().catch(console.error);
}, {
    scheduled: true,
    timezone: 'UTC'
});

// Schedule the daily recurring invoice check to run at midnight every day
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily recurring invoice check...');
    await checkAndNotifyRecurringInvoicesDaily();
});

console.log('Cron jobs scheduled: yearly summary (monthly), recurring invoice check (daily).'); 