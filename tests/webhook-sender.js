const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/webhook';

const sampleUser = {
    id: '42',
    first_name: 'Alice',
    last_name: 'Tester',
    email: 'alice@example.com'
};

// Helper function to create a timestamp
const getTimestamp = () => Math.floor(Date.now() / 1000);

// Helper function to create a sample client
const createSampleClient = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        name: 'Test Client',
        balance: 1000,
        paid_to_date: 500,
        contacts: [{
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '123-456-7890'
        }],
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return {
                ...base,
                created_at: now,
                updated_at: now,
                archived_at: 0,
                is_deleted: false
            };
        case 'Update':
            return {
                ...base,
                created_at: now - 1000,
                updated_at: now,
                archived_at: 0,
                is_deleted: false
            };
        case 'Archive':
            return {
                ...base,
                created_at: now - 2000,
                updated_at: now - 1000,
                archived_at: now,
                is_deleted: false
            };
        case 'Restore':
            return {
                ...base,
                created_at: now - 3000,
                updated_at: now,
                archived_at: 0,
                is_deleted: false,
                _was_archived: true
            };
        case 'Delete':
            return {
                ...base,
                created_at: now - 4000,
                updated_at: now - 3000,
                archived_at: 0,
                is_deleted: true
            };
        case 'Remind':
            return {
                ...base,
                created_at: now - 8000,
                updated_at: now - 7000,
                archived_at: 0,
                is_deleted: false,
                remind: true
            };
        default:
            return {
                ...base,
                created_at: now,
                updated_at: now,
                archived_at: 0,
                is_deleted: false
            };
    }
};

// Helper function to create a sample invoice
const createSampleInvoice = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        amount: 1000,
        balance: 500,
        client_id: '1',
        status_id: event === 'Approve' ? '2' : '1',
        number: 'INV-001',
        client: {
            id: '1',
            name: 'Test Client'
        },
        invitations: [{
            id: '1',
            message_id: event === 'Email Sent' ? 'msg123' : null,
            sent_date: event === 'Email Sent' || event === 'Marked as Sent' ? getTimestamp() : null
        }],
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Email Sent':
            return { ...base, created_at: now - 5000, updated_at: now - 4000, archived_at: 0, is_deleted: false, invitations: [{ id: '1', message_id: 'msg123', sent_date: now }] };
        case 'Marked as Sent':
            return { ...base, created_at: now - 6000, updated_at: now - 5000, archived_at: 0, is_deleted: false, invitations: [{ id: '1', message_id: null, sent_date: now }] };
        case 'Approve':
            return { ...base, created_at: now - 7000, updated_at: now - 6000, archived_at: 0, is_deleted: false, status_id: '2' };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Helper function to create a sample quote
const createSampleQuote = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        amount: 1000,
        client_id: '1',
        status_id: event === 'Approve' ? '2' : '1',
        number: 'Q-001',
        client: {
            id: '1',
            name: 'Test Client'
        },
        invitations: [{
            id: '1',
            message_id: event === 'Email Sent' ? 'msg123' : null,
            sent_date: event === 'Email Sent' || event === 'Marked as Sent' ? getTimestamp() : null
        }],
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Email Sent':
            return { ...base, created_at: now - 5000, updated_at: now - 4000, archived_at: 0, is_deleted: false, invitations: [{ id: '1', message_id: 'msg123', sent_date: now }] };
        case 'Marked as Sent':
            return { ...base, created_at: now - 6000, updated_at: now - 5000, archived_at: 0, is_deleted: false, invitations: [{ id: '1', message_id: null, sent_date: now }] };
        case 'Approve':
            return { ...base, created_at: now - 7000, updated_at: now - 6000, archived_at: 0, is_deleted: false, status_id: '2' };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Helper function to create a sample payment
const createSamplePayment = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        amount: 500,
        client_id: '1',
        number: 'PAY-001',
        transaction_reference: 'TR-001',
        client: {
            id: '1',
            name: 'Test Client'
        },
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Helper function to create a sample vendor
const createSampleVendor = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        name: 'Test Vendor',
        contacts: [{
            id: '1',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            phone: '098-765-4321'
        }],
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Helper function to create a sample expense
const createSampleExpense = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        amount: 100,
        number: 'EXP-001',
        date: '2024-03-20',
        public_notes: 'Test expense',
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Helper function to create a sample project
const createSampleProject = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        name: 'Test Project',
        client_id: '1',
        due_date: '2024-04-20',
        budgeted_hours: 40,
        current_hours: 20,
        public_notes: 'Test project',
        client: {
            id: '1',
            name: 'Test Client'
        },
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Helper function to create a sample task
const createSampleTask = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        name: 'Test Task',
        number: 'TASK-001',
        description: 'Test task description',
        rate: 50,
        duration: 2,
        status_id: '1',
        public_notes: 'Test task notes',
        project: {
            id: '1',
            name: 'Test Project'
        },
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Helper function to create a sample product
const createSampleProduct = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        product_key: 'PROD-001',
        price: 100,
        cost: 50,
        quantity: 10,
        in_stock_quantity: 5,
        max_quantity: 20,
        notes: 'Test product',
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Helper function to create a sample credit
const createSampleCredit = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        amount: 200,
        balance: 200,
        client_id: '1',
        number: 'CRED-001',
        date: '2024-03-20',
        status_id: event === 'Applied' ? '3' : '1',
        public_notes: 'Test credit',
        client: {
            id: '1',
            name: 'Test Client'
        },
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Applied':
            return { ...base, created_at: now - 5000, updated_at: now - 4000, archived_at: 0, is_deleted: false, status_id: '3' };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Helper function to create a sample purchase order
const createSamplePurchaseOrder = (event) => {
    const base = {
        id: '1',
        user_id: '1',
        amount: 500,
        vendor_id: '1',
        number: 'PO-001',
        date: '2024-03-20',
        status_id: '1',
        public_notes: 'Test PO',
        vendor: {
            id: '1',
            name: 'Test Vendor'
        },
        invitations: [{
            id: '1',
            message_id: event === 'Email Sent' ? 'msg123' : null,
            sent_date: event === 'Email Sent' || event === 'Marked as Sent' ? getTimestamp() : null
        }],
        user: sampleUser
    };
    const now = getTimestamp();
    switch (event) {
        case 'Create':
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Update':
            return { ...base, created_at: now - 1000, updated_at: now, archived_at: 0, is_deleted: false };
        case 'Archive':
            return { ...base, created_at: now - 2000, updated_at: now - 1000, archived_at: now, is_deleted: false };
        case 'Restore':
            return { ...base, created_at: now - 3000, updated_at: now, archived_at: 0, is_deleted: false, _was_archived: true };
        case 'Delete':
            return { ...base, created_at: now - 4000, updated_at: now - 3000, archived_at: 0, is_deleted: true };
        case 'Email Sent':
            return { ...base, created_at: now - 5000, updated_at: now - 4000, archived_at: 0, is_deleted: false, invitations: [{ id: '1', message_id: 'msg123', sent_date: now }] };
        case 'Marked as Sent':
            return { ...base, created_at: now - 6000, updated_at: now - 5000, archived_at: 0, is_deleted: false, invitations: [{ id: '1', message_id: null, sent_date: now }] };
        case 'Approve':
            return { ...base, created_at: now - 7000, updated_at: now - 6000, archived_at: 0, is_deleted: false, status_id: '2' };
        case 'Remind':
            return { ...base, created_at: now - 8000, updated_at: now - 7000, archived_at: 0, is_deleted: false, remind: true };
        default:
            return { ...base, created_at: now, updated_at: now, archived_at: 0, is_deleted: false };
    }
};

// Function to send a webhook
async function sendWebhook(entityType, event) {
    let data;
    switch (entityType) {
        case 'client':
            data = createSampleClient(event);
            break;
        case 'invoice':
            data = createSampleInvoice(event);
            break;
        case 'quote':
            data = createSampleQuote(event);
            break;
        case 'payment':
            data = createSamplePayment(event);
            break;
        case 'vendor':
            data = createSampleVendor(event);
            break;
        case 'expense':
            data = createSampleExpense(event);
            break;
        case 'project':
            data = createSampleProject(event);
            break;
        case 'task':
            data = createSampleTask(event);
            break;
        case 'product':
            data = createSampleProduct(event);
            break;
        case 'credit':
            data = createSampleCredit(event);
            break;
        case 'purchaseOrder':
            data = createSamplePurchaseOrder(event);
            break;
        default:
            console.error('Unknown entity type:', entityType);
            return;
    }

    try {
        const response = await axios.post(WEBHOOK_URL, {
            entity_type: entityType,
            event: event,
            ...data
        });
        console.log(`✅ Sent ${entityType} ${event} webhook:`, response.status);
    } catch (error) {
        console.error(`❌ Failed to send ${entityType} ${event} webhook:`, error.message);
    }
}

// Function to test all events for an entity
async function testEntity(entityType) {
    const events = ['Create', 'Update', 'Archive', 'Restore', 'Delete'];
    
    // Add entity-specific events
    switch (entityType) {
        case 'invoice':
        case 'quote':
        case 'purchaseOrder':
            events.push('Email Sent', 'Marked as Sent', 'Approve');
            break;
        case 'credit':
            events.push('Applied');
            break;
    }

    console.log(`\n🔍 Testing ${entityType} events...`);
    for (const event of events) {
        await sendWebhook(entityType, event);
        // Wait 1 second between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Function to test all entities
async function testAllEntities() {
    const entities = [
        'client',
        'invoice',
        'quote',
        'payment',
        'vendor',
        'expense',
        'project',
        'task',
        'product',
        'credit',
        'purchaseOrder'
    ];

    for (const entity of entities) {
        await testEntity(entity);
    }
}

// Run the tests
testAllEntities().catch(console.error); 