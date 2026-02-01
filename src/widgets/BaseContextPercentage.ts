import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextConfig } from '../utils/model-context';
import {
    renderProgressBar,
    renderProgressBarWithLabel
} from '../utils/progress-bar';

type DisplayMode = 'text' | 'progress' | 'progress-short' | 'bar-only' | 'bar-label';

function isDisplayMode(value: string | undefined): value is DisplayMode {
    return value === 'text' || value === 'progress' || value === 'progress-short' || value === 'bar-only' || value === 'bar-label';
}

function toDisplayMode(value: string | undefined, fallback: DisplayMode): DisplayMode {
    return isDisplayMode(value) ? value : fallback;
}

interface ContextConfig {
    maxTokens: number;
    usableTokens: number;
}

export abstract class BaseContextPercentageWidget implements Widget {
    protected abstract readonly label: string;
    protected abstract readonly previewPercentage: number;

    abstract getDefaultColor(): string;
    abstract getDescription(): string;
    abstract getDisplayName(): string;
    protected abstract getDenominator(config: ContextConfig): number;

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const isInverse = item.metadata?.inverse === 'true';
        const mode = toDisplayMode(item.metadata?.display, 'text');
        const modifiers: string[] = [];

        if (isInverse) {
            modifiers.push('remaining');
        }
        if (mode === 'progress') {
            modifiers.push('progress bar');
        } else if (mode === 'progress-short') {
            modifiers.push('short bar');
        } else if (mode === 'bar-only') {
            modifiers.push('bar only');
        } else if (mode === 'bar-label') {
            modifiers.push('bar with label');
        }

        return {
            displayText: this.getDisplayName(),
            modifierText: modifiers.length > 0 ? `(${modifiers.join(', ')})` : undefined
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-inverse') {
            const currentState = item.metadata?.inverse === 'true';
            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    inverse: (!currentState).toString()
                }
            };
        }
        if (action === 'toggle-progress') {
            const currentMode = toDisplayMode(item.metadata?.display, 'text');
            let nextMode: DisplayMode;
            if (currentMode === 'text') {
                nextMode = 'progress';
            } else if (currentMode === 'progress') {
                nextMode = 'progress-short';
            } else if (currentMode === 'progress-short') {
                nextMode = 'bar-only';
            } else if (currentMode === 'bar-only') {
                nextMode = 'bar-label';
            } else {
                nextMode = 'text';
            }
            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    display: nextMode
                }
            };
        }
        return null;
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const isInverse = item.metadata?.inverse === 'true';
        const displayMode = toDisplayMode(item.metadata?.display, 'text');

        if (context.isPreview) {
            const previewValue = isInverse ? (100 - this.previewPercentage) : this.previewPercentage;
            return this.formatOutput(item, displayMode, previewValue, isInverse);
        } else if (context.tokenMetrics) {
            const modelId = context.data?.model?.id;
            const contextConfig = getContextConfig(modelId);
            const denominator = this.getDenominator(contextConfig);
            const usedPercentage = Math.min(100, (context.tokenMetrics.contextLength / denominator) * 100);
            const displayPercentage = isInverse ? (100 - usedPercentage) : usedPercentage;
            return this.formatOutput(item, displayMode, displayPercentage, isInverse);
        }
        return null;
    }

    private formatOutput(item: WidgetItem, displayMode: DisplayMode, percentage: number, isInverse: boolean): string {
        const fillPercentage = isInverse ? (100 - percentage) : percentage;

        if (displayMode === 'bar-only') {
            return `[${renderProgressBar(fillPercentage, 16)}]`;
        }
        if (displayMode === 'bar-label') {
            return `[${renderProgressBarWithLabel(fillPercentage, 16)}]`;
        }
        if (displayMode === 'progress' || displayMode === 'progress-short') {
            const prefix = item.rawValue ? '' : `${this.label} `;
            const barWidth = displayMode === 'progress' ? 32 : 16;
            const progressBar = renderProgressBar(fillPercentage, barWidth);
            return `${prefix}[${progressBar}] ${percentage.toFixed(1)}%`;
        }
        return item.rawValue ? `${percentage.toFixed(1)}%` : `${this.label}: ${percentage.toFixed(1)}%`;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'l', label: '(l)eft/remaining', action: 'toggle-inverse' },
            { key: 'p', label: '(p)rogress toggle', action: 'toggle-progress' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}