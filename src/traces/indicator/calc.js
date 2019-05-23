/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

function calc(gd, trace) {
    return true;
}

function crossTraceCalc(gd) {
    return true;
}

module.exports = {
    calc: calc,
    crossTraceCalc: crossTraceCalc
};
