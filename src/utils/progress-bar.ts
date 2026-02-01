export function renderProgressBar(percentage: number, barWidth: number): string {
    const filledWidth = Math.floor((percentage / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;
    return '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
}