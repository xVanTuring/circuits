export interface Point {
    x: number;
    y: number;
}

// TODO: remove
const pointMap = new Map<string, Point>();
export function getPoint(x: number, y: number) {
    const key = `${x}_${y}`;
    if (!pointMap.has(key)) {
        pointMap.set(key, { x, y });
    }
    return pointMap.get(key)!;

}
