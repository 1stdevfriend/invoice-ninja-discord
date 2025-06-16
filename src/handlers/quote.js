const { getColorForEvent } = require('../utils');

function handleQuoteEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `💬 Quote ${eventType}`;
    const fields = [
        { name: 'Quote #', value: safeGet(data, 'number'), inline: true },
        { name: 'Amount', value: `$${safeGet(data, 'amount')}`, inline: true },
        { name: 'Client', value: safeGet(data, 'client.name'), inline: true },
        { name: 'Valid Until', value: safeGet(data, 'valid_until'), inline: true },
        { name: 'Status', value: safeGet(data, 'status_id'), inline: true },
        { name: 'Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handleQuoteEvent }; 