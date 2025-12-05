import components from "./components.js";
import { applyCFF } from "canvasfileformat";
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
            else {
                // contents: [name, color, component]
                this.components[contents[0]] = {
                    color: contents[1],
                    value: contents[2]
                };
            }
        });
    }
    /** Creates a melooly from a melooly save file */
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
        applyCFF(canvas, appliedRender, false, scale);
    }
    /** Add drawing instructions for a custom component so it can be used as a feature (e.g. a new eye style) */
    async addComponent(layer, name, cff) {
        this.renders[layer] ??= {};
        this.renders[layer][name] = cff;
    }
    /** Save a component drawing instruction from the web */
    async fetchComponent(layer, value) {
        // Fetch from the web
        try {
            let result = await fetch(`https://melooly.vercel.app/components/${layer}/${value}.canvas`);
            if (!result.ok)
                throw { status: result.status, description: result.statusText, url: result.url };
            let render = await result.text();
            // Add to renders 
            this.addComponent(layer, value, render);
        }
        catch (error) {
            if (error.status)
                console.error(`Server Error ${error.status}: ${error.description} (url ${error.url})`);
            else
                console.error(error);
        }
    }
    /** Delete all saved component drawing instructions */
    async clearSavedComponents() {
        for (const key of Object.keys(this.renders)) {
            this.renders[key] = {};
        }
    }
    /** Save drawing instructions for currently used components */
    async saveSelectedComponents() {
        for (const entry of Object.entries(this.components)) {
            await this.fetchComponent(entry[0], entry[1].value);
        }
    }
    /** Apply saved components to another melooly */
    copySavedComponents(clone) {
        Object.entries(this.renders).forEach((layer) => {
            clone.renders[layer[0]] = { ...layer[1], ...clone.renders[layer[0]] };
        });
    }
    /** Saves all component drawing instructions from the web */
    async saveAllComponents() {
        // Handle non-hair features
        let entries = Object.entries(components);
        for (let entry of entries) {
            if (entry[0] != 'hair') {
                await Promise.all(entry[1].values.map((value) => this.fetchComponent(entry[0], value)));
            }
        }
        // Handle hair
        let hairFronts = new Set(components.hair.values.map(e => e.front));
        let hairBacks = new Set(components.hair.values.map(e => e.back));
        await Promise.all(new Array(...hairFronts).map((value) => this.fetchComponent('hair/front', value)));
        await Promise.all(new Array(...hairBacks).map((value) => (this.fetchComponent('hair/back', value))));
    }
    /** Convert melooly to string representation, which can be used to instantiate more Melooly classes */
    toSavefile() {
        let text = `${this.name}\t${this.favoriteColor}\t${this.gender}\n`;
        text += this.renderingOrder.map((layer) => {
            return `${layer}\t${this.components[layer].color ?? ""}\t${this.components[layer].value}`;
        }).join("\n");
        return text;
    }
    /** Clone this melooly */
    clone() {
        let clone = new Melooly(this.toSavefile());
        this.copySavedComponents(clone);
        return clone;
    }
    applyHairColor(color) {
        if (this.components.moustache.color == this.components["hair/back"].color)
            this.components.moustache.color = color;
        this.components["hair/back"].color = color;
        this.components["hair/front"].color = color;
    }
}
export { components, MeloolyLauncher, Melooly };
