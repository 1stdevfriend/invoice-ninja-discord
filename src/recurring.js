const axios = require('axios');
require('dotenv').config();

/**
 * Checks for recurring invoices where the next send/payment date is within a week,
 * and sends a Discord embed with details if any are found.
 */
async function checkAndNotifyRecurringInvoices() {
    const apiUrl = process.env.INVOICE_NINJA_URL;
    const token = process.env.INVOICE_NINJA_TOKEN;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!apiUrl || !token || !webhookUrl) {
        console.error('Missing INVOICE_NINJA_URL, INVOICE_NINJA_TOKEN, or DISCORD_WEBHOOK_URL');
        return;
    }
    // Get today's date and a week from now
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    const startDate = today.toISOString().slice(0, 10);
    const endDate = weekFromNow.toISOString().slice(0, 10);

    // Fetch recurring invoices with next_send_date in the next week
    const headers = { 'X-Api-Token': token };
    let recurring = [];
    try {
        const res = await axios.get(`${apiUrl}/api/v1/recurring_invoices?next_send_date=${startDate},${endDate}`, { headers });
        recurring = res.data.data || [];
    } catch (err) {
        console.error('Failed to fetch recurring invoices:', err.message);
        return;
    }
    if (recurring.length === 0) {
        // No upcoming recurring invoices
        return;
    }
    // Build embed fields
    const fields = recurring.map(inv => {
        const clientName = inv.client?.name || 'Unknown Client';
        const amount = inv.amount ? inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
        const currency = inv.currency?.code || inv.client?.currency?.code || 'INR';
        const symbol = inv.currency?.symbol || inv.client?.currency?.symbol || '₹';
        const nextSend = inv.next_send_date || 'N/A';
        const number = inv.number || inv.id;
        return {
            name: `🔁 Recurring Invoice #${number}`,
            value: `👤 Client: **${clientName}**\n💰 Amount: **${symbol}${amount} ${currency}**\n📅 Next Send: **${nextSend}**\n📝 Frequency: **${inv.frequency_id || 'N/A'}**`,
            inline: false
        };
    });
    const embed = {
        title: '🔔 Upcoming Recurring Invoices (Next 7 Days)',
        color: 0xffa500,
        fields,
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Forwarded from Invoice Ninja',
            icon_url: 'https://media.discordapp.net/attachments/540447710239784971/1384075879130595409/invoiceninja-svgrepo-com.png'
        }
    };
    await axios.post(webhookUrl, { embeds: [embed] });
}

/**
 * Checks for recurring invoices where the next send/payment date is within a week,
 * and sends a Discord embed with details if any are found.
 * This function is intended to be run daily via a cron job.
 */
async function checkAndNotifyRecurringInvoicesDaily() {
    const apiUrl = process.env.INVOICE_NINJA_URL;
    const token = process.env.INVOICE_NINJA_TOKEN;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!apiUrl || !token || !webhookUrl) {
        console.error('Missing INVOICE_NINJA_URL, INVOICE_NINJA_TOKEN, or DISCORD_WEBHOOK_URL');
        return;
    }
    // Get today's date and a week from now
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    const startDate = today.toISOString().slice(0, 10);
    const endDate = weekFromNow.toISOString().slice(0, 10);

    // Fetch recurring invoices with next_send_date in the next week
    const headers = { 'X-Api-Token': token };
    let recurring = [];
    try {
        const res = await axios.get(`${apiUrl}/api/v1/recurring_invoices?next_send_date=${startDate},${endDate}`, { headers });
        recurring = res.data.data || [];
    } catch (err) {
        console.error('Failed to fetch recurring invoices:', err.message);
        return;
    }
    if (recurring.length === 0) {
        // No upcoming recurring invoices
        return;
    }
    // Build embed fields
    const fields = recurring.map(inv => {
        const clientName = inv.client?.name || 'Unknown Client';
        const amount = inv.amount ? inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
        const currency = inv.currency?.code || inv.client?.currency?.code || 'INR';
        const symbol = inv.currency?.symbol || inv.client?.currency?.symbol || '₹';
        const nextSend = inv.next_send_date || 'N/A';
        const number = inv.number || inv.id;
        return {
            name: `🔁 Recurring Invoice #${number}`,
            value: `👤 Client: **${clientName}**\n💰 Amount: **${symbol}${amount} ${currency}**\n📅 Next Send: **${nextSend}**\n📝 Frequency: **${inv.frequency_id || 'N/A'}**`,
            inline: false
        };
    });
    const embed = {
        title: '🔔 Upcoming Recurring Invoices (Next 7 Days)',
        color: 0xffa500,
        fields,
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Forwarded from Invoice Ninja',
            icon_url: 'https://media.discordapp.net/attachments/540447710239784971/1384075879130595409/invoiceninja-svgrepo-com.png'
        }
    };
    await axios.post(webhookUrl, { embeds: [embed] });
}

module.exports = { checkAndNotifyRecurringInvoices, checkAndNotifyRecurringInvoicesDaily }; 