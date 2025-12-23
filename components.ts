

let hairColors = [
    '#0C0C0D',
    '#392613',
    '#604020',
    '#804000',
    '#A87E00',
    '#DFCFA0',
    '#A80000',
    '#A82A00',
    '#879292',
    '#D3DEDE'
];

let components = {
    hair: {
        colors: hairColors,
        values:    [
        {
            front: 'A/normal',
            back: 'A/normal'
        },
        {
            front: 'A/normal',
            back: 'A/short'
        },
        {
            front: 'A/normal',
            back: 'A/small'
        },
        {
            front: 'A/raised',
            back: 'A/very small'
        },
        {
            front: 'A/small',
            back: 'A/normal'
        },
        {
            front: 'A/small',
            back: 'A/short'
        },
        {
            front: 'A/small',
            back: 'A/small'
        },
        {
            front: 'A/small',
            back: 'C'
        },
        {
            front: 'B',
            back: 'A/normal'
        },
        {
            front: 'B',
            back: 'C'
        },
        {
            front: 'B',
            back: 'A/short'
        },
        {
            front: 'B',
            back: 'B'
        },

        {
            front: 'D/normal',
            back: 'C'
        },
        {
            front: 'D/normal',
            back: 'D/normal'
        },
        {
            front: 'D/normal',
            back: 'D/long'
        },
        {
            front: 'D/normal',
            back: 'D/short'
        },
        {
            front: 'D/alt',
            back: 'A/short'
        },
        {
            front: 'D/alt',
            back: 'D/normal'
        },
        {
            front: 'D/alt',
            back: 'D/long'
        },
        {
            front: 'D/alt',
            back: 'D/short'
        },
        {
            front: 'E/normal',
            back: 'E/normal'
        },
        {
            front: 'E/normal',
            back: 'E/large'
        },
        {
            front: 'E/high',
            back: 'E/normal'
        },
        {
            front: 'G/normal',
            back: 'E/large'
        },
        {
            front: 'D/alt',
            back: 'F/normal'
        },
        {
            front: 'D/alt',
            back: 'F/short'
        },
        {
            front: 'E/normal',
            back: 'F/normal'
        },
        {
            front: 'G/normal',
            back: 'F/short'
        },
        {
            front: 'G/normal',
            back: 'A/normal'
        },
        {
            front: 'G/high',
            back: 'A/normal'
        },
        {
            front: 'G/normal',
            back: 'I'
        }, 
        {
            front: 'G/high',
            back: 'I'
        },
        {
            front: 'G/normal',
            back: 'G/normal'
        },
        {
            front: 'G/high',
            back: 'G/normal'
        }, {
            front: 'G/ultrahigh',
            back: 'G/normal'
        },
        {
            front: 'B',
            back: 'G/alt'
        },
        {
            front: 'A/small',
            back: 'H'
        },
        {
            front: 'D/normal',
            back: 'H'
        },
        {
            front: 'D/alt',
            back: 'H'
        },
        {
            front: 'E/high',
            back: 'H'
        },
        ]
    },
    head: {
        colors: [
            '#392613',
            '#6B472E',
            '#734D26',
            '#8F6224',
            '#B18044',
            '#DBB470',
            '#DFBF9F',
            '#FFD9B3',
            '#FFD7BF',
            '#FFE5CC'
        ],
        values: ['normal', 'narrow', 'low', 'lowWide', 'wide', 'high', 'highNarrow', 'noChin']
    },
    mole: {
        colors: [
            '#0D0D0C',
            '#693F3F',
            '#996673',
        ],
        values: ['left', 'right', '']
    },
    blush: {
        colors: [
            '#FFCCB366',
            '#FFC0B380',
            '#A3662966',
            '#C651394D'
        ],
        values: ['blush', '']
    },
    eyes: {
        colors: [
            '#0054A8',
            '#007EA8',
            '#339955',
            '#78AA55',
            '#7E692A',
            '#7E542A',
            '#604020',
            '#608F9F',
            '#0D0D0C'
        ],
        values: ['normal', 'oval', 'round', 'circle', 'tired', 'wink', 'blink']
    },
    nose: {
        colors: [],
        values: [
            'normal',
            'narrow',
            'wide',
            'bent',
            'topless',
            'toplessNarrow',
            'toplessWide',
            'toplessBent',
            'short',
            'shortWide',
            '3D',
            '3DLong'
        ]
    },
    mouth: {
        colors: ['#BF4060', '#BF409F', '#7E3F2A', '#602030'],
        values: [
            'flat',
            'smile2',
            'smile',
            'smirk',
            'lipstick',
            'lipstick2',
            'flat3',
            'flat2',
            'frown',
            'smirk2',
            'angry',
            'angry2',
            'sour',
            'lined',
            'ball',
            'ball2'
        ]
    },
    glasses: {
        colors: ['#0C0C0D', '#392613', '#3D3D43', '#806000', '#7E2A69', '#2A697E', '#133928'],
        values: [
            '',
            'oval',
            'middle',
            'rectangle',
            'asymmetric',
            'up',
            'circle',
            'goggle',
            'goggle2',
            'sunglasses/oval',
            'sunglasses/middle',
            'sunglasses/rectangle',
            'sunglasses/asymmetric'
        ]
    },
    moustache: {
        colors: hairColors,
        values: [
            '',
            'A',
            'B',
            'C',
            'D'
        ]
    }
};

export default components;
