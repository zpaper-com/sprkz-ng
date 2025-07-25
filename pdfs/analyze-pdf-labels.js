#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if pdf2pic is available, if not provide installation instructions
async function checkDependencies() {
    try {
        require('pdf-parse');
        console.log('✓ pdf-parse is available');
    } catch (error) {
        console.log('❌ pdf-parse not found. Install with: npm install pdf-parse');
        process.exit(1);
    }
}

async function analyzePDFLabels(pdfPath) {
    try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(pdfPath);
        
        console.log(`\n=== Analyzing ${path.basename(pdfPath)} ===`);
        
        const data = await pdfParse(dataBuffer);
        
        console.log(`Pages: ${data.numpages}`);
        console.log(`Text length: ${data.text.length} characters`);
        
        // Extract potential form field labels
        const lines = data.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        console.log('\n--- Text Content Analysis ---');
        console.log('Lines that might contain form labels:');
        
        const formIndicators = [
            'name', 'first', 'last', 'address', 'phone', 'email', 'date', 'signature',
            'city', 'state', 'zip', 'street', 'apt', 'unit', 'country',
            'title', 'company', 'organization', 'department',
            'birth', 'age', 'gender', 'sex',
            'yes', 'no', 'check', 'select', 'choose',
            ':', '_____', '___', 'fill', 'enter', 'provide'
        ];
        
        const potentialLabels = [];
        
        lines.forEach((line, index) => {
            const lowerLine = line.toLowerCase();
            const hasFormIndicator = formIndicators.some(indicator => 
                lowerLine.includes(indicator)
            );
            
            if (hasFormIndicator || line.includes(':') || line.includes('_')) {
                potentialLabels.push({
                    lineNumber: index + 1,
                    text: line,
                    context: {
                        previous: lines[index - 1] || '',
                        next: lines[index + 1] || ''
                    }
                });
            }
        });
        
        console.log(`\nFound ${potentialLabels.length} potential form-related lines:`);
        
        potentialLabels.forEach((label, index) => {
            console.log(`\n${index + 1}. Line ${label.lineNumber}: "${label.text}"`);
            if (label.context.previous) {
                console.log(`   Previous: "${label.context.previous}"`);
            }
            if (label.context.next) {
                console.log(`   Next: "${label.context.next}"`);
            }
        });
        
        // Try to identify patterns that might represent form fields
        console.log('\n--- Form Field Pattern Analysis ---');
        
        const fieldPatterns = [
            { pattern: /([A-Za-z\s]+):?\s*[_]{3,}/, description: 'Text followed by underlines' },
            { pattern: /([A-Za-z\s]+):?\s*\[\s*\]/, description: 'Text followed by checkbox' },
            { pattern: /([A-Za-z\s]+):\s*$/, description: 'Text ending with colon' },
            { pattern: /\b(First|Last|Full)\s+(Name|name)\b/, description: 'Name fields' },
            { pattern: /\b(Address|Street|City|State|ZIP|Phone|Email)\b/i, description: 'Contact fields' },
            { pattern: /\b(Date|Signature|Sign)\b/i, description: 'Date/Signature fields' }
        ];
        
        fieldPatterns.forEach(({ pattern, description }) => {
            const matches = [];
            lines.forEach((line, index) => {
                const match = line.match(pattern);
                if (match) {
                    matches.push({ lineNumber: index + 1, text: line, match: match[1] || match[0] });
                }
            });
            
            if (matches.length > 0) {
                console.log(`\n${description} (${matches.length} found):`);
                matches.forEach(match => {
                    console.log(`  Line ${match.lineNumber}: "${match.text}" → Label: "${match.match}"`);
                });
            }
        });
        
        return potentialLabels;
        
    } catch (error) {
        console.error(`Error analyzing ${pdfPath}:`, error.message);
        return [];
    }
}

async function main() {
    await checkDependencies();
    
    const pdfFiles = ['makana2025.pdf', 'tremfya.pdf'];
    
    for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(__dirname, pdfFile);
        if (fs.existsSync(pdfPath)) {
            await analyzePDFLabels(pdfPath);
        } else {
            console.log(`❌ PDF file not found: ${pdfPath}`);
        }
    }
    
    console.log('\n=== Analysis Complete ===');
    console.log('\nTo install required dependencies:');
    console.log('npm install pdf-parse');
    console.log('\nFor more advanced PDF analysis (including form field metadata):');
    console.log('npm install pdf2pic hummus-recipe pdf-lib');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { analyzePDFLabels };