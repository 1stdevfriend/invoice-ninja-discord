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
        { name: '📝 Notes', value: safeGet(data, 'public_notes'), inline: true }
    ];
    const userDisplay = getUserDisplay();
    if (userDisplay) {
        fields.push({ name: '⚡ Action', value: `${eventType} by: ${userDisplay}`, inline: true });
    }
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

function determineCreditEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.status_id === '3') return 'Applied';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

module.exports = { handleCreditEvent, determineCreditEvent }; 