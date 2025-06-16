const axios = require('axios');
require('dotenv').config();

// Helper function to parse event name for color mapping
function parseEventName(event) {
    if (!event) return 'default';
    return event.toLowerCase().replace(/\s+/g, '_');
}

// Helper function to get color for event type
function getColorForEvent(event) {
    const eventName = parseEventName(event);
    const colorMap = {
        // Common events
        create: 0x00ff00,      // Green
        update: 0x0000ff,      // Blue
        delete: 0xff0000,      // Red
        archive: 0x808080,     // Gray
        restore: 0xffa500,     // Orange
        default: 0x808080,     // Gray

        // Invoice/Quote/PO specific events
        email_sent: 0x00ff00,  // Green
        marked_as_sent: 0x00ff00, // Green
        approve: 0x00ff00,     // Green
        expired: 0xff0000,     // Red

        // Credit specific events
        applied: 0x00ff00,     // Green
    };
    return colorMap[eventName] || colorMap.default;
}

async function fetchAndSummarizeMonthlyStats() {
    const apiUrl = "http://localhost:80"
    const token = "x7A5Q3fIhpE2vc4rviu3sZqFan19vYe4E0d5uboAM7fSWFguxO8bgDz5XmeNh5ad";
    if (!apiUrl || !token) throw new Error('INVOICE_NINJA_URL or INVOICE_NINJA_TOKEN not set');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    // Get last day of month
    const endDate = new Date(year, now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const displayMonth = `01/${now.toLocaleString('en-US', { month: 'short' })}/${year}`;

    const headers = { 'X-Api-Token': token };
    const payload = {
        start_date: startDate,
        end_date: endDate,
        date_range: 'this_month'
    };

    // Fetch summary from charts/totals_v2
    const res = await axios.post(`${apiUrl}/api/v1/charts/totals_v2`, payload, { headers });
    const data = res.data;
    const summary = {};
    // currencies: {"21":"THB","1":"USD"}
    const currencyMap = data.currencies || {};
    // For each currency in the response
    for (const currencyId of Object.keys(currencyMap)) {
        const currencyData = data[currencyId] || {};
        // Prefer symbol/code from invoices, then expenses, then outstanding, then fallback
        const symbol = currencyData.invoices?.symbol || currencyData.expenses?.symbol || currencyData.outstanding?.symbol || '₹';
        const code = currencyData.invoices?.code || currencyData.expenses?.code || currencyData.outstanding?.code || 'INR';
        // Invoices
        let invoiceCount = 0, invoiceAmount = 0;
        if (currencyData.invoices && currencyData.invoices.invoiced_amount) {
            invoiceAmount = parseFloat(currencyData.invoices.invoiced_amount) || 0;
            invoiceCount = currencyData.invoices.invoiced_count ? parseInt(currencyData.invoices.invoiced_count) : (invoiceAmount > 0 ? 1 : 0);
        }
        // Expenses
        let expenseAmount = 0;
        if (currencyData.expenses && currencyData.expenses.amount) {
            expenseAmount = parseFloat(currencyData.expenses.amount) || 0;
        }
        // Outstanding
        let outstandingAmount = 0, outstandingCount = 0;
        if (currencyData.outstanding && currencyData.outstanding.amount) {
            outstandingAmount = parseFloat(currencyData.outstanding.amount) || 0;
            outstandingCount = currencyData.outstanding.outstanding_count ? parseInt(currencyData.outstanding.outstanding_count) : (outstandingAmount > 0 ? 1 : 0);
        }
        summary[currencyId] = {
            symbol,
            code,
            invoiceCount,
            invoiceAmount,
            expenseAmount,
            outstandingAmount,
            outstandingCount
        };
    }
    return {
        summary,
        displayMonth
    };
}

/**
 * Sends the monthly summary as a Discord embed to the specified webhook URL.
 * @param {string} [webhookUrl] - Optional Discord webhook URL. Defaults to process.env.DISCORD_WEBHOOK_URL.
 * @returns {Promise<void>}
 */
async function sendMonthlySummaryToDiscord(webhookUrl) {
    const url = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
    if (!url) {
        throw new Error('DISCORD_WEBHOOK_URL not set in .env or passed as argument');
    }
    try {
        const { fetchAndSummarizeMonthlyStats } = module.exports;
        const stats = await fetchAndSummarizeMonthlyStats();
        const { summary, displayMonth } = stats;
        const fields = [];
        for (const currencyId of Object.keys(summary)) {
            const s = summary[currencyId];
            const lines = [];
            if (s.invoiceCount > 0) {
                lines.push(`🟦 Invoices: ${s.invoiceCount} (${s.symbol}${s.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);
            }
            if (s.expenseAmount > 0) {
                lines.push(`⬜ Expenses: ${s.symbol}${s.expenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            }
            if (s.outstandingCount > 0) {
                lines.push(`🟥 Outstanding: ${s.outstandingCount} (${s.symbol}${s.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);
            }
            if (lines.length > 0) {
                fields.push({
                    name: `${displayMonth} (${s.code})`,
                    value: lines.join('\n'),
                    inline: false
                });
            }
        }
        if (fields.length === 0) {
            // No summary data to send
            return;
        }
        const embed = {
            title: '📊 Monthly Financial Summary',
            color: 0x00bfff,
            fields,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Forwarded from Invoice Ninja',
                icon_url: 'https://media.discordapp.net/attachments/540447710239784971/1384075879130595409/invoiceninja-svgrepo-com.png'
            }
        };
        await axios.post(url, { embeds: [embed] });
    } catch (err) {
        throw new Error('Failed to send monthly summary to Discord: ' + err.message);
    }
}

module.exports = { getColorForEvent, parseEventName, fetchAndSummarizeMonthlyStats, sendMonthlySummaryToDiscord }; 