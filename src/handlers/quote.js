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
        { name: '🔖 Status', value: statusName, inline: true }
    ];
    const userDisplay = getUserDisplay();
    if (userDisplay) {
        fields.push({ name: '⚡ Action', value: `${eventType} by: ${userDisplay}`, inline: true });
    }
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

function determineQuoteEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.status_id === '2') return 'Approve';
    if (data.status_id === '5') return 'Expired';
    if (data.remind) return 'Remind';
    if (data.invitations?.[0]?.message_id && data.invitations?.[0]?.sent_date) return 'Email Sent';
    if (data.invitations?.[0]?.sent_date) return 'Marked as Sent';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

module.exports = { handleQuoteEvent, determineQuoteEvent }; 