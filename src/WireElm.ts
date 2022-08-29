import { CircuitElm } from "./CircuitElm";

export class WireElm extends CircuitElm {
    constructor(position: [number, number, number, number]) {
        super(position);
    }

    isWireEquivalent() { return true; }
    isRemovableWire() { return true; }
}