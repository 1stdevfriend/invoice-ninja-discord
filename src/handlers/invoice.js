const { getColorForEvent } = require('../utils');

const INVOICE_STATUS_MAP = {
    '1': 'Draft',
    '2': 'Sent',
    '3': 'Paid',
    '4': 'Partial',
    '5': 'Cancelled',
    '6': 'Reversed',
    '7': 'Viewed',
    '8': 'Approved',
    '9': 'Expired',
};

function handleInvoiceEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `📄 Invoice ${eventType}`;
    const statusId = safeGet(data, 'status_id');
    const statusName = INVOICE_STATUS_MAP[statusId] || statusId || 'Unknown';
    const fields = [
        { name: '🧾 Invoice #', value: safeGet(data, 'number'), inline: true },
        { name: '💰 Amount', value: `$${safeGet(data, 'amount')}`, inline: true },
        { name: '💸 Balance', value: `$${safeGet(data, 'balance')}`, inline: true },
        { name: '👤 Client', value: safeGet(data, 'client.name'), inline: true },
        { name: '📅 Due Date', value: safeGet(data, 'due_date'), inline: true },
        { name: '🔖 Status', value: statusName, inline: true },
        { name: '⚡ Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handleInvoiceEvent }; 