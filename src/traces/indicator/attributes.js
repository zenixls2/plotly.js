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

var fontAttrs = require('../../plots/font_attributes');
var textFontAttrs = fontAttrs({
    editType: 'plot',
    arrayOk: true,
    colorEditType: 'plot',
    description: 'Sets the font used for `textinfo`.'
});
delete(textFontAttrs.size); // TODO: relative size?

module.exports = {
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

    font: extendFlat({}, textFontAttrs, {
        size: undefined,
        description: [
            'Set the font used to display main number'
        ].join(' ')
    }),

    gauge: {
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
        description: 'The gauge of the Indicator plot.'
    },

    mode: {
        valType: 'enumerated',
        editType: 'calc',
        role: 'info',
        values: ['gauge', 'bignumber'],
        dflt: 'bignumber'
    },
};
