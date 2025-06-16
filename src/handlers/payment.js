const { getColorForEvent } = require('../utils');

function handlePaymentEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `💵 Payment ${eventType}`;
    const fields = [
        { name: 'Payment #', value: safeGet(data, 'number'), inline: true },
        { name: 'Amount', value: `$${safeGet(data, 'amount')}`, inline: true },
        { name: 'Client', value: safeGet(data, 'client.name'), inline: true },
        { name: 'Reference', value: safeGet(data, 'transaction_reference'), inline: true },
        { name: 'Payment Type', value: safeGet(data, 'payment_type_id'), inline: true },
        { name: 'Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handlePaymentEvent }; 