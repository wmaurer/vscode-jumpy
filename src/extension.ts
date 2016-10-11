'use strict';
import * as vscode from 'vscode';

import { createCodeArray, createDataUriCaches, getCodeIndex, getLines, createTextEditorDecorationType, createDecorationOptions } from './jumpy-vscode';
import { JumpyPosition, JumpyFn, jumpyWord, jumpyLine } from './jumpy-positions';

export function activate(context: vscode.ExtensionContext) {
    const codeArray = createCodeArray();

    createDataUriCaches(codeArray);

    const decorationTypeOffset2 = createTextEditorDecorationType(2);
    const decorationTypeOffset1 = createTextEditorDecorationType(1);

    let positions: JumpyPosition[] = null;
    let firstLineNumber = 0;

    let isJumpyMode = false;
    let firstKeyOfCode: string = null;

    function runJumpy(jumpyFn: JumpyFn, regexp: RegExp) {
        const editor = vscode.window.activeTextEditor;

        const getLinesResult = getLines(editor);
        positions = jumpyFn(codeArray.length, getLinesResult.firstLineNumber, getLinesResult.lines, regexp);

        const decorationsOffset2 = positions
            .map((position, i) => position.charOffset == 1 ? null : createDecorationOptions(position.line, position.character, position.character + 2, context, codeArray[i]))
            .filter(x => !!x);

        const decorationsOffset1 = positions
            .map((position, i) => position.charOffset == 2 ? null : createDecorationOptions(position.line, position.character, position.character + 2, context, codeArray[i]))
            .filter(x => !!x);

        editor.setDecorations(decorationTypeOffset2, decorationsOffset2);
        editor.setDecorations(decorationTypeOffset1, decorationsOffset1);

        isJumpyMode = true;
        firstKeyOfCode = null;
    }

    let jumpyWordDisposable = vscode.commands.registerCommand('extension.jumpy-word', () => {
        const configuration = vscode.workspace.getConfiguration('jumpy');
        const defaultRegexp = '\\w{2,}';
        const wordRegexp = configuration ? configuration.get<string>('wordRegexp', defaultRegexp) : defaultRegexp;
        runJumpy(jumpyWord, new RegExp(wordRegexp, 'g'));
    });

    context.subscriptions.push(jumpyWordDisposable);

    let jumpyLineDisposable = vscode.commands.registerCommand('extension.jumpy-line', () => {
        const configuration = vscode.workspace.getConfiguration('jumpy');
        const defaultRegexp = '^\s*$';
        const lineRegexp = configuration ? configuration.get<string>('lineRegexp', defaultRegexp) : defaultRegexp;
        runJumpy(jumpyLine, new RegExp(lineRegexp));
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
            editor.setDecorations(decorationTypeOffset2, []);
            editor.setDecorations(decorationTypeOffset1, []);
            return;
        }

        if (!firstKeyOfCode) {
            firstKeyOfCode = text;
            return;
        }

        const code = firstKeyOfCode + text;
        const position = positions[getCodeIndex(code)];

        editor.setDecorations(decorationTypeOffset2, []);
        editor.setDecorations(decorationTypeOffset1, []);

        vscode.window.activeTextEditor.selection = new vscode.Selection(position.line, position.character, position.line, position.character);
        isJumpyMode = false;
    });

    context.subscriptions.push(jumpyTypeDisposable);
}

export function deactivate() {
}
