export function worldToScreen(x: number, y: number) { return { x: (x-y)*32, y: (x+y)*16 }; }
