import { componentRecord, layer, Melooly, MeloolyLauncher } from "../index.js";
import { readFileSync, writeFileSync } from "fs"
import { Canvas, CanvasRenderingContext2D as crc2D } from "canvas"
import terminalImage from 'terminal-image';
import { config } from 'dotenv';
import { env } from 'process';
import { styleText } from "util";
import { Path2D, applyPath2DToCanvasRenderingContext } from "path2d";
config({ quiet: true });
async function userTest(launcher: MeloolyLauncher) {
    let meloolies = await launcher.getMelooly(env.USER_ID!).catch((v) => {
        console.error(styleText('redBright',`Fetching from user encountered error ${v.status} with message "${v.error}"`));
        if (v.error == 'Unauthorized User') console.log(`You probably need to navigate to ${MeloolyLauncher.popupURL}${env.MELOOLY_ID} to enable data sharing.`)
    });
    if (!meloolies) return;
    await meloolies[0].saveAllComponents();
    //await melooly.prepareComponents();
    let clone = new Melooly(meloolies[0].toSavefile());
    clone.addComponent('nose', 'demo', readFileSync('./test/demo.canvas', { encoding: 'utf-8' }))
    clone.components.nose = { color: '#0000ff', value: 'demo' }
    meloolies[0].copySavedComponents(clone);;

    await drawSample(clone, 2, {
        eyes: {
            color: '#ff0000',
            value: 'round'
        }
    }, 'test1')
}
async function demoTest(launcher: MeloolyLauncher) {
    let demo = await launcher.getDemo().catch(v => console.error(v));
    if (!demo) return;
    await demo.saveSelectedComponents();
    await drawSample(demo, 3, {}, 'test2')
}
async function test() {
    // Apply polyfills
    globalThis.Path2D = Path2D as any;
    applyPath2DToCanvasRenderingContext(crc2D as any);

    console.log("Testing");
    
    Melooly.componentURL = 'http://localhost:5173/components/\\l/\\v.canvas'
    let launcher = new MeloolyLauncher(env.MELOOLY_ID!, env.MELOOLY_KEY!);
    await userTest(launcher);
    await demoTest(launcher);
};
test()

async function drawSample(melooly: Melooly, scale: number, items: Partial<componentRecord>, filename: string) {
    let canvas = new Canvas(270 * scale, 270 * scale);
    let context = canvas.getContext('2d') as any as CanvasRenderingContext2D // Convert to HTML canvas
    context.fillStyle = melooly.favoriteColor;
    context.fillRect(0, 0, 270 * scale, 270 * scale);
    melooly.draw(context, scale, items);

    console.log(`\n${styleText('cyanBright', melooly.name) } Components: `);
    Object.entries(melooly.components).forEach((entry)=>{
        let item = items[entry[0] as layer];
        console.log(`\t${entry[0].padEnd(12)}: ${styleText('yellow', entry[1].value.padEnd(14))} ${entry[1].color.padEnd(8)} ${item? styleText('green', `Replaced with ${item.color.padEnd(8)} ${item.value}`):''}`)
    });
    console.log('')
    writeFileSync(`./test/${filename}.png`, canvas.toBuffer())
    console.log(await terminalImage.file(`./test/${filename}.png`, { width: '50%', height: '50%' }))
}