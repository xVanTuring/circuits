import { CircuitElm } from "./CircuitElm";
import { GroundElm } from "./GroundElm";
import { Point } from "./Point";
import { RailElm } from "./RailElm";
import { ResistorElm } from "./ResistorElm";
import { VoltageElm } from "./VoltageElm";
import { WireElm } from "./WireElm";


interface CircuitNodeLink {
    num: number;
    elm: CircuitElm;
}
interface NodeMapEntry {
    node: number; // should be -1 by default
}
function createNodeMapEntry(node = -1): NodeMapEntry {
    return {
        node: node
    };
}

class CircuitNode {
    links: Array<CircuitNodeLink>;
    internal = false;
    constructor() {
        this.links = [];
    }
}
interface WireInfo {
    wire: CircuitElm;
    neighbors: CircuitElm[];
    post: number;
}
function createWireInfo(elm: CircuitElm): WireInfo {
    return {
        wire: elm,
        neighbors: [],
        post: 0
    };
}
/**
 * 

$   1 0.000005 10.20027730826997 50 5 50 5e-11

id  position        flag    
g   256 288 256 304 0       0
r   256 128 256 224 0       1000
w   256 224 256 288 1       
R   256 128 256 48  0       0 40 6 0 0 0.5
                            waveform, frequency, maxVoltage,
                            bias, phaseShift ,dutyCycle
 */


const elmList: Array<CircuitElm> = [
    new GroundElm([256, 288, 256, 304]),
    new ResistorElm([256, 128, 256, 224]),
    new WireElm([256, 224, 256, 288]),
    new RailElm([256, 128, 256, 48]),
];
function analyzeCircuit(elmList: Array<CircuitElm>) {
    const nodeList: Array<CircuitNode> = [];
    const [nodeMap, wireInfoList] = calculateWireClosure(elmList);
    nodeMap.forEach((v, k) => {
        console.log(v, k);
    });
    setGroundNode(nodeList, elmList, nodeMap);

    const vscount = makeNodeList(nodeList, elmList, nodeMap);
    // let voltageSources = Array<CircuitElm>(vscount); 
    // console.log(vscount)
}

/**
 * @en
 * find groups of nodes connected by wire equivalents and map them to the same
 * node. this speeds things
 * up considerably by reducing the size of the matrix. We do this for wires,
 * labeled nodes, and ground.
 * The actual node we map to is not assigned yet. Instead we map to the same
 * NodeMapEntry.
 * @zh 
 * 找到通过"广义导线"连接的节点组并将它们映射到同一个节点。
 * @param elmList 
 * @returns 
 */
function calculateWireClosure(elmList: Array<CircuitElm>): [Map<Point, NodeMapEntry>, WireInfo[]] {
    GroundElm.firstGround = null;
    const nodeMap = new Map<Point, NodeMapEntry>();
    const wireInfoList: WireInfo[] = [];
    for (let i = 0; i < elmList.length; i++) {
        const ce: CircuitElm = elmList[i];
        if (!ce.isRemovableWire()) {
            continue;
        }
        ce.hasWireInfo = false;
        wireInfoList.push(createWireInfo(ce));
        let p0: Point = ce.getPost(0)!;
        let cn = nodeMap.get(p0);
        const p1 = ce.getConnectedPost();
        if (p1 == null) {
            if (cn == null) {
                cn = createNodeMapEntry();
                nodeMap.set(p0, cn);
            }
            continue;
        }
        let cn2 = nodeMap.get(p1);
        if (cn != null && cn2 != null) {
            for (const key of nodeMap.keys()) {
                if (nodeMap.get(key) == cn2) {
                    nodeMap.set(key, cn);
                }
            }
            continue;
        }
        if (cn != null) {
            nodeMap.set(p1, cn);
            continue;
        }
        if (cn2 != null) {
            nodeMap.set(p0, cn2);
            continue;
        }
        let nme = createNodeMapEntry();
        nodeMap.set(p0, nme);
        nodeMap.set(p1, nme);
    }
    return [nodeMap, wireInfoList];
}
/**
 * find or allocate ground node
 */
function setGroundNode(nodeList: Array<CircuitNode>, elmList: Array<CircuitElm>, nodeMap: Map<Point, NodeMapEntry>) {
    let gotGround = false;
    let gotRail = false;
    let volt: CircuitElm | null = null;

    for (let i = 0; i < elmList.length; i++) {
        const ce = elmList[i];
        if (ce instanceof GroundElm) {
            gotGround = true;
            let nme = nodeMap.get(ce.getPost(0)!)!;
            nme.node = 0;
            break;
        }
        if (ce instanceof RailElm)
            gotRail = true;
        if (volt == null && ce instanceof VoltageElm)
            volt = ce;
    }
    const cn: CircuitNode = new CircuitNode();
    nodeList.push(cn);

    if (!gotGround && !gotRail && volt != null) {
        const pt = volt.getPost(0)!;
        let cln = nodeMap.get(pt);
        if (cln != null) {
            cln.node = 0;
        } else {
            nodeMap.set(pt, createNodeMapEntry(0));
        }
    }

}
function makeNodeList(nodeList: Array<CircuitNode>, elmList: Array<CircuitElm>, nodeMap: Map<Point, NodeMapEntry>) {
    const postCountMap = new Map<Point, number>();
    let vscount = 0;
    for (let i = 0; i < elmList.length; i++) {
        const ce = elmList[i];
        // TODO: internalNodeAmount
        // let internalNodeAmount = ce.getInternalNodeCount();
        let voltageSourceCount = ce.getVoltageSourceCount();
        vscount += voltageSourceCount;
        let postCount = ce.getPostCount();

        for (let j = 0; j < postCount; j++) {
            const pt = ce.getPost(j);
            let g = postCountMap.get(pt);
            postCountMap.set(pt, g == null ? 1 : g + 1);

            let cln = nodeMap.get(pt);
            if (cln == null || cln.node == -1) {
                let cn = new CircuitNode();
                let link: CircuitNodeLink = {
                    num: j,
                    elm: ce,
                };
                cn.links.push(link);
                const globalId = nodeList.length;
                nodeList.push(cn);

                ce.setNode(j, globalId);
                if (cln != null) {
                    cln.node = globalId;
                } else {
                    nodeMap.set(pt, createNodeMapEntry(globalId));
                }
            } else {
                const n = cln.node;
                const cnl: CircuitNodeLink = {
                    num: j,
                    elm: ce
                };
                nodeList[n].links.push(cnl);
                ce.setNode(j, n);
                if (n == 0)
                    ce.setNodeVoltage(j, 0);
            }
        }
    }
    return vscount;
}

function calcWireInfo(wireInfoList: Array<WireInfo>, nodeList: Array<CircuitNode>) {
    let moved = 0;
    const loopList = [...wireInfoList];
    const wireCount = loopList.length;
    while (loopList.length > 0) {
        const wi = loopList.shift()!;
        const wire = wi.wire;
        const cn1 = nodeList[wire.getNode(0)];

        const neighbors0: Array<CircuitElm> = [];
        const neighbors1: Array<CircuitElm> = [];
        let isReady0 = true;
        let isReady1 = !(wire instanceof GroundElm);

        for (let j = 0; j < cn1.links.length; j++) {
            const cnl = cn1.links[j];
            const ce = cnl.elm;
            if (ce == wire)
                continue;
            const pt = ce.getPost(cnl.num);
            const notReady = (ce.isRemovableWire() && !ce.hasWireInfo);

            if (pt.x == wire.point1.x && pt.y == wire.point1.y) {
                neighbors0.push(ce);
                if (notReady)
                    isReady0 = false;
            } else if (wire.getPostCount() > 1) { // 不是地线
                const p2 = wire.getConnectedPost()!;
                if (pt.x == p2?.x && pt.y == p2?.y) {
                    neighbors0.push(ce);
                    if (notReady) {
                        isReady1 = false;
                    }
                }
            }// todo LabeledNodeElm
        }
        if (isReady0) {
            wi.neighbors = neighbors0;
            wi.post = 0;
            wire.hasWireInfo = true;
            moved = 0;
        } else if (isReady1) {
            wi.neighbors = neighbors1;
            wi.post = 1;
            wire.hasWireInfo = true;
            moved = 0;
        } else {
            loopList.push(wi);
            moved++;
            if (moved > wireCount * 2) {
                console.error("Wire loop detected", wire);
                return false;
            }
        }
    }
    return true;
}
analyzeCircuit(elmList);