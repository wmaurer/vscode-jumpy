import { ExtensionContext } from 'vscode';
import { Jumpy } from './jumpy/mod';

const jumpy = new Jumpy();

export function activate(_context: ExtensionContext): void {
    jumpy.activate();
}

export function deactivate(): void {
    jumpy.deactivate();
}
