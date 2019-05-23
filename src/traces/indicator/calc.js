/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

function calc(gd, trace) {
    var cd = [];
    cd[0] = {
        y: trace.values[0]
    };
    return cd;
}

module.exports = {
    calc: calc
};
