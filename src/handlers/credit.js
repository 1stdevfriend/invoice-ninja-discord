const { getColorForEvent } = require('../utils');

function handleCreditEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `💳 Credit ${eventType}`;
    const fields = [
        { name: '💳 Credit #', value: safeGet(data, 'number'), inline: true },
        { name: '💰 Amount', value: `$${safeGet(data, 'amount')}`, inline: true },
        { name: '💸 Balance', value: `$${safeGet(data, 'balance')}`, inline: true },
        { name: '👤 Client', value: safeGet(data, 'client.name'), inline: true },
        { name: '📅 Date', value: safeGet(data, 'date'), inline: true },
        { name: '🔖 Status', value: safeGet(data, 'status_id'), inline: true },
        { name: '📝 Notes', value: safeGet(data, 'public_notes'), inline: true },
        { name: '⚡ Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handleCreditEvent }; 