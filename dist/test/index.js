import { Melooly, MeloolyLauncher } from "../index.js";
import { readFileSync, writeFileSync } from "fs";
import { Canvas } from "canvas";
import terminalImage from 'terminal-image';
import { config } from 'dotenv';
import { env } from 'process';
config({ quiet: true });
async function userTest(launcher) {
    let meloolies = await launcher.getMelooly(env.USER_ID).catch((v) => {
        console.error(v);
        console.log(`You might need to navigate to ${MeloolyLauncher.popupURL}${env.MELOOLY_ID} to enable data sharing.`);
    });
    if (!meloolies)
        return;
    await meloolies[0].saveAllComponents();
    //await melooly.prepareComponents();
    let clone = new Melooly(meloolies[0].toSavefile());
    clone.addComponent('nose', 'demo', readFileSync('./test/demo.canvas', { encoding: 'utf-8' }));
    clone.components.nose = { color: '#00f', value: 'demo' };
    meloolies[0].copySavedComponents(clone);
    ;
    await drawSample(clone, 2, {
        eyes: {
            color: '#ff0000',
            value: 'round'
        }
    }, 'test1');
}
async function demoTest(launcher) {
    let demo = await launcher.getDemo().catch(v => console.error(v));
    if (!demo)
        return;
    await demo.saveSelectedComponents();
    await drawSample(demo, 3, {}, 'test2');
}
async function test() {
    console.log("Testing");
    let launcher = new MeloolyLauncher(env.MELOOLY_ID, env.MELOOLY_KEY);
    await userTest(launcher);
    await demoTest(launcher);
}
;
test();
async function drawSample(melooly, scale, items, filename) {
    let canvas = new Canvas(270 * scale, 270 * scale);
    let context = canvas.getContext('2d'); // Convert to HTML canvas
    context.fillStyle = melooly.favoriteColor;
    context.fillRect(0, 0, 270 * scale, 270 * scale);
    melooly.draw(context, scale, items);
    console.log(`Name: `, melooly.name);
    console.log(`Components: `, melooly.components);
    writeFileSync(`./test/${filename}.png`, canvas.toBuffer());
    console.log(await terminalImage.file(`./test/${filename}.png`, { width: '50%', height: '50%' }));
}
