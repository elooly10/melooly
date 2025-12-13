import { componentRecord, Melooly, MeloolyLauncher } from "../index.js";
import { readFileSync, writeFileSync } from "fs"
import { Canvas } from "canvas"
import terminalImage from 'terminal-image';
import { config } from 'dotenv';
import { env } from 'process';
config({ quiet: true });
async function test() {
    let launcher = new MeloolyLauncher(env.MELOOLY_ID!, env.MELOOLY_KEY!);
    let meloolies = await launcher.getMelooly(env.USER_ID!);
    await meloolies[0].saveAllComponents();
    //await melooly.prepareComponents();
    let clone = new Melooly(meloolies[0].toSavefile());
    clone.addComponent('nose', 'demo', readFileSync('./test/demo.canvas', {encoding: 'utf-8'}))
    clone.components.nose = {color: '#00f', value: 'demo'}
    meloolies[0].copySavedComponents(clone);
    console.log(`Name: `, clone.name);
    console.log(`Components: `, clone.components);

    drawSample(clone, 2, { eyes: {
        color: '#ff0000',
        value: 'round'
    }})
};
test()

async function drawSample(melooly: Melooly, scale: number, items: Partial<componentRecord>) {
    let canvas = new Canvas(270 * scale, 270 * scale);
    let context = canvas.getContext('2d') as any as CanvasRenderingContext2D // Convert to HTML canvas
    context.fillStyle = melooly.favoriteColor;
    context.fillRect(0, 0, 270 * scale, 270 * scale);
    melooly.draw(context, scale, items);

    writeFileSync('./test/test.png', canvas.toBuffer())
    console.log(await terminalImage.file('./test/test.png', { width: '50%', height: '50%' }))
}