/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Drawing = require('../../components/drawing');
var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');

module.exports = function plot(gd, cdModule) {
    var fullLayout = gd._fullLayout;

    Lib.makeTraceGroups(fullLayout._indicatorlayer, cdModule, 'trace').each(function(cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        plotGroup.each(function() {
            var slices = d3.select(this).selectAll('g.slice').data(cd);

            slices.enter().append('g')
                .classed('slice', true);
            slices.exit().remove();
        });
    });
};
