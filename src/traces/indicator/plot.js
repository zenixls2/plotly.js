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
            var number = d3.select(this).selectAll('text.number').data(cd);
            console.log(cd0);
            number.enter().append('text')
                .attr({
                    x: fullLayout.width / 2,
                    y: fullLayout.height / 2,
                    'text-anchor': 'middle'
                })
                .style('font-size', fullLayout._size.h)
                .classed('number', true)
                .text(cd0.y)
                // .call(Drawing.font, trace.font);
            number.exit().remove();
        });
    });
};
