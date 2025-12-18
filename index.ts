import components from "./components.js";
import { applyCFF } from "canvasff";
function getRandomNumbers(count: number, max: number) {
    if(count > max) return [];
    let numbers: number[] = [];
    for(let i = 0; i < count; i++) {
        let number: number;
        do {
            number = Math.floor(Math.random() * max)
        } while(numbers.includes(number))
        numbers.push(number);
    }
    return numbers;
}
class MeloolyLauncher {
    private key: string;
    private websiteID: string;
    /** URL of the server that sends meloolies. */
    static serverURL: string = 'https://melooly.vercel.app/API/';
    /** URL of the Demo Melooly database */
    static demoServerURL: string = 'https://melooly.vercel.app/demoCharacters/';
    /** Number of Demo Meloolies in the database */
    static readonly demoCount = 10;
    /** URL of the auth popup */
    static popupURL: string = 'https://melooly.vercel.app/popup/';
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
     * @param monitorSpeed The speed at which popup close events are monitored, in milliseconds. Defaults to 100ms.
     * @returns A promise resolving to user ID, or null, if the user selects not to share
     */
    public initiatePopup(monitorSpeed = 100) {
        let popup = open(MeloolyLauncher.popupURL + this.websiteID, "_blank", "width=310,height=400");
        return new Promise<string | null>((resolve, reject) => {
            if (!popup) {
                reject();
                return;
            }
            // message handler may be removed from multiple places so keep a nullable ref
            let messageHandler: EventListener | null = null;
            let timer = setInterval(function () {
                if (popup.closed) {
                    clearInterval(timer);
                    // Remove handler
                    if (messageHandler) window.removeEventListener('message', messageHandler);
                    resolve(null)
                }
            }, monitorSpeed);

            messageHandler = ((event: MessageEvent) => {
                // Ensure this comes from popup
                if (event.source !== popup) return;
                clearInterval(timer);
                if (messageHandler) window.removeEventListener('message', messageHandler);
                resolve(event.data as string);
            }) as EventListener;

            window.addEventListener('message', messageHandler);
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
        let results = await fetch(MeloolyLauncher.serverURL + userID, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json'
            }
        });
        // if (!results.ok) throw { status: results.status, error: results.statusText };
        let json: string[] | {message: string} = await results.json();
        if (!Array.isArray(json)) throw { status: results.status, error: json.message };
        else return json.map((v) => new Melooly(v));
    };
    /**
     * Gets a demo character
     * @param demoID The number ID of what demo character to load
     * @returns A melooly demo
     */
    public async getDemo(demoID: number = Math.floor(Math.random() * MeloolyLauncher.demoCount)): Promise<Melooly> {
        let results = await fetch(MeloolyLauncher.demoServerURL + demoID.toString(16).padStart(2, '0') + '.melooly');
        if (!results.ok) throw { status: results.status, error: results.statusText };
        let characterContents: string = await results.text();
        return new Melooly(characterContents);
    };

    /** Basic function to get multiple demo characters
     * If count is set to a number less than the number of demo characters, count number of demos will be grabbed randomly (each demo is unique).
     * If it is unset or set to Infinity, each demo will be got in numerical order
     */
    public async getDemos(count: number = Infinity): Promise<Melooly[]> {
        let numbers: number[] = count > MeloolyLauncher.demoCount?new Array(MeloolyLauncher.demoCount).fill(0).map((v, i)=>i) :
        getRandomNumbers(count, MeloolyLauncher.demoCount);
        return await Promise.all(numbers.map(n=>this.getDemo(n)))
    };
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
    public favoriteColor: number = 0;
    /** Import savefile to melooly */
    private importFile(file: string) {
        file.split("\n").forEach((element, i) => {
            let contents = element.split("\t");
            if (i == 0) {
                this.name = contents[0];
                this.favoriteColor = parseInt(contents[1]);
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
        'moustache',
        'glasses',
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
        applyCFF(canvas, appliedRender, scale)
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

/** An object converting the favorite color to a hex value  */
const primaryColors: Record<number, string> = {
    0:  '#382E2E', // Black
    1:  '#FF0040', // Red
    2:  '#FF8000', // Orange
    3:  '#FFFF00', // Yellow
    4:  '#00A82A', // Green
    5:  '#2050DF', // Blue
    6:  '#6040BF', // Purple
    7:  '#FF80DF', // Pink
    8:  '#BFFF00', // Lime
    9:  '#107070', // Teal
    10: '#00BFFF', // Sky
    11: '#BF409F', // Fuchsia
    12: '#804000', // Brown
    13: '#808000', // Olive
    14: '#879292', // Gray
    15: '#F2F3F3'  // White
 // 16: "#800020", // Maroon
 // 17: "#206030", // Forest
 // 18: "#200080", // Navy
 // 19: "#EFD790", // Cream
 // 20: '#D2691E', // Carmel
};

export {
    components,
    primaryColors,
    MeloolyLauncher,
    Melooly
}