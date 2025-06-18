const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json());

const { handleClientEvent, determineClientEvent } = require('./handlers/client');
const { handleInvoiceEvent, determineInvoiceEvent } = require('./handlers/invoice');
const { handleQuoteEvent, determineQuoteEvent } = require('./handlers/quote');
const { handlePaymentEvent, determinePaymentEvent } = require('./handlers/payment');
const { handleVendorEvent, determineVendorEvent } = require('./handlers/vendor');
const { handleExpenseEvent, determineExpenseEvent } = require('./handlers/expense');
const { handleProjectEvent, determineProjectEvent } = require('./handlers/project');
const { handleTaskEvent, determineTaskEvent } = require('./handlers/task');
const { handleProductEvent, determineProductEvent } = require('./handlers/product');
const { handleCreditEvent, determineCreditEvent } = require('./handlers/credit');
const { handlePurchaseOrderEvent, determinePurchaseOrderEvent } = require('./handlers/purchaseOrder');

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
    default: process.env.DISCORD_WEBHOOK_URL,
    error: process.env.ERROR_DISCORD_WEBHOOK_URL
};

// Function to determine entity type from webhook data structure
function determineEntityTypeFromData(data) {
    if (!data) return null;
    
    console.log('Attempting to determine entity type from fields:', Object.keys(data));
    
    // Check for specific fields that indicate entity type
    if (data.number && data.amount !== undefined && data.balance !== undefined) {
        // Check if it's an invoice, quote, or credit based on additional fields
        if (data.quote_id || data.type === 'quote') return 'quote';
        if (data.credit_id || data.type === 'credit') return 'credit';
        if (data.purchase_order_id || data.type === 'purchase_order') return 'purchaseOrder';
        if (data.type === 'invoice' || data.invoice_id) return 'invoice';
        // Default to invoice if it has invoice-like fields
        return 'invoice';
    }
    
    if (data.name && (data.contacts || data.email) && data.balance !== undefined) {
        return 'client';
    }
    
    if (data.amount && (data.payment_date || data.date) && (data.invoice_id || data.invoice_number)) {
        return 'payment';
    }
    
    if (data.name && (data.vendor_contacts || data.vendor_email)) {
        return 'vendor';
    }
    
    if (data.amount && (data.expense_date || data.date) && (data.vendor_id || data.vendor_name)) {
        return 'expense';
    }
    
    if (data.name && (data.start_date || data.project_start_date) && (data.end_date || data.project_end_date)) {
        return 'project';
    }
    
    if (data.description && (data.time_log || data.time_spent) && (data.project_id || data.project_name)) {
        return 'task';
    }
    
    if ((data.product_key || data.product_name) && (data.notes || data.description) && data.cost !== undefined) {
        return 'product';
    }
    
    // Additional checks for edge cases
    if (data.type) {
        switch (data.type) {
            case 'invoice': return 'invoice';
            case 'quote': return 'quote';
            case 'credit': return 'credit';
            case 'payment': return 'payment';
            case 'client': return 'client';
            case 'vendor': return 'vendor';
            case 'expense': return 'expense';
            case 'project': return 'project';
            case 'task': return 'task';
            case 'product': return 'product';
            case 'purchase_order': return 'purchaseOrder';
        }
    }
    
    // If we can't determine, return null
    return null;
}

app.post('/webhook', async (req, res) => {
    const INVOICE_NINJA_ICON_URL = 'https://media.discordapp.net/attachments/540447710239784971/1384075879130595409/invoiceninja-svgrepo-com.png';
    try {
        const data = req.body;
        console.log('Received webhook:', JSON.stringify(data, null, 2));

        if (!data) {
            console.error('Invalid webhook data: Empty payload');
            return res.status(400).send('Invalid webhook data: Empty payload');
        }

        // Try to get entity_type from data, or determine it from structure
        let entityType = data.entity_type || determineEntityTypeFromData(data);
        
        if (!entityType) {
            console.error('Invalid webhook data: Cannot determine entity type');
            console.log('Available fields:', Object.keys(data));
            console.log('Data structure:', JSON.stringify(data, null, 2));
            return res.status(400).send('Invalid webhook data: Cannot determine entity type');
        }

        console.log('Determined entity type:', entityType);

        let eventType;
        let embed;

        const safeGet = (obj, path, defaultValue = 'N/A') => {
            try {
                return path.split('.').reduce((o, i) => o[i], obj) || defaultValue;
            } catch (e) {
                return defaultValue;
            }
        };

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

        const webhookUrl = webhookUrls[entityType] || webhookUrls.default;

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
        if (webhookUrls.error) {
            try {
                await axios.post(webhookUrls.error, {
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

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

require('./cron');

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
