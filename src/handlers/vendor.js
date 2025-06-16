const { getColorForEvent } = require('../utils');

function handleVendorEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `🏢 Vendor ${eventType}`;
    const fields = [
        { name: '🏢 Vendor', value: safeGet(data, 'name'), inline: true },
        { name: '📧 Email', value: safeGet(data, 'contacts.0.email'), inline: true },
        { name: '📞 Phone', value: safeGet(data, 'contacts.0.phone'), inline: true },
        { name: '🌐 Website', value: safeGet(data, 'website'), inline: true },
        { name: '📝 Notes', value: safeGet(data, 'public_notes'), inline: true },
        { name: '⚡ Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handleVendorEvent }; 