"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const fs_1 = require("fs");
const canvas_1 = require("canvas");
const terminal_image_1 = __importDefault(require("terminal-image"));
async function test() {
    let demo = (0, fs_1.readFileSync)('./demo.melooly', { encoding: 'utf-8' });
    let melooly = new index_1.Melooly(demo);
    await melooly.saveAllComponents();
    //await melooly.prepareComponents();
    let clone = new index_1.Melooly(demo);
    melooly.copyComponents(clone);
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
    let canvas = new canvas_1.Canvas(270 * scale, 270 * scale);
    let context = canvas.getContext('2d');
    context.fillStyle = melooly.favoriteColor;
    context.fillRect(0, 0, 270 * scale, 270 * scale);
    melooly.draw(context, scale, items);
    (0, fs_1.writeFileSync)('test.png', canvas.toBuffer());
    console.log(await terminal_image_1.default.file('test.png', { width: '50%', height: '50%' }));
}
