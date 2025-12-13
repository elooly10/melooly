import components from "./components.js";
declare class MeloolyLauncher {
    private key;
    private websiteID;
    static serverURL: string;
    /**
     * Creates a launcher with requested information
     * @param websiteID the ID of your API Key (not the key itself)
     * @param key the API Key, as administered on the website. These expire annually and will require a code update.
     */
    constructor(websiteID: string, key: string);
    /**
     * Creates a popup for user authentication
     * @param monitorSpeed The speed at which popup close events are monitored, in milliseconds. Defaults to 50ms.
     * @returns A promise resolving to user ID, or null, if the user selects not to share
     */
    initiatePopup(monitorSpeed?: number): Promise<string | null>;
    /**
     * Fetches Meloolies from the server
     * @param userID the user you want to get Meloolies from
     * @returns An array of Meloolies.
     * @throws If the key is invalid, the server has an error, the user has not approved sharing, etc.
     * @see MeloolyLauncher.initiatePopup for how to get the userID
     */
    getMelooly(userID: string): Promise<Melooly[]>;
}
export type layer = "blush" | "hair/back" | "hair/front" | "head" | "mole" | "eyes" | "nose" | "mouth" | "glasses" | "moustache";
export type componentRecord = Record<layer, {
    color: string;
    value: string;
}>;
/** Melooly character class. Provides drawing utils for applying to a canvas.
 */
declare class Melooly {
    components: Record<layer, {
        color: string;
        value: string;
    }>;
    name: string;
    gender: 'M' | 'F' | 'O' | 'P';
    favoriteColor: string;
    /** Import savefile to melooly */
    private importFile;
    /** URL all Meloolies load components from. Defaults to melooly website.
     * Layer is represented with \l, and value \v.
     */
    static componentURL: string;
    /** Creates a melooly from a melooly save file */
    constructor(file: string);
    readonly renderingOrder: layer[];
    /** Draws melooly at requested scale onto the provided canvas.
     * Canvas needs to be at least 270px × specified scale for component to fit. */
    draw(canvas: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, scale?: number, componentAdjustments?: Partial<typeof this.components>): void;
    /** Draws melooly component at requested scale onto the provided canvas.
     * Canvas needs to be at least 270px × specified scale for component to fit.
     */
    drawComponent(component: {
        layer: layer;
        name: string;
        color: string;
    }, canvas: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, scale?: number): void;
    /** Individual component saves. */
    private renders;
    /** Add drawing instructions for a custom component so it can be used as a feature (e.g. a new eye style) */
    addComponent(layer: layer, name: string, cff: string): Promise<void>;
    /** Save a component drawing instruction from the web */
    fetchComponent(layer: layer, value: string): Promise<void>;
    /** Delete all saved component drawing instructions */
    clearSavedComponents(): Promise<void>;
    /** Save drawing instructions for currently used components */
    saveSelectedComponents(): Promise<void>;
    /** Apply saved components to another melooly */
    copySavedComponents(clone: Melooly): void;
    /** Saves all component drawing instructions from the web */
    saveAllComponents(): Promise<void>;
    /** Convert melooly to string representation, which can be used to instantiate more Melooly classes */
    toSavefile(): string;
    /** Clone this melooly */
    clone(): Melooly;
    applyHairColor(color: string): void;
}
export { components, MeloolyLauncher, Melooly };
