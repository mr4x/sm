export function findLimits(points) {
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity,
        minZ = Infinity,
        maxZ = -Infinity;

    for (const p of points) {
        const x = p.x;
        const y = p.y;
        const z = p.z;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
    }

    minX = Math.min(minX, 0);
    minY = Math.min(minY, 0);
    minZ = Math.min(minZ, 0);

    return { minX, minY, minZ, maxX, maxY, maxZ };
}

export function unionLimits(a, b) {
    return {
        minX: Math.min(a.minX, b.minX),
        minY: Math.min(a.minY, b.minY),
        minZ: Math.min(a.minZ, b.minZ),
        maxX: Math.max(a.maxX, b.maxX),
        maxY: Math.max(a.maxY, b.maxY),
        maxZ: Math.max(a.maxZ, b.maxZ),
    };
}

export function normalize(v) {
    const w = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / w, v[1] / w, v[2] / w];
}
