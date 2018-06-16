import * as vscode from 'vscode';

const plusMinusLines = 60;
const numCharCodes = 26;

export function createCodeArray(): string[] {
    const codeArray = new Array(numCharCodes * numCharCodes);
    let codeIndex = 0;
    for (let i = 0; i < numCharCodes; i++) {
        for (let j = 0; j < numCharCodes; j++) {
            codeArray[codeIndex++] = String.fromCharCode(97 + i) + String.fromCharCode(97 + j);
        }
    }
    return codeArray;
}

let darkDataUriCache: { [index: string]: vscode.Uri } = {};
let lightDataUriCache: { [index: string]: vscode.Uri } = {};

export interface Decoration {
    bgColor: string;
    fgColor: string;

    fontFamily: string;
    fontSize: number;
}

export function createDataUriCaches(codeArray: string[], darkDecoration: Decoration, lightDecoration: Decoration) {
    codeArray.forEach(code => (darkDataUriCache[code] = getSvgDataUri(code, darkDecoration)));
    codeArray.forEach(code => (lightDataUriCache[code] = getSvgDataUri(code, lightDecoration)));
}

export function getCodeIndex(code: string): number {
    return (code.charCodeAt(0) - 97) * numCharCodes + code.charCodeAt(1) - 97;
}

export function getLines(editor: vscode.TextEditor): { firstLineNumber: number; lines: string[] } {
    const document = editor.document;
    const activePosition = editor.selection.active;

    const startLine = activePosition.line < plusMinusLines ? 0 : activePosition.line - plusMinusLines;
    const endLine =
        document.lineCount - activePosition.line < plusMinusLines
            ? document.lineCount
            : activePosition.line + plusMinusLines;

    const lines: string[] = [];
    for (let i = startLine; i < endLine; i++) {
        lines.push(document.lineAt(i).text);
    }

    return {
        firstLineNumber: startLine,
        lines,
    };
}

export function createTextEditorDecorationType(dec: Decoration) {
    const width = dec.fontSize + 6;
    const left = -width + 2;

    return vscode.window.createTextEditorDecorationType({
        after: {
            margin: `0 0 0 ${left}px`,
            height: '${dec.fontSize}px',
            width: `${width}px`,
        },
    });
}

export function createDecorationOptions(
    line: number,
    startCharacter: number,
    endCharacter: number,
    context: vscode.ExtensionContext,
    code: string,
): vscode.DecorationOptions {
    return {
        range: new vscode.Range(line, startCharacter, line, endCharacter),
        renderOptions: {
            dark: {
                after: {
                    contentIconPath: darkDataUriCache[code],
                },
            },
            light: {
                after: {
                    contentIconPath: lightDataUriCache[code],
                },
            },
        },
    };
}

function getSvgDataUri(code: string, dec: Decoration) {
    const width = dec.fontSize + 6;

    // prettier-ignore
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${dec.fontSize}" height="${dec.fontSize}" width="${width}">`;
    // prettier-ignore
    svg += `<rect width="${width}" height="${dec.fontSize}" rx="2" ry="2" style="fill: ${dec.bgColor};"></rect>`;
    // prettier-ignore
    svg += `<text font-family="${dec.fontFamily}" font-size="${dec.fontSize}px" textLength="${width - 2}" textAdjust="spacing" fill="${dec.fgColor}" x="1" y="${dec.fontSize - 2}" alignment-baseline="baseline">`;
    svg += code;
    svg += `</text></svg>`;

    return vscode.Uri.parse(`data:image/svg+xml;utf8,${svg}`);
}
