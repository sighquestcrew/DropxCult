const fs = require('fs');
const path = require('path');

const adminSchemaPath = path.join(__dirname, '../dropxcult-admin/prisma/schema.prisma');
const storeSchemaPath = path.join(__dirname, '../dropxcult-store/prisma/schema.prisma');

const adminSchema = fs.readFileSync(adminSchemaPath, 'utf8');
const storeSchema = fs.readFileSync(storeSchemaPath, 'utf8');

// Extract model definitions
function extractModels(schema) {
    const modelRegex = /model\s+(\w+)\s*{([^}]*)}/gs;
    const models = {};
    let match;

    while ((match = modelRegex.exec(schema)) !== null) {
        const modelName = match[1];
        const modelBody = match[2].trim();
        models[modelName] = modelBody;
    }

    return models;
}

const adminModels = extractModels(adminSchema);
const storeModels = extractModels(storeSchema);

const allModelNames = new Set([...Object.keys(adminModels), ...Object.keys(storeModels)]);
const conflicts = [];
const differences = [];

let output = '';
output += '='.repeat(80) + '\n';
output += 'PRISMA SCHEMA COMPARISON REPORT\n';
output += '='.repeat(80) + '\n\n';

allModelNames.forEach(modelName => {
    const inAdmin = modelName in adminModels;
    const inStore = modelName in storeModels;

    if (inAdmin && !inStore) {
        differences.push(`❌ Model "${modelName}" exists in ADMIN but NOT in STORE`);
    } else if (!inAdmin && inStore) {
        differences.push(`❌ Model "${modelName}" exists in STORE but NOT in ADMIN`);
    } else if (inAdmin && inStore) {
        // Both have this model, compare them
        if (adminModels[modelName] !== storeModels[modelName]) {
            conflicts.push({
                model: modelName,
                admin: adminModels[modelName],
                store: storeModels[modelName]
            });
        }
    }
});

if (differences.length > 0) {
    output += 'MISSING MODELS:\n';
    output += '-'.repeat(80) + '\n';
    differences.forEach(diff => output += diff + '\n');
    output += '\n';
}

if (conflicts.length > 0) {
    output += 'MODEL CONFLICTS (different definitions):\n';
    output += '-'.repeat(80) + '\n';
    conflicts.forEach(({ model, admin, store }) => {
        output += `\n⚠️  Model: ${model}\n`;
        output += '\nADMIN version:\n';
        output += admin + '\n';
        output += '\nSTORE version:\n';
        output += store + '\n';
        output += '-'.repeat(80) + '\n';
    });
} else if (differences.length === 0) {
    output += '✅ All shared models are IDENTICAL between Admin and Store!\n';
}

output += '\n';
output += 'SUMMARY:\n';
output += '-'.repeat(80) + '\n';
output += `Total models in Admin: ${Object.keys(adminModels).length}\n`;
output += `Total models in Store: ${Object.keys(storeModels).length}\n`;
output += `Missing models: ${differences.length}\n`;
output += `Conflicting models: ${conflicts.length}\n`;
output += '='.repeat(80) + '\n';

// Write to file
fs.writeFileSync(path.join(__dirname, 'schema-comparison.txt'), output);
console.log(output);
