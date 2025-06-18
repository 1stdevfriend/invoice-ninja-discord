const { getColorForEvent } = require('../utils');

function handleProductEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `📦 Product ${eventType}`;
    const fields = [
        { name: '📦 Product Key', value: safeGet(data, 'product_key'), inline: true },
        { name: '💲 Price', value: `$${safeGet(data, 'price')}`, inline: true },
        { name: '💸 Cost', value: `$${safeGet(data, 'cost')}`, inline: true },
        { name: '🔢 Quantity', value: safeGet(data, 'quantity'), inline: true },
        { name: '📦 In Stock', value: safeGet(data, 'in_stock_quantity'), inline: true },
        { name: '🔝 Max Quantity', value: safeGet(data, 'max_quantity'), inline: true },
        { name: '📝 Notes', value: safeGet(data, 'notes'), inline: true }
    ];
    const userDisplay = getUserDisplay();
    if (userDisplay) {
        fields.push({ name: '⚡ Action', value: `${eventType} by: ${userDisplay}`, inline: true });
    }
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

function determineProductEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

module.exports = { handleProductEvent, determineProductEvent }; 