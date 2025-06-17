const { getColorForEvent } = require('../utils');

function handleTaskEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `✅ Task ${eventType}`;
    const fields = [
        { name: '📝 Task #', value: safeGet(data, 'number'), inline: true },
        { name: '🗒️ Description', value: safeGet(data, 'description'), inline: true },
        { name: '📁 Project', value: safeGet(data, 'project.name'), inline: true },
        { name: '💲 Rate', value: `$${safeGet(data, 'rate')}`, inline: true },
        { name: '⏱️ Duration', value: safeGet(data, 'duration'), inline: true },
        { name: '🔖 Status', value: safeGet(data, 'status_id'), inline: true },
        { name: '📝 Notes', value: safeGet(data, 'public_notes'), inline: true },
        { name: '⚡ Action', value: `${eventType} by: ${getUserDisplay()}`, inline: true }
    ];
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

module.exports = { handleTaskEvent }; 