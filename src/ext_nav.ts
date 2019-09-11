import { TextEditor, TextLine, DecorationOptions } from 'vscode';
import { createDecorationOptions } from './ext_settings';

const CODE_ARRAY = createCodeArray();
const MAX_DECORATIONS = CODE_ARRAY.length;

export interface JumpPosition {
    line: number;
    character: number;
    charOffset: number;
}

export interface JumpPositionMap {
    [code: string]: JumpPosition;
}

export type JumpCallbck = (
    firstLineNumber: number,
    lines: TextLine[],
    regex: RegExp,
) => [JumpPositionMap, DecorationOptions[]];

export function jumpWord(
    firstLineNumber: number,
    lines: TextLine[],
    regex: RegExp,
): [JumpPositionMap, DecorationOptions[]] {
    const positions: JumpPositionMap = {};
    const decorationOptions: DecorationOptions[] = [];

    let posCount = 0;
    for (let i = 0; i < lines.length && posCount < MAX_DECORATIONS; i++) {
        const text = lines[i].text;

        let regexRes = regex.exec(text);
        while (regexRes != null && posCount < MAX_DECORATIONS) {
            const code = CODE_ARRAY[posCount];
            const position = {
                line: i + firstLineNumber,
                character: regexRes.index,
                charOffset: 2,
            };

            positions[code] = position;
            decorationOptions.push(
                createDecorationOptions(position.line, position.character, code),
            );

            posCount += 1;
            regexRes = regex.exec(text);
        }
    }

    return [positions, decorationOptions];
}

export function jumpLine(
    firstLineNumber: number,
    lines: TextLine[],
    regexp: RegExp,
): [JumpPositionMap, DecorationOptions[]] {
    const positions: JumpPositionMap = {};
    const decorationOptions: DecorationOptions[] = [];

    let posCount = 0;
    for (let i = 0; i < lines.length && posCount < MAX_DECORATIONS; i++) {
        if (!lines[i].text.match(regexp)) {
            const code = CODE_ARRAY[posCount];
            const position = {
                line: i + firstLineNumber,
                character: 0,
                charOffset: lines[i].text.length === 1 ? 1 : 2,
            };

            positions[code] = position;
            decorationOptions.push(
                createDecorationOptions(position.line, position.character, code),
            );
            posCount += 1;
        }
    }

    return [positions, decorationOptions];
}

export function getLines(editor: TextEditor): [number, TextLine[]] {
    const lines: TextLine[] = [];

    const document = editor.document;
    const ranges = editor.visibleRanges;
    const firstLineNumber = ranges[0] ? ranges[0].start.line : 0;

    for (const range of ranges) {
        let lineNumber = range.start.line;
        while (lineNumber <= range.end.line) {
            lines.push(document.lineAt(lineNumber));
            lineNumber += 1;
        }
    }

    return [firstLineNumber, lines];
}

export function createCodeArray(): string[] {
    const codes = [];
    const sets = [
        ['a', 's', 'd', 'f', 'g'],
        ['q', 'w', 'e', 'r', 't'],
        ['z', 'x', 'c', 'v', 'b'],
        ['l', 'k', 'j', 'h'],
        ['p', 'o', 'i', 'u', 'y'],
        ['m', 'n'],
    ];

    for (const set of sets) {
        for (let i = 0; i < set.length; i++) {
            for (let j = i; j < set.length; j++) {
                codes.push(`${set[i]}${set[j]}`);
            }
        }
    }

    return codes;
}
