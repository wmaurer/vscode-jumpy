'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-jumpy" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        const decorationType = vscode.window.createTextEditorDecorationType({});

        const rofn = n => ({
            dark: {
                after: {
                    margin: '3px 0 0 -14px',
                    contentIconPath: `c:\\temp\\${n}.png`
                }
            }
        });

        const d1 = {
            range: new vscode.Range(1, 11, 1, 13),
            renderOptions: rofn('zq')
        };

        const activeEditor = vscode.window.activeTextEditor;
        activeEditor.setDecorations(decorationType, [d1])
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
