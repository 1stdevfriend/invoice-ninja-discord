# Invoice Ninja Discord Notifier

A robust webhook forwarder and notifier for Invoice Ninja, sending beautiful, informative Discord embeds for all entity events, recurring invoice reminders, and payment/client summaries.

## Features

- Forwards all Invoice Ninja webhook events to Discord as rich embeds
- Supports all entity types: Client, Invoice, Quote, Payment, Vendor, Expense, Product, Task, Project, Credit, Purchase Order
- Visually improved monthly and yearly financial summaries
- Daily recurring invoice reminders (upcoming in the next 7 days)
- Yearly payment summary by client (with totals and payment count)
- Modular handler-based architecture for easy extension
- Emoji-rich, compact, and visually appealing Discord messages

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following content (add your Invoice Ninja and Discord webhook details):
   ```
   PORT=3000
   INVOICE_NINJA_URL=https://your-invoice-ninja-instance.com
   INVOICE_NINJA_TOKEN=your_api_token
   DISCORD_WEBHOOK_URL=your_default_discord_webhook
   # Optionally, set per-entity webhooks:
   DISCORD_WEBHOOK_URL_CLIENT=...
   DISCORD_WEBHOOK_URL_INVOICE=...
   # ...etc for other entities
   ERROR_DISCORD_WEBHOOK_URL=your_error_discord_webhook
   ```

3. Start the server:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

## Usage

- Webhook endpoint: `POST /webhook` (set this as your Invoice Ninja webhook target)
- Cron jobs:
  - Daily: Checks for recurring invoices due in the next 7 days and sends reminders to Discord
  - Monthly: Sends a visually improved monthly summary and a yearly payment summary by client

## Project Structure

```
.
├── src/
│   ├── index.js                # Main Express server and webhook handler
│   ├── handlers/               # Entity-specific and recurring invoice handlers
│   └── utils.js                # Utility functions (summaries, color, etc)
├── .env                        # Environment variables
├── package.json
├── CHANGELOG.md
└── README.md
```

---

For more details, see the code and CHANGELOG.
