// Environment Configuration Management for BharatChain
const fs = require('fs');
const path = require('path');

class EnvironmentConfig {
    constructor() {
        this.envPath = path.join(__dirname, '..', '.env');
        this.requiredVars = {
            'Application': ['NODE_ENV', 'PORT', 'CORS_ORIGIN'],
            'Database': ['DB_HOST', 'DB_NAME', 'SQLITE_DB_PATH'],
            'Authentication': ['JWT_SECRET', 'JWT_EXPIRES_IN'],
            'Blockchain': ['CITIZEN_REGISTRY_ADDRESS', 'DOCUMENT_REGISTRY_ADDRESS', 'GRIEVANCE_SYSTEM_ADDRESS', 'RPC_URL'],
            'Security': ['BCRYPT_ROUNDS', 'ENCRYPTION_KEY', 'SESSION_SECRET']
        };
        this.warnings = [];
        this.errors = [];
    }

    validateEnvironment() {
        console.log('🔍 Validating environment configuration...\n');

        // Check if .env file exists
        if (!fs.existsSync(this.envPath)) {
            this.errors.push('.env file not found');
            return false;
        }

        // Load environment variables
        require('dotenv').config({ path: this.envPath });

        // Validate required variables by category
        Object.entries(this.requiredVars).forEach(([category, vars]) => {
            console.log(`📋 ${category} Configuration:`);
            vars.forEach(varName => {
                const value = process.env[varName];
                if (!value) {
                    this.errors.push(`Missing required variable: ${varName}`);
                    console.log(`  ❌ ${varName}: Missing`);
                } else {
                    // Check for default/placeholder values
                    if (this.isPlaceholderValue(varName, value)) {
                        this.warnings.push(`${varName} appears to be a placeholder value`);
                        console.log(`  ⚠️  ${varName}: ${this.maskSensitive(varName, value)} (placeholder)`);
                    } else {
                        console.log(`  ✅ ${varName}: ${this.maskSensitive(varName, value)}`);
                    }
                }
            });
            console.log('');
        });

        // Additional validations
        this.validateSpecificConfigs();

        return this.errors.length === 0;
    }

    validateSpecificConfigs() {
        // Validate PORT
        const port = process.env.PORT;
        if (port && (isNaN(port) || port < 1024 || port > 65535)) {
            this.warnings.push('PORT should be between 1024 and 65535');
        }

        // Validate JWT_SECRET strength
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret && jwtSecret.length < 32) {
            this.warnings.push('JWT_SECRET should be at least 32 characters long');
        }

        // Validate database path
        const dbPath = process.env.SQLITE_DB_PATH;
        if (dbPath) {
            const dbDir = path.dirname(dbPath);
            if (!fs.existsSync(dbDir)) {
                this.warnings.push(`Database directory does not exist: ${dbDir}`);
            }
        }

        // Validate blockchain addresses
        const addressPattern = /^0x[a-fA-F0-9]{40}$/;
        ['CITIZEN_REGISTRY_ADDRESS', 'DOCUMENT_REGISTRY_ADDRESS', 'GRIEVANCE_SYSTEM_ADDRESS'].forEach(addr => {
            const value = process.env[addr];
            if (value && !addressPattern.test(value)) {
                this.errors.push(`Invalid blockchain address format for ${addr}`);
            }
        });

        // Validate RPC URL
        const rpcUrl = process.env.RPC_URL;
        if (rpcUrl && !rpcUrl.startsWith('http')) {
            this.errors.push('RPC_URL must start with http:// or https://');
        }
    }

    isPlaceholderValue(varName, value) {
        const placeholders = [
            'your-', 'change-this', 'replace-with', 'mock-', 'test-', 'placeholder',
            'example', 'dummy', 'sample', 'here'
        ];
        
        // Exception: Hardhat development keys are valid
        if (varName === 'PRIVATE_KEY' && value === '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') {
            return false;
        }
        
        return placeholders.some(placeholder => 
            value.toLowerCase().includes(placeholder)
        );
    }

    maskSensitive(varName, value) {
        const sensitiveVars = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'PRIVATE'];
        
        if (sensitiveVars.some(sensitive => varName.includes(sensitive))) {
            if (value.length <= 8) {
                return '***';
            }
            return value.substring(0, 4) + '...' + value.substring(value.length - 4);
        }
        
        // Truncate very long values
        return value.length > 50 ? value.substring(0, 47) + '...' : value;
    }

    generateSecureValues() {
        console.log('🔐 Generating secure configuration values...\n');
        
        const crypto = require('crypto');
        
        const secureValues = {
            JWT_SECRET: crypto.randomBytes(64).toString('hex'),
            ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
            SESSION_SECRET: crypto.randomBytes(64).toString('hex'),
            QR_CODE_SECRET: crypto.randomBytes(32).toString('hex'),
            PAYMENT_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex')
        };

        console.log('🔑 Generated secure values (copy to .env):');
        Object.entries(secureValues).forEach(([key, value]) => {
            console.log(`${key}=${value}`);
        });
        
        return secureValues;
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Environment Configuration Summary');
        console.log('='.repeat(60));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ All configuration checks passed!');
        } else {
            if (this.errors.length > 0) {
                console.log(`❌ ${this.errors.length} Error(s):`);
                this.errors.forEach(error => console.log(`   • ${error}`));
                console.log('');
            }

            if (this.warnings.length > 0) {
                console.log(`⚠️  ${this.warnings.length} Warning(s):`);
                this.warnings.forEach(warning => console.log(`   • ${warning}`));
                console.log('');
            }
        }

        console.log('📝 Next Steps:');
        if (this.errors.length > 0) {
            console.log('   1. Fix the errors listed above');
            console.log('   2. Run this validation again');
        } else if (this.warnings.length > 0) {
            console.log('   1. Consider addressing the warnings for production');
            console.log('   2. Generate secure values for placeholder secrets');
        } else {
            console.log('   1. Your environment is ready for development!');
            console.log('   2. Remember to update placeholder values for production');
        }
        
        console.log('='.repeat(60));
    }

    createProductionTemplate() {
        const prodTemplate = `# BharatChain Production Environment Template
# Copy this file to .env.production and fill in the actual values

# Critical: Replace ALL placeholder values before deploying to production!

# Application Configuration
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com

# Database Configuration (Production PostgreSQL)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=bharatchain_prod
DB_USER=bharatchain_user
DB_PASS=your-secure-database-password
DB_SSL=true

# JWT Configuration (Generate new secrets!)
JWT_SECRET=generate-new-64-character-secret-for-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Blockchain Configuration (Use actual deployed contracts)
CITIZEN_REGISTRY_ADDRESS=0x...
DOCUMENT_REGISTRY_ADDRESS=0x...
GRIEVANCE_SYSTEM_ADDRESS=0x...

# Network Configuration (Use Polygon Mainnet)
BLOCKCHAIN_NETWORK=polygon
RPC_URL=https://polygon-rpc.com
CHAIN_ID=137

# Production Wallet (Use secure key management!)
PRIVATE_KEY=your-production-private-key-use-key-management-service
WALLET_ADDRESS=your-production-wallet-address

# Real API Keys (Replace with actual government API keys)
UIDAI_API_KEY=real-uidai-api-key
PAN_API_KEY=real-pan-api-key
MEA_PASSPORT_API_KEY=real-mea-api-key

# Production Payment Gateway
RAZORPAY_KEY_ID=rzp_live_key_id
RAZORPAY_KEY_SECRET=rzp_live_key_secret

# Security (Generate new secrets!)
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=generate-new-32-character-encryption-key
SESSION_SECRET=generate-new-session-secret

# Production Features
DEBUG_MODE=false
MOCK_PAYMENTS=false
MOCK_SMS=false
MOCK_EMAIL=false
MOCK_BLOCKCHAIN=false

# Monitoring
SENTRY_DSN=your-production-sentry-dsn
LOG_LEVEL=warn
`;

        const templatePath = path.join(__dirname, '..', '.env.production.template');
        fs.writeFileSync(templatePath, prodTemplate);
        console.log(`📄 Production template created: ${templatePath}`);
    }
}

// Export for use in other files
module.exports = EnvironmentConfig;

// If run directly, validate environment
if (require.main === module) {
    const config = new EnvironmentConfig();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--generate-secrets')) {
        config.generateSecureValues();
    } else if (args.includes('--create-prod-template')) {
        config.createProductionTemplate();
    } else {
        const isValid = config.validateEnvironment();
        config.printSummary();
        
        if (args.includes('--strict') && !isValid) {
            process.exit(1);
        }
    }
}