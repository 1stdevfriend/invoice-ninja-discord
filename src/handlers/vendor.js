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

function determineVendorEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

module.exports = { handleVendorEvent, determineVendorEvent }; 