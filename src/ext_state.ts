import { commands } from 'vscode';
import { JumpPositionMap } from './ext_position';
import { ExtSettings } from './ext_settings';

export class ExtState {
    public codes: string[];
    public maxDecorations: number;
    public settings: ExtSettings;
    public positions: JumpPositionMap;
    public firstChar: string;
    public isInJumpMode: boolean;

    constructor () {
        this.codes = this.buildCodes();
        this.maxDecorations = this.codes.length;
        this.settings = new ExtSettings();
        this.positions = {};
        this.firstChar = '';
        this.isInJumpMode = false;
    }

    public disableJumpMode(): this {
        this.isInJumpMode = false;
        this.firstChar = '';
        commands.executeCommand('setContext', 'jumpy.isJumpyMode', false);
        return this;
    }

    public enableJumpMode(): this {
        this.isInJumpMode = true;
        commands.executeCommand('setContext', 'jumpy.isJumpyMode', true);
        return this;
    }

    private buildCodes(): string[] {
        const codes: string[] = [];

        const sets = [
            ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'],
            ['p', 'o', 'i', 'l', 'k', 'j', 'm', 'n'],
            ['t', 'y', 'u', 'g', 'h', 'b'],
        ];

        for (const set of sets) {
            combine(set, set);
        }
        combine(sets[0], sets[1]);
        combine(sets[0], sets[2]);
        combine(sets[1], sets[2]);

        return codes;

        function combine (arrA: string[], arrB: string[]) {
            for (let i = 0; i < arrA.length; i++) {
                for (let j = i; j < arrB.length; j++) {
                    codes.push(`${arrA[i]}${arrB[j]}`);
                }
            }
        }
    }
}
