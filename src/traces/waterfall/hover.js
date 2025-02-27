/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hoverLabelText = require('../../plots/cartesian/axes').hoverLabelText;
var opacity = require('../../components/color').opacity;
var hoverOnBars = require('../bar/hover').hoverOnBars;

var DIRSYMBOL = {
    increasing: '▲',
    decreasing: '▼'
};

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var point = hoverOnBars(pointData, xval, yval, hovermode);
    if(!point) return;

    var cd = point.cd;
    var trace = cd[0].trace;
    var isHorizontal = (trace.orientation === 'h');

    var vAxis = isHorizontal ? pointData.xa : pointData.ya;

    function formatNumber(a) {
        return hoverLabelText(vAxis, a);
    }

    // the closest data point
    var index = point.index;
    var di = cd[index];

    var size = (di.isSum) ? di.b + di.s : di.rawS;

    if(!di.isSum) {
        point.initial = di.b + di.s - size;
        point.delta = size;
        point.final = point.initial + point.delta;

        var v = formatNumber(Math.abs(point.delta));
        point.deltaLabel = size < 0 ? '(' + v + ')' : v;
        point.finalLabel = formatNumber(point.final);
        point.initialLabel = formatNumber(point.initial);
    }

    var hoverinfo = di.hi || trace.hoverinfo;
    var text = [];
    if(hoverinfo && hoverinfo !== 'none' && hoverinfo !== 'skip') {
        var isAll = (hoverinfo === 'all');
        var parts = hoverinfo.split('+');

        var hasFlag = function(flag) { return isAll || parts.indexOf(flag) !== -1; };

        if(!di.isSum) {
            if(hasFlag('final') &&
                (isHorizontal ? !hasFlag('x') : !hasFlag('y')) // don't display redundant info.
            ) {
                text.push(point.finalLabel);
            }
            if(hasFlag('delta')) {
                if(size < 0) {
                    text.push(point.deltaLabel + ' ' + DIRSYMBOL.decreasing);
                } else {
                    text.push(point.deltaLabel + ' ' + DIRSYMBOL.increasing);
                }
            }
            if(hasFlag('initial')) {
                text.push('Initial: ' + point.initialLabel);
            }
        }
    }

    if(text.length) point.extraText = text.join('<br>');

    point.color = getTraceColor(trace, di);

    return [point];
};

function getTraceColor(trace, di) {
    var cont = trace[di.dir].marker;
    var mc = cont.color;
    var mlc = cont.line.color;
    var mlw = cont.line.width;
    if(opacity(mc)) return mc;
    else if(opacity(mlc) && mlw) return mlc;
}
