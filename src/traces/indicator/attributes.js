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

// var extendFlat = require('../../lib/extend').extendFlat;

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
        description: [
            'Sets the value formatting rule using d3 formatting mini-language',
            'which is similar to those of Python. See',
            'https://github.com/d3/d3-format/blob/master/README.md#locale_format'
        ].join(' ')
    },

    min: {
        valType: 'number',
        editType: 'calc',
        dflt: 0,
        description: [
            'Sets the minimum value of the gauge.'
        ].join(' ')
    },

    max: {
        valType: 'number',
        editType: 'calc',
        description: [
            'Sets the maximum value of the gauge.'
        ].join(' ')
    },

    mode: {
        valType: 'enumerated',
        editType: 'calc',
        values: ['gauge', 'bignumber'],
        dflt: 'bignumber'
    },
};
