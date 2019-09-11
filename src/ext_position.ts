import { DecorationOptions, Range, TextLine } from 'vscode';
import { ExtState } from './ext_state';

export interface JumpPosition {
    line: number;
    character: number;
}

export interface JumpPositionMap {
    [code: string]: JumpPosition;
}

export type JumpCallback = (
    state: ExtState,
    firstLineNumber: number,
    lines: TextLine[],
    regex: RegExp,
) => [JumpPositionMap, DecorationOptions[]];

export function createDecorationOptions(
    line: number,
    startCharacter: number,
    code: string,
): DecorationOptions {
    return {
        range: new Range(line, startCharacter, line, startCharacter),
        renderOptions: {
            dark: {
                after: {
                    contentText: code,
                },
            },
            light: {
                after: {
                    contentText: code,
                },
            },
        },
    };
}

export function jumpWord(
    state: ExtState,
    firstLineNumber: number,
    lines: TextLine[],
    regex: RegExp,
): [JumpPositionMap, DecorationOptions[]] {
    const positions: JumpPositionMap = {};
    const decorationOptions: DecorationOptions[] = [];

    let posCount = 0;
    for (let i = 0; i < lines.length && posCount < state.maxDecorations; i++) {
        const text = lines[i].text;

        let regexRes = regex.exec(text);
        while (regexRes != null && posCount < state.maxDecorations) {
            const code = state.codes[posCount];

            if (regexRes.index < 4) {
                regexRes = regex.exec(text);
                continue;
            }

            const position = {
                line: i + firstLineNumber,
                character: regexRes.index,
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
    state: ExtState,
    firstLineNumber: number,
    lines: TextLine[],
    regexp: RegExp,
): [JumpPositionMap, DecorationOptions[]] {
    const positions: JumpPositionMap = {};
    const decorationOptions: DecorationOptions[] = [];

    let posCount = 0;
    for (let i = 0; i < lines.length && posCount < state.maxDecorations; i++) {
        if (!lines[i].text.match(regexp)) {
            const code = state.codes[posCount];
            const position = {
                line: i + firstLineNumber,
                character: 2,
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
