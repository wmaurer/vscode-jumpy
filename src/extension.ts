'use strict';
import { ExtensionContext } from 'vscode';
import { Jumpy } from './jumpy/mod';

// Add primary charset setting
// Register Type command on jumpy enter
// Deregister Type command on jumpy exit
// Deregister commands on deactivate
// Add settings to switch between icon and text markers
// Jump N lines up/down on "[" or "]" keypress
// Toggle display mode "

const jumpy = new Jumpy();

export function activate(_context: ExtensionContext): void {
    jumpy.activate();
}

// tsling-disable
export function deactivate(): void {
    jumpy.deactivate();
}
