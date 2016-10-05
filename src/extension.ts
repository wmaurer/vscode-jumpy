'use strict';
import * as vscode from 'vscode';

import { createCodeArray, getCodeIndex, getLines, createTextEditorDecorationType, createDecorationOptions } from './jumpy-vscode';
import { JumpyPosition, jumpyWord, jumpyLine } from './jumpy-positions';

export function activate(context: vscode.ExtensionContext) {
    const codeArray = createCodeArray();
    const decorationType = createTextEditorDecorationType();

    let positions: JumpyPosition[] = null;
    let firstLineNumber = 0;

    let isJumpyMode = false;
    let firstKeyOfCode: string = null;

    function runJumpy(jumpyFn: any) {
        const editor = vscode.window.activeTextEditor;

        const getLinesResult = getLines(editor);
        positions = jumpyFn(codeArray.length, getLinesResult.firstLineNumber, getLinesResult.lines);
        const decorations = positions
            .map((position, i) => createDecorationOptions(position.line, position.character, position.character + 2, context, codeArray[i]));

        editor.setDecorations(decorationType, decorations);

        isJumpyMode = true;
        firstKeyOfCode = null;
    }

    let jumpyWordDisposable = vscode.commands.registerCommand('extension.jumpy-word', () => {
        runJumpy(jumpyWord);
    });

    context.subscriptions.push(jumpyWordDisposable);

    let jumpyLineDisposable = vscode.commands.registerCommand('extension.jumpy-line', () => {
        runJumpy(jumpyLine);
    });

    context.subscriptions.push(jumpyLineDisposable);

    const jumpyTypeDisposable = vscode.commands.registerCommand('type', args => {
        if (!isJumpyMode) {
            vscode.commands.executeCommand('default:type', args);
            return;
        }

        const editor = vscode.window.activeTextEditor;
        const text: string = args.text;

        if (text.search(/[a-z]/) === -1) {
            isJumpyMode = false;
            editor.setDecorations(decorationType, []);
            return;
        }

        if (!firstKeyOfCode) {
            firstKeyOfCode = text;
            return;
        }

        const code = firstKeyOfCode + text;
        const position = positions[getCodeIndex(code)];

        editor.setDecorations(decorationType, []);
        vscode.window.activeTextEditor.selection = new vscode.Selection(position.line, position.character, position.line, position.character);
        isJumpyMode = false;
    });

    context.subscriptions.push(jumpyTypeDisposable);
}

export function deactivate() {
}
