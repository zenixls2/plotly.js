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
        var fmt = d3.format('.3s');

        var size = fullLayout._size;
        var radius = Math.min(size.w / 2, size.h);
        var innerRadius = 0.75 * radius;
        var isWide = !(size.h > radius);
        var verticalMargin = isWide ? fullLayout.height - size.b : fullLayout.height - size.b - (size.h - radius) / 2;

        var mainFontSize = Math.min(2 * 0.75 * radius / (trace.max.toString().length));
        var gaugeFontSize = 0.25 * mainFontSize;

        plotGroup.each(function() {
            var number = d3.select(this).selectAll('text.number').data(cd);

            number.enter().append('text').classed('number', true);

            number.attr({
                x: fullLayout.width / 2,
                y: verticalMargin,
                'text-anchor': 'middle'
            })
            .style('font-size', mainFontSize)
            .text(fmt(cd[0].y));
            number.exit().remove();

            // Trace name
            var name = d3.select(this).selectAll('text.name').data(cd);
            name.enter().append('text').classed('name', true);
            name.attr({
                x: fullLayout.width / 2,
                y: verticalMargin - radius - gaugeFontSize,
                'text-anchor': 'middle'
            })
            .style('font-size', gaugeFontSize)
            .text(trace.name);
            name.exit().remove();

            // If a gauge
            var gauge = d3.select(this).selectAll('g.gauge').data(cd);
            gauge.enter().append('g').classed('gauge', true);
            gauge.attr('transform', 'translate(' + fullLayout.width / 2 + ',' + verticalMargin + ')');

            var minText = gauge.selectAll('text.min').data(cd);
            minText.enter().append('text').classed('min', true);
            minText
              .text(fmt(trace.min))
              .style('font-size', gaugeFontSize)
              .attr({
                  x: - (innerRadius + radius) / 2,
                  y: gaugeFontSize,
                  'text-anchor': 'middle'
              });

            var maxText = gauge.selectAll('text.max').data(cd);
            maxText.enter().append('text').classed('max', true);
            maxText
              .text(fmt(trace.max))
              .style('font-size', gaugeFontSize)
              .attr({
                  x: (innerRadius + radius) / 2,
                  y: gaugeFontSize,
                  'text-anchor': 'middle'
              });

            var arcPath = d3.svg.arc()
              .innerRadius(innerRadius).outerRadius(radius)
              .startAngle(-theta);

            // Draw background
            var bgArc = gauge.selectAll('g.bgArc').data(cd);
            bgArc.enter().append('g').classed('bgArc', true).append('path');
            bgArc.select('path').attr('d', arcPath.endAngle(theta))
              .style('fill', 'rgba(0, 0, 0, 0.1)')
              .style('stroke', 'rgba(0, 0, 0, 0.25)');
            bgArc.exit().remove();

            // Draw foreground with transition
            var fgArc = gauge.selectAll('g.fgArc').data(cd);
            fgArc.enter().append('g').classed('fgArc', true).append('path');
            fgArc.select('path').attr('d', arcPath.endAngle(cd[0].p)).style('fill', 'green');
            fgArc.exit().remove();
        });
    });
};
