#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function checkDependencies() {
    try {
        require('pdf-lib');
        console.log('✓ pdf-lib is available');
    } catch (error) {
        console.log('❌ pdf-lib not found. Install with: npm install pdf-lib');
        process.exit(1);
    }
}

async function extractFormFieldsWithContext(pdfPath) {
    try {
        const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } = require('pdf-lib');
        const pdfParse = require('pdf-parse');
        
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        console.log(`\n=== Form Field Analysis for ${path.basename(pdfPath)} ===`);
        
        // Get form fields
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        
        console.log(`Found ${fields.length} form fields`);
        
        // Also get text content for context
        const textData = await pdfParse(pdfBytes);
        const textLines = textData.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        const results = [];
        
        for (const field of fields) {
            const fieldInfo = {
                name: field.getName(),
                type: field.constructor.name,
                required: false,
                suggestedLabel: '',
                description: '',
                context: {
                    nearby: [],
                    potential_labels: [],
                    descriptions: []
                }
            };
            
            // Try to determine if field is required
            try {
                if (field instanceof PDFTextField) {
                    fieldInfo.required = field.isRequired && field.isRequired();
                }
            } catch (e) {
                // Some PDFs don't have proper required field metadata
            }
            
            // Analyze field name to suggest better labels
            const fieldName = field.getName().toLowerCase();
            fieldInfo.suggestedLabel = generateSuggestedLabel(fieldName);
            
            // Look for contextual clues in the text
            const contextualClues = findContextualLabels(fieldName, textLines);
            fieldInfo.context.potential_labels = contextualClues;
            
            // Look for descriptive text near the field
            const descriptions = findDescriptiveText(fieldName, textLines);
            fieldInfo.context.descriptions = descriptions;
            if (descriptions.length > 0) {
                fieldInfo.description = descriptions[0].text; // Use the highest confidence description
            }
            
            results.push(fieldInfo);
            
            console.log(`\n--- Field: ${field.getName()} ---`);
            console.log(`Type: ${field.constructor.name}`);
            console.log(`Required: ${fieldInfo.required}`);
            console.log(`Suggested Label: "${fieldInfo.suggestedLabel}"`);
            if (fieldInfo.description) {
                console.log(`Description: "${fieldInfo.description}"`);
            }
            
            if (contextualClues.length > 0) {
                console.log('Potential Labels from PDF Context:');
                contextualClues.forEach((clue, index) => {
                    console.log(`  ${index + 1}. "${clue.label}" (confidence: ${clue.confidence})`);
                    if (clue.context) {
                        console.log(`     Context: "${clue.context}"`);
                    }
                });
            }
            
            if (descriptions.length > 0) {
                console.log('Descriptive Text Found:');
                descriptions.forEach((desc, index) => {
                    console.log(`  ${index + 1}. "${desc.text}" (confidence: ${desc.confidence})`);
                    console.log(`     Location: ${desc.location}`);
                });
            }
        }
        
        return results;
        
    } catch (error) {
        console.error(`Error analyzing ${pdfPath}:`, error.message);
        return [];
    }
}

function generateSuggestedLabel(fieldName) {
    // Common field name patterns and their user-friendly labels
    const patterns = [
        { regex: /^(first|fname|firstname|first_name)$/i, label: 'First Name' },
        { regex: /^(last|lname|lastname|last_name)$/i, label: 'Last Name' },
        { regex: /^(name|full_name|fullname)$/i, label: 'Full Name' },
        { regex: /^(address|addr|street)$/i, label: 'Address' },
        { regex: /^(city)$/i, label: 'City' },
        { regex: /^(state|st)$/i, label: 'State' },
        { regex: /^(zip|zipcode|zip_code|postal)$/i, label: 'ZIP Code' },
        { regex: /^(phone|tel|telephone|phone_number)$/i, label: 'Phone Number' },
        { regex: /^(email|e_mail|email_address)$/i, label: 'Email Address' },
        { regex: /^(dob|date_of_birth|birthdate|birth_date)$/i, label: 'Date of Birth' },
        { regex: /^(ssn|social_security|social_security_number)$/i, label: 'Social Security Number' },
        { regex: /^(signature|sig|sign)$/i, label: 'Signature' },
        { regex: /^(date|current_date|today)$/i, label: 'Date' },
        { regex: /^(gender|sex)$/i, label: 'Gender' },
        { regex: /^(age)$/i, label: 'Age' },
        { regex: /^(company|employer|organization)$/i, label: 'Company/Organization' },
        { regex: /^(title|job_title|position)$/i, label: 'Title/Position' },
        { regex: /^(insurance|insurance_provider)$/i, label: 'Insurance Provider' },
        { regex: /^(policy|policy_number|policy_id)$/i, label: 'Policy Number' },
        { regex: /^(group|group_number|group_id)$/i, label: 'Group Number' },
        { regex: /^(diagnosis|medical_condition)$/i, label: 'Diagnosis/Medical Condition' },
        { regex: /^(medication|medications|drugs)$/i, label: 'Medications' },
        { regex: /^(allergies|allergy)$/i, label: 'Allergies' },
        { regex: /^(emergency_contact|emergency_name)$/i, label: 'Emergency Contact' },
        { regex: /^(relationship)$/i, label: 'Relationship' }
    ];
    
    for (const pattern of patterns) {
        if (pattern.regex.test(fieldName)) {
            return pattern.label;
        }
    }
    
    // If no specific pattern matches, try to clean up the field name
    return fieldName
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

function findDescriptiveText(fieldName, textLines) {
    const results = [];
    const fieldNameLower = fieldName.toLowerCase();
    
    // Look for lines that contain the field name
    textLines.forEach((line, index) => {
        const lineLower = line.toLowerCase();
        
        // If this line contains the field name (exact match or similar)
        if (lineLower.includes(fieldNameLower) || calculateSimilarity(fieldNameLower, lineLower) > 0.7) {
            // Look at the next few lines for descriptive text
            for (let i = 1; i <= 3; i++) {
                const nextLine = textLines[index + i];
                if (nextLine && isDescriptiveText(nextLine, fieldNameLower)) {
                    results.push({
                        text: nextLine.trim(),
                        confidence: 1.0 - (i * 0.2), // Closer lines have higher confidence
                        location: `Line ${index + i + 1} (${i} lines after field name)`,
                        lineNumber: index + i + 1
                    });
                }
            }
            
            // Also look at previous lines in case description comes before field name
            for (let i = 1; i <= 2; i++) {
                const prevLine = textLines[index - i];
                if (prevLine && isDescriptiveText(prevLine, fieldNameLower)) {
                    results.push({
                        text: prevLine.trim(),
                        confidence: 0.8 - (i * 0.2), // Previous lines have slightly lower confidence
                        location: `Line ${index - i + 1} (${i} lines before field name)`,
                        lineNumber: index - i + 1
                    });
                }
            }
        }
    });
    
    // Remove duplicates and sort by confidence
    return results
        .filter((item, index, arr) => 
            arr.findIndex(other => other.text === item.text) === index
        )
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3); // Top 3 descriptions
}

function isDescriptiveText(text, fieldName) {
    const textLower = text.toLowerCase();
    const trimmedText = text.trim();
    
    // Skip if text is too short or too long
    if (trimmedText.length < 10 || trimmedText.length > 200) {
        return false;
    }
    
    // Skip if text looks like a label or field name itself
    if (textLower.includes(':') && trimmedText.length < 50) {
        return false;
    }
    
    // Skip if text contains the field name (likely the label line)
    if (textLower.includes(fieldName)) {
        return false;
    }
    
    // Skip if text looks like navigation or UI elements
    const skipPatterns = [
        /^(line \d+|page \d+|section \d+)/i,
        /^(next|previous|back|continue|submit)/i,
        /^[\d\s.:]+$/,
        /^[_\-=\s]+$/
    ];
    
    for (const pattern of skipPatterns) {
        if (pattern.test(trimmedText)) {
            return false;
        }
    }
    
    // Look for descriptive indicators
    const descriptiveIndicators = [
        'using', 'provides', 'allows', 'enables', 'helps', 'solution', 'platform', 'system',
        'through', 'with', 'for', 'to', 'and', 'or', 'includes', 'features', 'offers',
        'resulting', 'exchange', 'manage', 'automat', 'document', 'data', 'communication'
    ];
    
    const hasDescriptiveWords = descriptiveIndicators.some(indicator => 
        textLower.includes(indicator)
    );
    
    // Must have some descriptive words and be reasonably long
    return hasDescriptiveWords && trimmedText.length > 30;
}

function findContextualLabels(fieldName, textLines) {
    const results = [];
    const fieldNameLower = fieldName.toLowerCase();
    
    // Look for lines that might contain labels for this field
    textLines.forEach((line, index) => {
        const lineLower = line.toLowerCase();
        
        // Check if this line mentions the field name or similar terms
        const similarity = calculateSimilarity(fieldNameLower, lineLower);
        
        if (similarity > 0.3) {
            // Extract potential label from this line
            const label = extractLabelFromLine(line);
            if (label && label.length > 0) {
                results.push({
                    label: label,
                    confidence: similarity,
                    context: line,
                    lineNumber: index + 1
                });
            }
        }
        
        // Look for patterns like "Label:" or "Label ____"
        const colonMatch = line.match(/([^:]+):\s*$/);
        if (colonMatch) {
            const potentialLabel = colonMatch[1].trim();
            if (isLikelyFieldLabel(potentialLabel, fieldNameLower)) {
                results.push({
                    label: potentialLabel,
                    confidence: 0.8,
                    context: line,
                    lineNumber: index + 1
                });
            }
        }
        
        // Look for patterns with underlines (common in forms)
        const underlineMatch = line.match(/([^_]+)_+/);
        if (underlineMatch) {
            const potentialLabel = underlineMatch[1].trim();
            if (isLikelyFieldLabel(potentialLabel, fieldNameLower)) {
                results.push({
                    label: potentialLabel,
                    confidence: 0.7,
                    context: line,
                    lineNumber: index + 1
                });
            }
        }
    });
    
    // Sort by confidence and remove duplicates
    return results
        .sort((a, b) => b.confidence - a.confidence)
        .filter((item, index, arr) => 
            arr.findIndex(other => other.label.toLowerCase() === item.label.toLowerCase()) === index
        )
        .slice(0, 5); // Top 5 matches
}

function calculateSimilarity(str1, str2) {
    // Simple similarity calculation based on common words
    const words1 = str1.split(/\W+/).filter(w => w.length > 2);
    const words2 = str2.split(/\W+/).filter(w => w.length > 2);
    
    let matches = 0;
    for (const word1 of words1) {
        for (const word2 of words2) {
            if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
                matches++;
                break;
            }
        }
    }
    
    return matches / Math.max(words1.length, words2.length, 1);
}

function extractLabelFromLine(line) {
    // Remove common non-label parts
    let cleaned = line
        .replace(/[_]{3,}/g, '') // Remove multiple underscores
        .replace(/\([^)]*\)/g, '') // Remove parenthetical content
        .replace(/\b(required|optional|fill\s+in|enter|provide)\b/gi, '') // Remove instruction words
        .replace(/[:]{1,}/g, '') // Remove colons
        .trim();
    
    // If the line is too long, try to extract just the label part
    if (cleaned.length > 50) {
        const parts = cleaned.split(/[,;]/);
        cleaned = parts[0].trim();
    }
    
    return cleaned;
}

function isLikelyFieldLabel(label, fieldName) {
    const labelLower = label.toLowerCase();
    const fieldLower = fieldName.toLowerCase();
    
    // Check for direct matches or partial matches
    if (labelLower.includes(fieldLower) || fieldLower.includes(labelLower)) {
        return true;
    }
    
    // Check for common field keywords
    const fieldKeywords = ['name', 'address', 'phone', 'email', 'date', 'signature', 'city', 'state', 'zip'];
    const hasFieldKeyword = fieldKeywords.some(keyword => 
        labelLower.includes(keyword) && fieldLower.includes(keyword)
    );
    
    return hasFieldKeyword;
}

async function main() {
    await checkDependencies();
    
    const pdfFiles = ['makana2025.pdf', 'tremfya.pdf'];
    
    for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(__dirname, pdfFile);
        if (fs.existsSync(pdfPath)) {
            const results = await extractFormFieldsWithContext(pdfPath);
            
            // Save results to JSON file for further processing
            const outputPath = path.join(__dirname, `${path.parse(pdfFile).name}_form_analysis.json`);
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            console.log(`\nResults saved to: ${outputPath}`);
        } else {
            console.log(`❌ PDF file not found: ${pdfPath}`);
        }
    }
    
    console.log('\n=== Analysis Complete ===');
    console.log('\nTo install required dependencies:');
    console.log('npm install pdf-lib');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { extractFormFieldsWithContext, generateSuggestedLabel };