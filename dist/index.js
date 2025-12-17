import components from "./components.js";
import { applyCFF } from "canvasff";
function getRandomNumbers(count, max) {
    if (count > max)
        return [];
    let numbers = [];
    for (let i = 0; i < count; i++) {
        let number;
        do {
            number = Math.floor(Math.random() * max);
        } while (numbers.includes(number));
        numbers.push(number);
    }
    return numbers;
}
class MeloolyLauncher {
    /**
     * Creates a launcher with requested information
     * @param websiteID the ID of your API Key (not the key itself)
     * @param key the API Key, as administered on the website. These expire annually and will require a code update.
     */
    constructor(websiteID, key) {
        this.key = key;
        this.websiteID = websiteID;
    }
    /**
     * Creates a popup for user authentication
     * @param monitorSpeed The speed at which popup close events are monitored, in milliseconds. Defaults to 100ms.
     * @returns A promise resolving to user ID, or null, if the user selects not to share
     */
    initiatePopup(monitorSpeed = 100) {
        let popup = open(MeloolyLauncher.popupURL + this.websiteID, "_blank", "width=310,height=400");
        return new Promise((resolve, reject) => {
            if (!popup) {
                reject();
                return;
            }
            // message handler may be removed from multiple places so keep a nullable ref
            let messageHandler = null;
            let timer = setInterval(function () {
                if (popup.closed) {
                    clearInterval(timer);
                    // Remove handler
                    if (messageHandler)
                        window.removeEventListener('message', messageHandler);
                    resolve(null);
                }
            }, monitorSpeed);
            messageHandler = ((event) => {
                // Ensure this comes from popup
                if (event.source !== popup)
                    return;
                clearInterval(timer);
                if (messageHandler)
                    window.removeEventListener('message', messageHandler);
                resolve(event.data);
            });
            window.addEventListener('message', messageHandler);
        });
    }
    /**
     * Fetches Meloolies from the server
     * @param userID the user you want to get Meloolies from
     * @returns An array of Meloolies.
     * @throws If the key is invalid, the server has an error, the user has not approved sharing, etc.
     * @see MeloolyLauncher.initiatePopup for how to get the userID
     */
    async getMelooly(userID) {
        let results = await fetch(MeloolyLauncher.serverURL + userID, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json'
            }
        });
        // if (!results.ok) throw { status: results.status, error: results.statusText };
        let json = await results.json();
        if (!Array.isArray(json))
            throw { status: results.status, error: json.message };
        else
            return json.map((v) => new Melooly(v));
    }
    ;
    /**
     * Gets a demo character
     * @param demoID The number ID of what demo character to load
     * @returns A melooly demo
     */
    async getDemo(demoID = Math.floor(Math.random() * MeloolyLauncher.demoCount)) {
        let results = await fetch(MeloolyLauncher.demoServerURL + demoID.toString(16).padStart(2, '0') + '.melooly');
        if (!results.ok)
            throw { status: results.status, error: results.statusText };
        let characterContents = await results.text();
        return new Melooly(characterContents);
    }
    ;
    async getRandomDemos(count) {
        let numbers = count > MeloolyLauncher.demoCount ? new Array(MeloolyLauncher.demoCount).fill(0).map((v, i) => i) :
            getRandomNumbers(count, MeloolyLauncher.demoCount);
        return await Promise.all(numbers.map(n => this.getDemo(n)));
    }
    ;
}
/** URL of the server that sends meloolies. */
MeloolyLauncher.serverURL = 'https://melooly.vercel.app/API/';
/** URL of the Demo Melooly database */
MeloolyLauncher.demoServerURL = 'https://melooly.vercel.app/demoCharacters/';
/** Number of Demo Meloolies in the database */
MeloolyLauncher.demoCount = 10;
/** URL of the auth popup */
MeloolyLauncher.popupURL = 'https://melooly.vercel.app/popup/';
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
            'moustache',
            'glasses',
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
            let result = await fetch(Melooly.componentURL.replaceAll('\\l', layer).replaceAll('\\v', value));
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
        let componentPromises = [];
        for (const entry of Object.entries(this.components)) {
            componentPromises.push(this.fetchComponent(entry[0], entry[1].value));
        }
        await Promise.allSettled(componentPromises);
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
        let componentPromises = [];
        for (let entry of entries) {
            if (entry[0] != 'hair') {
                componentPromises.push(...entry[1].values.map((value) => this.fetchComponent(entry[0], value)));
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
/** URL all Meloolies load components from. Defaults to melooly website.
 * Layer is represented with \l, and value \v.
 */
Melooly.componentURL = 'https://melooly.vercel.app/components/\\l/\\v.canvas';
export { components, MeloolyLauncher, Melooly };
