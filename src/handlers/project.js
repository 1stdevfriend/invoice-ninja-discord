const { getColorForEvent } = require('../utils');

function handleProjectEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `📋 Project ${eventType}`;
    const fields = [
        { name: '📋 Project', value: safeGet(data, 'name'), inline: true },
        { name: '👤 Client', value: safeGet(data, 'client.name'), inline: true },
        { name: '📅 Due Date', value: safeGet(data, 'due_date'), inline: true },
        { name: '⏳ Budgeted Hours', value: safeGet(data, 'budgeted_hours'), inline: true },
        { name: '⏱️ Current Hours', value: safeGet(data, 'current_hours'), inline: true },
        { name: '📝 Notes', value: safeGet(data, 'public_notes'), inline: true }
    ];
    const userDisplay = getUserDisplay();
    if (userDisplay) {
        fields.push({ name: '⚡ Action', value: `${eventType} by: ${userDisplay}`, inline: true });
    }
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

function determineProjectEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    return 'Update';
}

module.exports = { handleProjectEvent, determineProjectEvent }; 