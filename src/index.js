import u from 'umbrellajs';
import Zdog from 'zdog';
import { transpose, multiply, inv } from 'mathjs';

import * as utils from './utils';
import data from './data.json';

const AXIS_FULL = 700;
const POINT_SIZE = 3;

const COLOR_RED = 'rgba(255,65,54,0.8)';
const COLOR_GREEN = 'rgba(46,204,64,0.8)';
const COLOR_BLUE = 'rgba(0,116,217,0.8)';
const COLOR_GOLD = 'rgba(238,170,0,0.8)';
const COLOR_PURPLE = 'rgba(102,51,102,0.8)';

const n = 200;
const d = 0.001;
const precision = 3;

function drawPlot(element, data) {
    console.log(data);
    let isSpinning = true;

    const { minX, minY, minZ, maxX, maxY, maxZ } = utils.unionLimits(
        utils.findLimits(data[0].points),
        utils.findLimits(data[1].points)
    );

    const dx = maxX - minX;
    const dy = maxY - minY;
    const dz = maxZ - minZ;

    console.log({ dx, dy, dz });

    const cx = minX + dx / 2;
    const cy = minY + dy / 2;
    const cz = minZ + dz / 2;

    const unit = AXIS_FULL / Math.max(dx, dy, dz);

    const HALF_X = cx * unit;
    const HALF_Y = cy * unit;
    const HALF_Z = cz * unit;

    const illo = new Zdog.Illustration({
        element,
        rotate: { y: Zdog.TAU / 8, x: -Zdog.TAU / 12, z: Zdog.TAU / 2 },
        dragRotate: true,
        onDragStart: function () {
            isSpinning = false;
        },
        onDragEnd: function () {
            isSpinning = true;
        },
    });

    new Zdog.Shape({
        addTo: illo,
        stroke: 2,
        path: [
            { x: minX * unit - HALF_X, y: -HALF_Y, z: -HALF_Z },
            { x: maxX * unit - HALF_X, y: -HALF_Y, z: -HALF_Z },
        ],
        color: COLOR_RED,
    });

    new Zdog.Cone({
        addTo: illo,
        translate: { x: maxX * unit - HALF_X, y: -HALF_Y, z: -HALF_Z },
        rotate: { y: -Zdog.TAU / 4 },
        diameter: 10,
        length: 15,
        stroke: false,
        color: COLOR_RED,
    });

    new Zdog.Shape({
        addTo: illo,
        stroke: 2,
        path: [
            { x: -HALF_X, y: minY * unit - HALF_Y, z: -HALF_Z },
            { x: -HALF_X, y: maxY * unit - HALF_Y, z: -HALF_Z },
        ],
        color: COLOR_GREEN,
    });

    new Zdog.Cone({
        addTo: illo,
        translate: { x: -HALF_X, y: maxY * unit - HALF_Y, z: -HALF_Z },
        rotate: { x: -Zdog.TAU / 4 },
        diameter: 10,
        length: 15,
        stroke: false,
        color: COLOR_GREEN,
    });

    new Zdog.Shape({
        addTo: illo,
        stroke: 2,
        path: [
            { x: -HALF_X, y: -HALF_Y, z: minZ * unit - HALF_Z },
            { x: -HALF_X, y: -HALF_Y, z: maxZ * unit - HALF_Z },
        ],
        color: COLOR_BLUE,
    });

    new Zdog.Cone({
        addTo: illo,
        translate: { x: -HALF_X, y: -HALF_Y, z: maxZ * unit - HALF_Z },
        diameter: 10,
        length: 15,
        stroke: false,
        color: COLOR_BLUE,
    });

    for (const set of data) {
        for (const p of set.points) {
            new Zdog.Shape({
                addTo: illo,
                stroke: POINT_SIZE,
                translate: { x: p.x * unit - HALF_X, y: p.y * unit - HALF_Y, z: p.z * unit - HALF_Z },
                color: set.color,
            });
        }
    }

    function animate() {
        if (isSpinning) {
            illo.rotate.y += 0.01;
        }
        illo.updateRenderGraph();
        requestAnimationFrame(animate);
    }
    animate();

    return illo;
}

function computeVariant(vi) {
    const v = data[`v${vi}`];

    const initialY = [];
    const initialZ = [];

    for (let i = 0; i < n; i++) {
        const x = data.x1[i];
        const y = v.y[i];
        const z = data.x2[i];

        initialY.push({ x, y, z });
    }

    for (let i = 0; i < n; i++) {
        const x = data.x1[i];
        const y = v.z[i];
        const z = data.x2[i];

        initialZ.push({ x, y, z });
    }

    drawPlot('.pointcloud', [
        { points: initialY, color: COLOR_PURPLE },
        { points: initialZ, color: COLOR_GOLD },
    ]);

    const $initialTable = u('.initialtable');
    $initialTable.empty();

    const A = [];
    const By = [];
    const Bz = [];

    for (let i = 0; i < n; i++) {
        const x = initialY[i].x;
        const y = initialY[i].y;
        const z = initialY[i].z;
        const yAlt = initialZ[i].y;

        A.push([z, x, 1]);
        By.push(y);
        Bz.push(yAlt);

        $initialTable.append(
            u('<tr>').append(
                `<th>${i + 1}</th><td>${x.toFixed(3)}</td><td>${z.toFixed(3)}</td><td>${y.toFixed(
                    3
                )}</td><td>${yAlt.toFixed(3)}</td>`
            )
        );
    }

    const AT = transpose(A);
    const AT_A = multiply(AT, A);
    const AT_A_inv = inv(AT_A);
    const AT_A_inv_AT = multiply(AT_A_inv, AT);
    const Ry = multiply(AT_A_inv_AT, By);
    const Rz = multiply(AT_A_inv_AT, Bz);

    // SOLVING

    const solvedY = [];
    const solvedZ = [];

    for (let i = 0; i < n; i++) {
        const x = data.x1[i];
        const z = data.x2[i];

        const y = +(z * Ry[0] + x * Ry[1] + Ry[2]).toFixed(precision);

        solvedY.push({ x, y, z });
    }

    for (let i = 0; i < n; i++) {
        const x = data.x1[i];
        const z = data.x2[i];

        const y = +(z * Rz[0] + x * Rz[1] + Rz[2]).toFixed(precision);

        solvedZ.push({ x, y, z });
    }

    const solved = drawPlot('.solved', [
        {
            points: solvedY,
            color: COLOR_PURPLE,
        },
        {
            points: solvedZ,
            color: COLOR_GOLD,
        },
    ]);

    u('.gold').text(`Y = ${Ry[2].toFixed(3)} + ${Ry[1].toFixed(3)} · X1 + ${Ry[0].toFixed(3)} · X2`);
    u('.purple').text(`Z = ${Rz[2].toFixed(3)} + ${Rz[1].toFixed(3)} · X1 + ${Rz[0].toFixed(3)} · X2`);

    const Y = utils.normalize([Ry[1], -1, Ry[0]]);

    new Zdog.Shape({
        addTo: solved,
        path: [{}, { x: 200 * Y[0], y: 200 * Y[1], z: 200 * Y[2] }],
        stroke: 2,
        color: COLOR_GOLD,
    });

    const Z = utils.normalize([Rz[1], -1, Rz[0]]);

    new Zdog.Shape({
        addTo: solved,
        path: [{}, { x: 200 * Z[0], y: 200 * Z[1], z: 200 * Z[2] }],
        stroke: 2,
        color: COLOR_PURPLE,
    });
}

u('#variant').on('change', e => {
    computeVariant(e.target.selectedIndex + 1);
});
computeVariant(1);
