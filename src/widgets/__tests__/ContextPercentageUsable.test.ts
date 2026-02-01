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
import { ContextPercentageUsableWidget } from '../ContextPercentageUsable';

function render(modelId: string | undefined, contextLength: number, rawValue = false, inverse = false) {
    const widget = new ContextPercentageUsableWidget();
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
        id: 'context-percentage-usable',
        type: 'context-percentage-usable',
        rawValue,
        metadata: inverse ? { inverse: 'true' } : undefined
    };

    return widget.render(item, context, DEFAULT_SETTINGS);
}

describe('ContextPercentageUsableWidget', () => {
    describe('Sonnet 4.5 with 800k usable tokens', () => {
        it('should calculate percentage using 800k denominator for Sonnet 4.5 with [1m] suffix', () => {
            const result = render('claude-sonnet-4-5-20250929[1m]', 42000);
            expect(result).toBe('Ctx(u): 5.3%');
        });

        it('should calculate percentage using 800k denominator for Sonnet 4.5 (raw value) with [1m] suffix', () => {
            const result = render('claude-sonnet-4-5-20250929[1m]', 42000, true);
            expect(result).toBe('5.3%');
        });
    });

    describe('Older models with 160k usable tokens', () => {
        it('should calculate percentage using 160k denominator for older Sonnet 3.5', () => {
            const result = render('claude-3-5-sonnet-20241022', 42000);
            expect(result).toBe('Ctx(u): 26.3%');
        });

        it('should calculate percentage using 160k denominator when model ID is undefined', () => {
            const result = render(undefined, 42000);
            expect(result).toBe('Ctx(u): 26.3%');
        });

        it('should calculate percentage using 160k denominator for unknown model', () => {
            const result = render('claude-unknown-model', 42000);
            expect(result).toBe('Ctx(u): 26.3%');
        });
    });

    describe('progress bar display mode', () => {
        function renderWithMode(modelId: string | undefined, contextLength: number, display: string, rawValue = false, inverse = false) {
            const widget = new ContextPercentageUsableWidget();
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
                id: 'context-percentage-usable',
                type: 'context-percentage-usable',
                rawValue,
                metadata: { display, ...(inverse ? { inverse: 'true' } : {}) }
            };
            return widget.render(item, context, DEFAULT_SETTINGS);
        }

        it('should render progress bar for 160k usable model', () => {
            // 42000/160000 = 26.25%, floor(0.2625 * 32) = 8 filled, 24 empty
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'progress');
            expect(result).toBe('Ctx(u) [████████░░░░░░░░░░░░░░░░░░░░░░░░] 26.3%');
        });

        it('should render short progress bar', () => {
            // 42000/160000 = 26.25%, floor(0.2625 * 16) = 4 filled, 12 empty
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'progress-short');
            expect(result).toBe('Ctx(u) [████░░░░░░░░░░░░] 26.3%');
        });

        it('should render progress bar with raw value', () => {
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'progress', true);
            expect(result).toBe('[████████░░░░░░░░░░░░░░░░░░░░░░░░] 26.3%');
        });

        it('should render inverse progress bar showing remaining percentage with used fill', () => {
            const result = renderWithMode('claude-3-5-sonnet-20241022', 42000, 'progress', false, true);
            expect(result).toBe('Ctx(u) [████████░░░░░░░░░░░░░░░░░░░░░░░░] 73.8%');
        });

        it('should render progress bar for 800k usable model', () => {
            // 42000/800000 = 5.25%, floor(0.0525 * 32) = 1 filled, 31 empty
            const result = renderWithMode('claude-sonnet-4-5-20250929[1m]', 42000, 'progress');
            expect(result).toBe('Ctx(u) [█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 5.3%');
        });
    });

    describe('preview with progress mode', () => {
        it('should render progress bar preview', () => {
            const widget = new ContextPercentageUsableWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'context-percentage-usable',
                type: 'context-percentage-usable',
                metadata: { display: 'progress' }
            };
            const result = widget.render(item, context, DEFAULT_SETTINGS);
            // 11.6%, floor(0.116 * 32) = 3 filled, 29 empty
            expect(result).toBe('Ctx(u) [███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 11.6%');
        });

        it('should render short progress bar preview', () => {
            const widget = new ContextPercentageUsableWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'context-percentage-usable',
                type: 'context-percentage-usable',
                metadata: { display: 'progress-short' }
            };
            const result = widget.render(item, context, DEFAULT_SETTINGS);
            // 11.6%, floor(0.116 * 16) = 1 filled, 15 empty
            expect(result).toBe('Ctx(u) [█░░░░░░░░░░░░░░░] 11.6%');
        });
    });
});