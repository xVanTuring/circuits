import { CircuitElm } from "./CircuitElm";

export interface CircuitNodeLink {
    num: number;
    elm: CircuitElm;
}
export class CircuitNode {
    links: Array<CircuitNodeLink>;
    internal = false;
    constructor() {
        this.links = [];
    }
}
