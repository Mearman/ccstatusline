import { BaseContextPercentageWidget } from './BaseContextPercentage';

export class ContextPercentageWidget extends BaseContextPercentageWidget {
    protected readonly label = 'Ctx';
    protected readonly previewPercentage = 9.3;

    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return 'Shows percentage of context window used or remaining'; }
    getDisplayName(): string { return 'Context %'; }

    protected getDenominator(config: { maxTokens: number }): number {
        return config.maxTokens;
    }
}