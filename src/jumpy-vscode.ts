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

export function getCodeIndex(code: string): number {
    return (code.charCodeAt(0) - 97) * numCharCodes + code.charCodeAt(1) - 97;
}

export function getLines(editor: vscode.TextEditor): { firstLineNumber: number, lines: string[] } {
    const document = editor.document;
    const activePosition = editor.selection.active;

    const startLine = activePosition.line < plusMinusLines ? 0 : activePosition.line - plusMinusLines;
    const endLine = (document.lineCount - activePosition.line) < plusMinusLines ? document.lineCount : activePosition.line + plusMinusLines;

    const lines: string[] = [];
    for (let i = startLine; i < endLine; i++) {
        lines.push(document.lineAt(i).text);
    }

    return {
        firstLineNumber: startLine,
        lines
    };
}

export function createTextEditorDecorationType() {
    return vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 0 0 -14px',
            height: '13px',
            width: '14px'
        }
    });
}

export function createDecorationOptions(line: number, startCharacter: number, endCharacter: number, context: vscode.ExtensionContext, code: string): vscode.DecorationOptions {
    return {
        range: new vscode.Range(line, startCharacter, line, endCharacter),
        renderOptions: {
            dark: {
                after: {
                    contentIconPath: context.asAbsolutePath(`./images/dark/${code}.svg`)
                }
            },
            light: {
                after: {
                    contentIconPath: context.asAbsolutePath(`./images/light/${code}.svg`)
                }
            }
        }
    };
}
