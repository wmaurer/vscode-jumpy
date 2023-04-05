'use strict';
import * as vscode from 'vscode';

import {
    createCodeArray,
    getCodeIndex,
    getLines,
    createTextEditorDecorationType,
    createDecorationOptions,
} from './jumpy-vscode';
import { JumpyPosition, JumpyFn, jumpyWord, jumpyLine } from './jumpy-positions';

export function activate(context: vscode.ExtensionContext) {
    // Load decoration codes
    const codeArray = createCodeArray();

    // load configuration
    const editorConfig = vscode.workspace.getConfiguration('editor');
    const configuration = vscode.workspace.getConfiguration('jumpy');

    // set variables for decorations
    let fontFamily = configuration.get<string>('fontFamily');
    fontFamily = fontFamily || editorConfig.get<string>('fontFamily') || 'monospace';

    let fontSize = configuration.get<number>('fontSize');
    fontSize = fontSize || editorConfig.get<number>('fontSize') - 1 || 14;

    const fgColor: vscode.ThemeColor | string =
        configuration.get<string>('foregroundColor') || new vscode.ThemeColor('editor.background') || 'indianred';
    const bgColor: vscode.ThemeColor | string =
        configuration.get<string>('backgroundColor') || new vscode.ThemeColor('editor.foreground') || 'goldenrod';

    const decoration = {
        bgColor,
        fgColor,
        fontFamily: fontFamily,
        fontSize: fontSize,
    };

    const decorationTypeOffset = createTextEditorDecorationType(decoration);

    let positions: JumpyPosition[] = null;
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

        const decorationsOffset = positions
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

        editor.setDecorations(decorationTypeOffset, decorationsOffset);

        setJumpyMode(true);
        firstKeyOfCode = null;
    }

    function exitJumpyMode() {
        const editor = vscode.window.activeTextEditor;
        setJumpyMode(false);
        editor.setDecorations(decorationTypeOffset, []);
    }

    // register disposable functions
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

    // runs on 'type' (user typeing) when in jumpy mode
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
            // set first key of code so that on next type we can get the full code
            firstKeyOfCode = text;
            return;
        }

        const code = firstKeyOfCode + text;
        const position = positions[getCodeIndex(codeArray, code.toLowerCase())];

        editor.setDecorations(decorationTypeOffset, []);

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
