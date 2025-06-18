const { getColorForEvent } = require('../utils');

const PO_STATUS_MAP = {
    '1': 'Draft',
    '2': 'Sent',
    '3': 'Accepted',
    '4': 'Cancelled',
    '5': 'Expired',
};

function handlePurchaseOrderEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `📝 Purchase Order ${eventType}`;
    const statusId = safeGet(data, 'status_id');
    const statusName = PO_STATUS_MAP[statusId] || statusId || 'Unknown';
    const fields = [
        { name: '📝 PO #', value: safeGet(data, 'number'), inline: true },
        { name: '💰 Amount', value: `$${safeGet(data, 'amount')}`, inline: true },
        { name: '🏢 Vendor', value: safeGet(data, 'vendor.name'), inline: true },
        { name: '📅 Date', value: safeGet(data, 'date'), inline: true },
        { name: '🔖 Status', value: statusName, inline: true },
        { name: '📝 Notes', value: safeGet(data, 'public_notes'), inline: true }
    ];
    const userDisplay = getUserDisplay();
    if (userDisplay) {
        fields.push({ name: '⚡ Action', value: `${eventType} by: ${userDisplay}`, inline: true });
    }
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

function determinePurchaseOrderEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.status_id === '2') return 'Approve';
    if (data.status_id === '5') return 'Expired';
    if (data.remind) return 'Remind';
    if (data.invitations?.[0]?.message_id && data.invitations?.[0]?.sent_date) return 'Email Sent';
    if (data.invitations?.[0]?.sent_date) return 'Marked as Sent';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

module.exports = { handlePurchaseOrderEvent, determinePurchaseOrderEvent }; 