const { getColorForEvent } = require('../utils');

function handleExpenseEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `💸 Expense ${eventType}`;
    const fields = [
        { name: 'Expense #', value: safeGet(data, 'number'), inline: true },
        { name: 'Amount', value: `$${safeGet(data, 'amount')}`, inline: true },
        { name: 'Date', value: safeGet(data, 'date'), inline: true },
        { name: 'Vendor', value: safeGet(data, 'vendor.name'), inline: true },
        { name: 'Notes', value: safeGet(data, 'public_notes'), inline: true },
        { name: 'Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handleExpenseEvent }; 