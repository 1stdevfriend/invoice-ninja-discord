const cron = require('node-cron');
const { sendYearlySummaryToDiscord, sendYearlyPaymentSummaryToDiscord } = require('./utils');
const { handleRecurringInvoiceCheck } = require('./handlers/recurring');

cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly summary...');
    await sendYearlySummaryToDiscord();
    await sendYearlyPaymentSummaryToDiscord();
}, {
    timezone: 'UTC'
});

cron.schedule('0 0 * * *', async () => {
    console.log('Running daily recurring invoice check...');
    await handleRecurringInvoiceCheck();
});

console.log('Cron jobs scheduled: yearly summary (monthly), yearly payment summary (monthly), recurring invoice check (daily).'); 
