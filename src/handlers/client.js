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
    description += `\n\n👤 ${action} by: ${userDisplay}`;
    const color = getColorForEvent(eventType);
    return { title, description, color };
}

module.exports = { handleClientEvent }; 