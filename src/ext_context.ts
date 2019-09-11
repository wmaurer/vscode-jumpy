import { commands } from 'vscode';

let IN_JUMP_MODE = false;

export function setJumpMode(val: boolean): void {
    IN_JUMP_MODE = val;
    commands.executeCommand('setContext', 'jumpy.isJumpyMode', val);
}

export function isInJumpMode(): boolean {
    return IN_JUMP_MODE;
}
