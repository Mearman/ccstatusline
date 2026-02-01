import { BaseContextPercentageWidget } from './BaseContextPercentage';

export class ContextPercentageUsableWidget extends BaseContextPercentageWidget {
    protected readonly label = 'Ctx(u)';
    protected readonly previewPercentage = 11.6;

    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return 'Shows percentage of usable context window used or remaining (80% of max before auto-compact)'; }
    getDisplayName(): string { return 'Context % (usable)'; }

    protected getDenominator(config: { usableTokens: number }): number {
        return config.usableTokens;
    }
}