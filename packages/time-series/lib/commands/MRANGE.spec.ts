import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MRANGE';
import { TimeSeriesAggregationType, TimeSeriesReduceType } from '.';

describe('MRANGE', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments(0, 10, ['name=value', 'age!=']),
                ['TS.MRANGE', '0', '10', 'FILTER', 'name=value', 'age!=']
            );
        });

        it('with FILTER_BY_TS', () => {
            assert.deepEqual(
                transformArguments(0, 10, ['name=value'], {
                    FILTER_BY_TS: [1]
                }),
                ['TS.MRANGE', '0', '10', 'FILTER_BY_TS', '1', 'FILTER', 'name=value']
            );
        });

        it('with FILTER_BY_VALUE', () => {
            assert.deepEqual(
                transformArguments(0, 10, ['name=value'], {
                    FILTER_BY_VALUE: {min: 4, max: 6}
                }),
                ['TS.MRANGE', '0', '10', 'FILTER_BY_VALUE', '4', '6', 'FILTER', 'name=value']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments(0, 10, ['name=value'], {
                    COUNT: 1
                }),
                ['TS.MRANGE', '0', '10', 'COUNT', '1', 'FILTER', 'name=value']
            );
        });

        it('with ALIGN', () => {
            assert.deepEqual(
                transformArguments(0, 10, ['name=value'], {
                    ALIGN: '-'
                }),
                ['TS.MRANGE', '0', '10', 'ALIGN', '-', 'FILTER', 'name=value']
            );
        });

        it('with AGGREGATION', () => {
            assert.deepEqual(
                transformArguments(0, 10, ['name=value'], {
                    AGGREGATION: { 
                        type: TimeSeriesAggregationType.AVARAGE,
                        timeBucket: 5
                    }
                }),
                ['TS.MRANGE', '0', '10', 'AGGREGATION', 'avg', '5', 'FILTER', 'name=value']
            );
        });

        it('with GROUPBY and REDUCE', () => {
            assert.deepEqual(
                transformArguments(0, 10, ['name=value'], {
                    GROUPBY: 'name',
                    REDUCE: TimeSeriesReduceType.SUM
                }),
                ['TS.MRANGE', '0', '10', 'FILTER', 'name=value', 'GROUPBY', 'name', 'REDUCE', 'sum']
            );
        });

        it('with FILTER_BY_TS, FILTER_BY_VALUE, COUNT, ALIGN, AGGREGATION, GROUPBY and REDUCE', () => {
            assert.deepEqual(
                transformArguments(0, 10, ['name=value'], {
                    FILTER_BY_TS: [1],
                    FILTER_BY_VALUE: {
                        min: 4,
                        max: 6
                    },
                    COUNT: 1,
                    ALIGN: '+',
                    AGGREGATION: { 
                        type: TimeSeriesAggregationType.FIRST, 
                        timeBucket: 5 
                    },
                    GROUPBY: 'age',
                    REDUCE: TimeSeriesReduceType.SUM
                }),
                ['TS.MRANGE', '0', '10', 'FILTER_BY_TS', '1', 'FILTER_BY_VALUE', 
                '4', '6', 'COUNT', '1', 'ALIGN', '+', 'AGGREGATION', 'first', '5',
                'FILTER', 'name=value', 'GROUPBY', 'age', 'REDUCE', 'sum']
            );
        });
    });

    testUtils.testWithClient('client.ts.mrange', async client => {
        await Promise.all([
            client.ts.create('key1', {
                LABELS: { MRANGEkey: 'MRANGEvalue'}
            }),
            client.ts.create('key2', {
                LABELS: { MRANGEkey: 'MRANGEvalue'}
            }),
            client.ts.add('key1', 1, 2),
            client.ts.add('key2', 0, 2),
        ]);

        assert.deepEqual(
            await client.ts.mRange(0, 100, ['MRANGEkey=MRANGEvalue']),
            [
                {
                    key: 'key1',
                    samples: [{
                        timestamp: 1,
                        value: 2
                    }]
                },
                {
                    key: 'key2',
                    samples: [{
                        timestamp: 0,
                        value: 2
                    }]
                }
            ]
        );
    }, GLOBAL.SERVERS.OPEN);
});
