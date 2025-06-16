const { getColorForEvent } = require('../utils');

const QUOTE_STATUS_MAP = {
    '1': 'Draft',
    '2': 'Sent',
    '3': 'Approved',
    '4': 'Converted',
    '5': 'Expired',
};

function handleQuoteEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `💬 Quote ${eventType}`;
    const statusId = safeGet(data, 'status_id');
    const statusName = QUOTE_STATUS_MAP[statusId] || statusId || 'Unknown';
    const fields = [
        { name: '📄 Quote #', value: safeGet(data, 'number'), inline: true },
        { name: '💰 Amount', value: `$${safeGet(data, 'amount')}`, inline: true },
        { name: '👤 Client', value: safeGet(data, 'client.name'), inline: true },
        { name: '📅 Valid Until', value: safeGet(data, 'valid_until'), inline: true },
        { name: '🔖 Status', value: statusName, inline: true },
        { name: '⚡ Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handleQuoteEvent }; 