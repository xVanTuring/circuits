import assert from "assert";
import { getPoint, Point } from "./Point";

interface Dumpable {
    getDumpType(): void;
}
interface HasFlag {
    getDefaultFlags(): number;
    hasFlag(flag: number): boolean;
}
interface Current {
    /**
     * set current for voltage source vn to c.
     * vn will be the same value as in a previous call to setVoltageSource(n, vn)
     * @param vn 
     * @param value 
     */
    setCurrent(vn: number, value: number): void;
    getCurrent(): number;
}


const CURRENT_TOO_FAST = 100;

export abstract class CircuitElm {

    nodes!: number[];
    volts!: number[];

    voltSource!: number;

    current: number = 0;
    curcount: number = 0;

    hasWireInfo = false;

    constructor(position: [number, number, number, number]) {
        this.allocNodes();
        this.point1 = getPoint(position[0], position[1]);
        this.point2 = getPoint(position[2], position[3]);
    }


    allocNodes() {
        const n = this.getPostCount() + this.getInternalNodeCount();
        if (this.nodes == null || this.nodes.length == 0) {
            this.nodes = Array(n).fill(0);
            this.volts = Array(n).fill(0);
        }
    }

    getPostCount(): number {
        return 2;
    }

    getInternalNodeCount(): number {
        return 0;
    }

    reset() {

        for (let i = 0; i != this.getPostCount() + this.getInternalNodeCount(); i++)
            this.volts[i] = 0;
        this.curcount = 0;
    }


    // getPostVoltage(x: number): number {
    //     assert(this.volts);
    //     return this.volts[x];
    // }

    setNodeVoltage(n: number, c: number) {
        this.volts[n] = c;
        // calculateCurrent();
    }

    getVoltageSourceCount(): number {
        return 0;
    }

    setNode(port: number, idx: number) {
        this.nodes[port] = idx;
    }

    setVoltageSource(n: number, v: number) {
        this.voltSource = v;
    }

    // getVoltageDiff() {
    //     return this.volts[0] - this.volts[1];
    // }

    get nonLinear() {
        return false;
    }

    getNode(n: number) {
        return this.nodes[n];
    }

    isWireEquivalent() {
        return false;
    }

    isRemovableWire() {
        return false;
    }

    point1: Point;
    point2: Point;

    getPost(n: number): Point {
        if (n == 0)
            return this.point1;
        if (n == 1)
            return this.point2;
        throw Error("No suce post");
    }

    getConnectedPost(): Point | null {
        return this.point2;
    }

    hasGroundConnection(n1: number) {
        return false;
    }

    get connectionNodeCount() {
        return this.getPostCount();
    }

    getConnectionNode(n: number) {
        return this.getNode(n);
    }
    getConnection(n1: number, n2: number): boolean {
        return true;
    }
}

function addCurCount(c: number, a: number): number {
    if (c === CURRENT_TOO_FAST || c === -CURRENT_TOO_FAST) {
        return c;
    }
    return c + a;
}