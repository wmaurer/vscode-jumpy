export interface JumpyPosition {
    line: number;
    character: number;
}

export interface JumpyFn {
    (maxDecorations: number, firstLineNumber: number, lines: string[], regexp: RegExp): JumpyPosition[];
}

export function jumpyWord(
    maxDecorations: number,
    firstLineNumber: number,
    lines: string[],
    regexp: RegExp,
): JumpyPosition[] {
    const positions: JumpyPosition[] = [];
    for (let i = 0; i < lines.length && isValidIndex(positions.length, maxDecorations); i++) {
        let lineText = lines[i];
        let word: RegExpExecArray;
        while (!!(word = regexp.exec(lineText)) && isValidIndex(positions.length, maxDecorations)) {
            positions.push({
                line: i + firstLineNumber,
                character: word.index,
            });
        }
    }
    return positions;
}

export function jumpyLine(
    maxDecorations: number,
    firstLineNumber: number,
    lines: string[],
    regexp: RegExp,
): JumpyPosition[] {
    const positions: JumpyPosition[] = [];
    for (let i = 0; i < lines.length && isValidIndex(positions.length, maxDecorations); i++) {
        if (!lines[i].match(regexp)) {
            positions.push({
                line: i + firstLineNumber,
                character: 0,
            });
        }
    }
    return positions;
}

function isValidIndex(index: number, max: number): boolean {
    if (max < 0) return true;
    return (index < max);
};
