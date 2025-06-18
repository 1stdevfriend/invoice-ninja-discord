const { getColorForEvent } = require('../utils');

function handleClientEvent(data, eventType, getUserDisplay, safeGet) {
    const title = `👤 Client ${eventType}`;
    let description = `🏢 Client: ${safeGet(data, 'name')}` +
        `\n📧 Email: ${safeGet(data, 'contacts.0.email')}` +
        `\n💰 Balance: $${safeGet(data, 'balance')}` +
        `\n💵 Paid to Date: $${safeGet(data, 'paid_to_date')}`;
    const userDisplay = getUserDisplay();
    const action = eventType === 'Create' ? 'Created' : 
                  eventType === 'Update' ? 'Updated' : 
                  eventType === 'Delete' ? 'Deleted' : 
                  eventType === 'Archive' ? 'Archived' : 
                  eventType === 'Restore' ? 'Restored' : 'Modified';
    if (userDisplay) {
        description += `\n\n👤 ${action} by: ${userDisplay}`;
    }
    const color = getColorForEvent(eventType);
    return { title, description, color };
}

function determineClientEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

module.exports = { handleClientEvent, determineClientEvent }; 