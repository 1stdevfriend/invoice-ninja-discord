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

/**
 * Fetches monthly summaries for all months of the current year up to the current month,
 * and sends a combined yearly embed to Discord.
 * @param {string} [webhookUrl] - Optional Discord webhook URL. Defaults to process.env.DISCORD_WEBHOOK_URL.
 * @returns {Promise<boolean>} - Returns true if an embed is sent, false if no data is sent.
 */
async function sendYearlySummaryToDiscord(webhookUrl) {
    const url = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
    if (!url) {
        throw new Error('DISCORD_WEBHOOK_URL not set in .env or passed as argument');
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-based month
    const fields = [];
    // We'll keep track of all currencies seen so far
    const allCurrencies = new Set();
    // First pass: collect all currencies used in the year
    const monthCurrencyData = [];
    for (let month = 1; month <= currentMonth; month++) {
        const startDate = `${currentYear}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(currentYear, month, 0).toISOString().slice(0, 10);
        const displayMonth = `01/${new Date(currentYear, month - 1, 1).toLocaleString('en-US', { month: 'short' })}/${currentYear}`;
        const payload = {
            start_date: startDate,
            end_date: endDate,
            date_range: 'custom'
        };
        const headers = { 'X-Api-Token': process.env.INVOICE_NINJA_TOKEN };
        let data = {};
        try {
            const res = await axios.post(`${process.env.INVOICE_NINJA_URL}/api/v1/charts/totals_v2`, payload, { headers });
            data = res.data;
        } catch (e) {
            // If API fails, treat as no data
            data = {};
        }
        const currencyMap = data.currencies || {};
        const monthData = {};
        if (Object.keys(currencyMap).length === 0) {
            // No currencies, use INR as fallback
            monthData['INR'] = {
                symbol: '₹',
                code: 'INR',
                invoiceCount: 0,
                invoiceAmount: 0,
                paymentCount: 0,
                paymentAmount: 0,
                expenseAmount: 0,
                outstandingAmount: 0,
                outstandingCount: 0
            };
            allCurrencies.add('INR');
        } else {
            for (const currencyId of Object.keys(currencyMap)) {
                const currencyData = data[currencyId] || {};
                const symbol = currencyData.invoices?.symbol || currencyData.expenses?.symbol || currencyData.outstanding?.symbol || '₹';
                const code = currencyData.invoices?.code || currencyData.expenses?.code || currencyData.outstanding?.code || 'INR';
                let invoiceCount = 0, invoiceAmount = 0;
                if (currencyData.invoices && currencyData.invoices.invoiced_amount) {
                    invoiceAmount = parseFloat(currencyData.invoices.invoiced_amount) || 0;
                    invoiceCount = currencyData.invoices.invoiced_count ? parseInt(currencyData.invoices.invoiced_count) : (invoiceAmount > 0 ? 1 : 0);
                }
                let paymentCount = 0, paymentAmount = 0;
                if (currencyData.payments && currencyData.payments.amount) {
                    paymentAmount = parseFloat(currencyData.payments.amount) || 0;
                    paymentCount = currencyData.payments.count ? parseInt(currencyData.payments.count) : (paymentAmount > 0 ? 1 : 0);
                }
                let expenseAmount = 0;
                if (currencyData.expenses && currencyData.expenses.amount) {
                    expenseAmount = parseFloat(currencyData.expenses.amount) || 0;
                }
                let outstandingAmount = 0, outstandingCount = 0;
                if (currencyData.outstanding && currencyData.outstanding.amount) {
                    outstandingAmount = parseFloat(currencyData.outstanding.amount) || 0;
                    outstandingCount = currencyData.outstanding.outstanding_count ? parseInt(currencyData.outstanding.outstanding_count) : (outstandingAmount > 0 ? 1 : 0);
                }
                monthData[code] = {
                    symbol,
                    code,
                    invoiceCount,
                    invoiceAmount,
                    paymentCount,
                    paymentAmount,
                    expenseAmount,
                    outstandingAmount,
                    outstandingCount
                };
                allCurrencies.add(code);
            }
        }
        monthCurrencyData.push({ displayMonth, monthData });
    }
    // Second pass: for each month, for each currency ever seen, show all fields (0 if missing)
    for (const { displayMonth, monthData } of monthCurrencyData) {
        for (const code of allCurrencies) {
            const s = monthData[code] || {
                symbol: code === 'INR' ? '₹' : '',
                code,
                invoiceCount: 0,
                invoiceAmount: 0,
                paymentCount: 0,
                paymentAmount: 0,
                expenseAmount: 0,
                outstandingAmount: 0,
                outstandingCount: 0
            };
            const lines = [
                `🟦 Invoices: ${s.invoiceCount} (${s.symbol}${s.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
                `🟩 Payments: ${s.paymentCount} (${s.symbol}${s.paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
                `⬜ Expenses: ${s.symbol}${s.expenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `🟥 Outstanding: ${s.outstandingCount} (${s.symbol}${s.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
            ];
            // Add a blank line after each month's summary for this currency
            fields.push({
                name: `${displayMonth} (${code})`,
                value: lines.join('\n') + '\n',
                inline: false
            });
        }
    }
    // Remove duplicate month/currency pairs (if any)
    const uniqueFields = [];
    const seen = new Set();
    for (const field of fields) {
        const key = field.name;
        if (!seen.has(key)) {
            uniqueFields.push(field);
            seen.add(key);
        }
    }
    if (uniqueFields.length === 0) {
        // No summary data to send
        return false;
    }
    const embed = {
        title: '📊 Yearly Financial Summary',
        color: 0x00bfff,
        fields: uniqueFields,
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Forwarded from Invoice Ninja',
            icon_url: 'https://media.discordapp.net/attachments/540447710239784971/1384075879130595409/invoiceninja-svgrepo-com.png'
        }
    };
    await axios.post(url, { embeds: [embed] });
    return true;
}

/**
 * Generates and sends a yearly payment summary by client to Discord
 * Shows total payments made by each client from January 1st till current date
 */
async function sendYearlyPaymentSummaryToDiscord() {
    const apiUrl = process.env.INVOICE_NINJA_URL;
    const token = process.env.INVOICE_NINJA_TOKEN;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!apiUrl || !token || !webhookUrl) {
        console.error('Missing required environment variables');
        return false;
    }

    try {
        // Get current year's start date and current date
        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10); // January 1st
        const endDate = now.toISOString().slice(0, 10);

        // Fetch all payments for the current year
        const headers = { 'X-Api-Token': token };
        const response = await axios.get(
            `${apiUrl}/api/v1/payments?date_range=${startDate},${endDate}`,
            { headers }
        );
        const payments = response.data.data || [];
        console.log('Fetched payments:', payments.length);

        // Fetch all clients and build a map of client_id -> {name, email}
        const clientsRes = await axios.get(`${apiUrl}/api/v1/clients`, { headers });
        const clients = clientsRes.data.data || [];
        const clientMap = {};
        for (const client of clients) {
            clientMap[client.id] = {
                name: client.name || 'Unknown Client',
                email: (client.contacts && client.contacts[0]?.email) || 'No email'
            };
        }

        // Group payments by client
        const clientPayments = payments.reduce((acc, payment) => {
            const clientId = payment.client_id;
            if (!acc[clientId]) {
                acc[clientId] = {
                    name: clientMap[clientId]?.name || 'Unknown Client',
                    email: clientMap[clientId]?.email || 'No email',
                    total: 0,
                    count: 0,
                    currency: payment.currency?.code || 'INR',
                    symbol: payment.currency?.symbol || '₹'
                };
            }
            acc[clientId].total += parseFloat(payment.amount) || 0;
            acc[clientId].count += 1;
            return acc;
        }, {});

        // Convert to array and sort by total amount (descending)
        const sortedClients = Object.values(clientPayments)
            .sort((a, b) => b.total - a.total);
        console.log('Sorted clients:', sortedClients.length);

        if (sortedClients.length === 0) {
            console.log('No payments found for the current year');
            return false;
        }

        // Create Discord embed fields
        const fields = sortedClients.map(client => ({
            name: `👤 ${client.name}`,
            value: `📧 ${client.email}\n💰 Total Paid: **${client.symbol}${client.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${client.currency}**\n🔢 Number of Payments: **${client.count}**`,
            inline: false
        }));

        // Create and send Discord embed
        const embed = {
            title: `📊 Yearly Payment Summary (${now.getFullYear()})`,
            description: `Payment summary from January 1st to ${endDate}`,
            color: 0x00ff00, // Green color
            fields,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Forwarded from Invoice Ninja',
                icon_url: 'https://media.discordapp.net/attachments/540447710239784971/1384075879130595409/invoiceninja-svgrepo-com.png'
            }
        };

        console.log('Sending embed with fields:', fields.length);
        await axios.post(webhookUrl, { embeds: [embed] });
        return true;
    } catch (error) {
        console.error('Failed to send yearly payment summary:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        return false;
    }
}

module.exports = { getColorForEvent, parseEventName, fetchAndSummarizeMonthlyStats, sendMonthlySummaryToDiscord, sendYearlySummaryToDiscord, sendYearlyPaymentSummaryToDiscord }; 