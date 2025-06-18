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
        { name: '🔖 Status', value: statusName, inline: true }
    ];
    const userDisplay = getUserDisplay();
    if (userDisplay) {
        fields.push({ name: '⚡ Action', value: `${eventType} by: ${userDisplay}`, inline: true });
    }
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

function determineInvoiceEvent(data) {
    if (data.archived_at > 0) return 'Archive';
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

module.exports = { handleInvoiceEvent, determineInvoiceEvent }; 