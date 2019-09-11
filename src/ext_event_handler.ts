import { commands, Selection, TextEditorRevealType, window } from 'vscode';
import { isInJumpMode, setJumpMode } from './ext_context';
import { getLines, JumpCallbck, JumpPositionMap } from './ext_nav';
import { createTextEditorDecorationType } from './ext_settings';

const DECORATION = createTextEditorDecorationType();

let POSITIONS: JumpPositionMap = {};
let FIRST_CHAR = '';

export function exitJumpMode() {
    const editor = window.activeTextEditor;
    setJumpMode(false);
    FIRST_CHAR = '';
    if (editor) {
        editor.setDecorations(DECORATION, []);
    }
}

export function startJumpMode(callback: JumpCallbck, regex: RegExp): void {
    const editor = window.activeTextEditor;
    if (editor === undefined) {
        return;
    }

    setJumpMode(true);

    const [firstLineNumber, visibleTextLines] = getLines(editor);
    const [positions, decorations] = callback(firstLineNumber, visibleTextLines, regex);

    editor.setDecorations(DECORATION, decorations);
    POSITIONS = positions;
}

export function handleType(input: { text: string }): void {
    if (!isInJumpMode()) {
        commands.executeCommand('default:type', input);
        return;
    }

    const editor = window.activeTextEditor;
    if (editor === undefined) {
        return;
    }

    const text = input.text;
    if (text.search(/[a-z]/i) === -1) {
        return exitJumpMode();
    }

    if (FIRST_CHAR === '') {
        FIRST_CHAR = text;
        return;
    }

    const code = FIRST_CHAR + text.toLowerCase();
    const position = POSITIONS[code];
    if (!position) {
        return exitJumpMode();
    }

    editor.selection = new Selection(
        position.line,
        position.character,
        position.line,
        position.character,
    );

    const reviewType: TextEditorRevealType = TextEditorRevealType.Default;
    editor.revealRange(editor.selection, reviewType);
    exitJumpMode();
}
