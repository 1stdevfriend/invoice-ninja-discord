const { getColorForEvent } = require('../utils');

function handleExpenseEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `💸 Expense ${eventType}`;
    const fields = [
        { name: '💸 Expense #', value: safeGet(data, 'number'), inline: true },
        { name: '💰 Amount', value: `$${safeGet(data, 'amount')}`, inline: true },
        { name: '📅 Date', value: safeGet(data, 'date'), inline: true },
        { name: '🏢 Vendor', value: safeGet(data, 'vendor.name'), inline: true },
        { name: '📝 Notes', value: safeGet(data, 'public_notes'), inline: true },
        { name: '⚡ Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

function determineExpenseEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

module.exports = { handleExpenseEvent, determineExpenseEvent }; 