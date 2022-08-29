import { CircuitElm } from "./CircuitElm";

export class VoltageElm extends CircuitElm {

    getVoltageSourceCount() {
        return 1;
    }
}