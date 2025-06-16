const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json());

// Discord webhook URL should be set in .env file
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const ERROR_DISCORD_WEBHOOK_URL = process.env.ERROR_DISCORD_WEBHOOK_URL;

const { handleClientEvent } = require('./handlers/client');
const { handleInvoiceEvent } = require('./handlers/invoice');
const { handleQuoteEvent } = require('./handlers/quote');
const { handlePaymentEvent } = require('./handlers/payment');
const { handleVendorEvent } = require('./handlers/vendor');
const { handleExpenseEvent } = require('./handlers/expense');
const { handleProjectEvent } = require('./handlers/project');
const { handleTaskEvent } = require('./handlers/task');
const { handleProductEvent } = require('./handlers/product');
const { handleCreditEvent } = require('./handlers/credit');
const { handlePurchaseOrderEvent } = require('./handlers/purchaseOrder');

const INVOICE_NINJA_ICON_URL = 'https://media.discordapp.net/attachments/540447710239784971/1384075879130595409/invoiceninja-svgrepo-com.png';

const ENTITY_THUMBNAILS = {
    client: 'https://cdn-icons-png.flaticon.com/512/5455/5455723.png',
    invoice: 'https://cdn-icons-png.flaticon.com/512/4862/4862191.png',
    quote: 'https://cdn-icons-png.flaticon.com/512/4388/4388554.png',
    payment: 'https://cdn-icons-png.flaticon.com/512/6184/6184467.png',
    vendor: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    expense: 'https://cdn-icons-png.flaticon.com/512/781/781831.png',
    project: 'https://cdn-icons-png.flaticon.com/512/906/906175.png',
    task: 'https://cdn-icons-png.flaticon.com/512/1632/1632670.png',
    product: 'https://cdn-icons-png.flaticon.com/512/679/679922.png',
    credit: 'https://cdn-icons-png.flaticon.com/512/2424/2424710.png',
    purchaseOrder: 'https://cdn-icons-png.flaticon.com/512/3500/3500833.png',
};

const webhookUrls = {
    client: process.env.DISCORD_WEBHOOK_URL_CLIENT,
    invoice: process.env.DISCORD_WEBHOOK_URL_INVOICE,
    quote: process.env.DISCORD_WEBHOOK_URL_QUOTE,
    payment: process.env.DISCORD_WEBHOOK_URL_PAYMENT,
    vendor: process.env.DISCORD_WEBHOOK_URL_VENDOR,
    expense: process.env.DISCORD_WEBHOOK_URL_EXPENSE,
    project: process.env.DISCORD_WEBHOOK_URL_PROJECT,
    task: process.env.DISCORD_WEBHOOK_URL_TASK,
    product: process.env.DISCORD_WEBHOOK_URL_PRODUCT,
    credit: process.env.DISCORD_WEBHOOK_URL_CREDIT,
    purchaseOrder: process.env.DISCORD_WEBHOOK_URL_PURCHASEORDER,
};

// Helper function to determine client event type
function determineClientEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine invoice event type
function determineInvoiceEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.status_id === '2') return 'Approve';
    if (data.status_id === '5') return 'Expired';
    if (data.remind) return 'Remind';
    if (data.invitations?.[0]?.message_id && data.invitations?.[0]?.sent_date) return 'Email Sent';
    if (data.invitations?.[0]?.sent_date) return 'Marked as Sent';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine quote event type
function determineQuoteEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.status_id === '2') return 'Approve';
    if (data.status_id === '5') return 'Expired';
    if (data.remind) return 'Remind';
    if (data.invitations?.[0]?.message_id && data.invitations?.[0]?.sent_date) return 'Email Sent';
    if (data.invitations?.[0]?.sent_date) return 'Marked as Sent';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine payment event type
function determinePaymentEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine vendor event type
function determineVendorEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine expense event type
function determineExpenseEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine project event type
function determineProjectEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine task event type
function determineTaskEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine product event type
function determineProductEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine credit event type
function determineCreditEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.status_id === '3') return 'Applied';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Helper function to determine purchase order event type
function determinePurchaseOrderEvent(data) {
    if (data.is_deleted) return 'Delete';
    if (data.archived_at > 0) return 'Archive';
    if (data.archived_at === 0 && data.updated_at > data.created_at && data._was_archived) return 'Restore';
    if (data.status_id === '2') return 'Approve';
    if (data.status_id === '5') return 'Expired';
    if (data.remind) return 'Remind';
    if (data.invitations?.[0]?.message_id && data.invitations?.[0]?.sent_date) return 'Email Sent';
    if (data.invitations?.[0]?.sent_date) return 'Marked as Sent';
    if (data.archived_at === 0 && data.updated_at > data.created_at) return 'Update';
    if (data.created_at === data.updated_at) return 'Create';
    return 'Update';
}

// Webhook handler
app.post('/webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log('Received webhook:', JSON.stringify(data, null, 2));

        if (!data || !data.entity_type) {
            console.error('Invalid webhook data: Missing entity_type');
            return res.status(400).send('Invalid webhook data: Missing entity_type');
        }

        let eventType;
        let embed;
        const entityType = data.entity_type;

        // Safely access nested properties
        const safeGet = (obj, path, defaultValue = 'N/A') => {
            try {
                return path.split('.').reduce((o, i) => o[i], obj) || defaultValue;
            } catch (e) {
                return defaultValue;
            }
        };

        // Get user display name from webhook data
        const getUserDisplay = () => {
            const user = data.user || {};
            return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User';
        };

        switch (entityType) {
            case 'client':
                eventType = determineClientEvent(data);
                embed = handleClientEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'invoice':
                eventType = determineInvoiceEvent(data);
                embed = handleInvoiceEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'quote':
                eventType = determineQuoteEvent(data);
                embed = handleQuoteEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'payment':
                eventType = determinePaymentEvent(data);
                embed = handlePaymentEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'vendor':
                eventType = determineVendorEvent(data);
                embed = handleVendorEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'expense':
                eventType = determineExpenseEvent(data);
                embed = handleExpenseEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'project':
                eventType = determineProjectEvent(data);
                embed = handleProjectEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'task':
                eventType = determineTaskEvent(data);
                embed = handleTaskEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'product':
                eventType = determineProductEvent(data);
                embed = handleProductEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'credit':
                eventType = determineCreditEvent(data);
                embed = handleCreditEvent(data, eventType, getUserDisplay, safeGet);
                break;
            case 'purchaseOrder':
                eventType = determinePurchaseOrderEvent(data);
                embed = handlePurchaseOrderEvent(data, eventType, getUserDisplay, safeGet);
                break;
            default:
                console.log('Unsupported entity type:', entityType);
                return res.status(200).send('Unsupported entity type');
        }

        embed.timestamp = new Date().toISOString();
        embed.footer = {
            text: 'Forwarded from Invoice Ninja',
            icon_url: INVOICE_NINJA_ICON_URL
        };
        embed.thumbnail = {
            url: ENTITY_THUMBNAILS[entityType] || INVOICE_NINJA_ICON_URL
        };

        // Use per-entity webhook URL, fallback to DISCORD_WEBHOOK_URL
        const webhookUrl = webhookUrls[entityType] || DISCORD_WEBHOOK_URL;

        if (webhookUrl) {
            try {
                await axios.post(webhookUrl, {
                    embeds: [embed]
                });
                console.log('Successfully sent webhook to Discord');
            } catch (error) {
                console.error('Error sending to Discord:', error.message);
            }
        } else {
            console.warn('No Discord webhook URL set for entity', entityType);
        }

        res.status(200).send('Webhook processed successfully');
    } catch (error) {
        console.error('Error processing webhook:', error);
        // Send error to error webhook if configured
        if (ERROR_DISCORD_WEBHOOK_URL) {
            try {
                await axios.post(ERROR_DISCORD_WEBHOOK_URL, {
                    embeds: [{
                        title: '🚨 Webhook Error',
                        color: 0xff0000,
                        fields: [
                            { name: 'Error', value: error.message || String(error), inline: false },
                            { name: 'Payload', value: '```json\n' + JSON.stringify(req.body, null, 2) + '\n```', inline: false }
                        ],
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: 'Forwarded from Invoice Ninja',
                            icon_url: INVOICE_NINJA_ICON_URL
                        }
                    }]
                });
                console.log('Error webhook sent to Discord');
            } catch (err) {
                console.error('Failed to send error webhook:', err.message);
            }
        }
        res.status(500).send('Error processing webhook');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 