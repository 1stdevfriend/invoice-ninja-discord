const axios = require('axios');
require('dotenv').config();

function parseEventName(event) {
    if (!event) return 'default';
    return event.toLowerCase().replace(/\s+/g, '_');
}

function getColorForEvent(event) {
    const eventName = parseEventName(event);
    const colorMap = {
        create: 0x00ff00,      
        update: 0x0000ff,      
        delete: 0xff0000,      
        archive: 0x808080,     
        restore: 0xffa500,     
        default: 0x808080,     
        email_sent: 0x00ff00,  
        marked_as_sent: 0x00ff00, 
        approve: 0x00ff00,     
        expired: 0xff0000,     
        applied: 0x00ff00,     
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
    const endDate = new Date(year, now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const displayMonth = `01/${now.toLocaleString('en-US', { month: 'short' })}/${year}`;

    const headers = { 'X-Api-Token': token };
    const payload = {
        start_date: startDate,
        end_date: endDate,
        date_range: 'this_month'
    };

    const res = await axios.post(`${apiUrl}/api/v1/charts/totals_v2`, payload, { headers });
    const data = res.data;
    const summary = {};
    const currencyMap = data.currencies || {};
    for (const currencyId of Object.keys(currencyMap)) {
        const currencyData = data[currencyId] || {};
        const symbol = currencyData.invoices?.symbol || currencyData.expenses?.symbol || currencyData.outstanding?.symbol || '₹';
        const code = currencyData.invoices?.code || currencyData.expenses?.code || currencyData.outstanding?.code || 'INR';
        let invoiceCount = 0, invoiceAmount = 0;
        if (currencyData.invoices && currencyData.invoices.invoiced_amount) {
            invoiceAmount = parseFloat(currencyData.invoices.invoiced_amount) || 0;
            invoiceCount = currencyData.invoices.invoiced_count ? parseInt(currencyData.invoices.invoiced_count) : (invoiceAmount > 0 ? 1 : 0);
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
            if (s.invoiceCount === 0 && s.expenseAmount === 0 && s.outstandingCount === 0) continue;
            fields.push(
                {
                    name: `🟦 Invoices (${s.code})`,
                    value: `**${s.invoiceCount}**\n${s.symbol}${s.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    inline: true
                },
                {
                    name: `⬜ Expenses (${s.code})`,
                    value: `**${s.symbol}${s.expenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**`,
                    inline: true
                },
                {
                    name: `🟥 Outstanding (${s.code})`,
                    value: `**${s.outstandingCount}**\n${s.symbol}${s.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    inline: true
                }
            );
        }
        if (fields.length === 0) {
            return;
        }
        const embed = {
            title: `📊 Monthly Financial Summary: ${displayMonth}`,
            description: "Here's your monthly overview by currency. Stay on top of your finances! 💸",
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

async function sendYearlySummaryToDiscord(webhookUrl) {
    const url = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
    if (!url) {
        throw new Error('DISCORD_WEBHOOK_URL not set in .env or passed as argument');
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; 
    const fields = [];
    const allCurrencies = new Set();
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
            data = {};
        }
        const currencyMap = data.currencies || {};
        const monthData = {};
        if (Object.keys(currencyMap).length === 0) {
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
            fields.push({
                name: `${displayMonth} (${code})`,
                value: lines.join('\n') + '\n',
                inline: false
            });
        }
    }

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

async function sendYearlyPaymentSummaryToDiscord() {
    const apiUrl = process.env.INVOICE_NINJA_URL;
    const token = process.env.INVOICE_NINJA_TOKEN;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!apiUrl || !token || !webhookUrl) {
        console.error('Missing required environment variables');
        return false;
    }

    try {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10); 
        const endDate = now.toISOString().slice(0, 10);

        const headers = { 'X-Api-Token': token };
        const response = await axios.get(
            `${apiUrl}/api/v1/payments?date_range=${startDate},${endDate}`,
            { headers }
        );
        const payments = response.data.data || [];
        console.log('Fetched payments:', payments.length);

        const clientsRes = await axios.get(`${apiUrl}/api/v1/clients`, { headers });
        const clients = clientsRes.data.data || [];
        const clientMap = {};
        for (const client of clients) {
            clientMap[client.id] = {
                name: client.name || 'Unknown Client',
                email: (client.contacts && client.contacts[0]?.email) || 'No email'
            };
        }

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

        const sortedClients = Object.values(clientPayments)
            .sort((a, b) => b.total - a.total);
        console.log('Sorted clients:', sortedClients.length);

        if (sortedClients.length === 0) {
            console.log('No payments found for the current year');
            return false;
        }

        const fields = sortedClients.map(client => ({
            name: `👤 ${client.name}`,
            value: `📧 ${client.email}\n💰 Total Paid: **${client.symbol}${client.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${client.currency}**\n🔢 Number of Payments: **${client.count}**`,
            inline: false
        }));

        const embed = {
            title: `📊 Yearly Payment Summary (${now.getFullYear()})`,
            description: `Payment summary from January 1st to ${endDate}`,
            color: 0x00ff00, 
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
