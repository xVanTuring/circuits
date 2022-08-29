import { CircuitElm } from "./CircuitElm";
import { Point } from "./Point";

export class GroundElm extends CircuitElm {

    isWireEquivalent() { return true; }
    isRemovableWire() { return true; }

    static firstGround: Point | null;

    getConnectedPost() {
        if (GroundElm.firstGround != null)
            return GroundElm.firstGround;
        GroundElm.firstGround = this.point1;
        return null;
    }

    hasGroundConnection(n1: number) {
        return true;
    }

    getPostCount() {
        return 1;
    }
}