'use strict';
import * as vscode from 'vscode';
import { exitJumpMode, startJumpMode, handleType } from './ext_event_handler';
import { setJumpMode } from './ext_context';
import { getLineRegex, getWordRegex } from './ext_settings';
import { jumpWord, jumpLine } from './ext_nav';

// Possible commands registered by extension.
enum Command {
    Word = 'extension.jumpy-word',
    Line = 'extension.jumpy-line',
    Exit = 'extension.jumpy-exit',
    Type = 'type',
}

// Extension context
// @ts-ignore
const enum Context {
    InJumpyMode = 'jumpy.inJumpyMode',
}

export function activate(context: vscode.ExtensionContext) {
    setJumpMode(false);

    const runHandlerWord = () => {
        console.time('WORD');
        startJumpMode(jumpWord, getWordRegex());
        console.timeEnd('WORD');
    };
    const runHandlerLine = () => startJumpMode(jumpLine, getLineRegex());

    context.subscriptions.push(
        vscode.commands.registerCommand(Command.Word, runHandlerWord),
        vscode.commands.registerCommand(Command.Line, runHandlerLine),
        vscode.commands.registerCommand(Command.Exit, exitJumpMode),
        vscode.commands.registerCommand(Command.Type, handleType),
        vscode.window.onDidChangeActiveTextEditor(exitJumpMode),
    );
}

export function deactivate() {}
