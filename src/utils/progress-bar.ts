export function renderProgressBar(percentage: number, barWidth: number): string {
    const filledWidth = Math.floor((percentage / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;
    return '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
}

export function renderProgressBarWithLabel(percentage: number, barWidth: number): string {
    const bar = renderProgressBar(percentage, barWidth);
    const label = `${percentage.toFixed(1)}%`;

    if (label.length >= barWidth) {
        return label.slice(0, barWidth);
    }

    const filledWidth = Math.floor((percentage / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const largerStart = filledWidth >= emptyWidth ? 0 : filledWidth;
    const largerLength = Math.max(filledWidth, emptyWidth);
    const labelStart = largerStart + Math.floor((largerLength - label.length) / 2);

    return bar.slice(0, labelStart) + label + bar.slice(labelStart + label.length);
}