import { MeloolyLauncher, primaryColors, components } from "../index.js";
import { writeFileSync } from "fs";
import { Canvas, CanvasRenderingContext2D as crc2D } from "canvas";
import { Path2D, applyPath2DToCanvasRenderingContext } from "path2d";
import terminalImage from 'terminal-image';
import { styleText } from "util";
async function demoTest(launcher) {
    MeloolyLauncher.demoServerURL = 'http://localhost:5173/demoCharacters/';
    let demos = await launcher.getDemos().catch(e => console.log(e));
    if (!demos)
        return;
    generateReport(demos);
    await Promise.all(demos.map(d => d.saveSelectedComponents()));
    for (let i = 0; i < demos.length; i++) {
        await drawSample(demos[i], 3, {}, `demo${i}`);
    }
}
async function test() {
    // Apply polyfills
    globalThis.Path2D = Path2D;
    applyPath2DToCanvasRenderingContext(crc2D);
    console.log("Testing");
    let launcher = new MeloolyLauncher('', '');
    await demoTest(launcher);
}
;
test();
function drawOntoCanvas(canvas, melooly, scale, items) {
    let context = canvas.getContext('2d'); // Convert to HTML canvas
    context.fillStyle = primaryColors[melooly.favoriteColor];
    context.fillRect(0, 0, 270 * scale, 270 * scale);
    melooly.draw(context, scale, items);
    return canvas.toBuffer();
}
async function drawSample(melooly, scale, items, filename) {
    let canvas = new Canvas(270 * scale, 270 * scale);
    console.log(`\n${styleText('cyanBright', melooly.name)} Components: `);
    Object.entries(melooly.components).forEach((entry) => {
        let item = items[entry[0]];
        console.log(`\t${entry[0].padEnd(12)}: ${styleText('yellow', entry[1].value.padEnd(14))} ${entry[1].color.padEnd(8)} ${item ? styleText('green', `Replaced with ${item.color.padEnd(8)} ${item.value}`) : ''}`);
    });
    writeFileSync(`./test/demoImages/${filename}.png`, drawOntoCanvas(canvas, melooly, scale, items));
    console.log(await terminalImage.file(`./test/demoImages/${filename}.png`, { width: 50, height: 50 }));
}
function generateReport(demos) {
    // Initialize stats container
    const stats = {};
    demos.forEach(demo => {
        // Iterate over all components in the demo
        Object.entries(demo.components).forEach(([layerName, data]) => {
            if (!stats[layerName]) {
                stats[layerName] = { components: {}, colors: {} };
            }
            // Track Component Usage
            if (!stats[layerName].components[data.value]) {
                stats[layerName].components[data.value] = [];
            }
            stats[layerName].components[data.value].push(demo.name);
            // Track Color Usage
            if (!stats[layerName].colors[data.color]) {
                stats[layerName].colors[data.color] = [];
            }
            stats[layerName].colors[data.color].push(demo.name);
        });
    });
    let rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
\\f0\\fs24`;
    // Helper to collect all valid values for a layer
    const getValidOptions = (layerName) => {
        if (layerName === 'hair/front') {
            const values = new Set(components["hair"].values.map(v => v.front));
            return { values: Array.from(values), colors: components["hair"].colors };
        }
        if (layerName === 'hair/back') {
            const values = new Set(components["hair"].values.map(v => v.back));
            return { values: Array.from(values), colors: components["hair"].colors };
        }
        // Handle other layers that match keys in components.ts
        const key = layerName;
        if (components[key]) {
            // Ensure we are working with string[] for values
            const vals = components[key].values;
            const stringVals = vals.map(v => (typeof v === 'string' ? v : JSON.stringify(v)));
            return { values: stringVals, colors: components[key].colors };
        }
        return { values: [], colors: [] };
    };
    // Iterate through layers
    for (const [layerName, layerData] of Object.entries(stats)) {
        const validOptions = getValidOptions(layerName);
        // Titleize layer name
        const title = layerName.charAt(0).toUpperCase() + layerName.slice(1);
        rtfContent += `\\fs32\\b ${title}\\b0\\fs24\\par\n`;
        rtfContent += `\\b Components\\b0\\par\n`;
        // Used Components
        for (const [compName, users] of Object.entries(layerData.components)) {
            // clean empty name for display
            const displayName = compName === '' ? '(empty)' : compName;
            rtfContent += `\\tab ${displayName} (${users.length})\\par\n`;
            users.forEach(u => rtfContent += `\\tab\\tab - ${u}\\par\n`);
        }
        // Unused Components
        const usedComps = new Set(Object.keys(layerData.components));
        const unusedComps = validOptions.values.filter((v) => !usedComps.has(v));
        if (unusedComps.length > 0) {
            rtfContent += `\\tab\\b Unused:\\b0\\par\n`;
            unusedComps.forEach((u) => {
                const displayName = u === '' ? '(empty)' : u;
                rtfContent += `\\tab\\tab - ${displayName}\\par\n`;
            });
        }
        rtfContent += `\\b Colors\\b0\\par\n`;
        // Used Colors
        for (const [color, users] of Object.entries(layerData.colors)) {
            // if empty color string (common for non-colored items like nose sometimes or if undefined)
            // display as (none)
            const displayName = color === '' ? '(none)' : color;
            rtfContent += `\\tab ${displayName} (${users.length})\\par\n`;
            users.forEach(u => rtfContent += `\\tab\\tab - ${u}\\par\n`);
        }
        // Unused Colors
        const usedColors = new Set(Object.keys(layerData.colors));
        const unusedColors = validOptions.colors.filter(c => !usedColors.has(c));
        if (unusedColors.length > 0) {
            rtfContent += `\\tab\\b Unused:\\b0\\par\n`;
            unusedColors.forEach(c => {
                rtfContent += `\\tab\\tab - ${c}\\par\n`;
            });
        }
        // Spacer
        rtfContent += `\\par\n`;
    }
    rtfContent += `}`;
    writeFileSync('./test/demo_report.rtf', rtfContent);
    console.log("Report generated at ./test/demo_report.rtf");
}
