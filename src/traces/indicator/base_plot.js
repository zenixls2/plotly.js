/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Registry = require('../../registry');
var getModuleCalcData = require('../../plots/get_data').getModuleCalcData;

exports.name = 'indicator';

exports.plot = function(gd) {
    var Indicator = Registry.getModule('indicator');
    var cd = getModuleCalcData(gd.calcdata, Indicator)[0];
    Indicator.plot(gd, cd);
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var hadIndicator = (oldFullLayout._has && oldFullLayout._has('indicator'));
    var hasIndicator = (newFullLayout._has && newFullLayout._has('indicator'));

    if(hadIndicator && !hasIndicator) {
        oldFullLayout._indicatorlayer.selectAll('g.trace').remove();
    }
};
