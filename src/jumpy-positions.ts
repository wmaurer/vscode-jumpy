export interface JumpyPosition {
    line: number;
    character: number;
    charOffset: number;
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
    let positionIndex = 0;
    const positions: JumpyPosition[] = [];
    for (let i = 0; i < lines.length && positionIndex < maxDecorations; i++) {
        let lineText = lines[i];
        let word: RegExpExecArray;
        while (!!(word = regexp.exec(lineText)) && positionIndex < maxDecorations) {
            positions.push({
                line: i + firstLineNumber,
                character: word.index,
                charOffset: 2,
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
    let positionIndex = 0;
    const positions: JumpyPosition[] = [];
    for (let i = 0; i < lines.length && positionIndex < maxDecorations; i++) {
        if (!lines[i].match(regexp)) {
            positions.push({
                line: i + firstLineNumber,
                character: 0,
                charOffset: lines[i].length == 1 ? 1 : 2,
            });
        }
    }
    return positions;
}
