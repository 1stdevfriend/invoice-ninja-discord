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
        { name: '📝 Notes', value: safeGet(data, 'public_notes'), inline: true },
        { name: '⚡ Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handlePurchaseOrderEvent }; 