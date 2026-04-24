const fs = require('fs');
const path = require('path');

const DIRECTORY = path.join(__dirname, 'resources/js');

const REPLACEMENTS = [
    // Backgrounds
    { regex: /dark:bg-slate-900/g, replacement: 'dark:bg-background' },
    { regex: /dark:bg-gray-900/g, replacement: 'dark:bg-background' },
    { regex: /dark:bg-\[#222\]/g, replacement: 'dark:bg-background' },
    
    // Cards & popovers
    { regex: /dark:bg-slate-800/g, replacement: 'dark:bg-card' },
    { regex: /dark:bg-gray-800/g, replacement: 'dark:bg-card' },
    
    // Borders
    { regex: /dark:border-white\/5/g, replacement: 'dark:border-border' },
    { regex: /dark:border-white\/10/g, replacement: 'dark:border-border' },
    { regex: /dark:border-gray-800/g, replacement: 'dark:border-border' },
    { regex: /dark:border-gray-700/g, replacement: 'dark:border-border' },
    
    // Muted/secondary
    { regex: /dark:bg-slate-800\/50/g, replacement: 'dark:bg-card/50' },
    { regex: /dark:bg-slate-900\/80/g, replacement: 'dark:bg-background/80' },
    
    // Text
    { regex: /dark:text-gray-300/g, replacement: 'dark:text-muted-foreground' },
    { regex: /dark:text-gray-400/g, replacement: 'dark:text-muted-foreground' }
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

function replaceColors() {
    const files = walk(DIRECTORY);
    let updatedCount = 0;

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let initialContent = content;

        REPLACEMENTS.forEach(({ regex, replacement }) => {
            content = content.replace(regex, replacement);
        });

        if (content !== initialContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated: ${file.replace(DIRECTORY, '')}`);
            updatedCount++;
        }
    });

    console.log(`\nCompleted. Updated ${updatedCount} files.`);
}

replaceColors();
