'use strict';
import * as vscode from 'vscode';

import {
    createCodeArray,
    getCodeIndex,
    getLines,
    createTextEditorDecorationType,
    createDecorationOptions,
} from './hopper';
import { HopperPosition, HopperFn, hopperWord, hopperLine } from './positions';

export function activate(context: vscode.ExtensionContext) {
    // Load decoration codes
    const codeArray = createCodeArray();

    // load configuration
    const editorConfig = vscode.workspace.getConfiguration('editor');
    const configuration = vscode.workspace.getConfiguration('hopper');

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

    let positions: HopperPosition[] = null;
    let isHopperMode: boolean = false;
    setHopperMode(false);
    let firstKeyOfCode: string = null;

    function setHopperMode(value: boolean) {
        isHopperMode = value;
        vscode.commands.executeCommand('setContext', 'hopper.isHopperMode', value);
    }

    function runHopper(hopperFn: HopperFn, regexp: RegExp) {
        const editor = vscode.window.activeTextEditor;

        const getLinesResult = getLines(editor);
        positions = hopperFn(codeArray.length, getLinesResult.firstLineNumber, getLinesResult.lines, regexp);

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

        setHopperMode(true);
        firstKeyOfCode = null;
    }

    function exitHopperMode() {
        const editor = vscode.window.activeTextEditor;
        setHopperMode(false);
        editor.setDecorations(decorationTypeOffset, []);
    }

    // register disposable functions
    const hopperWordDisposable = vscode.commands.registerCommand('extension.hopper-word', () => {
        const configuration = vscode.workspace.getConfiguration('hopper');
        const defaultRegexp = '\\w{2,}';
        const wordRegexp = configuration ? configuration.get<string>('wordRegexp', defaultRegexp) : defaultRegexp;
        runHopper(hopperWord, new RegExp(wordRegexp, 'g'));
    });
    context.subscriptions.push(hopperWordDisposable);

    const hopperLineDisposable = vscode.commands.registerCommand('extension.hopper-line', () => {
        const configuration = vscode.workspace.getConfiguration('hopper');
        const defaultRegexp = '^\\s*$';
        const lineRegexp = configuration ? configuration.get<string>('lineRegexp', defaultRegexp) : defaultRegexp;
        runHopper(hopperLine, new RegExp(lineRegexp));
    });
    context.subscriptions.push(hopperLineDisposable);

    // runs on 'type' (user typeing) when in hopper mode
    const hopperTypeDisposable = vscode.commands.registerCommand('type', args => {
        if (!isHopperMode) {
            vscode.commands.executeCommand('default:type', args);
            return;
        }

        const editor = vscode.window.activeTextEditor;
        const text: string = args.text;

        if (text.search(/[a-z]/i) === -1) {
            exitHopperMode();
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

        setHopperMode(false);
    });
    context.subscriptions.push(hopperTypeDisposable);

    const exitHopperModeDisposable = vscode.commands.registerCommand('extension.hopper-exit', () => {
        exitHopperMode();
    });
    context.subscriptions.push(exitHopperModeDisposable);

    const didChangeActiveTextEditorDisposable = vscode.window.onDidChangeActiveTextEditor(event => exitHopperMode());
    context.subscriptions.push(didChangeActiveTextEditorDisposable);
}

export function deactivate() {}
