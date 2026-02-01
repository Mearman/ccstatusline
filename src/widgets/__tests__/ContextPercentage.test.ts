import {
    describe,
    expect,
    it
} from 'vitest';

import type {
    RenderContext,
    WidgetItem
} from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import { ContextPercentageWidget } from '../ContextPercentage';

function render(modelId: string | undefined, contextLength: number, rawValue = false, inverse = false) {
    const widget = new ContextPercentageWidget();
    const context: RenderContext = {
        data: modelId ? { model: { id: modelId } } : undefined,
        tokenMetrics: {
            inputTokens: 0,
            outputTokens: 0,
            cachedTokens: 0,
            totalTokens: 0,
            contextLength
        }
    };
    const item: WidgetItem = {
        id: 'context-percentage',
        type: 'context-percentage',
        rawValue,
        metadata: inverse ? { inverse: 'true' } : undefined
    };

    return widget.render(item, context, DEFAULT_SETTINGS);
}

describe('ContextPercentageWidget', () => {
    describe('Sonnet 4.5 with 1M context window', () => {
        it('should calculate percentage using 1M denominator for Sonnet 4.5 with [1m] suffix', () => {
            const result = render('claude-sonnet-4-5-20250929[1m]', 42000);
            expect(result).toBe('Ctx: 4.2%');
        });

        it('should calculate percentage using 1M denominator for Sonnet 4.5 (raw value) with [1m] suffix', () => {
            const result = render('claude-sonnet-4-5-20250929[1m]', 42000, true);
            expect(result).toBe('4.2%');
        });
    });

    describe('Older models with 200k context window', () => {
        it('should calculate percentage using 200k denominator for older Sonnet 3.5', () => {
            const result = render('claude-3-5-sonnet-20241022', 42000);
            expect(result).toBe('Ctx: 21.0%');
        });

        it('should calculate percentage using 200k denominator when model ID is undefined', () => {
            const result = render(undefined, 42000);
            expect(result).toBe('Ctx: 21.0%');
        });

        it('should calculate percentage using 200k denominator for unknown model', () => {
            const result = render('claude-unknown-model', 42000);
            expect(result).toBe('Ctx: 21.0%');
        });
    });

    describe('progress bar display mode', () => {
        function renderWithMode(modelId: string | undefined, contextLength: number, display: string, rawValue = false, inverse = false) {
            const widget = new ContextPercentageWidget();
            const context: RenderContext = {
                data: modelId ? { model: { id: modelId } } : undefined,
                tokenMetrics: {
                    inputTokens: 0,
                    outputTokens: 0,
                    cachedTokens: 0,
                    totalTokens: 0,
                    contextLength
                }
            };
            const item: WidgetItem = {
                id: 'context-percentage',
                type: 'context-percentage',
                rawValue,
                metadata: { display, ...(inverse ? { inverse: 'true' } : {}) }
            };
            return widget.render(item, context, DEFAULT_SETTINGS);
        }

        it('should render progress bar for 200k model', () => {
            // 42000/200000 = 21.0%, floor(0.21 * 32) = 6 filled, 26 empty
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'progress');
            expect(result).toBe('Ctx [██████░░░░░░░░░░░░░░░░░░░░░░░░░░] 21.0%');
        });

        it('should render short progress bar', () => {
            // 42000/200000 = 21.0%, floor(0.21 * 16) = 3 filled, 13 empty
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'progress-short');
            expect(result).toBe('Ctx [███░░░░░░░░░░░░░] 21.0%');
        });

        it('should render progress bar with raw value', () => {
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'progress', true);
            expect(result).toBe('[██████░░░░░░░░░░░░░░░░░░░░░░░░░░] 21.0%');
        });

        it('should render inverse progress bar showing remaining percentage with used fill', () => {
            // inverse: display shows 79.0% remaining, but bar fills based on used (21.0%)
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'progress', false, true);
            expect(result).toBe('Ctx [██████░░░░░░░░░░░░░░░░░░░░░░░░░░] 79.0%');
        });

        it('should render progress bar for 1M model', () => {
            // 42000/1000000 = 4.2%, floor(0.042 * 32) = 1 filled, 31 empty
            const result = renderWithMode('claude-sonnet-4-5-20250929[1m]', 42000, 'progress');
            expect(result).toBe('Ctx [█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 4.2%');
        });
    });

    describe('compact bar display modes', () => {
        function renderWithMode(modelId: string | undefined, contextLength: number, display: string, rawValue = false, inverse = false) {
            const widget = new ContextPercentageWidget();
            const context: RenderContext = {
                data: modelId ? { model: { id: modelId } } : undefined,
                tokenMetrics: {
                    inputTokens: 0,
                    outputTokens: 0,
                    cachedTokens: 0,
                    totalTokens: 0,
                    contextLength
                }
            };
            const item: WidgetItem = {
                id: 'context-percentage',
                type: 'context-percentage',
                rawValue,
                metadata: { display, ...(inverse ? { inverse: 'true' } : {}) }
            };
            return widget.render(item, context, DEFAULT_SETTINGS);
        }

        it('should render bar-only mode with no label or percentage', () => {
            // 42000/200000 = 21.0%, floor(0.21 * 16) = 3 filled, 13 empty
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'bar-only');
            expect(result).toBe('[███░░░░░░░░░░░░░]');
        });

        it('should render bar-label mode with percentage centred in larger segment', () => {
            // 21.0% used, empty segment (13) > filled (3), label "21.0%" centred in empty
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'bar-label');
            expect(result).toBe('[███░░░░21.0%░░░░]');
        });

        it('should render bar-only ignoring rawValue', () => {
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'bar-only', true);
            expect(result).toBe('[███░░░░░░░░░░░░░]');
        });

        it('should render bar-label for inverse mode', () => {
            // inverse: fill is still 21.0% (used), label shows in filled segment if it were larger
            // but 21% fill = 3, empty = 13, so label still in empty segment
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'bar-label', false, true);
            expect(result).toBe('[███░░░░21.0%░░░░]');
        });
    });

    describe('preview with progress mode', () => {
        it('should render progress bar preview', () => {
            const widget = new ContextPercentageWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'context-percentage',
                type: 'context-percentage',
                metadata: { display: 'progress' }
            };
            const result = widget.render(item, context, DEFAULT_SETTINGS);
            // 9.3%, floor(0.093 * 32) = 2 filled, 30 empty
            expect(result).toBe('Ctx [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 9.3%');
        });

        it('should render short progress bar preview', () => {
            const widget = new ContextPercentageWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'context-percentage',
                type: 'context-percentage',
                metadata: { display: 'progress-short' }
            };
            const result = widget.render(item, context, DEFAULT_SETTINGS);
            // 9.3%, floor(0.093 * 16) = 1 filled, 15 empty
            expect(result).toBe('Ctx [█░░░░░░░░░░░░░░░] 9.3%');
        });
    });
});