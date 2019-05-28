/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// var plotAttrs = require('../../plots/attributes');
// var domainAttrs = require('../../plots/domain').attributes;

var extendFlat = require('../../lib/extend').extendFlat;
var extendDeep = require('../../lib/extend').extendDeep;
var fontAttrs = require('../../plots/font_attributes');
var colorAttrs = require('../../components/color/attributes');
var domainAttrs = require('../../plots/domain').attributes;

var textFontAttrs = fontAttrs({
    editType: 'plot',
    arrayOk: true,
    colorEditType: 'plot',
    description: 'Sets the font used for `textinfo`.'
});
delete(textFontAttrs.size); // TODO: relative size?

var gaugeArcAttr = {
    color: {
        valType: 'color',
        editType: 'style',
        description: [
            'Sets the background color of the arc.'
        ].join(' ')
    },

    line: {
        color: {
            valType: 'color',
            role: 'style',
            dflt: colorAttrs.defaultLine,
            editType: 'style',
            description: [
                'Sets the color of the line enclosing each sector.'
            ].join(' ')
        },
        width: {
            valType: 'number',
            role: 'style',
            min: 0,
            dflt: 0,
            editType: 'style',
            description: [
                'Sets the width (in px) of the line enclosing each sector.'
            ].join(' ')
        },
        editType: 'calc'
    },
    editType: 'calc'
};


module.exports = {
    mode: {
        valType: 'enumerated',
        editType: 'calc',
        role: 'info',
        values: ['gauge', 'bignumber', 'sparkline'],
        dflt: 'bignumber'
    },
    values: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the number to be displayed.'
        ].join(' ')
    },
    valueformat: {
        valType: 'string',
        dflt: '.3s',
        role: 'style',
        editType: 'plot',
        description: [
            'Sets the value formatting rule using d3 formatting mini-language',
            'which is similar to those of Python. See',
            'https://github.com/d3/d3-format/blob/master/README.md#locale_format'
        ].join(' ')
    },
    min: {
        valType: 'number',
        editType: 'calc',
        role: 'info',
        dflt: 0,
        description: [
            'Sets the minimum value of the gauge.'
        ].join(' ')
    },
    max: {
        valType: 'number',
        editType: 'calc',
        role: 'info',
        description: [
            'Sets the maximum value of the gauge.'
        ].join(' ')
    },
    // position and shape
    domain: domainAttrs({name: 'indicator', trace: true, editType: 'calc'}),
    font: extendFlat({}, textFontAttrs, {
        description: [
            'Set the font used to display main number'
        ].join(' ')
    }),

    ticker: {
        showticker: {
            valType: 'boolean',
            editType: 'style',
            role: 'style',
            dflt: false,
            description: [
                'Show a ticker'
            ].join(' ')
        },
        showpercentage: {
            valType: 'boolean',
            editType: 'style',
            role: 'style',
            dflt: false,
            description: [
                'Show relative change in percentage'
            ].join(' ')
        }
    },
    gauge: {
        background: extendFlat({}, gaugeArcAttr, {
            description: [
                'Set the appearance of the gauge\'s background'
            ].join(' ')
        }),
        value: extendDeep({}, gaugeArcAttr, {
            color: {dflt: 'green'},
            description: [
                'Set the appearance of the gauge\'s value'
            ].join(' ')
        }),
        target: extendFlat({}, gaugeArcAttr, {
            description: [
                'Set the appearance of the gauge\'s target'
            ].join(' ')
        }),
        description: 'The gauge of the Indicator plot.'
    }
};
