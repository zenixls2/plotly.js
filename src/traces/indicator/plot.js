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
var cn = require('./constants');
var svgTextUtils = require('../../lib/svg_text_utils');
// var Plots = require('../../plots/plots');
// var Axes = require('../../plots/cartesian/axes');
//
// // arc cotangent
// function arcctg(x) { return Math.PI / 2 - Math.atan(x); }
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

        // FIXME: I think the ydomain below is reversed
        // Domain size
        var domain = trace.domain;
        var size = Lib.extendFlat({}, fullLayout._size, {
            w: fullLayout._size.w * (domain.x[1] - domain.x[0]),
            h: fullLayout._size.h * (domain.y[1] - domain.y[0]),
            l: fullLayout._size.l + fullLayout._size.w * domain.x[0],
            r: fullLayout._size.r + fullLayout._size.w * (1 - domain.x[1]),
            t: fullLayout._size.t + fullLayout._size.h * domain.y[0],
            b: fullLayout._size.b + fullLayout._size.h * (1 - domain.y[1])
        });

        // title
        var hasTitle = true;

        // bignumber
        var hasBigNumber = trace.mode.indexOf('bignumber') !== -1;
        var fmt = d3.format(trace.valueformat);

        // delta
        var hasDelta = trace.mode.indexOf('delta') !== -1;
        var deltaFmt = d3.format(trace.delta.valueformat);
        var deltaText = function(d) {
            if(d.delta === 0) return '-';
            var value = trace.delta.showpercentage ? deltaFmt(d.relativeDelta) : deltaFmt(d.delta);
            return (d.delta > 0 ? cn.DIRSYMBOL.increasing : cn.DIRSYMBOL.decreasing) + value;
        };
        var deltaFill = function(d) {
            return d.delta >= 0 ? trace.delta.increasing.color : trace.delta.decreasing.color;
        };

        // gauge related
        var hasGauge = trace.mode.indexOf('gauge') !== -1;

        // circular gauge
        var isAngular = hasGauge && trace.gauge.shape === 'angular';
        var theta = Math.PI / 2;
        var radius = Math.min(size.w / 2, size.h * 0.75);
        var innerRadius = cn.innerRadius * radius;
        function valueToAngle(v) {
            var angle = (v - trace.min) / (trace.max - trace.min) * Math.PI - Math.PI / 2;
            if(angle < -theta) return -theta;
            if(angle > theta) return theta;
            return angle;
        }

        // bullet gauge
        var isBullet = hasGauge && trace.gauge.shape === 'bullet';

        var isWide = (size.h * 0.75 < size.w / 2);

        // TODO: Move the following to defaults
        // Position elements
        var bignumberVerticalMargin, mainFontSize, bignumberX;
        var deltaVerticalMargin, deltaFontSize, deltaBaseline;
        var bulletHeight = Math.min(cn.bulletHeight, size.h / 2);
        var gaugeFontSize;
        var labelFontSize, labelY;
        var centerX = size.l + size.w / 2;
        bignumberX = centerX;

        if(!hasGauge) {
            // when no gauge, we are only constrained by figure size
            if(hasBigNumber) {
                // Center the text vertically
                mainFontSize = Math.min(size.w / (trace.max.toString().length), size.h / 3);
                deltaFontSize = 0.5 * mainFontSize;
                bignumberVerticalMargin = size.t + size.h / 2;
                deltaVerticalMargin = Math.min(size.t + size.h / 2 + mainFontSize / 2 + deltaFontSize / 2);
            } else {
                mainFontSize = Math.min(size.w / (trace.max.toString().length + 1), size.h / 3);
                deltaFontSize = mainFontSize;
                bignumberVerticalMargin = 0;
                deltaVerticalMargin = size.t + size.h / 2;
            }
            labelFontSize = 0.35 * mainFontSize;
            labelY = size.t + Math.max(labelFontSize / 2, size.h / 5);
        } else {
            if(isAngular) {
                bignumberVerticalMargin = size.t + size.h;
                if(!isWide) bignumberVerticalMargin -= (size.h - radius) / 2;
                // TODO: check formatted size of the number
                mainFontSize = Math.min(2 * innerRadius / (trace.max.toString().length));
                deltaFontSize = 0.35 * mainFontSize;
                gaugeFontSize = Math.max(0.25 * mainFontSize, (radius - innerRadius) / 4);
                labelFontSize = 0.35 * mainFontSize;
                deltaVerticalMargin = bignumberVerticalMargin + deltaFontSize;
                if(!hasBigNumber) deltaBaseline = 'bottom';
                if(isWide) {
                    labelY = size.t + (0.25 / 2) * size.h - labelFontSize / 2;
                } else {
                    labelY = ((bignumberVerticalMargin - radius) + size.t) / 2;
                }
            }
            if(isBullet) {
                // Center the text
                var p = 0.75;
                mainFontSize = Math.min(0.2 * size.w / (trace.max.toString().length), bulletHeight);
                bignumberVerticalMargin = size.t + size.h / 2;
                bignumberX = size.l + (p + (1 - p) / 2) * size.w;
                deltaFontSize = 0.5 * mainFontSize;
                deltaVerticalMargin = bignumberVerticalMargin + mainFontSize / 2 + deltaFontSize;
                labelFontSize = 0.4 * mainFontSize;
                labelY = bignumberVerticalMargin;
            }

            if(!hasBigNumber) {
                deltaFontSize = 0.75 * mainFontSize;
                deltaVerticalMargin = bignumberVerticalMargin;
            }
        }

        plotGroup.each(function() {
            // Trace name
            var name = d3.select(this).selectAll('text.name').data(cd);
            name.enter().append('text').classed('name', true);
            name.attr({
                x: isBullet ? size.l + 0.23 * size.w : centerX,
                y: labelY,
                'text-anchor': isBullet ? 'end' : 'middle',
                'alignment-baseline': 'central'
            })
            .text(trace.title.text)
            .call(Drawing.font, trace.title.font)
            .style('font-size', labelFontSize)
            .call(svgTextUtils.convertToTspans, gd);
            name.exit().remove();

            // bignumber
            var data = cd.filter(function() {return hasBigNumber;});
            var number = d3.select(this).selectAll('text.number').data(data);
            number.enter().append('text').classed('number', true);
            number.attr({
                x: bignumberX,
                y: bignumberVerticalMargin,
                'text-anchor': 'middle',
                'alignment-baseline': isAngular ? 'bottom' : 'central'
            })
            .call(Drawing.font, trace.number.font)
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

            // delta
            data = cd.filter(function() {return hasDelta;});
            var delta = d3.select(this).selectAll('text.delta').data(data);
            delta.enter().append('text').classed('delta', true);
            delta.attr({
                x: bignumberX,
                y: deltaVerticalMargin,
                'text-anchor': 'middle',
                'alignment-baseline': deltaBaseline || 'central'
            })
            .call(Drawing.font, trace.delta.font)
            .style('font-size', deltaFontSize)
            .style('fill', deltaFill)
            .text(deltaText);
            delta.exit().remove();

            // Draw circular gauge
            data = cd.filter(function() {return isAngular;});
            var gauge = d3.select(this).selectAll('g.gauge').data(data);
            gauge.enter().append('g').classed('gauge', true);
            gauge.attr('transform', 'translate(' + centerX + ',' + bignumberVerticalMargin + ')');

            // Draw gauge's min and max in text
            var minText = gauge.selectAll('text.min').data(cd);
            minText.enter().append('text').classed('min', true);
            minText
                  .call(Drawing.font, trace.number.font)
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
                  .call(Drawing.font, trace.number.font)
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

            var valueArcPath = d3.svg.arc()
                  .innerRadius((innerRadius + radius) / 2 - trace.gauge.value.size / 2 * (radius - innerRadius))
                  .outerRadius((innerRadius + radius) / 2 + trace.gauge.value.size / 2 * (radius - innerRadius))
                  .startAngle(-theta);

            // TODO: DRY up the following code to draw the different arcs
            // Draw background
            var bgArc = gauge.selectAll('g.bgArc').data(cd);
            bgArc.enter().append('g').classed('bgArc', true).append('path');
            bgArc.select('path').attr('d', arcPath.endAngle(theta))
                  .style('fill', trace.gauge.bgcolor)
                  .style('stroke', trace.gauge.bordercolor)
                  .style('stroke-width', trace.gauge.borderwidth);
            bgArc.exit().remove();

            // Draw steps
            var targetArc = gauge.selectAll('g.targetArc').data(trace.gauge.steps);
            targetArc.enter().append('g').classed('targetArc', true).append('path');
            targetArc.select('path')
                  .attr('d', function(d) {
                      return arcPath
                        .startAngle(valueToAngle(d.range[0]))
                        .endAngle(valueToAngle(d.range[1]))();
                  })
                  .style('fill', function(d) { return d.color;})
                  .style('stroke', function(d) { return d.line.color;})
                  .style('stroke-width', function(d) { return d.line.width;});
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
                      .attrTween('d', arcTween(valueArcPath, valueToAngle(cd[0].lastY), valueToAngle(cd[0].y)));
            } else {
                fgArcPath
                      .attr('d', valueArcPath.endAngle(valueToAngle(cd[0].y)));
            }
            fgArcPath
                  .style('fill', trace.gauge.value.color)
                  .style('stroke', trace.gauge.value.line.color)
                  .style('stroke-width', trace.gauge.value.line.width);
            fgArc.exit().remove();

            // TODO: threshold reuse arc path with very small range
            // TODO: add hover on threshold
            data = cd.filter(function() {return trace.gauge.threshold.value;});
            var threshold = gauge.selectAll('g.threshold').data(data);
            threshold.enter().append('g').classed('threshold', true).append('line');
            threshold.select('line')
                .attr('x1', Math.sin(valueToAngle(trace.gauge.threshold.value)) * innerRadius)
                .attr('x2', Math.sin(valueToAngle(trace.gauge.threshold.value)) * radius)
                .attr('y1', -Math.cos(valueToAngle(trace.gauge.threshold.value)) * innerRadius)
                .attr('y2', -Math.cos(valueToAngle(trace.gauge.threshold.value)) * radius)
                .style('stroke', trace.gauge.threshold.color)
                .style('stroke-width', trace.gauge.threshold.width);
            threshold.exit().remove();

            // Draw bullet
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
            data = cd.filter(function() {return isBullet;});
            var innerBulletHeight = trace.gauge.value.size * bulletHeight;
            var bulletVerticalMargin = bignumberVerticalMargin - bulletHeight / 2;
            var bullet = d3.select(this).selectAll('g.bullet').data(data);
            bullet.enter().append('g').classed('bullet', true);
            bullet.attr('transform', 'translate(' + (size.l + (hasTitle ? 0.25 : 0) * size.w) + ',' + bulletVerticalMargin + ')');

            var bulletWidth = 1;
            if(hasBigNumber || hasDelta) bulletWidth -= 0.25;
            if(hasTitle) bulletWidth -= 0.25;
            var scale = d3.scale.linear().domain([trace.min, trace.max]).range([0, bulletWidth * size.w]);

            // TODO: prevent rect width from being negative
            // TODO: prevent rect position to overflow background
            var bgBullet = bullet.selectAll('g.bgBullet').data(cd);
            bgBullet.enter().append('g').classed('bgBullet', true).append('rect');
            bgBullet.select('rect')
                  .attr('width', scale(trace.max))
                  .attr('height', bulletHeight)
                  .style('fill', trace.gauge.bgcolor)
                  .style('stroke', trace.gauge.bordercolor)
                  .style('stroke-width', trace.gauge.borderwidth);
            bgBullet.exit().remove();

            var targetBullet = bullet.selectAll('g.targetBullet').data(trace.gauge.steps);
            targetBullet.enter().append('g').classed('targetBullet', true).append('rect');
            targetBullet.select('rect')
                  .attr('width', function(d) { return scale(d.range[1] - d.range[0]);})
                  .attr('x', function(d) { return scale(d.range[0]);})
                  .attr('height', bulletHeight)
                  .style('fill', function(d) { return d.color;})
                  .style('stroke', function(d) { return d.line.color;})
                  .style('stroke-width', function(d) { return d.line.width;});
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

            data = cd.filter(function() {return trace.gauge.threshold.value;});
            threshold = bullet.selectAll('g.threshold').data(data);
            threshold.enter().append('g').classed('threshold', true).append('line');
            threshold.select('line')
                .attr('x1', scale(trace.gauge.threshold.value))
                .attr('x2', scale(trace.gauge.threshold.value))
                .attr('y1', (1 - trace.gauge.threshold.size) / 2 * bulletHeight)
                .attr('y2', (1 - (1 - trace.gauge.threshold.size) / 2) * bulletHeight)
                .style('stroke', trace.gauge.threshold.color)
                .style('stroke-width', trace.gauge.threshold.width);
            threshold.exit().remove();

            // Draw x axis and ticks
            // TODO: reuse axis logic
            var xaxis = bullet.selectAll('g.xaxislayer-above').data(cd);
            xaxis.enter().append('g').classed('xaxislayer-above', true);
            var ticksPos = [trace.min, trace.max];
            ticksPos = ticksPos.concat(trace.gauge.steps.map(function(d) { return d.range[1];}));
            var ticks = xaxis.selectAll('g.tick').data(ticksPos);
            var group = ticks.enter().append('g').classed('tick', true);

            group.append('path');
            ticks.select('path')
                .attr('d', 'M0,0V' + 0.1 * bulletHeight)
                .style('stroke', trace.number.font.color);

            group.insert('text');
            ticks.select('text')
                .text(function(d) { return fmt(d);})
                .call(Drawing.font, trace.number.font)
                .style('font-size', labelFontSize)
                .attr({
                    y: 0.2 * bulletHeight,
                    'text-anchor': 'middle',
                    'alignment-baseline': 'hanging'
                });
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
