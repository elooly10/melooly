import components from "./components.js";
import { applyCFF } from "canvasfileformat";
class MeloolyLauncher {
    private key: string;
    private websiteID: string;
    static serverURL: string = 'http://localhost:3000/meloolies/'; // URL of server.
    /**
     * Creates a launcher with requested information
     * @param websiteID the ID of your API Key (not the key itself)
     * @param key the API Key, as administered on the website. These expire annually and will require a code update.
     */
    constructor(websiteID: string, key: string) {
        this.key = key;
        this.websiteID = websiteID
    }
    /**
     * Creates a popup for user authentication  
     * @param monitorSpeed The speed at which popup close events are monitored, in milliseconds. Defaults to 50ms.
     * @returns A promise resolving to user ID, or null, if the user selects not to share
     */
    public initiatePopup(monitorSpeed = 100) {
        let popup = open(`http://melooly.vercel.app/popup/${this.websiteID}`, "_blank", "width=310,height=400");
        return new Promise<string | null>((resolve, reject) => {
            if (!popup) {
                reject();
                return;
            }
            let timer = setInterval(function () {
                if (popup.closed) {
                    clearInterval(timer);
                    console.log('Popup closed')
                    resolve(null)
                }
            }, monitorSpeed);
            popup.addEventListener('message', (message) => {
                console.log(message.data)
                clearInterval(timer);
                resolve(message.data);
            })
        })
    }
    /** 
     * Fetches Meloolies from the server
     * @param userID the user you want to get Meloolies from
     * @returns An array of Meloolies.
     * @throws If the key is invalid, the server has an error, the user has not approved sharing, etc.
     * @see MeloolyLauncher.initiatePopup for how to get the userID
     */
    public async getMelooly(userID: string): Promise<Melooly[]> {
            let results = await fetch(`${MeloolyLauncher.serverURL}${userID}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.key}`,
                    'Content-Type': 'application/json'
                }
            });
            if(!results.ok) throw {status: results.status, error: results.statusText};
            let json: string[] | {error: string} = await results.json();
            if(!Array.isArray(json)) throw {status: results.status, error: json.error};
            else return json.map((v)=>new Melooly(v));
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
    /** URL all Meloolies load components from. Defaults to melooly website.
     * Layer is represented with \l, and value \v.
     */
    static componentURL = 'https://melooly.vercel.app/components/\\l/\\v.canvas'
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
        const components = { ...this.components, ...componentAdjustments }
        for (const componentKey of this.renderingOrder) {
            this.drawComponent({ layer: componentKey, name: components[componentKey].value, color: components[componentKey].color }, canvas, scale)
        }
    }
    /** Draws melooly component at requested scale onto the provided canvas.
     * Canvas needs to be at least 270px × specified scale for component to fit.
     */
    public drawComponent(component: { layer: layer, name: string, color: string }, canvas: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, scale: number = 1) {
        //Draw it!
        let render = this.renders[component.layer]?.[component.name];
        if (!render) {
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
            let result = await fetch(Melooly.componentURL.replaceAll('\\l', layer).replaceAll('\\v', value))
            if (!result.ok) throw { status: result.status, description: result.statusText, url: result.url }
            let render = await result.text()
            // Add to renders 
            this.addComponent(layer, value, render)
        } catch (error: any) {
            if (error.status) console.error(`Server Error ${error.status}: ${error.description} (url ${error.url})`)
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
        let componentPromises: Promise<void>[] = [];
        for (const entry of Object.entries(this.components)) {
            componentPromises.push(this.fetchComponent(entry[0] as layer, entry[1].value));
        }
        await Promise.allSettled(componentPromises);
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
        let componentPromises: Promise<void>[] = [];
        for (let entry of entries) {
            if (entry[0] != 'hair') {
                componentPromises.push(...(entry[1].values as string[]).map((value) => this.fetchComponent(entry[0] as layer, value)));
            }
        }

        // Handle hair
        let hairFronts = new Set(components.hair.values.map(e => e.front));
        let hairBacks = new Set(components.hair.values.map(e => e.back));
        componentPromises.push(...new Array(...hairFronts).map((value) => this.fetchComponent('hair/front', value)));
        componentPromises.push(...new Array(...hairBacks).map((value) => (this.fetchComponent('hair/back', value))));

        // Load!
        await Promise.allSettled(componentPromises);
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
        if (this.components.moustache.color == this.components["hair/back"].color) this.components.moustache.color = color;
        this.components["hair/back"].color = color;
        this.components["hair/front"].color = color;
    }
}

export {
    components,
    MeloolyLauncher,
    Melooly
}