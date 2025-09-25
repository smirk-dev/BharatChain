const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, '../database/bharatchain.db');
const db = new sqlite3.Database(dbPath);

// Create QR codes table
const createQRTable = `
CREATE TABLE IF NOT EXISTS document_qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    qr_payload TEXT NOT NULL,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY(document_id) REFERENCES documents(id),
    FOREIGN KEY(created_by) REFERENCES citizens(id)
);
`;

db.run(createQRTable, (err) => {
    if (err) {
        console.error('Error creating QR codes table:', err);
    } else {
        console.log('✅ QR codes table created successfully');
    }
    
    // Close database connection
    db.close();
});

console.log('🔧 Adding QR codes table to database...');