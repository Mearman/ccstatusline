import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextConfig } from '../utils/model-context';

type DisplayMode = 'text' | 'progress' | 'progress-short';

export class ContextPercentageWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return 'Shows percentage of context window used or remaining'; }
    getDisplayName(): string { return 'Context %'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const isInverse = item.metadata?.inverse === 'true';
        const mode = (item.metadata?.display ?? 'text') as DisplayMode;
        const modifiers: string[] = [];

        if (isInverse) {
            modifiers.push('remaining');
        }
        if (mode === 'progress') {
            modifiers.push('progress bar');
        } else if (mode === 'progress-short') {
            modifiers.push('short bar');
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
            const currentMode = (item.metadata?.display ?? 'text') as DisplayMode;
            let nextMode: DisplayMode;
            if (currentMode === 'text') {
                nextMode = 'progress';
            } else if (currentMode === 'progress') {
                nextMode = 'progress-short';
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
        const displayMode = (item.metadata?.display ?? 'text') as DisplayMode;

        if (context.isPreview) {
            return this.formatOutput(item, displayMode, isInverse ? 90.7 : 9.3, isInverse);
        } else if (context.tokenMetrics) {
            const modelId = context.data?.model?.id;
            const contextConfig = getContextConfig(modelId);
            const usedPercentage = Math.min(100, (context.tokenMetrics.contextLength / contextConfig.maxTokens) * 100);
            const displayPercentage = isInverse ? (100 - usedPercentage) : usedPercentage;
            return this.formatOutput(item, displayMode, displayPercentage, isInverse);
        }
        return null;
    }

    private formatOutput(item: WidgetItem, displayMode: DisplayMode, percentage: number, isInverse: boolean): string {
        const prefix = item.rawValue ? '' : 'Ctx ';
        if (displayMode === 'progress' || displayMode === 'progress-short') {
            const barWidth = displayMode === 'progress' ? 32 : 16;
            const fillPercentage = isInverse ? (100 - percentage) : percentage;
            const filledWidth = Math.floor((fillPercentage / 100) * barWidth);
            const emptyWidth = barWidth - filledWidth;
            const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
            return `${prefix}[${progressBar}] ${percentage.toFixed(1)}%`;
        }
        return item.rawValue ? `${percentage.toFixed(1)}%` : `Ctx: ${percentage.toFixed(1)}%`;
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