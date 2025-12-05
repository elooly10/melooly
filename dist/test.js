import { Melooly } from "./index";
import { readFileSync, writeFileSync } from "fs";
import { Canvas } from "canvas";
import terminalImage from 'terminal-image';
async function test() {
    let demo = readFileSync('./demo.melooly', { encoding: 'utf-8' });
    let melooly = new Melooly(demo);
    await melooly.saveAllComponents();
    //await melooly.prepareComponents();
    let clone = new Melooly(melooly.toSavefile());
    clone.addComponent('nose', 'demo', readFileSync('./demo.canvas', { encoding: 'utf-8' }));
    clone.components.nose = { color: '#00f', value: 'demo' };
    melooly.copySavedComponents(clone);
    console.log(`Name: `, clone.name);
    console.log(`Components: `, clone.components);
    drawSample(clone, 2, { eyes: {
            color: '#ff0000',
            value: 'round'
        } });
}
;
test();
async function drawSample(melooly, scale, items) {
    let canvas = new Canvas(270 * scale, 270 * scale);
    let context = canvas.getContext('2d');
    context.fillStyle = melooly.favoriteColor;
    context.fillRect(0, 0, 270 * scale, 270 * scale);
    melooly.draw(context, scale, items);
    writeFileSync('test.png', canvas.toBuffer());
    console.log(await terminalImage.file('test.png', { width: '50%', height: '50%' }));
}
