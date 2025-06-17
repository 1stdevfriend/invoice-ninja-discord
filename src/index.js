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

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const ERROR_DISCORD_WEBHOOK_URL = process.env.ERROR_DISCORD_WEBHOOK_URL;

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
};

const INVOICE_NINJA_ICON_URL = 'https://media.discordapp.net/attachments/540447710239784971/1384075879130595409/invoiceninja-svgrepo-com.png';

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

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

require('./cron');

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
