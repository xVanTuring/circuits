import { CircuitElm } from "./CircuitElm";

export class ResistorElm extends CircuitElm {
    resistance: number;
    constructor(position: [number, number, number, number], r?: number) {
        super(position);
        this.resistance = r ?? 1000;
    }

}