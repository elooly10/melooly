import { componentRecord, layer, Melooly, MeloolyLauncher } from "../index.js";
import { writeFileSync } from "fs"
import { Canvas, CanvasRenderingContext2D as crc2D } from "canvas"
import { Path2D, applyPath2DToCanvasRenderingContext } from "path2d";
import terminalImage from 'terminal-image';
import { styleText } from "util";
async function demoTest(launcher: MeloolyLauncher) {
	let demos = await Promise.all(new Array(MeloolyLauncher.demoCount - 1).fill(undefined).map((v, i)=>launcher.getDemo(i)
	)).catch(v => console.error(v));
	if (!demos) return;
	await Promise.all(demos.map(d=>d.saveSelectedComponents()));
	for(let i = 0; i < demos.length; i++) {
		await drawSample(demos[i], 3, {}, `demo${i}`);
	}
}
async function test() {
	// Apply polyfills
	globalThis.Path2D = Path2D as any;
	applyPath2DToCanvasRenderingContext(crc2D as any);
	Melooly.componentURL = 'http://localhost:5173/components/\\l/\\v.canvas'
	console.log("Testing");
	let launcher = new MeloolyLauncher('','');
	await demoTest(launcher);
};
test()

async function drawSample(melooly: Melooly, scale: number, items: Partial<componentRecord>, filename: string) {
	let canvas = new Canvas(270 * scale, 270 * scale);
	let context = canvas.getContext('2d') as any as CanvasRenderingContext2D // Convert to HTML canvas
	context.fillStyle = melooly.favoriteColor;
	context.fillRect(0, 0, 270 * scale, 270 * scale);
	melooly.draw(context, scale, items);

	console.log(`\n${styleText('cyanBright', melooly.name)} Components: `);
	Object.entries(melooly.components).forEach((entry) => {
		let item = items[entry[0] as layer];
		console.log(`\t${entry[0].padEnd(12)}: ${styleText('yellow', entry[1].value.padEnd(14))} ${entry[1].color.padEnd(8)} ${item ? styleText('green', `Replaced with ${item.color.padEnd(8)} ${item.value}`) : ''}`)
	});
	console.log('')
	writeFileSync(`./test/${filename}.png`, canvas.toBuffer())
	console.log(await terminalImage.file(`./test/${filename}.png`, { width: '50%', height: '50%' }))
}