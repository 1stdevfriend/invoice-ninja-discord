const { getColorForEvent } = require('../utils');

function handleProductEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `📦 Product ${eventType}`;
    const fields = [
        { name: 'Product Key', value: safeGet(data, 'product_key'), inline: true },
        { name: 'Price', value: `$${safeGet(data, 'price')}`, inline: true },
        { name: 'Cost', value: `$${safeGet(data, 'cost')}`, inline: true },
        { name: 'Quantity', value: safeGet(data, 'quantity'), inline: true },
        { name: 'In Stock', value: safeGet(data, 'in_stock_quantity'), inline: true },
        { name: 'Max Quantity', value: safeGet(data, 'max_quantity'), inline: true },
        { name: 'Notes', value: safeGet(data, 'notes'), inline: true },
        { name: 'Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handleProductEvent }; 