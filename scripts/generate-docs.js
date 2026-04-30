import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { paramInfo } from '../src/paramInfo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let md = `# LindEvol Simulation Parameters

This document provides a comprehensive overview of the parameters that configure the LindEvol artificial ecology simulation.

> **Note**: This document is auto-generated from \`src/paramInfo.js\`. Do not edit it directly.

## Parameter Definitions

| Parameter | Type | Description |
| :--- | :--- | :--- |
`;

paramInfo.forEach(p => {
    md += `| **${p.label}** (\`${p.id}\`) | \`${p.type}\` | ${p.description} |\n`;
});

md += `\n## Action Map Weights\n\nThe \`action_map\` parameter is an array of integer weights that define the probability of specific actions occurring when a genetic rule executes. The indices correspond to:\n\n`;

const actionMap = paramInfo.find(p => p.id === 'action_map');
if (actionMap && actionMap.labels) {
    actionMap.labels.forEach((label, idx) => {
        md += `*   **[${idx}] ${label}**\n`;
    });
}

const outputPath = path.join(__dirname, '..', 'PARAMETERS.md');
fs.writeFileSync(outputPath, md);
console.log('Successfully generated PARAMETERS.md from src/paramInfo.js');
