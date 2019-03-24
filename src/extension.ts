'use strict';
import * as vscode from 'vscode';

import {
    Decoration,
    createCharArray,
    createFixedCodeArray,
    createVariableCodeArray,
    createDataUriCaches,
    getCodeIndices,
    getLines,
    createTextEditorDecorationType,
    createDecorationOptions,
} from './jumpy-vscode';
import { JumpyPosition, JumpyFn, jumpyWord, jumpyLine } from './jumpy-positions';

export function activate(context: vscode.ExtensionContext) {
    enum CodeType {
        Fixed,
        Variable
    };

    // configrations
    let fontFamily: string = "";
    let fontSize: number = 1;
    let darkDecoration: Decoration = null;
    let lightDecoration: Decoration = null;

    let codeType: CodeType = CodeType.Fixed;
    let codeChars: string = "";
    let fixedCodeLength: number = 1;

    loadConfiguration();

    // property
    let positions: JumpyPosition[] = [];
    let isJumpyMode: boolean = false;
    let keysOfCode: string[] = [];

    let charArray: string[] = [];
    let codeArray: string[] = [];
    const decorationType = createTextEditorDecorationType();

    charArray = createCharArray(codeChars);
    if (codeType == CodeType.Fixed) {
        codeArray = createFixedCodeArray(charArray, fixedCodeLength);
        createDataUriCaches(codeArray, darkDecoration, lightDecoration);
    }

    setJumpyMode(false);

    console.log(fontFamily)

    function loadConfiguration() {
        const editorConfig = vscode.workspace.getConfiguration('editor');
        const configuration = vscode.workspace.getConfiguration('jumpy');

        fontFamily = configuration.get<string>('fontFamily');
        fontFamily = fontFamily || editorConfig.get<string>('fontFamily');
        fontSize = configuration.get<number>('fontSize');
        fontSize = fontSize || editorConfig.get<number>('fontSize') - 1;

        const colors = {
            darkBgColor: configuration.get<string>('darkThemeBackground'),
            darkFgColor: configuration.get<string>('darkThemeForeground'),
            lightBgColor: configuration.get<string>('lightThemeBackground'),
            lightFgColor: configuration.get<string>('lightThemeForeground'),
        };

        darkDecoration = {
            bgColor: colors.darkBgColor,
            fgColor: colors.darkFgColor,
            fontFamily: fontFamily,
            fontSize: fontSize,
        };
        lightDecoration = {
            bgColor: colors.lightBgColor,
            fgColor: colors.lightFgColor,
            fontFamily: fontFamily,
            fontSize: fontSize,
        };

        codeType = CodeType[configuration.get<string>('codeCreatingMode')];
        codeChars = configuration.get<string>('codeChars');
        fixedCodeLength = Math.max(configuration.get<number>('fixedCodeLength'), 1);
    }

    function setJumpyMode(value: boolean) {
        isJumpyMode = value;
        vscode.commands.executeCommand('setContext', 'jumpy.isJumpyMode', value);
    }

    function runJumpy(jumpyFn: JumpyFn, regexp: RegExp) {
        const editor = vscode.window.activeTextEditor;

        const getLinesResult = getLines(editor);
        const maxDecorations = (codeType == CodeType.Fixed) ? codeArray.length : -1;
        positions = jumpyFn(maxDecorations, getLinesResult.firstLineNumber, getLinesResult.lines, regexp);

        if (codeType == CodeType.Variable) {
            codeArray = createVariableCodeArray(charArray, positions.length);
            createDataUriCaches(codeArray, darkDecoration, lightDecoration);
        }

        const decorations = positions
            .map((position, i) =>
                createDecorationOptions(
                    position.line,
                    position.character,
                    codeArray[i]
                )
            );
        console.log(decorations)

        editor.setDecorations(decorationType, decorations);

        setJumpyMode(true);
        keysOfCode = [];
    }

    function exitJumpyMode() {
        const editor = vscode.window.activeTextEditor;
        setJumpyMode(false);

        editor.setDecorations(decorationType, []);
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

        let regexp = new RegExp('[' + charArray.join("") + ']', 'i');
        if (text.search(regexp) === -1) {
            exitJumpyMode();
            return;
        }

        keysOfCode.push(text);
        const indices: number[] = getCodeIndices(positions.length, codeArray, keysOfCode.join("").toLowerCase());

        // invalid char
        if (indices.length == 0) {
            exitJumpyMode();
            return;
        }

        // not unique
        if (indices.length != 1) {
            const decorations = indices
                .map((index, i) =>
                    createDecorationOptions(
                        positions[index].line,
                        positions[index].character,
                        codeArray[index]
                    )
                )

            editor.setDecorations(decorationType, decorations);
            return;
        }

        editor.setDecorations(decorationType, []);

        const position = positions[indices[0]];
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

    const didChangeConfigurationDisposable = vscode.workspace.onDidChangeConfiguration(event => {
        loadConfiguration();

        charArray = createCharArray(codeChars);
        if (codeType == CodeType.Fixed) {
            codeArray = createFixedCodeArray(charArray, fixedCodeLength);
            createDataUriCaches(codeArray, darkDecoration, lightDecoration);
        }
    });
    context.subscriptions.push(didChangeConfigurationDisposable);
}

export function deactivate() { }
