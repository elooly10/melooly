"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Melooly = exports.MeloolyLauncher = exports.components = void 0;
const components_1 = __importDefault(require("./components"));
exports.components = components_1.default;
const canvasfileformat_1 = require("canvasfileformat");
class MeloolyLauncher {
    constructor(key) {
        this.key = key;
    }
    async getUser() {
        console.log("This is a demo function that will open a popup.");
        return '0';
    }
    async getMelooly(userID) {
        console.log("This is a demo function that will get stuff from the express server.");
        return [];
    }
}
exports.MeloolyLauncher = MeloolyLauncher;
/** Melooly character class. Provides drawing utils for applying to a canvas.
 */
class Melooly {
    /** Import savefile to melooly */
    importFile(file) {
        file.split("\n").forEach((element, i) => {
            let contents = element.split("\t");
            if (i == 0) {
                this.name = contents[0];
                this.favoriteColor = contents[1];
                this.gender = contents[2] ?? 'P';
            }
            else if (i == 1) {
                this.components['hair/back'] = {
                    color: contents[0],
                    value: contents[2]
                };
                this.components['hair/front'] = {
                    color: contents[0],
                    value: contents[1]
                };
            }
            else {
                // contents: [name, color, component]
                this.components[contents[0]] = {
                    color: contents[1],
                    value: contents[2]
                };
            }
        });
    }
    /** file: Melooly save file, from Melooly.toSaveFile */
    constructor(file) {
        this.components = {};
        this.name = "";
        this.gender = 'P';
        this.favoriteColor = '#000000';
        this.renderingOrder = [
            'hair/back',
            'head',
            'blush',
            'mole',
            'eyes',
            'nose',
            'mouth',
            'glasses',
            'moustache',
            'hair/front'
        ];
        // Handle renders
        /** Individual component saves. */
        this.renders = {};
        this.importFile(file);
    }
    // Static cff renders will be saved in the package
    /** Draws melooly at requested scale onto the provided canvas.
     * Canvas needs to be at least 270px × specified scale for component to fit. */
    draw(canvas, scale = 1, componentAdjustments = {}) {
        const components = { ...this.components, ...componentAdjustments };
        for (const componentKey of this.renderingOrder) {
            this.drawComponent({ layer: componentKey, name: components[componentKey].value, color: components[componentKey].color }, canvas, scale);
        }
    }
    /** Draws melooly component at requested scale onto the provided canvas.
     * Canvas needs to be at least 270px × specified scale for component to fit.
     */
    drawComponent(component, canvas, scale = 1) {
        console.log(component);
        //Draw it!
        let render = this.renders[component.layer]?.[component.name];
        if (!render) {
            console.warn(`No component initialized for ${component.layer}/${component.name}`);
            return;
        }
        let appliedRender = 'begin path\n' + render.replaceAll("\\c", component.color);
        (0, canvasfileformat_1.applyCFF)(canvas, appliedRender, false, scale);
    }
    /** Save a component drawing instruction from the web */
    async fetchComponent(layer, component) {
        // Fetch from the web
        try {
            let result = await fetch(`http://localhost:5173/components/${layer}/${component}.canvas`);
            if (!result.ok)
                throw { status: result.status, description: result.statusText, url: result.url };
            let render = await result.text();
            // Add to renders 
            if (!this.renders[layer])
                this.renders[layer] = {};
            this.renders[layer][component] = render;
        }
        catch (error) {
            if (error.status)
                console.error(`Server Error ${error.status}: ${error.description} (url ${error.url})`);
            else
                console.error(error);
        }
    }
    /** Delete all saved component drawing instructions */
    async clearComponents() {
        for (const key of Object.keys(this.renders)) {
            this.renders[key] = {};
        }
    }
    /** Load drawing instructions for currently used components */
    async prepareComponents() {
        for (const entry of Object.entries(this.components)) {
            await this.fetchComponent(entry[0], entry[1].value);
        }
    }
    /** Saves all component drawing instructions from the web */
    async saveAllComponents() {
        // Handle non-hair features
        let entries = Object.entries(components_1.default);
        for (let entry of entries) {
            if (entry[0] != 'hair') {
                await Promise.all(entry[1].values.map((value) => this.fetchComponent(entry[0], value)));
            }
        }
        // Handle hair
        let hairFronts = new Set(components_1.default.hair.values.map(e => e.front));
        let hairBacks = new Set(components_1.default.hair.values.map(e => e.back));
        await Promise.all(new Array(...hairFronts).map((value) => this.fetchComponent('hair/front', value)));
        await Promise.all(new Array(...hairBacks).map((value) => (this.fetchComponent('hair/back', value))));
    }
    /** Convert melooly to string representation, which can be used to instantiate more Melooly classes */
    toSavefile() {
        let text = `${this.name}\t${this.favoriteColor}\t${this.gender}\n${this.components["hair/front"].color}\t${this.components["hair/front"].value}\t${this.components["hair/back"].value}\n`;
        text += Object.entries(this.components).map((component) => {
            return `${component[0]}\t${component[1].color ?? ""}\t${component[1].value}`;
        }).join("\n");
        return text;
    }
    /** Clone this melooly */
    clone() {
        let clone = new Melooly(this.toSavefile());
        this.copyComponents(clone);
        return clone;
    }
    /** Apply saved renders to another melooly */
    copyComponents(clone) {
        Object.entries(this.renders).forEach((layer) => {
            clone.renders[layer[0]] = { ...layer[1], ...clone.renders[layer[0]] };
        });
    }
}
exports.Melooly = Melooly;
