'use strict';
import { exitJumpMode, handleType, startJumpMode } from './ext_event_handler';
import { jumpLine, jumpWord } from './ext_position';
import { ExtState } from './ext_state';
import { ExtensionContext, commands, window, workspace } from 'vscode';
import { Settings } from './ext_settings';

enum Command {
    Word = 'extension.jumpy-word',
    Line = 'extension.jumpy-line',
    Exit = 'extension.jumpy-exit',
    Type = 'type',
}

export function activate(context: ExtensionContext) {
    const state = new ExtState().disableJumpMode();

    const runWordHandler = () => startJumpMode(state, jumpWord, state.settings.wordRegexp);
    const runLineHandler = () => startJumpMode(state, jumpLine, state.settings.lineRegexp);
    const exitHandler = () => exitJumpMode(state);
    const typeHandler = (input: { text: string }) => handleType(state, input);

    context.subscriptions.push(
        commands.registerCommand(Command.Word, runWordHandler),
        commands.registerCommand(Command.Line, runLineHandler),
        commands.registerCommand(Command.Exit, exitHandler),
        commands.registerCommand(Command.Type, typeHandler),
        window.onDidChangeActiveTextEditor(exitHandler),
        workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(Settings.ExtNamespace)
                || event.affectsConfiguration(Settings.EditorNamespace)) {
                state.settings.refreshConfig();
            }
        }),
    );
}

export function deactivate() {}
