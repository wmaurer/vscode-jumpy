export interface HopperPosition {
    line: number;
    character: number;
    charOffset: number;
}

export interface HopperFn {
    (maxDecorations: number, firstLineNumber: number, lines: string[], regexp: RegExp): HopperPosition[];
}

export function hopperWord(
    maxDecorations: number,
    firstLineNumber: number,
    lines: string[],
    regexp: RegExp,
): HopperPosition[] {
    let positionIndex = 0;
    const positions: HopperPosition[] = [];

    // For each line in the document,
    // find all the words that match the regexp
    // and add them to the positions array
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

export function hopperLine(
    maxDecorations: number,
    firstLineNumber: number,
    lines: string[],
    regexp: RegExp,
): HopperPosition[] {
    let positionIndex = 0;
    const positions: HopperPosition[] = [];
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
