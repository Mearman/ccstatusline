import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    renderProgressBar,
    renderProgressBarWithLabel
} from '../utils/progress-bar';

type DisplayMode = 'time' | 'progress' | 'progress-short' | 'bar-only' | 'bar-label';

function isBlockTimerDisplayMode(value: string | undefined): value is DisplayMode {
    return value === 'time' || value === 'progress' || value === 'progress-short' || value === 'bar-only' || value === 'bar-label';
}

function toBlockTimerDisplayMode(value: string | undefined, fallback: DisplayMode): DisplayMode {
    return isBlockTimerDisplayMode(value) ? value : fallback;
}

export class BlockTimerWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return 'Shows elapsed time since beginning of current 5hr block'; }
    getDisplayName(): string { return 'Block Timer'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const mode = item.metadata?.display ?? 'time';
        const modifiers: string[] = [];

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
        if (action === 'toggle-progress') {
            const currentMode = toBlockTimerDisplayMode(item.metadata?.display, 'time');
            let nextMode: DisplayMode;

            if (currentMode === 'time') {
                nextMode = 'progress';
            } else if (currentMode === 'progress') {
                nextMode = 'progress-short';
            } else if (currentMode === 'progress-short') {
                nextMode = 'bar-only';
            } else if (currentMode === 'bar-only') {
                nextMode = 'bar-label';
            } else {
                nextMode = 'time';
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
        const displayMode = toBlockTimerDisplayMode(item.metadata?.display, 'time');

        if (context.isPreview) {
            const prefix = item.rawValue ? '' : 'Block ';
            if (displayMode === 'bar-only') {
                return `[${renderProgressBar(73.9, 16)}]`;
            } else if (displayMode === 'bar-label') {
                return `[${renderProgressBarWithLabel(73.9, 16)}]`;
            } else if (displayMode === 'progress') {
                return `${prefix}[${renderProgressBar(73.9, 32)}] 73.9%`;
            } else if (displayMode === 'progress-short') {
                return `${prefix}[${renderProgressBar(73.9, 16)}] 73.9%`;
            }
            return item.rawValue ? '3hr 45m' : 'Block: 3hr 45m';
        }

        // Check if we have block metrics in context
        const blockMetrics = context.blockMetrics;
        if (!blockMetrics) {
            // No active session - show empty progress bar or 0hr 0m
            if (displayMode === 'bar-only') {
                return `[${renderProgressBar(0, 16)}]`;
            } else if (displayMode === 'bar-label') {
                return `[${renderProgressBarWithLabel(0, 16)}]`;
            } else if (displayMode === 'progress' || displayMode === 'progress-short') {
                const barWidth = displayMode === 'progress' ? 32 : 16;
                return item.rawValue ? `[${renderProgressBar(0, barWidth)}] 0%` : `Block [${renderProgressBar(0, barWidth)}] 0%`;
            } else {
                return item.rawValue ? '0hr 0m' : 'Block: 0hr 0m';
            }
        }

        try {
            // Calculate elapsed time and progress
            const now = new Date();
            const elapsedMs = now.getTime() - blockMetrics.startTime.getTime();
            const sessionDurationMs = 5 * 60 * 60 * 1000; // 5 hours
            const progress = Math.min(elapsedMs / sessionDurationMs, 1.0);
            const percentage = (progress * 100).toFixed(1);

            if (displayMode === 'bar-only') {
                return `[${renderProgressBar(progress * 100, 16)}]`;
            } else if (displayMode === 'bar-label') {
                return `[${renderProgressBarWithLabel(progress * 100, 16)}]`;
            } else if (displayMode === 'progress' || displayMode === 'progress-short') {
                const barWidth = displayMode === 'progress' ? 32 : 16;
                const progressBar = renderProgressBar(progress * 100, barWidth);

                if (item.rawValue) {
                    return `[${progressBar}] ${percentage}%`;
                } else {
                    return `Block [${progressBar}] ${percentage}%`;
                }
            } else {
                // Time display mode
                const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
                const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));

                let timeString: string;
                if (elapsedMinutes === 0) {
                    timeString = `${elapsedHours}hr`;
                } else {
                    timeString = `${elapsedHours}hr ${elapsedMinutes}m`;
                }

                return item.rawValue ? timeString : `Block: ${timeString}`;
            }
        } catch {
            return null;
        }
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'p', label: '(p)rogress toggle', action: 'toggle-progress' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}