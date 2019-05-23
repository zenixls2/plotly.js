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

// arc cotangent
function arcctg(x) { return Math.PI / 2 - Math.atan(x); }

module.exports = function plot(gd, cdModule) {
    var fullLayout = gd._fullLayout;

    // Compute aspect ratio
    // var aspectratio = fullLayout._size.w / fullLayout._size.h;
    // var theta = arcctg(aspectratio / 2);
    var theta = Math.PI / 2;

    Lib.makeTraceGroups(fullLayout._indicatorlayer, cdModule, 'trace').each(function(cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        var size = fullLayout._size;
        var radius = Math.min(size.w / 2, size.h);
        var isWide = size.w / 2 > size.h;
        var verticalMargin = isWide ? fullLayout.height - size.b : fullLayout.height / 2;

        plotGroup.each(function() {
            var number = d3.select(this).selectAll('text.number').data(cd);

            number.enter().append('text').classed('number', true);

            number.attr({
                x: fullLayout.width / 2,
                y: verticalMargin,
                'text-anchor': 'middle',
                'dominant-baseline': isWide ? undefined  : 'middle'
            })
            .style('font-size', Math.min(2 * 0.75 * radius / (cd[0].y.toString().length)))
            .text(cd[0].y);
            number.exit().remove();

            // If a gauge
            // Draw background
            var arcPath = d3.svg.arc()
              .innerRadius(radius * 0.75).outerRadius(radius)
              .startAngle(-theta).endAngle(theta);

            var arc = d3.select(this).selectAll('g.arc').data(cd);
            arc.enter().append('g').classed('arc', true).append('path');

            arc.attr('transform', 'translate(' + fullLayout.width / 2 + ',' + verticalMargin + ')');
            arc.select('path').attr('d', arcPath);

            arc.exit().remove();
            // Draw foreground with transition
        });
    });
};
