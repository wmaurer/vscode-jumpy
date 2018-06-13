'use strict';
import * as vscode from 'vscode';

import {
    Decoration,
    createCodeArray,
    createDataUriCaches,
    getCodeIndex,
    getLines,
    createTextEditorDecorationType,
    createDecorationOptions,
} from './jumpy-vscode';
import { JumpyPosition, JumpyFn, jumpyWord, jumpyLine } from './jumpy-positions';

export function activate(context: vscode.ExtensionContext) {
    const codeArray = createCodeArray();

    // decorations, based on configuration
    const editorConfig = vscode.workspace.getConfiguration('editor');
    const configuration = vscode.workspace.getConfiguration('jumpy');

    let fontFamily = configuration.get<string>('fontFamily');
    fontFamily = fontFamily || editorConfig.get<string>('fontFamily');

    let fontSize = configuration.get<number>('fontSize');
    fontSize = fontSize || editorConfig.get<number>('fontSize') - 1;

    const colors = {
        darkBgColor: configuration.get<string>('darkThemeBackground'),
        darkFgColor: configuration.get<string>('darkThemeForeground'),
        lightBgColor: configuration.get<string>('lightThemeBackground'),
        lightFgColor: configuration.get<string>('lightThemeForeground'),
    };

    const darkDecoration = {
        bgColor: colors.darkBgColor,
        fgColor: colors.darkFgColor,
        fontFamily: fontFamily,
        fontSize: fontSize,
    };
    const lightDecoration = {
        bgColor: colors.lightBgColor,
        fgColor: colors.lightFgColor,
        fontFamily: fontFamily,
        fontSize: fontSize,
    };

    createDataUriCaches(codeArray, darkDecoration, lightDecoration);

    const decorationTypeOffset2 = createTextEditorDecorationType(darkDecoration);
    const decorationTypeOffset1 = createTextEditorDecorationType(darkDecoration);

    let positions: JumpyPosition[] = null;
    let firstLineNumber = 0;
    let isJumpyMode: boolean = false;
    setJumpyMode(false);
    let firstKeyOfCode: string = null;

    function setJumpyMode(value: boolean) {
        isJumpyMode = value;
        vscode.commands.executeCommand('setContext', 'jumpy.isJumpyMode', value);
    }

    function runJumpy(jumpyFn: JumpyFn, regexp: RegExp) {
        const editor = vscode.window.activeTextEditor;

        const getLinesResult = getLines(editor);
        positions = jumpyFn(codeArray.length, getLinesResult.firstLineNumber, getLinesResult.lines, regexp);

        const decorationsOffset2 = positions
            .map(
                (position, i) =>
                    position.charOffset == 1
                        ? null
                        : createDecorationOptions(
                              position.line,
                              position.character,
                              position.character + 2,
                              context,
                              codeArray[i],
                          ),
            )
            .filter(x => !!x);

        const decorationsOffset1 = positions
            .map(
                (position, i) =>
                    position.charOffset == 2
                        ? null
                        : createDecorationOptions(
                              position.line,
                              position.character,
                              position.character + 2,
                              context,
                              codeArray[i],
                          ),
            )
            .filter(x => !!x);

        editor.setDecorations(decorationTypeOffset2, decorationsOffset2);
        editor.setDecorations(decorationTypeOffset1, decorationsOffset1);

        setJumpyMode(true);
        firstKeyOfCode = null;
    }

    function exitJumpyMode() {
        const editor = vscode.window.activeTextEditor;
        setJumpyMode(false);
        editor.setDecorations(decorationTypeOffset2, []);
        editor.setDecorations(decorationTypeOffset1, []);
    }

    const jumpyWordDisposable = vscode.commands.registerCommand('extension.jumpy-word', () => {
        const configuration = vscode.workspace.getConfiguration('jumpy');
        const defaultRegexp = '\\w{2,}';
        const wordRegexp = configuration ? configuration.get<string>('wordRegexp', defaultRegexp) : defaultRegexp;
        runJumpy(jumpyWord, new RegExp(wordRegexp, 'g'));
    });
    context.subscriptions.push(jumpyWordDisposable);

    const jumpyLineDisposable = vscode.commands.registerCommand('extension.jumpy-line', () => {
        const configuration = vscode.workspace.getConfiguration('jumpy');
        const defaultRegexp = '^\\s*$';
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

        if (text.search(/[a-z]/i) === -1) {
            exitJumpyMode();
            return;
        }

        if (!firstKeyOfCode) {
            firstKeyOfCode = text;
            return;
        }

        const code = firstKeyOfCode + text;
        const position = positions[getCodeIndex(code.toLowerCase())];

        editor.setDecorations(decorationTypeOffset2, []);
        editor.setDecorations(decorationTypeOffset1, []);

        vscode.window.activeTextEditor.selection = new vscode.Selection(
            position.line,
            position.character,
            position.line,
            position.character,
        );

        const reviewType: vscode.TextEditorRevealType = vscode.TextEditorRevealType.Default;
        vscode.window.activeTextEditor.revealRange(vscode.window.activeTextEditor.selection, reviewType);

        setJumpyMode(false);
    });
    context.subscriptions.push(jumpyTypeDisposable);

    const exitJumpyModeDisposable = vscode.commands.registerCommand('extension.jumpy-exit', () => {
        exitJumpyMode();
    });
    context.subscriptions.push(exitJumpyModeDisposable);

    const didChangeActiveTextEditorDisposable = vscode.window.onDidChangeActiveTextEditor(event => exitJumpyMode());
    context.subscriptions.push(didChangeActiveTextEditorDisposable);
}

export function deactivate() {}
