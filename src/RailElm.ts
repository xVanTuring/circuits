import { CircuitElm } from "./CircuitElm";
import { VoltageElm } from "./VoltageElm";

export class RailElm extends VoltageElm {

    getPostCount() {
        return 1;
    }

    hasGroundConnection(n1: number) {
        return true;
    }
}