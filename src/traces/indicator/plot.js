/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
// var Plots = require('../../plots/plots');
// var Axes = require('../../plots/cartesian/axes');
// var svgTextUtils = require('../../lib/svg_text_utils');
//
// // arc cotangent
// function arcctg(x) { return Math.PI / 2 - Math.atan(x); }
var cn = require('./constants');
// var barPlot = require('../bar/plot').plot;

module.exports = function plot(gd, cdModule, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout;
    var onComplete;

    // If transition config is provided, then it is only a partial replot and traces not
    // updated are removed.
    var hasTransition = transitionOpts && transitionOpts.duration > 0;

    if(hasTransition) {
        if(makeOnCompleteCallback) {
            // If it was passed a callback to register completion, make a callback. If
            // this is created, then it must be executed on completion, otherwise the
            // pos-transition redraw will not execute:
            onComplete = makeOnCompleteCallback();
        }
    }

    // Compute aspect ratio
    // var aspectratio = fullLayout._size.w / fullLayout._size.h;
    // var theta = arcctg(aspectratio / 2);

    Lib.makeTraceGroups(fullLayout._indicatorlayer, cdModule, 'trace').each(function(cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        // Domain size
        var domain = trace.domain;
        var size = Lib.extendFlat({}, fullLayout._size, {
            w: fullLayout._size.w * (domain.x[1] - domain.x[0]),
            h: fullLayout._size.h * (domain.y[1] - domain.y[0]),
            l: Math.max(fullLayout._size.l, fullLayout.width * domain.x[0]),
            r: Math.max(fullLayout._size.r, fullLayout.width * (1 - domain.x[1])),
            t: Math.max(fullLayout._size.t, fullLayout.height * domain.y[0]),
            b: Math.max(fullLayout._size.b, fullLayout.height * (1 - domain.y[0]))
        });

        // bignumber
        var isBigNumber = trace.mode.indexOf('bignumber') !== -1;
        var fmt = d3.format(trace.valueformat);

        // delta
        var hasTicker = trace.mode.indexOf('delta') !== -1;
        var tickerFmt = d3.format(trace.delta.valueformat);
        var tickerText = function(d) {
            if(d.delta === 0) return '-';
            var value = trace.delta.showpercentage ? tickerFmt(d.relativeDelta) : tickerFmt(d.delta);
            return (d.delta > 0 ? cn.DIRSYMBOL.increasing : cn.DIRSYMBOL.decreasing) + value;
        };
        var tickerFill = function(d) {
            return d.delta > 0 ? trace.delta.increasing.color : trace.delta.decreasing.color;
        };

        // gauge related
        var isGauge = trace.mode.indexOf('gauge') !== -1;

        // circular gauge
        var isCircular = isGauge && trace.gauge.shape === 'circular';
        var theta = Math.PI / 2;
        var radius = Math.min(size.w / 2, size.h * 0.75);
        var innerRadius = cn.innerRadius * radius;

        // bullet gauge
        var isBullet = isGauge && trace.gauge.shape === 'bullet';

        var isWide = !(size.h > radius);

        function valueToAngle(v) {
            var angle = (v - trace.min) / (trace.max - trace.min) * Math.PI - Math.PI / 2;
            if(angle < -theta) return -theta;
            if(angle > theta) return theta;
            return angle;
        }

        // TODO: Move the following to defaults
        // Position elements
        var bignumberVerticalMargin, mainFontSize, bignumberX;
        var tickerVerticalMargin, tickerFontSize, tickerBaseline;
        var gaugeFontSize;
        var labelFontSize;
        var centerX = size.l + size.w / 2;
        bignumberX = centerX;

        if(!isGauge) {
            // when no gauge, we are only constrained by figure size
            if(isBigNumber) {
                // Center the text vertically
                mainFontSize = Math.min(size.w / (trace.max.toString().length), size.h / 2);
                tickerFontSize = 0.5 * mainFontSize;
                bignumberVerticalMargin = size.t + size.h / 2;
                tickerVerticalMargin = size.t + size.h - tickerFontSize / 2;
            } else {
                mainFontSize = Math.min(size.w / (trace.max.toString().length + 2), size.h / 2);
                tickerFontSize = mainFontSize;
                bignumberVerticalMargin = 0;
                tickerVerticalMargin = size.t + size.h / 2;
            }
            labelFontSize = 0.35 * mainFontSize;
        } else {
            if(isCircular) {
                bignumberVerticalMargin = size.t + size.h;
                if(!isWide) bignumberVerticalMargin -= (size.h - radius) / 2;
                // TODO: check formatted size of the number
                mainFontSize = Math.min(2 * innerRadius / (trace.max.toString().length));
                tickerFontSize = 0.35 * mainFontSize;
                gaugeFontSize = Math.max(0.25 * mainFontSize, (radius - innerRadius) / 4);
                labelFontSize = gaugeFontSize;
                tickerVerticalMargin = bignumberVerticalMargin + tickerFontSize;
                if(!isBigNumber) tickerBaseline = 'bottom';
            }
            if(isBullet) {
                // Center the text
                var p = 0.75;
                mainFontSize = Math.min(0.25 * size.w / (trace.max.toString().length), size.h / 2);
                bignumberVerticalMargin = size.t + size.h / 2;
                bignumberX = size.l + (p + (1 - p) / 2) * size.w;
                tickerFontSize = 0.5 * mainFontSize;
                tickerVerticalMargin = bignumberVerticalMargin + 1.5 * tickerFontSize;
                labelFontSize = 0.75 * mainFontSize;
            }

            if(!isBigNumber) {
                tickerFontSize = 0.75 * mainFontSize;
                tickerVerticalMargin = bignumberVerticalMargin;
            }
        }

        plotGroup.each(function() {
            // bignumber
            var data = cd.filter(function() {return isBigNumber;});
            var number = d3.select(this).selectAll('text.number').data(data);
            number.enter().append('text').classed('number', true);
            number.attr({
                x: bignumberX,
                y: bignumberVerticalMargin,
                'text-anchor': 'middle',
                'alignment-baseline': isCircular ? 'bottom' : 'central'
            })
            .call(Drawing.font, trace.font)
            .style('font-size', mainFontSize);

            if(hasTransition) {
                number
                    .transition()
                    .duration(transitionOpts.duration)
                    .ease(transitionOpts.easing)
                    .each('end', function() { onComplete && onComplete(); })
                    .each('interrupt', function() { onComplete && onComplete(); })
                    .attrTween('text', function() {
                        var that = d3.select(this);
                        var i = d3.interpolateNumber(cd[0].lastY, cd[0].y);
                        return function(t) {
                            that.text(fmt(i(t)));
                        };
                    });
            } else {
                number.text(fmt(cd[0].y));
            }
            number.exit().remove();

            // Ticker
            data = cd.filter(function() {return hasTicker;});
            var ticker = d3.select(this).selectAll('text.ticker').data(data);
            ticker.enter().append('text').classed('ticker', true);
            ticker.attr({
                x: bignumberX,
                y: tickerVerticalMargin,
                'text-anchor': 'middle',
                'alignment-baseline': tickerBaseline || 'central'
            })
            .call(Drawing.font, trace.font)
            .style('font-size', tickerFontSize)
            .style('fill', tickerFill)
            .text(tickerText);
            ticker.exit().remove();

            // Trace name
            var name = d3.select(this).selectAll('text.name').data(cd);
            name.enter().append('text').classed('name', true);
            name.attr({
                x: centerX,
                y: size.t + labelFontSize / 2,
                'text-anchor': 'middle',
                'alignment-baseline': 'central'
            })
            .call(Drawing.font, trace.font)
            .style('font-size', labelFontSize)
            .text(trace.name);
            name.exit().remove();

            // Draw circular gauge
            data = cd.filter(function() {return isCircular;});
            var gauge = d3.select(this).selectAll('g.gauge').data(data);
            gauge.enter().append('g').classed('gauge', true);
            gauge.attr('transform', 'translate(' + centerX + ',' + bignumberVerticalMargin + ')');

            // Draw gauge's min and max in text
            var minText = gauge.selectAll('text.min').data(cd);
            minText.enter().append('text').classed('min', true);
            minText
                  .call(Drawing.font, trace.font)
                  .style('font-size', gaugeFontSize)
                  .attr({
                      x: - (innerRadius + radius) / 2,
                      y: gaugeFontSize,
                      'text-anchor': 'middle'
                  })
                  .text(fmt(trace.min));

            var maxText = gauge.selectAll('text.max').data(cd);
            maxText.enter().append('text').classed('max', true);
            maxText
                  .call(Drawing.font, trace.font)
                  .style('font-size', gaugeFontSize)
                  .attr({
                      x: (innerRadius + radius) / 2,
                      y: gaugeFontSize,
                      'text-anchor': 'middle'
                  })
                  .text(fmt(trace.max));

            var arcPath = d3.svg.arc()
                  .innerRadius(innerRadius).outerRadius(radius)
                  .startAngle(-theta);

            // TODO: DRY up the following code to draw the different arcs
            // Draw background
            var bgArc = gauge.selectAll('g.bgArc').data(cd);
            bgArc.enter().append('g').classed('bgArc', true).append('path');
            bgArc.select('path').attr('d', arcPath.endAngle(theta))
                  .style('fill', trace.gauge.background.color)
                  .style('stroke', trace.gauge.background.line.color)
                  .style('stroke-width', trace.gauge.background.line.width);
            bgArc.exit().remove();

            // Draw target
            var thetaTarget = -theta;
            if(trace.target) thetaTarget = valueToAngle(trace.target);
            var targetArc = gauge.selectAll('g.targetArc').data(cd);
            targetArc.enter().append('g').classed('targetArc', true).append('path');
            targetArc.select('path').attr('d', arcPath.endAngle(thetaTarget))
                  .style('fill', trace.gauge.target.color)
                  .style('stroke', trace.gauge.target.line.color)
                  .style('stroke-width', trace.gauge.target.line.width);
            targetArc.exit().remove();

            // Draw foreground with transition
            var fgArc = gauge.selectAll('g.fgArc').data(cd);
            fgArc.enter().append('g').classed('fgArc', true).append('path');

            var fgArcPath = fgArc.select('path');
            if(hasTransition) {
                fgArcPath
                      .transition()
                      .duration(transitionOpts.duration)
                      .ease(transitionOpts.easing)
                      .each('end', function() { onComplete && onComplete(); })
                      .each('interrupt', function() { onComplete && onComplete(); })
                      .attrTween('d', arcTween(arcPath, valueToAngle(cd[0].lastY), valueToAngle(cd[0].y)));
            } else {
                fgArcPath
                      .attr('d', arcPath.endAngle(valueToAngle(cd[0].y)));
            }
            fgArcPath
                  .style('fill', trace.gauge.value.color)
                  .style('stroke', trace.gauge.value.line.color)
                  .style('stroke-width', trace.gauge.value.line.width);
            fgArc.exit().remove();

            // Draw bullet
            data = cd.filter(function() {return isBullet;});
            // if(isBullet) {
            //     var mockFigure = {
            //         data: [],
            //         layout: {
            //             xaxis: {
            //                 type: 'linear',
            //                 domain: [0, 1],
            //                 range: [trace.min, trace.max],
            //             },
            //             yaxis: {
            //                 type: 'linear',
            //                 range: [-0.5, 0.5]
            //             },
            //             width: fullLayout.width,
            //             height: 25,
            //             margin: { t: 0, b: 0, l: size.l, r: size.r },
            //             paper_bgcolor: 'rgba(0, 0, 0, 0)'
            //         },
            //         _context: gd._context
            //     };
            //
            //     Plots.supplyDefaults(mockFigure);
            //
            //     var xa = mockFigure._fullLayout.xaxis;
            //     var ya = mockFigure._fullLayout.yaxis;
            //
            //     xa.clearCalc();
            //     xa.setScale();
            //     ya.clearCalc();
            //     ya.setScale();
            //
            //     var plotinfo = {
            //         xaxis: xa,
            //         yaxis: ya
            //     };
            //     var opts = {
            //         mode: 'overlay'
            //     };
            //     var barWidth = -0.5;
            //     var cdBarModule = [[{
            //         i: 0,
            //         text: 'max',
            //         mlw: 1,
            //         s: 0,
            //         p: 0,
            //         p0: -barWidth,
            //         p1: barWidth,
            //         s0: 0,
            //         s1: trace.max,
            //         trace: {orientation: 'h', marker: {color: 'red'}}
            //     }, {
            //         i: 0,
            //         text: 'value',
            //         mlw: 1,
            //         p: 0,
            //         s: trace.target,
            //         p0: -barWidth,
            //         p1: barWidth,
            //         s0: 0,
            //         s1: trace.target,
            //         trace: {orientation: 'h', marker: {color: 'red'}}
            //     }, {
            //         i: 0,
            //         text: 'value',
            //         mlw: 1,
            //         p: 0,
            //         s: cd0.y,
            //         p0: -0.75 * barWidth,
            //         p1: 0.75 * barWidth,
            //         s0: 0,
            //         s1: cd0.y,
            //         trace: {orientation: 'h', marker: {color: 'red'}}
            //     }]];
            //     barPlot(gd, plotinfo, cdBarModule, fullLayout._cartesianlayer, opts);
            //
            //     var bars = fullLayout._cartesianlayer.select('.bars');
            //     bars.attr('transform', 'translate(' + size.l + ',' + 0.95 * size.h + ')');
            //     bars.selectAll('path').each(function(d, i) {
            //         var colors = {2: 'green', 1: 'rgba(255, 255, 0, 0.5)', 0: 'rgba(255, 255, 255, 0.25)'};
            //         d3.select(this).style('fill', colors[i]);
            //     });
            //
            //     Axes.drawOne(gd, xa);
            //     Axes.drawOne(gd, ya);
            // }
            var bulletHeight = 35;
            var innerBulletHeight = 0.6 * bulletHeight;
            var bulletVerticalMargin = bignumberVerticalMargin - bulletHeight / 2;
            var bullet = d3.select(this).selectAll('g.bullet').data(data);
            bullet.enter().append('g').classed('bullet', true);
            bullet.attr('transform', 'translate(' + size.l + ',' + bulletVerticalMargin + ')');

            var scale = d3.scale.linear().domain([trace.min, trace.max]).range([0, ((isBigNumber || hasTicker) ? 0.75 : 1.0) * size.w]);

            var bgBullet = bullet.selectAll('g.bgBullet').data(cd);
            bgBullet.enter().append('g').classed('bgBullet', true).append('rect');
            bgBullet.select('rect')
                  .attr('width', scale(trace.max))
                  .attr('height', bulletHeight)
                  .style('fill', trace.gauge.background.color)
                  .style('stroke', trace.gauge.background.line.color)
                  .style('stroke-width', trace.gauge.background.line.width);
            bgBullet.exit().remove();

            var targetBullet = bullet.selectAll('g.targetBullet').data(cd);
            targetBullet.enter().append('g').classed('targetBullet', true).append('rect');
            targetBullet.select('rect')
                  .attr('width', scale(trace.target))
                  .attr('height', bulletHeight)
                  // .attr('y', (50 - 25) / 2)
                  .style('fill', trace.gauge.target.color)
                  .style('stroke', trace.gauge.target.line.color)
                  .style('stroke-width', trace.gauge.target.line.width);
            targetBullet.exit().remove();

            var fgBullet = bullet.selectAll('g.fgBullet').data(cd);
            fgBullet.enter().append('g').classed('fgBullet', true).append('rect');
            fgBullet.select('rect')
                  .attr('height', innerBulletHeight)
                  .attr('y', (bulletHeight - innerBulletHeight) / 2)
                  .style('fill', trace.gauge.value.color)
                  .style('stroke', trace.gauge.value.line.color)
                  .style('stroke-width', trace.gauge.value.line.width);
            if(hasTransition) {
                fgBullet.select('rect')
                  .transition()
                  .duration(transitionOpts.duration)
                  .ease(transitionOpts.easing)
                  .each('end', function() { onComplete && onComplete(); })
                  .each('interrupt', function() { onComplete && onComplete(); })
                  .attr('width', scale(Math.min(trace.max, cd[0].y)));
            } else {
                fgBullet.select('rect')
                  .attr('width', scale(Math.min(trace.max, cd[0].y)));
            }
            fgBullet.exit().remove();

            var xaxis = bullet.selectAll('g.xaxislayer-above').data(cd);
            xaxis.enter().append('g').classed('xaxislayer-above', true);
            var ticksPos = [trace.min, trace.target, trace.max];
            var ticks = xaxis.selectAll('g.tick').data(ticksPos);
            var group = ticks.enter().append('g').classed('tick', true);

            group.append('path');
            ticks.select('path')
                .attr('d', 'M0,0V' + 0.1 * bulletHeight)
                .style('stroke', 'white');

            group.insert('text');
            ticks.select('text')
                .text(function(d) { return fmt(d);})
                .call(Drawing.font, trace.font)
                .attr({
                    y: 20,
                    'text-anchor': 'middle',
                    'alignment-baseline': 'central'
                })
                .style('fill', 'white');

            ticks
              .attr('transform', function(d) {
                  var pos = scale(d);
                  return 'translate(' + pos + ',' + bulletHeight + ')';
              });
            ticks.exit().remove();
        });
    });
};

// Returns a tween for a transition’s "d" attribute, transitioning any selected
// arcs from their current angle to the specified new angle.
function arcTween(arc, endAngle, newAngle) {
    return function() {
        var interpolate = d3.interpolate(endAngle, newAngle);
        return function(t) {
            return arc.endAngle(interpolate(t))();
        };
    };
}
