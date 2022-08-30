import { CircuitElm } from "./CircuitElm";
import { CircuitNode } from "./CircuitNode";
import { GroundElm } from "./GroundElm";
import { VoltageElm } from "./VoltageElm";

export enum DetectType {
    INDUCT = 1,
    VOLTAGE,
    SHORT,
    CAP_V
}
export class FindPathInfo {
    visited: boolean[];

    constructor(private type: DetectType, private firstElm: CircuitElm,
        private dest: number, private nodeList: Array<CircuitNode>,
        private nodesWithGroundConnection: Array<CircuitElm>) {
        this.visited = Array(nodeList.length).fill(false);
    }

    findPath(n1: number) {
        if (n1 == this.dest)
            return true;
        if (this.visited[n1])
            return false;
        this.visited[n1] = true;
        const cn = this.nodeList[n1];
        if (cn == null)
            return false;

        for (const cnl of cn.links) {
            const ce = cnl.elm;
            if (this.checkElm(n1, ce))
                return true;
        }

        if (n1 == 0) {
            for (let i = 0; i < this.nodesWithGroundConnection.length; i++) {
                if (this.checkElm(0, this.nodesWithGroundConnection[i]))
                    return true;
            }
        }
        return false;
    }

    checkElm(n1: number, anotherCe: CircuitElm): boolean {
        if (anotherCe == this.firstElm)
            return false;
        if (this.type == DetectType.INDUCT) {
            // if(ce instanceof CurrentElm)
            // return false;
        }
        // 过滤出电压源,导线,和 地
        if (this.type == DetectType.VOLTAGE) {
            // when checking for voltage loops,
            // we only care about voltage sources/wires/ground
            if (!(anotherCe.isWireEquivalent() || anotherCe instanceof VoltageElm || anotherCe instanceof GroundElm)) {
                return false;
            }
        }
        if (this.type == DetectType.SHORT && !anotherCe.isWireEquivalent()) {
            return false;
        }

        if (n1 == 0) {
            // look for posts which have a ground connection;
            // our path can go through ground
            for (let j = 0; j < anotherCe.connectionNodeCount; j++) {
                if (anotherCe.hasGroundConnection(j) && this.findPath(anotherCe.getConnectionNode(j))) {
                    return false;
                }
            }
        }
        for (let j = 0; j < anotherCe.connectionNodeCount; j++) {
            if (anotherCe.getConnectionNode(j) == n1) {
                if (anotherCe.hasGroundConnection(j) && this.findPath(0))
                    return true;
            }
            // TODO: type == INDUCT

            for (let k = 0; k < anotherCe.connectionNodeCount; k++) {
                if (j == k)
                    continue;
                if (anotherCe.getConnection(j, k) && this.findPath(anotherCe.getConnectionNode(k)))
                    return true;

            }

        }
        return false;
    }

}