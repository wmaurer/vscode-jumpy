import { commands, Selection, TextEditorRevealType, window, TextEditor, TextLine } from 'vscode';
import { JumpCallback } from './ext_position';
import { ExtState } from './ext_state';

export function exitJumpMode(state: ExtState) {
    state.disableJumpMode();

    const editor = window.activeTextEditor;
    if (editor) {
        editor.setDecorations(state.settings.decorationType, []);
    }
}

function getLines(editor: TextEditor): [number, TextLine[]] {
    const lines: TextLine[] = [];

    const document = editor.document;
    const ranges = editor.visibleRanges;
    const firstLineNumber = ranges[0] ? ranges[0].start.line : 0;

    for (const range of ranges) {
        let lineNumber = range.start.line;
        while (lineNumber <= range.end.line) {
            lines.push(document.lineAt(lineNumber));
            lineNumber += 1;
        }
    }

    return [firstLineNumber, lines];
}

export function startJumpMode(state: ExtState, callback: JumpCallback, regex: RegExp): void {
    const editor = window.activeTextEditor;
    if (editor === undefined) {
        return;
    }

    state.enableJumpMode();

    const [firstLineNumber, visibleTextLines] = getLines(editor);
    const [positions, decorationOptions] = callback(state, firstLineNumber, visibleTextLines, regex);

    editor.setDecorations(state.settings.decorationType, decorationOptions);
    state.positions = positions;
}

export function handleType(state: ExtState, input: { text: string }): void {
    if (!state.isInJumpMode) {
        commands.executeCommand('default:type', input);
        return;
    }

    const editor = window.activeTextEditor;
    if (editor === undefined) {
        return;
    }

    const text = input.text;
    if (text.search(/[a-z]/i) === -1) {
        exitJumpMode(state);
        return;
    }

    if (state.firstChar === '') {
        state.firstChar = text.toLowerCase();
        return;
    }

    const code = state.firstChar + text.toLowerCase();
    const position = state.positions[code];
    if (!position) {
        exitJumpMode(state);
        return;
    }

    editor.selection = new Selection(
        position.line,
        position.character,
        position.line,
        position.character,
    );

    const reviewType: TextEditorRevealType = TextEditorRevealType.Default;
    editor.revealRange(editor.selection, reviewType);
    exitJumpMode(state);
}
