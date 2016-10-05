export interface JumpyPosition {
    line: number;
    character: number;
}

const wordRegexp = new RegExp(/([A-Z]+([0-9a-z])*)|[a-z0-9]{2,}/, 'g');

export function jumpyWord(maxDecorations: number, firstLineNumber: number, lines: string[]): JumpyPosition[] {
    let positionIndex = 0;
    const positions = [];
    for (let i = 0; i < lines.length && positionIndex < maxDecorations; i++) {
        let lineText = lines[i];
        let word: RegExpExecArray;
        while (!!(word = wordRegexp.exec(lineText)) && positionIndex < maxDecorations) {
            positions.push({ line: i + firstLineNumber, character: word.index });
        }
    }
    return positions;
}

const blankLineRegexp = new RegExp(/^\s*$/);

export function jumpyLine(maxDecorations: number, firstLineNumber: number, lines: string[]): JumpyPosition[] {
    let positionIndex = 0;
    const positions = [];
    for (let i = 0; i < lines.length && positionIndex < maxDecorations; i++) {
        if (!lines[i].match(blankLineRegexp)) {
            positions.push({ line: i + firstLineNumber, character: 0 });
        }
    }
    return positions;
}
