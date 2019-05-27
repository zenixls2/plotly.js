/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

function calc(gd, trace) {
    var len = trace.values.length;

    // Gauge
    var gaugeMin = trace.gauge.min;
    var gaugeMax = trace.gauge.max;
    var gaugeRange = gaugeMax - gaugeMin;

    var cd = [];

    var lastReading = trace.values[len - 1];
    var secondLastReading = trace.values[len - 2];
    cd[0] = {
        y: lastReading,
        angle: (lastReading - gaugeMin) / gaugeRange * Math.PI - Math.PI / 2,
        delta: lastReading - secondLastReading,
        relativeDelta: (lastReading - secondLastReading) / secondLastReading,

        endAngle: (secondLastReading - gaugeMin) / gaugeRange * Math.PI - Math.PI / 2,
        endY: secondLastReading
    };
    return cd;
}

module.exports = {
    calc: calc
};
