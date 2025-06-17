const { getColorForEvent } = require('../utils');

function handlePaymentEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `💵 Payment ${eventType}`;
    const fields = [
        { name: '💳 Payment #', value: safeGet(data, 'number'), inline: true },
        { name: '💰 Amount', value: `$${safeGet(data, 'amount')}`, inline: true },
        { name: '👤 Client', value: safeGet(data, 'client.name'), inline: true },
        { name: '🔗 Reference', value: safeGet(data, 'transaction_reference'), inline: true },
        { name: '🏦 Payment Type', value: safeGet(data, 'payment_type_id'), inline: true },
        { name: '⚡ Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

function determinePaymentEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

module.exports = { handlePaymentEvent, determinePaymentEvent }; 