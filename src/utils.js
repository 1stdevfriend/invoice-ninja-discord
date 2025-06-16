// Helper function to parse event name for color mapping
function parseEventName(event) {
    if (!event) return 'default';
    return event.toLowerCase().replace(/\s+/g, '_');
}

// Helper function to get color for event type
function getColorForEvent(event) {
    const eventName = parseEventName(event);
    const colorMap = {
        // Common events
        create: 0x00ff00,      // Green
        update: 0x0000ff,      // Blue
        delete: 0xff0000,      // Red
        archive: 0x808080,     // Gray
        restore: 0xffa500,     // Orange
        default: 0x808080,     // Gray

        // Invoice/Quote/PO specific events
        email_sent: 0x00ff00,  // Green
        marked_as_sent: 0x00ff00, // Green
        approve: 0x00ff00,     // Green
        expired: 0xff0000,     // Red

        // Credit specific events
        applied: 0x00ff00,     // Green
    };
    return colorMap[eventName] || colorMap.default;
}

module.exports = { getColorForEvent, parseEventName }; 