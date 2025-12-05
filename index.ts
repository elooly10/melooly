import components from "./components";
import { applyCFF } from "canvasfileformat";
class MeloolyLauncher {
    private key: string;
    constructor(key: string) {
        this.key = key;
    }
    public async getUser(): Promise<string> {
        console.log("This is a demo function that will open a popup.");
        return '0'
    }
    public async getMelooly(userID: string): Promise<Melooly[]> {
        console.log("This is a demo function that will get stuff from the express server.");
        return []
    }
}
export type layer = "blush" | "hair/back" | "hair/front" | "head" | "mole" | "eyes" | "nose" | "mouth" | "glasses" | "moustache";
export type componentRecord = Record<layer, {
    color: string;
    value: string;
}>;
/** Melooly character class. Provides drawing utils for applying to a canvas.
 */
class Melooly {
    public components: Record<layer, { color: string, value: string }> = {} as any;
    public name: string = "";
    public gender: 'M' | 'F' | 'O' | 'P' = 'P';
    public favoriteColor: string = '#000000';
    /** Import savefile to melooly */
    private importFile(file: string) {
        file.split("\n").forEach((element, i) => {
            let contents = element.split("\t");
            if (i == 0) {
                this.name = contents[0];
                this.favoriteColor = contents[1];
                this.gender = contents[2] as typeof this.gender ?? 'P';
            } else {
                // contents: [name, color, component]
                this.components[contents[0] as layer] = {
                    color: contents[1],
                    value: contents[2]
                }
            }
        });
    }
    /** Creates a melooly from a melooly save file */
    constructor(file: string) {
        this.importFile(file)
    }
    readonly renderingOrder: layer[] = [
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
    ]
    // Static cff renders will be saved in the package
    /** Draws melooly at requested scale onto the provided canvas.
     * Canvas needs to be at least 270px × specified scale for component to fit. */
    public draw(canvas: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, scale: number = 1, componentAdjustments: Partial<typeof this.components> = {}) {
        const components = { ...this.components, ...componentAdjustments}
        for(const componentKey of this.renderingOrder) {
            this.drawComponent({layer: componentKey, name: components[componentKey].value, color: components[componentKey].color}, canvas, scale)
        }
    }
    /** Draws melooly component at requested scale onto the provided canvas.
     * Canvas needs to be at least 270px × specified scale for component to fit.
     */
    public drawComponent(component: { layer: layer, name: string, color: string }, canvas: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, scale: number = 1) {
        console.log(component)
        //Draw it!
        let render = this.renders[component.layer]?.[component.name];
        if(!render) {
            console.warn(`No component initialized for ${component.layer}/${component.name}`)
            return;
        }
        let appliedRender = 'begin path\n' + render.replaceAll("\\c", component.color);
        applyCFF(canvas, appliedRender, false, scale)
    }


    // Handle renders
    /** Individual component saves. */
    private renders: Partial<Record<layer, Record<string, string>>> = {};
    /** Add drawing instructions for a custom component so it can be used as a feature (e.g. a new eye style) */
    public async addComponent(layer: layer, name: string, cff: string) {
        this.renders[layer] ??= {};
        this.renders[layer][name] = cff;
    }
    /** Save a component drawing instruction from the web */
    public async fetchComponent(layer: layer, value: string) {
        // Fetch from the web
        try {
            let result = await fetch(`http://localhost:5173/components/${layer}/${value}.canvas`)
            if (!result.ok) throw { status: result.status, description: result.statusText, url: result.url }
            let render = await result.text()
            // Add to renders 
            this.addComponent(layer, value, render)
        } catch (error: any) {
            if(error.status) console.error(`Server Error ${error.status}: ${error.description} (url ${error.url})`)
            else console.error(error)
        }
    }
    /** Delete all saved component drawing instructions */
    public async clearSavedComponents() {
        for (const key of Object.keys(this.renders)) {
            this.renders[key as layer] = {};
        }
    }
    /** Save drawing instructions for currently used components */
    public async saveSelectedComponents() {
        for (const entry of Object.entries(this.components)) {
            await this.fetchComponent(entry[0] as layer, entry[1].value)
        }
    }
    /** Apply saved components to another melooly */
    public copySavedComponents(clone: Melooly) {
        Object.entries(this.renders).forEach((layer) => {
            clone.renders[layer[0] as layer] = { ...layer[1], ...clone.renders[layer[0] as layer] }
        })
    }

    /** Saves all component drawing instructions from the web */
    public async saveAllComponents() {
        // Handle non-hair features
        let entries = Object.entries(components);
        for (let entry of entries) {
            if (entry[0] != 'hair') {
                await Promise.all((entry[1].values as string[]).map((value) => this.fetchComponent(entry[0] as layer, value)));
            }
        }

        // Handle hair
        let hairFronts = new Set(components.hair.values.map(e => e.front));
        let hairBacks = new Set(components.hair.values.map(e => e.back));
        await Promise.all(new Array(...hairFronts).map((value) => this.fetchComponent('hair/front', value)));
        await Promise.all(new Array(...hairBacks).map((value) => (this.fetchComponent('hair/back', value))));
    }
    /** Convert melooly to string representation, which can be used to instantiate more Melooly classes */
    public toSavefile() {
        let text = `${this.name}\t${this.favoriteColor}\t${this.gender}\n`;

        text += this.renderingOrder.map((layer) => {
            return `${layer}\t${this.components[layer].color ?? ""}\t${this.components[layer].value}`
        }).join("\n");
        return text;
    }
    /** Clone this melooly */
    public clone() {
        let clone = new Melooly(this.toSavefile())
        this.copySavedComponents(clone);
        return clone;
    }

    public applyHairColor(color: string) {
        if(this.components.moustache.color == this.components["hair/back"].color) this.components.moustache.color = color;
        this.components["hair/back"].color = color;
        this.components["hair/front"].color = color;
    }
}

export {
    components,
    MeloolyLauncher,
    Melooly
}