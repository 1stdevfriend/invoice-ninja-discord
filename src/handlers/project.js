const { getColorForEvent } = require('../utils');

function handleProjectEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `📋 Project ${eventType}`;
    const fields = [
        { name: '📋 Project', value: safeGet(data, 'name'), inline: true },
        { name: '👤 Client', value: safeGet(data, 'client.name'), inline: true },
        { name: '📅 Due Date', value: safeGet(data, 'due_date'), inline: true },
        { name: '⏳ Budgeted Hours', value: safeGet(data, 'budgeted_hours'), inline: true },
        { name: '⏱️ Current Hours', value: safeGet(data, 'current_hours'), inline: true },
        { name: '📝 Notes', value: safeGet(data, 'public_notes'), inline: true },
        { name: '⚡ Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handleProjectEvent }; 