import * as vscode from 'vscode';

let darkDataUriCache: { [index: string]: vscode.Uri } = {};
let lightDataUriCache: { [index: string]: vscode.Uri } = {};

export function createCharArray(chars: string): string[] {
    return chars.split("").filter(function (x, i, self) {
        return self.indexOf(x) === i;
    });
}

export function createFixedCodeArray(chars: string[], length: number): string[] {
    let createArray = function (arr: string[], word: string, d: number) {
        d -= 1;
        chars.forEach(function (val: string) {
            if (d <= 0) {
                arr.push(word + val)
            }
            else {
                createArray(arr, word + val, d);
            }
        });
        return arr;
    };

    return createArray([], '', length);;
};

// Returns a list of hint strings which will uniquely identify the given number of links.The hint strings may be of different lengths.
// https://github.com/philc/vimium
export function createVariableCodeArray(chars: string[], count: number): string[] {
    let hints = [""];
    let offset = 0;
    while ((hints.length - offset < count) || (hints.length == 1)) {
        let hint = hints[offset++];
        chars.forEach(function (val: string) {
            hints.push(hint + val);
        });
    }

    return hints.slice(offset, offset + count);
}

export interface Decoration {
    bgColor: string;
    fgColor: string;

    fontFamily: string;
    fontSize: number;
}

export function createDataUriCaches(codeArray: string[], darkDecoration: Decoration, lightDecoration: Decoration) {
    darkDataUriCache = {}
    lightDataUriCache = {}
    codeArray.forEach(code => (darkDataUriCache[code] = getSvgDataUri(code, darkDecoration)));
    codeArray.forEach(code => (lightDataUriCache[code] = getSvgDataUri(code, lightDecoration)));
}

export function getCodeIndices(positionCount: number, codeArray: string[], code: string): number[] {
    let regexp = new RegExp('^' + code + '.*', 'i');
    return codeArray
        .slice(0, positionCount)
        .map((val, i) => (val.search(regexp) == -1) ? null : i)
        .filter(x => x != null);
}

export function getLines(editor: vscode.TextEditor): { firstLineNumber: number; lines: string[] } {
    const document = editor.document;
    const range = editor.visibleRanges;

    // get current visible lines
    const startLine = Math.max(range[0].start.line - 1, 0);
    const endLine = Math.min(range[0].end.line + 1, document.lineCount - 1);

    const lines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
        lines.push(document.lineAt(i).text);
    }

    return {
        firstLineNumber: startLine,
        lines,
    };
}

export function createTextEditorDecorationType(): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
        before: {
            // this is very tricky...
            margin: `0 0 0 0px; position: relative; z-index: 99`,
            width: `0px`
        },
    });
}

export function createDecorationOptions(line: number, start: number, code: string): vscode.DecorationOptions {
    return {
        range: new vscode.Range(line, start, line, start + code.length),
        renderOptions: {
            dark: {
                before: {
                    contentIconPath: darkDataUriCache[code],
                },
            },
            light: {
                before: {
                    contentIconPath: lightDataUriCache[code],
                },
            },
        },
    };
}

function getSvgDataUri(code: string, dec: Decoration) {
    const width = (dec.fontSize / 2.0) * code.length + 4;
    const height = dec.fontSize + 2;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" height="${height}" width="${width}">`;
    svg += `<rect width="${width}" height="${height}" rx="2" ry="2" style="fill: ${dec.bgColor};"></rect>`;
    svg += `<text font-family="${dec.fontFamily}" font-size="${dec.fontSize}px" fill="${dec.fgColor}" x="2" y="${height - 4}" alignment-baseline="baseline">`;
    svg += code;
    svg += `</text></svg>`;

    return vscode.Uri.parse(`data:image/svg+xml;utf8,${svg}`);
}
