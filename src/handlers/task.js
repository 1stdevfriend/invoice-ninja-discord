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
    ];
    const userDisplay = getUserDisplay();
    if (userDisplay) {
        fields.push({ name: '⚡ Action', value: `${eventType} by: ${userDisplay}`, inline: true });
    }
    const color = getColorForEvent(eventType);
    return { title, fields, color };
}

function determineTaskEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

module.exports = { handleTaskEvent, determineTaskEvent }; 